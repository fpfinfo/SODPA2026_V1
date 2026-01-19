import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Tesseract from "npm:tesseract.js@5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentRequest {
  documento_id: string;
  pdf_url: string;
}

interface OCRResult {
  text: string;
  confidence: number;
  extracted_fields: {
    nome?: string;
    cpf?: string;
    data?: string;
    numero?: string;
  };
}

// Helper: Extract CPF from text
function extractCPF(text: string): string | null {
  const cpfRegex = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
  const matches = text.match(cpfRegex);
  return matches ? matches[0].replace(/\D/g, '') : null;
}

// Helper: Extract nome (look for "servidor" or similar patterns)
function extractNome(text: string): string | null {
  // Pattern: "servidor NOME COMPLETO" or "interessado NOME"
  const nomeRegex = /(?:servidor|interessado)\s+([\p{L}\s]+)/gui;
  const match = text.match(nomeRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

// Helper: Extract date (DD/MM/YYYY)
function extractData(text: string): string | null {
  const dateRegex = /\d{2}\/\d{2}\/\d{4}/g;
  const matches = text.match(dateRegex);
  return matches ? matches[0] : null;
}

// Main OCR processing
async function processDocument(
  documentoId: string,
  pdfUrl: string,
  supabase: any
): Promise<OCRResult> {
  console.log(`Processing document ${documentoId} from ${pdfUrl}`);
  
  // 1. Download PDF from Supabase Storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documentos')
    .download(pdfUrl);
  
  if (downloadError) {
    throw new Error(`Failed to download PDF: ${downloadError.message}`);
  }
  
  // 2. Convert to ArrayBuffer then to base64 image (simplified - in production use pdf-lib)
  const arrayBuffer = await fileData.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  // 3. Run OCR with Tesseract.js
  const { data: { text, confidence } } = await Tesseract.recognize(
    `data:image/png;base64,${base64}`,
    'por', // Portuguese
    {
      logger: (m) => console.log(m) // Progress logging
    }
  );
  
  console.log(`OCR completed with ${confidence}% confidence`);
  console.log(`Extracted text preview: ${text.substring(0, 200)}...`);
  
  // 4. Extract structured fields
  const extracted_fields = {
    nome: extractNome(text),
    cpf: extractCPF(text),
    data: extractData(text),
  };
  
  return {
    text,
    confidence,
    extracted_fields
  };
}

// Validate extracted fields against database
async function validateFields(
  documentoId: string,
  extracted: OCRResult['extracted_fields'],
  supabase: any
): Promise<{ status: string; resultado: any; confianca: number }> {
  // Fetch the documento to get expected values
  const { data: doc, error: docError } = await supabase
    .from('documentos')
    .select(`
      *,
      solicitacoes!inner (
        id,
        suprido_nome,
        created_at
      )
    `)
    .eq('id', documentoId)
    .single();
  
  if (docError) {
    throw new Error(`Failed to fetch document: ${docError.message}`);
  }
  
  const expectedNome = doc.solicitacoes.suprido_nome;
  const validationResults = {
    nome_match: false,
    cpf_found: false,
    data_valid: false
  };
  
  // Validate nome (simple contains check - could use Levenshtein distance)
  if (extracted.nome && expectedNome) {
    const similarity = extracted.nome.toLowerCase().includes(expectedNome.toLowerCase().split(' ')[0]);
    validationResults.nome_match = similarity;
  }
  
  // Validate CPF exists
  validationResults.cpf_found = !!extracted.cpf;
  
  // Validate date is within reasonable range (±30 days of solicitacao creation)
  if (extracted.data) {
    const [day, month, year] = extracted.data.split('/').map(Number);
    const extractedDate = new Date(year, month - 1, day);
    const solicitacaoDate = new Date(doc.solicitacoes.created_at);
    const diffDays = Math.abs((extractedDate.getTime() - solicitacaoDate.getTime()) / (1000 * 60 * 60 * 24));
    validationResults.data_valid = diffDays <= 30;
  }
  
  // Determine status
  const allValid = validationResults.nome_match && validationResults.cpf_found && validationResults.data_valid;
  const anyInvalid = !validationResults.cpf_found || !validationResults.data_valid;
  
  return {
    status: allValid ? 'APPROVED' : anyInvalid ? 'REJECTED' : 'REVIEW_NEEDED',
    resultado: {
      extracted,
      validationResults
    },
    confianca: Object.values(validationResults).filter(Boolean).length / 3 * 100
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { documento_id, pdf_url }: ProcessDocumentRequest = await req.json();
    
    if (!documento_id || !pdf_url) {
      throw new Error('Missing required fields: documento_id, pdf_url');
    }
    
    // 1. Process OCR
    const ocrResult = await processDocument(documento_id, pdf_url, supabaseClient);
    
    // 2. Validate fields
    const validation = await validateFields(documento_id, ocrResult.extracted_fields, supabaseClient);
    
    // 3. Save validation result
    const { error: insertError } = await supabaseClient
      .from('documento_validations')
      .insert({
        documento_id,
        tipo_validacao: 'OCR',
        status: validation.status,
        resultado: validation.resultado,
        confianca: validation.confianca
      });
    
    if (insertError) {
      throw new Error(`Failed to save validation: ${insertError.message}`);
    }
    
    // 4. Update documento metadata
    await supabaseClient
      .from('documentos')
      .update({
        metadata: {
          ocr_processed: true,
          ocr_result: validation
        }
      })
      .eq('id', documento_id);
    
    return new Response(
      JSON.stringify({
        success: true,
        validation,
        ocr_confidence: ocrResult.confidence
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error processing document:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
