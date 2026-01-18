/**
 * CPF Validator Utility
 * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
 */

export function normalizeCPF(cpf?: string): string | undefined {
  if (!cpf) return undefined;
  // Remove todos os caracteres não numéricos
  return cpf.replace(/\D/g, '');
}

export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove non-digit characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check if has 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(9))) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
  if (checkDigit !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
}

export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
