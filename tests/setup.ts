import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Supabase client for testing
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}));

// Global test utilities
export const mockProcess = {
  id: 'test-uuid-123',
  protocolNumber: '2026.00001',
  interestedParty: 'SERVIDOR TESTE',
  value: 5000,
  status: 'INBOX',
  type: 'FUND_REQUEST',
  supplyCategory: 'ORDINARY',
  createdAt: new Date().toISOString(),
};
