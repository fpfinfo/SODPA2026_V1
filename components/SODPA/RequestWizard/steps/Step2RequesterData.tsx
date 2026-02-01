import React from 'react';
import { ArrowLeft, ArrowRight, User, Mail, Hash, Briefcase, Phone, MapPin, Building, CreditCard, Users } from 'lucide-react';
import { RequesterData } from '../types';

interface Step2Props {
  value: RequesterData;
  onChange: (data: RequesterData) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2RequesterData: React.FC<Step2Props> = ({ value, onChange, onNext, onBack }) => {
  const handleChange = (field: keyof RequesterData, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const inputClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none font-medium text-gray-800";
  const inputDisabledClass = "w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 cursor-not-allowed";
  const labelClass = "text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mb-1.5";

  return (
    <div className="py-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Dados do Solicitante</h2>
        <p className="text-gray-500">Confirme seus dados pessoais para a solicitação</p>
      </div>
      
      {/* Dados Pessoais */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <User className="text-blue-600" size={20} />
          Dados Pessoais
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelClass}>Nome Completo</label>
            <input 
              type="text" 
              className={inputClass}
              value={value.nome}
              onChange={e => handleChange('nome', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}><Mail size={14} /> E-mail</label>
            <input 
              type="email" 
              disabled
              className={inputDisabledClass}
              value={value.email}
            />
          </div>
          
          <div>
            <label className={labelClass}><Hash size={14} /> CPF</label>
            <input 
              type="text" 
              placeholder="000.000.000-00"
              className={inputClass}
              value={value.cpf}
              onChange={e => handleChange('cpf', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}><Hash size={14} /> Matrícula</label>
            <input 
              type="text" 
              disabled
              className={inputDisabledClass}
              value={value.matricula}
            />
          </div>
          
          <div>
            <label className={labelClass}><Briefcase size={14} /> Cargo / Função</label>
            <input 
              type="text" 
              className={inputClass}
              value={value.cargo}
              onChange={e => handleChange('cargo', e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}><Briefcase size={14} /> Tipo de Vínculo</label>
            <select 
              className={inputClass}
              value={value.vinculo}
              onChange={e => handleChange('vinculo', e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Efetivo">Efetivo</option>
              <option value="Requisitado">Requisitado</option>
              <option value="Colaborador">Colaborador</option>
            </select>
          </div>
          
          <div>
            <label className={labelClass}><Phone size={14} /> Telefone</label>
            <input 
              type="tel" 
              placeholder="(91) 99999-9999"
              className={inputClass}
              value={value.telefone}
              onChange={e => handleChange('telefone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Localização */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <MapPin className="text-green-600" size={20} />
          Localização
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}><Building size={14} /> Lotação</label>
            <input 
              type="text" 
              placeholder="Comarca ou Setor"
              className={inputClass}
              value={value.lotacao}
              onChange={e => handleChange('lotacao', e.target.value)}
            />
          </div>
          
          <div>
            <label className={labelClass}><MapPin size={14} /> Município</label>
            <input 
              type="text" 
              placeholder="Ex: Belém"
              className={inputClass}
              value={value.municipio}
              onChange={e => handleChange('municipio', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Gestor Imediato */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Users className="text-purple-600" size={20} />
          Gestor Imediato
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}><User size={14} /> Nome do Gestor</label>
            <input 
              type="text" 
              placeholder="Nome completo"
              className={inputClass}
              value={value.gestor_nome}
              onChange={e => handleChange('gestor_nome', e.target.value)}
            />
          </div>
          
          <div>
            <label className={labelClass}><Mail size={14} /> E-mail do Gestor</label>
            <input 
              type="email" 
              placeholder="gestor@tjpa.jus.br"
              className={inputClass}
              value={value.gestor_email}
              onChange={e => handleChange('gestor_email', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Dados Bancários */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <CreditCard className="text-amber-600" size={20} />
          Dados Bancários
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Banco</label>
            <input 
              type="text" 
              placeholder="Ex: Banco do Brasil"
              className={inputClass}
              value={value.banco}
              onChange={e => handleChange('banco', e.target.value)}
            />
          </div>
          
          <div>
            <label className={labelClass}>Agência</label>
            <input 
              type="text" 
              placeholder="0000-0"
              className={inputClass}
              value={value.agencia}
              onChange={e => handleChange('agencia', e.target.value)}
            />
          </div>
          
          <div>
            <label className={labelClass}>Conta Corrente</label>
            <input 
              type="text" 
              placeholder="00000-0"
              className={inputClass}
              value={value.conta_corrente}
              onChange={e => handleChange('conta_corrente', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        
        <button
          type="button"
          onClick={onNext}
          className="px-8 py-3 rounded-xl font-bold flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          Próximo <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Step2RequesterData;
