/**
 * Service Provider Form for PF Services (3.3.90.36)
 * Collects CPF, name, birth date, PIS/NIT, and service description
 */

import React, { useState, useCallback } from 'react';
import { User, Calendar, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { validateCPF, formatCPF, formatPISNIT } from '../lib/taxCalculations';
import { ServiceProviderData } from '../types/taxIntegration';

interface ServiceProviderFormProps {
  value: Partial<ServiceProviderData>;
  onChange: (data: Partial<ServiceProviderData>) => void;
  className?: string;
}

export const ServiceProviderForm: React.FC<ServiceProviderFormProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [cpfValid, setCpfValid] = useState(false);

  const handleCpfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = rawValue.length <= 11 ? formatCPF(rawValue) : formatCPF(rawValue.slice(0, 11));
    
    onChange({ ...value, cpf: formatted });
    
    if (rawValue.length === 11) {
      if (validateCPF(rawValue)) {
        setCpfError(null);
        setCpfValid(true);
      } else {
        setCpfError('CPF inválido');
        setCpfValid(false);
      }
    } else {
      setCpfError(null);
      setCpfValid(false);
    }
  }, [value, onChange]);

  const handlePisNitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = rawValue.length <= 11 ? formatPISNIT(rawValue) : formatPISNIT(rawValue.slice(0, 11));
    onChange({ ...value, pisNit: formatted });
  }, [value, onChange]);

  const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2";

  return (
    <div className={`bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-violet-200">
        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
          <User size={20} className="text-white" />
        </div>
        <div>
          <h4 className="text-sm font-black text-violet-900 uppercase tracking-wider">Dados do Prestador</h4>
          <p className="text-xs text-violet-600 font-medium">Obrigatório para elemento 3.3.90.36 (PF)</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPF */}
        <div>
          <label className={labelClass}>
            <CreditCard size={12} /> CPF <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={value.cpf || ''}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className={`${inputClass} pr-10 ${cpfError ? 'border-red-300 bg-red-50' : cpfValid ? 'border-emerald-300 bg-emerald-50' : ''}`}
            />
            {cpfValid && (
              <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
            )}
            {cpfError && (
              <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
            )}
          </div>
          {cpfError && <p className="text-xs text-red-500 font-medium mt-1">{cpfError}</p>}
        </div>

        {/* PIS/NIT */}
        <div>
          <label className={labelClass}>
            <CreditCard size={12} /> PIS/PASEP/NIT <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.pisNit || ''}
            onChange={handlePisNitChange}
            placeholder="000.00000.00-0"
            maxLength={14}
            className={inputClass}
          />
        </div>

        {/* Full Name */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            <User size={12} /> Nome Completo do Prestador <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={value.fullName || ''}
            onChange={(e) => onChange({ ...value, fullName: e.target.value.toUpperCase() })}
            placeholder="NOME COMPLETO DO PRESTADOR DE SERVIÇO"
            className={inputClass}
          />
        </div>

        {/* Birth Date */}
        <div>
          <label className={labelClass}>
            <Calendar size={12} /> Data de Nascimento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={value.birthDate || ''}
            onChange={(e) => onChange({ ...value, birthDate: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Service Description */}
        <div className="md:col-span-2">
          <label className={labelClass}>
            <FileText size={12} /> Descrição do Serviço Prestado <span className="text-red-500">*</span>
          </label>
          <textarea
            value={value.serviceDescription || ''}
            onChange={(e) => onChange({ ...value, serviceDescription: e.target.value })}
            placeholder="Ex: Serviço de limpeza e conservação, transporte de materiais, alimentação para evento..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 p-4 bg-violet-100 border border-violet-200 rounded-xl">
        <AlertCircle size={18} className="text-violet-600 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-700 leading-relaxed">
          Estes dados são <strong>obrigatórios</strong> para cumprimento das obrigações acessórias (eSocial/EFD-Reinf) 
          e serão integrados automaticamente ao Módulo de Gestão INSS.
        </p>
      </div>
    </div>
  );
};

export default ServiceProviderForm;
