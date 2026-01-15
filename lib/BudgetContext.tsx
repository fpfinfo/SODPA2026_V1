/**
 * Budget Context Provider
 * Global provider for budget configuration access across the application
 */

import React, { createContext, useContext, ReactNode } from 'react';
import useBudgetConfig, { UseBudgetConfigReturn } from './useBudgetConfig';

const BudgetContext = createContext<UseBudgetConfigReturn | null>(null);

interface BudgetProviderProps {
  children: ReactNode;
}

export function BudgetProvider({ children }: BudgetProviderProps) {
  const budgetConfig = useBudgetConfig();
  
  return (
    <BudgetContext.Provider value={budgetConfig}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget(): UseBudgetConfigReturn {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}

// Re-export utilities
export { BudgetUtils } from './useBudgetConfig';
export type { BudgetLookupResult } from './useBudgetConfig';
