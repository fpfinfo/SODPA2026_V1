import { SupridoStats } from './useSupridoCRM';

export interface RiskAnalysis {
  score: number; // 0-100 (0=Seguro, 100=Crítico)
  level: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  flags: RiskFlag[];
}

export interface RiskFlag {
  type: 'WARNING' | 'DANGER' | 'INFO';
  message: string;
  impact: number; // Pontos a somar no score
}

// Algoritmo de Scoring
export function calculateRisk(
  pc: any, 
  comprovantes: any[], 
  supridoStats: SupridoStats
): RiskAnalysis {
  let score = 0;
  const flags: RiskFlag[] = [];

  // ===========================================================================
  // 1. Análise Documental (Peso 40%)
  // ===========================================================================
  const totalDocs = comprovantes.length;
  if (totalDocs === 0) {
    score += 100;
    flags.push({ type: 'DANGER', message: 'Sem comprovantes anexados', impact: 100 });
  } else {
    // Verificar quantos são manuais (sem OCR/QR)
    const manuais = comprovantes.filter(c => c.tipo !== 'PASSAGEM' && c.tipo !== 'CUPOM_FISCAL' && !(c.tipo === 'RECIBO' && c.descricao?.includes('Transporte'))).length;
    const taxaManual = manuais / totalDocs;

    if (taxaManual > 0.5) {
      const pts = Math.round(taxaManual * 30);
      score += pts;
      flags.push({ type: 'WARNING', message: `${Math.round(taxaManual * 100)}% de recibos manuais/antigos`, impact: pts });
    }
    
    // Check duplicidade (já filtrado pelo upload, mas vai que...)
    // Aqui poderíamos checar "Valores Redondos"
    const valoresRedondos = comprovantes.filter(c => c.valor % 100 === 0 || c.valor % 50 === 0).length;
    if (valoresRedondos > 2) {
       score += 15;
       flags.push({ type: 'INFO', message: 'Múltiplos valores redondos detectados (Padrão Incomum)', impact: 15 });
    }
  }

  // ===========================================================================
  // 2. Perfil do Suprido (Peso 30%)
  // ===========================================================================
  if (supridoStats.reputacao === 'ATENCAO') {
    score += 30;
    flags.push({ type: 'DANGER', message: 'Suprido com histórico alto de devoluções', impact: 30 });
  } else if (supridoStats.reputacao === 'REGULAR') {
    score += 10;
    flags.push({ type: 'WARNING', message: 'Suprido com ocorrências recentes', impact: 10 });
  } else if (supridoStats.reputacao === 'EXCELENTE') {
    score -= 10; // Bônus
    flags.push({ type: 'INFO', message: 'Suprido com histórico excelente (Bônus)', impact: -10 });
  }

  // ===========================================================================
  // 3. Conciliação Financeira (Peso 30%)
  // ===========================================================================
  const totalGasto = pc.valor_gasto || 0;
  const totalDevolvido = pc.valor_devolvido || 0;
  const concedido = pc.valor_concedido || 0;
  const diff = Math.abs(concedido - (totalGasto + totalDevolvido));
  
  if (diff > 0.05) {
    score += 50;
    flags.push({ type: 'DANGER', message: 'Divergência Crítica na Conciliação (> R$ 0,05)', impact: 50 });
  }

  // ===========================================================================
  // Resultado
  // ===========================================================================
  score = Math.max(0, Math.min(100, score)); // Clamp 0-100

  let level: RiskAnalysis['level'] = 'BAIXO';
  if (score >= 80) level = 'CRITICO';
  else if (score >= 50) level = 'ALTO';
  else if (score >= 20) level = 'MEDIO';

  return { score, level, flags };
}
