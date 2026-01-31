import React, { useState } from 'react';
import { Briefcase, Plane, ArrowLeft, CheckCircle, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../ui/ToastProvider';

interface NewRequestWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const NewRequestWizard: React.FC<NewRequestWizardProps> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
      type: 'DIARIA' as 'DIARIA' | 'PASSAGEM',
      destination: '',
      startDate: '',
      returnDate: '',
      motive: '',
      bankAccount: 'Cadastrado no SGP' // Default placeholder
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
        // Encontrar perfil do usuário para pegar IDs de lotação
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, lotacoes(*)')
            .eq('id', user.id)
            .single();

        if (!profile) throw new Error('Perfil não encontrado');

        const { error } = await supabase.from('solicitacoes').insert({
            tipo: formData.type === 'PASSAGEM' ? 'ORDINARIO' : 'ORDINARIO', // Mapeando para tipos do sistema
            status: 'SOLICITADA',
            data_solicitacao: new Date().toISOString(),
            suprido_id: user.id,
            gestor_id: profile.gestor_id, // Assumindo que já existe link
            justificativa: formData.motive + `\n\nDestino: ${formData.destination}\nPeríodo: ${formData.startDate} a ${formData.returnDate}`,
            valor_solicitado: 0, // Será calculado
            ativo: true
        });

        if (error) throw error;

        showToast('Solicitação enviada com sucesso!', 'success');
        onComplete?.();

    } catch (error: any) {
        showToast(error.message || 'Erro ao enviar solicitação', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleBack = () => {
    onCancel?.();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
        
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
            <ArrowLeft size={20} />
            Voltar ao Portal
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {/* Header Wizard */}
            <div className="bg-indigo-900 p-8 text-white">
                <h2 className="text-2xl font-bold mb-2">Nova Solicitação</h2>
                <p className="text-indigo-200">Preencha os dados abaixo para formalizar seu pedido de diária ou passagem.</p>
                
                <div className="flex items-center gap-4 mt-8">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-white' : 'text-indigo-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-indigo-500' : 'bg-indigo-800'}`}>1</div>
                        <span className="text-sm font-bold">Tipo</span>
                    </div>
                    <div className="h-0.5 w-12 bg-indigo-700"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-white' : 'text-indigo-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-indigo-500' : 'bg-indigo-800'}`}>2</div>
                        <span className="text-sm font-bold">Detalhes</span>
                    </div>
                    <div className="h-0.5 w-12 bg-indigo-700"></div>
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-white' : 'text-indigo-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-indigo-500' : 'bg-indigo-800'}`}>3</div>
                        <span className="text-sm font-bold">Confirmação</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
                
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-lg font-bold text-gray-800">Qual o tipo de solicitação?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div 
                                onClick={() => setFormData({...formData, type: 'DIARIA'})}
                                className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-4 text-center hover:bg-gray-50 ${formData.type === 'DIARIA' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}
                            >
                                <div className={`p-4 rounded-full ${formData.type === 'DIARIA' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Briefcase size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Diária</h4>
                                    <p className="text-sm text-gray-500 mt-1">Para custeio de despesas com hospedagem e alimentação.</p>
                                </div>
                            </div>

                            <div 
                                onClick={() => setFormData({...formData, type: 'PASSAGEM'})}
                                className={`p-6 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-4 text-center hover:bg-gray-50 ${formData.type === 'PASSAGEM' ? 'border-purple-600 bg-purple-50' : 'border-gray-200'}`}
                            >
                                <div className={`p-4 rounded-full ${formData.type === 'PASSAGEM' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <Plane size={32} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">Passagem Aérea</h4>
                                    <p className="text-sm text-gray-500 mt-1">Solicitação de emissão de bilhetes aéreos.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="button" onClick={() => setStep(2)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Continuar</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-lg font-bold text-gray-800">Detalhes da Viagem</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <MapPin size={16} /> Destino
                                </label>
                                <input 
                                    type="text" 
                                    required 
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
                                    placeholder="Cidade - UF"
                                    value={formData.destination}
                                    onChange={e => setFormData({...formData, destination: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <DollarSign size={16} /> Dados Bancários
                                </label>
                                <input 
                                    type="text" 
                                    disabled
                                    className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-3" 
                                    value={formData.bankAccount}
                                />
                                <span className="text-xs text-gray-400">Padrão cadastrado no sistema.</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar size={16} /> Data de Ida
                                </label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    value={formData.startDate}
                                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar size={16} /> Data de Volta
                                </label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                                    value={formData.returnDate}
                                    onChange={e => setFormData({...formData, returnDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FileText size={16} /> Motivo da Viagem
                            </label>
                            <textarea 
                                rows={4}
                                required
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow"
                                placeholder="Descreva detalhadamente o objetivo da viagem..."
                                value={formData.motive}
                                onChange={e => setFormData({...formData, motive: e.target.value})}
                            ></textarea>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => setStep(1)} className="text-gray-500 font-medium hover:text-gray-800 transition-colors">Voltar</button>
                            <button type="button" onClick={() => setStep(3)} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Revisar</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in duration-300 text-center">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">Tudo pronto?</h3>
                        <p className="text-gray-500 max-w-md mx-auto">Confira os dados abaixo antes de enviar sua solicitação para a SODPA.</p>
                        
                        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-lg mx-auto border border-gray-200">
                            <div className="grid grid-cols-2 gap-y-4">
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Tipo</span>
                                    <p className="font-bold text-gray-900">{formData.type}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Destino</span>
                                    <p className="font-bold text-gray-900">{formData.destination}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-500 uppercase">Período</span>
                                    <p className="font-bold text-gray-900">{formData.startDate} até {formData.returnDate}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="text-xs font-bold text-gray-500 uppercase">Motivo</span>
                                <p className="text-sm text-gray-800 mt-1">{formData.motive}</p>
                            </div>
                        </div>

                        <div className="flex justify-between pt-6 max-w-lg mx-auto">
                            <button type="button" onClick={() => setStep(2)} className="text-gray-500 font-medium hover:text-gray-800 transition-colors">Corrigir</button>
                            <button 
                              type="submit" 
                              disabled={loading}
                              className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:transform-none"
                            >
                              {loading ? 'Enviando...' : 'Confirmar Envio'}
                            </button>
                        </div>
                    </div>
                )}

            </form>
        </div>
    </div>
  );
};

export default NewRequestWizard;
