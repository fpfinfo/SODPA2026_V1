
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
    const approvedValue = process.value || 0;
    
    // Fallback: If legacy process (no specific values), assume valid if documents exist
    // BUT for stricter security, we default to 0 if undefined
    const neVal = process.neValue ?? 0;
    const dlVal = process.dlValue ?? 0;
    const obVal = process.obValue ?? 0;

    const neExists = !!process.neNumber;
    const dlExists = !!process.dlNumber;
    const obExists = !!process.obNumber;

    const errors: string[] = [];
    const warnings: string[] = [];

    // NE Check
    let neStatus: 'MISSING' | 'VALID' | 'INVALID' = 'MISSING';
    if (neExists) {
      if (neVal === approvedValue) {
        neStatus = 'VALID';
      } else {
        neStatus = 'INVALID';
        errors.push(`NE (R$ ${neVal.toFixed(2)}) diverge do valor aprovado (R$ ${approvedValue.toFixed(2)})`);
      }
    }

    // DL Check
    let dlStatus: 'MISSING' | 'VALID' | 'INVALID' = 'MISSING';
    if (dlExists) {
      if (dlVal === approvedValue) { // Should match NE and Approved
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

    // OB Check
    let obStatus: 'MISSING' | 'VALID' | 'INVALID' = 'MISSING';
    if (obExists) {
      if (obVal === dlVal) { // OB must match DL strictly
        obStatus = 'VALID';
      } else {
        obStatus = 'INVALID';
        errors.push(`OB (R$ ${obVal.toFixed(2)}) diverge da Liquidação (R$ ${dlVal.toFixed(2)})`);
      }
    }

    // Global Validity
    // Valid if all 3 exist and are VALID (or Partial valid logic if we allow partials later)
    // For Phase 1: STRICT MATCH
    const isValid = 
      neStatus === 'VALID' && 
      dlStatus === 'VALID' && 
      obStatus === 'VALID' && 
      errors.length === 0;

    return {
      isValid,
      neStatus,
      dlStatus,
      obStatus,
      errors,
      warnings,
      financials: {
        ne: neVal,
        dl: dlVal,
        ob: obVal,
        approved: approvedValue
      }
    };
  }, [process]);
};
