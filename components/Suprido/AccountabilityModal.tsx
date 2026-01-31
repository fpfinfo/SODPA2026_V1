import React, { useState } from 'react';
import { X, UploadCloud, FileCheck, AlertCircle, FileText } from 'lucide-react';
import { Processo } from '../../types';
import { useToast } from '../ui/ToastProvider';
import { supabase } from '../../lib/supabaseClient';

interface AccountabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  processo: Processo | null;
  onSuccess: () => void;
}

const AccountabilityModal: React.FC<AccountabilityModalProps> = ({ isOpen, onClose, processo, onSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen || !processo) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
        // 1. Upload files
        const attachments = [];
        for (const file of files) {
             const fileName = `${processo.id}/${Date.now()}_${file.name}`;
             const { error: uploadError } = await supabase.storage
                .from('comprovantes')
                .upload(fileName, file);

             if (uploadError) throw uploadError;
             attachments.push(fileName);
        }

        // 2. Create PC Record
        const { error: pcError } = await supabase.from('prestacoes_contas').insert({
            solicitacao_id: processo.id,
            status: 'ENVIADA',
            data_envio: new Date().toISOString(),
            relatorio_atividades: report,
            arquivos: attachments
        });

        if (pcError) throw pcError;

        // 3. Update Request Status
        const { error: updateError } = await supabase
            .from('solicitacoes')
            .update({ status: 'PC_EM_ANALISE' }) // ou 'AGUARDANDO_PC' dependendo do fluxo
            .eq('id', processo.id);

        if (updateError) throw updateError;

        showToast({ type: 'success', title: 'Sucesso', message: 'Prestação de contas enviada com sucesso!' });
        setFiles([]);
        setReport('');
        onSuccess();
        onClose();

    } catch (error: any) {
        showToast({ type: 'error', title: 'Erro', message: error.message || 'Falha ao enviar prestação de contas.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="bg-orange-600 px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <FileCheck size={24} />
                Prestação de Contas
            </h3>
            <button onClick={onClose} className="hover:bg-orange-700 p-1 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 uppercase mb-1">Processo Ref.</h4>
                <p className="text-gray-900 font-medium">{processo.nup || 'NUP Pendente'}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{processo.justificativa}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Relatório de Atividades */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText size={16} className="text-orange-600" />
                        Relatório de Atividades
                    </label>
                    <textarea 
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-shadow"
                        placeholder="Descreva detalhadamente as atividades realizadas durante o período da viagem..."
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                    />
                </div>

                {/* Upload de Comprovantes */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <UploadCloud size={16} className="text-orange-600" />
                        Comprovantes (Bilhetes, Notas Fiscais)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-orange-50 hover:border-orange-300 transition-all cursor-pointer relative group">
                        <input 
                            type="file" 
                            multiple 
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-gray-100 rounded-full group-hover:bg-orange-100 transition-colors">
                                <UploadCloud size={24} className="text-gray-400 group-hover:text-orange-500" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium group-hover:text-orange-700">
                                {files.length > 0 ? `${files.length} arquivo(s) selecionado(s)` : 'Clique para selecionar arquivos'}
                            </span>
                            <span className="text-xs text-gray-400">PDF, JPG ou PNG (Max 10MB)</span>
                        </div>
                    </div>
                    
                    {files.length > 0 && (
                        <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                                    <FileCheck size={14} className="text-green-500" />
                                    <span className="truncate flex-1">{file.name}</span>
                                    <span className="text-gray-400">{(file.size / 1024).toFixed(0)}KB</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <p>Ao enviar, o processo será encaminhado para análise da SODPA. Certifique-se de que todos os documentos estão legíveis.</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        disabled={isSubmitting || files.length === 0 || !report}
                        className="px-4 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Prestação de Contas'}
                    </button>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};

export default AccountabilityModal;
