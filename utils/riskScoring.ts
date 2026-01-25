
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskScore {
  score: number;
  level: RiskLevel;
  penalties: string[];
}

export const calculateRiskScore = (stats: {
  totalProcesses: number;
  latePCs: number;
  returnedProcesses: number;
  glosas: number;
}): RiskScore => {
  let score = 100;
  const penalties: string[] = [];

  // 1. Atraso na Prestação de Contas (Penalty: 15pts each)
  if (stats.latePCs > 0) {
    const penalty = stats.latePCs * 15;
    score -= penalty;
    penalties.push(`-${penalty} pts: ${stats.latePCs} prestações de contas atrasadas`);
  }

  // 2. Devoluções por Erro (Penalty: 5pts each)
  if (stats.returnedProcesses > 0) {
    const penalty = stats.returnedProcesses * 5;
    score -= penalty;
    penalties.push(`-${penalty} pts: ${stats.returnedProcesses} processos devolvidos para correção`);
  }

  // 3. Glosas (Penalty: 20pts each - Serious)
  if (stats.glosas > 0) {
    const penalty = stats.glosas * 20;
    score -= penalty;
    penalties.push(`-${penalty} pts: ${stats.glosas} glosas registradas`);
  }

  // Bonus: Volume (Experience) - Max 10 pts
  const volumeBonus = Math.min(stats.totalProcesses, 10);
  if (volumeBonus > 0) {
    score += volumeBonus;
    // penalties.push(`+${volumeBonus} pts: Bônus por volume de processos`); 
  }

  // Cap score
  score = Math.max(0, Math.min(100, score));

  let level: RiskLevel = 'LOW';
  if (score < 50) level = 'CRITICAL';
  else if (score < 70) level = 'HIGH';
  else if (score < 85) level = 'MEDIUM';

  return { score, level, penalties };
};

export const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'CRITICAL': return 'text-red-700 bg-red-50 border-red-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

export const getRiskLabel = (level: RiskLevel): string => {
    switch (level) {
      case 'LOW': return 'Baixo Risco';
      case 'MEDIUM': return 'Risco Médio';
      case 'HIGH': return 'Alto Risco';
      case 'CRITICAL': return 'Crítico';
      default: return 'Desconhecido';
    }
  };
