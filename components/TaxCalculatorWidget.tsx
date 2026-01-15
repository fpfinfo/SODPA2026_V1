/**
 * Tax Calculator Widget for PF Services (3.3.90.36)
 * Real-time calculation of INSS (11%), ISS (5%), and net value
 */

import React, { useMemo } from 'react';
import { Calculator, AlertTriangle, Info } from 'lucide-react';
import { calculateTaxes, formatBRL } from '../lib/taxCalculations';
import { TaxCalculation } from '../types/taxIntegration';

interface TaxCalculatorWidgetProps {
  grossValue: number;
  issRate?: number;
  onChange?: (taxes: TaxCalculation) => void;
  className?: string;
}

export const TaxCalculatorWidget: React.FC<TaxCalculatorWidgetProps> = ({
  grossValue,
  issRate = 0.05,
  onChange,
  className = ''
}) => {
  const taxes = useMemo(() => {
    const result = calculateTaxes(grossValue, issRate);
    onChange?.(result);
    return result;
  }, [grossValue, issRate, onChange]);

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-blue-200">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <Calculator size={20} className="text-white" />
        </div>
        <div>
          <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider">Calculadora Tributária</h4>
          <p className="text-xs text-blue-600 font-medium">Cálculo automático de retenções</p>
        </div>
      </div>

      {/* Calculation Grid */}
      <div className="space-y-3">
        {/* Gross Value */}
        <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Bruto</span>
          <span className="text-lg font-black text-slate-900">{formatBRL(taxes.grossValue)}</span>
        </div>

        {/* INSS */}
        <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">(-) INSS Retido</span>
            <span className="text-[10px] font-bold text-red-400 bg-red-100 px-2 py-0.5 rounded-full">11%</span>
          </div>
          <span className="text-lg font-black text-red-700">{formatBRL(taxes.inssRetained)}</span>
        </div>

        {/* ISS */}
        <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">(-) ISS Retido</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-100 px-2 py-0.5 rounded-full">{(issRate * 100).toFixed(0)}%</span>
          </div>
          <span className="text-lg font-black text-amber-700">{formatBRL(taxes.issRetained)}</span>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-blue-200 my-2" />

        {/* Net Value */}
        <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">(=) Valor Líquido a Pagar</span>
          <span className="text-xl font-black text-emerald-800">{formatBRL(taxes.netValue)}</span>
        </div>

        {/* Patronal (informative) */}
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">INSS Patronal</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">20%</span>
          </div>
          <span className="text-sm font-bold text-slate-600">{formatBRL(taxes.inssPatronal)}</span>
        </div>
      </div>

      {/* GDR Alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-100 border border-amber-300 rounded-xl mt-4">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Atenção - Recolhimento Obrigatório</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            O valor de <strong>{formatBRL(taxes.inssRetained)}</strong> (INSS) deve ser recolhido via <strong>GDR</strong> e o comprovante anexado a este processo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculatorWidget;
