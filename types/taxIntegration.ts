/**
 * Tax Integration Types for PF Services (3.3.90.36)
 * INSS (11%) and ISS (5%) withholding
 */

// Service provider personal data for eSocial/EFD-Reinf compliance
export interface ServiceProviderData {
  cpf: string;
  fullName: string;
  birthDate: string;  // YYYY-MM-DD
  pisNit: string;
  serviceDescription: string;
}

// Real-time tax calculation results
export interface TaxCalculation {
  grossValue: number;
  inssRetained: number;   // 11%
  issRetained: number;    // 5%
  netValue: number;       // grossValue - inss - iss
  inssPatronal: number;   // 20% (employer portion)
}

// Complete INSS retention record for the module
export interface InssRetentionRecord {
  id: string;
  cpf: string;
  fullName: string;
  birthDate: string;
  pisNit: string;
  grossValue: number;
  inssRetained: number;
  inssPatronal: number;
  processNumber: string;
  portariaSf: string;
  comarca: string;
  serviceDescription: string;
  serviceDate: string;
  solicitacaoId: string;
  createdAt: string;
  status: 'PENDING' | 'PAID';
}

// Expense item with PF tax data attached
export interface ExpenseItemPF {
  id: string;
  element: string;              // 3.3.90.36
  description: string;
  grossValue: number;
  netValue: number;
  serviceDate: string;
  provider: ServiceProviderData;
  taxes: TaxCalculation;
}

// Tax rates constants
export const TAX_RATES = {
  INSS_EMPLOYEE: 0.11,   // 11% retained from provider
  INSS_EMPLOYER: 0.20,   // 20% employer contribution
  ISS_DEFAULT: 0.05,     // 5% municipal services tax
} as const;
