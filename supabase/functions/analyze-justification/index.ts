import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  solicitacao_id: string;
}

interface NLPAnalysis {
  aprovado: boolean;
  categoria: 'CONSUMO' | 'SERVICO_PF' | 'SERVICO_PJ' | 'VIAGEM' | 'OUTRA';
  confianca: number;
  motivo_rejeicao?: string;
  sugestao_analista: string;
  elementos_detectados: string[];
}

async function analyzeJustificationWithGemini(
  justificativa: string,
  valor: number
): Promise<NLPAnalysis> {
  const prompt = `
Você é um auditor sênior do Tribunal de Justiça do Pará (TJPA) especializado em Suprimento de Fundos.

CONTEXTO LEGAL:
- Resolução CNJ nº 169/2013: Limite de R$ 15.000 por suprimento
- Elementos permitidos:
  * 3.3.90.30 - Material de Consumo (papelaria, limpeza, pequenos materiais)
  * 3.3.90.33 - Passagens e Despesas com Locomoção
  * 3.3.90.36 - Outros Serviços de Terceiros - Pessoa Física
  * 3.3.90.39 - Outros Serviços de Terceiros - Pessoa Jurídica
- Proibições: Pagamento de pessoal, obras, equipamentos permanentes

JUSTIFICATIVA A ANALISAR: "${justificativa}"
VALOR SOLICITADO: R$ ${valor.toFixed(2)}

ANALISE E RETORNE APENAS UM JSON (sem markdown) no seguinte formato:
{
  "aprovado": boolean,
  "categoria": "CONSUMO" | "SERVICO_PF" | "SERVICO_PF" | "VIAGEM" | "OUTRA",
  "confianca": number (0-100),
  "motivo_rejeicao": string ou null,
  "sugestao_analista": string,
  "elementos_detectados": string[]
}

CRITÉRIOS DE APROVAÇÃO:
1. Justificativa específica (não vaga como "compra de material")
2. Elemento de despesa compatível com descrição
3. Urgência ou pronto pagamento evidenciados
4. Valor razoável para itens descritos
  `.trim();

  console.log('Calling Gemini API...');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2, // Mais determinístico
        maxOutputTokens: 500,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(` Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  
  console.log('Gemini response:', text);

  // Try to parse JSON directly, or extract from markdown
  let analysis: NLPAnalysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Gemini response');
    }
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    analysis = JSON.parse(jsonStr);
  }

  return analysis;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { solicitacao_id }: AnalyzeRequest = await req.json();

    if (!solicitacao_id) {
      throw new Error('Missing solicitacao_id');
    }

    // Fetch solicitação
    const { data: solicitacao, error: fetchError } = await supabase
      .from('solicitacoes')
      .select('descricao, valor_total')
      .eq('id', solicitacao_id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch solicitacao: ${fetchError.message}`);
    }

    if (!solicitacao.descricao) {
      throw new Error('Solicitacao has no justification (descricao)');
    }

    console.log(`Analyzing justification for solicitacao ${solicitacao_id}`);

    // Analyze with Gemini
    const analysis = await analyzeJustificationWithGemini(
      solicitacao.descricao,
      solicitacao.valor_total || 0
    );

    // Save result
    const { error: updateError } = await supabase
      .from('solicitacoes')
      .update({
        nlp_analysis: {
          ...analysis,
          analyzed_at: new Date().toISOString()
        }
      })
      .eq('id', solicitacao_id);

    if (updateError) {
      throw new Error(`Failed to save analysis: ${updateError.message}`);
    }

    console.log('Analysis complete:', analysis);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing justification:', error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
