
import { useMemo } from 'react';
import { Process } from '../types';

export interface TripleCheckResult {
  isValid: boolean;
  neStatus: 'MISSING' | 'VALID' | 'INVALID';
  dlStatus: 'MISSING' | 'VALID' | 'INVALID';
  obStatus: 'MISSING' | 'VALID' | 'INVALID';
  errors: string[];
  warnings: string[];
  financials: {
    ne: number;
    dl: number;
    ob: number;
    approved: number;
  };
}

export const useTripleCheck = (process: Process): TripleCheckResult => {
  return useMemo(() => {
    const approvedValue = process.value || (process as any).valor_total || (process as any).valor_solicitado || 0;
    
    // ATUALIZAÇÃO: Verificar se documentos existem (mesmo sem valores específicos)
    // Quando importados do ERP, usamos o valor aprovado como referência
    const neExists = !!(process.neNumber || (process as any).ne_number);
    const dlExists = !!(process.dlNumber || (process as any).dl_number);
    const obExists = !!(process.obNumber || (process as any).ob_number);
    
    // Se existem valores específicos, usa-os; senão, assume valor aprovado (upload ERP)
    const neVal = process.neValue ?? (process as any).ne_valor ?? (neExists ? approvedValue : 0);
    const dlVal = process.dlValue ?? (process as any).dl_valor ?? (dlExists ? approvedValue : 0);
    const obVal = process.obValue ?? (process as any).ob_valor ?? (obExists ? approvedValue : 0);

    const errors: string[] = [];
    const warnings: string[] = [];

    // NE Check - FLEXIBILIZADO: Se documento existe, considera válido (ERP já validou)
    let neStatus: 'MISSING' | 'VALID' | 'INVALID' = 'MISSING';
    if (neExists) {
      // Se valor é igual ao aprovado OU se não há valor específico (veio do ERP)
      if (neVal === approvedValue || (!process.neValue && neExists)) {
        neStatus = 'VALID';
      } else if (neVal === 0) {
        // Valor zero com documento existente = assume ERP válido
        neStatus = 'VALID';
      } else {
        neStatus = 'INVALID';
        errors.push(`NE (R$ ${neVal.toFixed(2)}) diverge do valor aprovado (R$ ${approvedValue.toFixed(2)})`);
      }
    }

    // DL Check - FLEXIBILIZADO
    let dlStatus: 'MISSING' | 'VALID' | 'INVALID' = 'MISSING';
    if (dlExists) {
      if (dlVal === approvedValue || (!process.dlValue && dlExists)) {
        dlStatus = 'VALID';
      } else if (dlVal === 0) {
        dlStatus = 'VALID';
      } else {
        dlStatus = 'INVALID';
        if (dlVal > approvedValue) {
           errors.push(`DL (R$ ${dlVal.toFixed(2)}) excede o valor aprovado (R$ ${approvedValue.toFixed(2)})`);
        } else if (dlVal < approvedValue) {
           warnings.push(`DL (R$ ${dlVal.toFixed(2)}) é menor que o valor aprovado (Pagamento Parcial?)`);
        }
      }
    }

    // OB Check - FLEXIBILIZADO
    let obStatus: 'MISSING' | 'VALID' | 'INVALID' = 'MISSING';
    if (obExists) {
      if (obVal === dlVal || (!process.obValue && obExists)) {
        obStatus = 'VALID';
      } else if (obVal === 0) {
        obStatus = 'VALID';
      } else {
        obStatus = 'INVALID';
        errors.push(`OB (R$ ${obVal.toFixed(2)}) diverge da Liquidação (R$ ${dlVal.toFixed(2)})`);
      }
    }

    // ATUALIZAÇÃO: Considerar válido quando documentos existem (upload ERP)
    // A validação detalhada é feita no ERP, aqui apenas conferimos existência
    const allDocsExist = neExists && dlExists && obExists;
    const isValid = allDocsExist && errors.length === 0;

    return {
      isValid,
      neStatus,
      dlStatus,
      obStatus,
      errors,
      warnings,
      financials: {
        ne: neVal || approvedValue,
        dl: dlVal || approvedValue,
        ob: obVal || approvedValue,
        approved: approvedValue
      }
    };
  }, [process]);
};
