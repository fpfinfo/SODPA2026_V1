import React, { useState } from 'react';
import { X, Printer, Car, Truck } from 'lucide-react';
import { generateReciboTransportePDF } from '../../utils/generateReciboTransportePDF';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useFornecedoresHistory } from '../../hooks/useFornecedoresHistory';

interface ReciboTransporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  nup: string;
}

export const ReciboTransporteModal: React.FC<ReciboTransporteModalProps> = ({ isOpen, onClose, nup }) => {
  const { userProfile } = useUserProfile();
  const { suggestions, searchFornecedores, clearSuggestions } = useFornecedoresHistory();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    prestadorNome: '',
    prestadorCPF: '',
    prestadorRG: '',
    prestadorEndereco: '',
    dataInicio: '',
    dataFim: '',
    valor: '',
    descricaoTrajeto: '',
    cidade: 'Belém' // Default, ideal vir do userProfile
  });

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!formData.prestadorNome || !formData.valor || !formData.descricaoTrajeto) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    const valorNum = parseFloat(formData.valor.replace(/[^\d,.-]/g, '').replace(',', '.'));

    generateReciboTransportePDF({
      nup,
      supridoNome: userProfile?.nome || 'SUPRIDO',
      supridoMatricula: userProfile?.matricula || '00000',
      prestadorNome: formData.prestadorNome,
      prestadorCPF: formData.prestadorCPF,
      prestadorRG: formData.prestadorRG,
      prestadorEndereco: formData.prestadorEndereco,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      valor: valorNum,
      descricaoTrajeto: formData.descricaoTrajeto,
      cidade: formData.cidade,
      dataEmissao: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
               <Car size={20} />
             </div>
             <div>
               <h3 className="font-bold text-lg">Emitir Recibo de Transporte</h3>
               <p className="text-xs text-slate-400">Elemento 3.3.90.33 - Isento de Impostos</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
           {/* Prestador */}
           <div className="col-span-2 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Dados do Prestador (Barqueiro/Motorista)</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo *</label>
                    <input 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm font-bold"
                      value={formData.prestadorNome}
                      onChange={e => {
                         const val = e.target.value;
                         setFormData(prev => ({...prev, prestadorNome: val}));
                         searchFornecedores(val);
                         setShowSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-slate-200 shadow-xl mt-1 rounded-lg max-h-32 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <button key={i} className="w-full text-left p-2 text-xs hover:bg-slate-50" onClick={() => {
                             setFormData(prev => ({...prev, prestadorNome: s.emitente, prestadorCPF: s.cnpj_cpf }));
                             clearSuggestions();
                          }}>
                             {s.emitente}
                          </button>
                        ))}
                      </div>
                    )}
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CPF *</label>
                    <input 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="000.000.000-00"
                      value={formData.prestadorCPF}
                      onChange={e => setFormData(prev => ({...prev, prestadorCPF: e.target.value}))}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">RG</label>
                    <input 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      value={formData.prestadorRG}
                      onChange={e => setFormData(prev => ({...prev, prestadorRG: e.target.value}))}
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cidade de Emissão</label>
                    <input 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      value={formData.cidade}
                      onChange={e => setFormData(prev => ({...prev, cidade: e.target.value}))}
                    />
                 </div>
                 <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço Completo</label>
                    <input 
                      className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                      value={formData.prestadorEndereco}
                      onChange={e => setFormData(prev => ({...prev, prestadorEndereco: e.target.value}))}
                    />
                 </div>
              </div>
           </div>

           {/* Diligência */}
           <div className="col-span-2 space-y-4 mt-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Dados da Diligência</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Data Início</label>
                    <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                           value={formData.dataInicio} onChange={e => setFormData({...formData, dataInicio: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Data Fim</label>
                    <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                           value={formData.dataFim} onChange={e => setFormData({...formData, dataFim: e.target.value})} />
                 </div>
                 <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Trajeto / Descrição do Serviço *</label>
                    <textarea 
                       className="w-full p-2 border border-slate-200 rounded-lg text-sm h-20 resize-none"
                       placeholder="Ex: Deslocamento fluvial ida e volta para cumprimento de mandado na Ilha do Combu..."
                       value={formData.descricaoTrajeto}
                       onChange={e => setFormData({...formData, descricaoTrajeto: e.target.value})}
                    />
                 </div>
                 
                 <div className="col-span-2 bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100">
                    <div>
                       <label className="text-[10px] font-bold text-blue-600 uppercase">Valor Total (R$)</label>
                       <p className="text-xs text-blue-400">Sem retenção de impostos</p>
                    </div>
                    <input 
                       className="w-40 p-3 text-right font-black text-xl border border-blue-200 rounded-lg text-slate-800"
                       placeholder="0,00"
                       value={formData.valor}
                       onChange={e => setFormData({...formData, valor: e.target.value})}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
           <button 
             onClick={handleGenerate}
             className="px-6 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 flex items-center gap-2 shadow-lg"
           >
             <Printer size={16} />
             Gerar Recibo PDF
           </button>
        </div>
      </div>
    </div>
  );
};
