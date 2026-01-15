/**
 * Tax Calculation Utilities for PF Services (3.3.90.36)
 * Handles INSS (11%), ISS (5%), and CPF validation
 */

import { TaxCalculation, TAX_RATES } from '../types/taxIntegration';

/**
 * Calculate all taxes for a PF service payment
 */
export function calculateTaxes(grossValue: number, issRate: number = TAX_RATES.ISS_DEFAULT): TaxCalculation {
  const inssRetained = Math.round(grossValue * TAX_RATES.INSS_EMPLOYEE * 100) / 100;
  const issRetained = Math.round(grossValue * issRate * 100) / 100;
  const netValue = Math.round((grossValue - inssRetained - issRetained) * 100) / 100;
  const inssPatronal = Math.round(grossValue * TAX_RATES.INSS_EMPLOYER * 100) / 100;
  
  return {
    grossValue,
    inssRetained,
    issRetained,
    netValue,
    inssPatronal,
  };
}

/**
 * Validate CPF using check digits algorithm
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCpf = cpf.replace(/\D/g, '');
  
  // Must have 11 digits
  if (cleanCpf.length !== 11) return false;
  
  // Reject known invalid patterns (all same digits)
  if (/^(\d)\1+$/.test(cleanCpf)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

/**
 * Format CPF with mask: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return cpf;
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Format PIS/NIT with mask: 000.00000.00-0
 */
export function formatPISNIT(pisNit: string): string {
  const clean = pisNit.replace(/\D/g, '');
  if (clean.length !== 11) return pisNit;
  return clean.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
}

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Format currency to BRL
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Check if expense element is PF (3.3.90.36)
 */
export function isPFElement(elementCode: string): boolean {
  return elementCode.startsWith('3.3.90.36');
}
