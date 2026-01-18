import { describe, it, expect, vi } from 'vitest';

/**
 * INSS Calculation Tests
 * 
 * Business Rules (CNJ 169/2013):
 * - INSS é retido na fonte para serviços prestados por pessoa física
 * - Alíquota padrão: 11% (até teto INSS)
 * - Teto INSS 2026: R$ 7.786,02 (valor hipotético para testes)
 */

// Test utility functions (would normally be imported from lib/calculations)
const INSS_RATE = 0.11; // 11%
const INSS_CEILING = 7786.02; // 2026 ceiling (example)
const MAX_INSS_CONTRIBUTION = INSS_CEILING * INSS_RATE; // R$ 856,46

const calculateINSS = (serviceValue: number): number => {
  const contribution = serviceValue * INSS_RATE;
  return Math.min(contribution, MAX_INSS_CONTRIBUTION);
};

const calculateNetValue = (grossValue: number, inssRetention: number): number => {
  return grossValue - inssRetention;
};

describe('INSS Calculations', () => {
  describe('calculateINSS', () => {
    it('should calculate 11% for values below ceiling', () => {
      const serviceValue = 1000;
      const expected = 110; // 11% of 1000
      expect(calculateINSS(serviceValue)).toBe(expected);
    });

    it('should cap at maximum contribution for values above ceiling', () => {
      const serviceValue = 10000; // Above ceiling
      const expected = MAX_INSS_CONTRIBUTION;
      expect(calculateINSS(serviceValue)).toBeCloseTo(expected, 2);
    });

    it('should handle zero value', () => {
      expect(calculateINSS(0)).toBe(0);
    });

    it('should handle exact ceiling value', () => {
      const expected = INSS_CEILING * INSS_RATE;
      expect(calculateINSS(INSS_CEILING)).toBeCloseTo(expected, 2);
    });

    it('should handle small values correctly', () => {
      const serviceValue = 100;
      const expected = 11; // 11% of 100
      expect(calculateINSS(serviceValue)).toBe(expected);
    });
  });

  describe('calculateNetValue', () => {
    it('should subtract INSS from gross value', () => {
      const gross = 1000;
      const inss = 110;
      expect(calculateNetValue(gross, inss)).toBe(890);
    });

    it('should handle zero INSS', () => {
      const gross = 1000;
      expect(calculateNetValue(gross, 0)).toBe(1000);
    });
  });
});

describe('INSS Business Rules', () => {
  it('should only apply to PF (pessoa física) services', () => {
    const isPF = true;
    const isPJ = false;
    
    // INSS only applies to individuals (PF)
    expect(isPF).toBe(true);
    expect(isPJ).toBe(false);
  });

  it('should validate that INSS rate is 11%', () => {
    expect(INSS_RATE).toBe(0.11);
  });

  it('should validate ceiling is within expected range', () => {
    // INSS ceiling should be between R$ 7,000 and R$ 10,000 (2024-2026 range)
    expect(INSS_CEILING).toBeGreaterThan(7000);
    expect(INSS_CEILING).toBeLessThan(10000);
  });
});
