import { describe, it, expect } from 'vitest';

/**
 * Limit Validation Tests
 * 
 * Business Rules (CNJ 169/2013):
 * - Suprimento de Fundos Ordinário: Limite R$ 15.000,00
 * - Suprimento de Fundos Extraordinário: Sem limite fixo (requer autorização)
 * - Prazo de aplicação: 90 dias (ordinário), 30 dias (extraordinário)
 * - Prazo de prestação de contas: 30 dias após aplicação
 */

// Limits as per CNJ 169/2013
const ORDINARY_LIMIT = 15000; // R$ 15.000,00
const APPLICATION_PERIOD_ORDINARY = 90; // days
const APPLICATION_PERIOD_EXTRAORDINARY = 30; // days
const ACCOUNTABILITY_PERIOD = 30; // days

// Allowed expense elements for Suprimento de Fundos
const ALLOWED_ELEMENTS = ['3.3.90.30', '3.3.90.33', '3.3.90.36', '3.3.90.39'];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const validateOrdinaryLimit = (value: number): ValidationResult => {
  const errors: string[] = [];
  
  if (value <= 0) {
    errors.push('Valor deve ser maior que zero');
  }
  
  if (value > ORDINARY_LIMIT) {
    errors.push(`Valor excede o limite de R$ ${ORDINARY_LIMIT.toLocaleString('pt-BR')}`);
  }
  
  return { valid: errors.length === 0, errors };
};

const validateExpenseElement = (element: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!ALLOWED_ELEMENTS.includes(element)) {
    errors.push(`Elemento de despesa ${element} não autorizado para Suprimento de Fundos`);
  }
  
  return { valid: errors.length === 0, errors };
};

const calculateDeadline = (startDate: Date, periodDays: number): Date => {
  const deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + periodDays);
  return deadline;
};

const isOverdue = (deadline: Date, currentDate: Date = new Date()): boolean => {
  return currentDate > deadline;
};

describe('Limit Validations', () => {
  describe('Ordinary Fund Limit (R$ 15.000)', () => {
    it('should accept values below limit', () => {
      const result = validateOrdinaryLimit(5000);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept values at exact limit', () => {
      const result = validateOrdinaryLimit(15000);
      expect(result.valid).toBe(true);
    });

    it('should reject values above limit', () => {
      const result = validateOrdinaryLimit(15001);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valor excede o limite de R$ 15.000');
    });

    it('should reject zero value', () => {
      const result = validateOrdinaryLimit(0);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Valor deve ser maior que zero');
    });

    it('should reject negative value', () => {
      const result = validateOrdinaryLimit(-100);
      expect(result.valid).toBe(false);
    });
  });

  describe('Expense Element Validation', () => {
    it('should accept allowed element 3.3.90.30', () => {
      const result = validateExpenseElement('3.3.90.30');
      expect(result.valid).toBe(true);
    });

    it('should accept allowed element 3.3.90.33', () => {
      const result = validateExpenseElement('3.3.90.33');
      expect(result.valid).toBe(true);
    });

    it('should accept allowed element 3.3.90.36', () => {
      const result = validateExpenseElement('3.3.90.36');
      expect(result.valid).toBe(true);
    });

    it('should accept allowed element 3.3.90.39', () => {
      const result = validateExpenseElement('3.3.90.39');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid expense element', () => {
      const result = validateExpenseElement('4.4.90.52');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('não autorizado');
    });
  });
});

describe('Deadline Calculations', () => {
  describe('Application Period', () => {
    it('should calculate 90-day deadline for ordinary fund', () => {
      const start = new Date('2026-01-01');
      const deadline = calculateDeadline(start, APPLICATION_PERIOD_ORDINARY);
      expect(deadline.toISOString().split('T')[0]).toBe('2026-04-01');
    });

    it('should calculate 30-day deadline for extraordinary fund', () => {
      const start = new Date('2026-01-01');
      const deadline = calculateDeadline(start, APPLICATION_PERIOD_EXTRAORDINARY);
      expect(deadline.toISOString().split('T')[0]).toBe('2026-01-31');
    });

    it('should calculate 30-day accountability deadline', () => {
      const applicationEnd = new Date('2026-04-01');
      const deadline = calculateDeadline(applicationEnd, ACCOUNTABILITY_PERIOD);
      expect(deadline.toISOString().split('T')[0]).toBe('2026-05-01');
    });
  });

  describe('Overdue Detection', () => {
    it('should detect overdue deadline', () => {
      const deadline = new Date('2026-01-01');
      const currentDate = new Date('2026-01-02');
      expect(isOverdue(deadline, currentDate)).toBe(true);
    });

    it('should not flag non-overdue deadline', () => {
      const deadline = new Date('2026-12-31');
      const currentDate = new Date('2026-01-01');
      expect(isOverdue(deadline, currentDate)).toBe(false);
    });

    it('should not flag deadline on exact date', () => {
      const deadline = new Date('2026-01-01T23:59:59');
      const currentDate = new Date('2026-01-01T12:00:00');
      expect(isOverdue(deadline, currentDate)).toBe(false);
    });
  });
});

describe('CNJ 169/2013 Compliance', () => {
  it('should validate ordinary limit is R$ 15.000', () => {
    expect(ORDINARY_LIMIT).toBe(15000);
  });

  it('should validate application period is 90 days', () => {
    expect(APPLICATION_PERIOD_ORDINARY).toBe(90);
  });

  it('should validate extraordinary period is 30 days', () => {
    expect(APPLICATION_PERIOD_EXTRAORDINARY).toBe(30);
  });

  it('should validate accountability period is 30 days', () => {
    expect(ACCOUNTABILITY_PERIOD).toBe(30);
  });

  it('should have correct allowed elements count', () => {
    expect(ALLOWED_ELEMENTS).toHaveLength(4);
  });
});
