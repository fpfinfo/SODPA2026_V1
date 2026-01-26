import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  X, 
  Search, 
  UserPlus, 
  Loader2, 
  AlertCircle, 
  Building2,
  MapPin,
  Briefcase,
  User
} from 'lucide-react';
import { useToast } from '../ui/ToastProvider';

interface ServidorTJ {
  id: string; // This is the ID in servidores_tj, not auth ID
  nome: string;
  email: string | null;
  cargo: string | null;
  lotacao: string | null;
  comarca: string | null;
  matricula: string | null;
  profile_id?: string; // We will attach this if found
  avatar_url?: string | null;
}

interface TitularAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidadeId: string; // The ID of the UnidadeTitular entry
  comarcaNome: string;
  onSuccess: () => void;
}

export const TitularAssignmentModal: React.FC<TitularAssignmentModalProps> = ({
  isOpen,
  onClose,
  unidadeId,
  comarcaNome,
  onSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ServidorTJ[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const { showToast } = useToast();

  // Debounced Search
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Search in servidores_tj (Source of Truth for HR data)
        const { data: servidores, error: errServ } = await supabase
          .from('servidores_tj')
          .select('id, nome, email, cargo, lotacao, comarca, matricula, avatar_url')
          .or(`nome.ilike.%${searchQuery}%,matricula.ilike.%${searchQuery}%`)
          .eq('ativo', true)
          .limit(10);

        if (errServ) throw errServ;
        
        if (!servidores || servidores.length === 0) {
          setResults([]);
          return;
        }

        // 2. Cross-reference with profiles to get the actual User ID needed for assignment
        const emails = servidores.map(s => s.email).filter(Boolean);
        
        if (emails.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email')
                .in('email', emails);

            const emailMap = new Map(profiles?.map(p => [p.email?.toLowerCase(), p.id]));

            const enriched = servidores.map(s => ({
                ...s,
                profile_id: s.email ? emailMap.get(s.email.toLowerCase()) : undefined
            }));
            
            setResults(enriched);
        } else {
            setResults(servidores);
        }

      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAssign = async (servidor: ServidorTJ) => {
    if (!servidor.profile_id) {
        showToast({ 
            type: 'error', 
            title: 'Usuário sem Acesso', 
            message: 'Este servidor consta na base do RH mas ainda não criou conta no sistema.' 
        });
        return;
    }

    setIsAssigning(true);
    try {
      // 1. Update unidade_titulares
      const { error } = await supabase
        .from('unidade_titulares')
        .update({
          suprido_atual_id: servidor.profile_id,
          status: 'REGULAR', 
          updated_at: new Date().toISOString()
        })
        .eq('id', unidadeId);

      if (error) throw error;

      showToast({ 
        type: 'success', 
        title: 'Titular Atribuído', 
        message: `${servidor.nome} definido para ${comarcaNome}.` 
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error assigning titular:', error);
      showToast({ 
        type: 'error', 
        title: 'Erro na Atribuição', 
        message: error.message 
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <UserPlus className="text-purple-600" size={20} />
              Atribuir Titular
            </h3>
            <p className="text-xs text-slate-500 font-medium">Definir responsável por <span className="text-purple-600 font-bold">{comarcaNome}</span></p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por Nome ou Matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-bold text-slate-700"
              autoFocus
            />
            {isLoading && (
              <div className="absolute right-3 top-3">
                <Loader2 size={18} className="animate-spin text-purple-600" />
              </div>
            )}
          </div>

          <div className="space-y-2 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
            {searchQuery.length > 0 && searchQuery.length < 3 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Digite mais {3 - searchQuery.length} letras para buscar...
              </div>
            ) : results.length === 0 && searchQuery.length >= 3 && !isLoading ? (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhum servidor encontrado na base TJPA.</p>
              </div>
            ) : (
              results.map(servidor => (
                <button
                  key={servidor.id}
                  onClick={() => handleAssign(servidor)}
                  disabled={isAssigning || !servidor.profile_id}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left group relative ${
                    servidor.profile_id 
                    ? 'hover:bg-purple-50 hover:border-purple-200 border-slate-100 bg-white' 
                    : 'bg-slate-50 border-slate-100 opacity-70 cursor-not-allowed grayscale-[0.5]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-300">
                     {servidor.avatar_url ? (
                        <img src={servidor.avatar_url} alt="" className="w-full h-full object-cover"/>
                     ) : (
                        <User size={20} className="text-slate-400" />
                     )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-black text-slate-800 group-hover:text-purple-700 truncate">{servidor.nome}</p>
                        {!servidor.profile_id && (
                            <span className="text-[10px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Sem Acesso</span>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-1 mt-1">
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Briefcase size={12} className="text-slate-400"/>
                            {servidor.cargo || 'Cargo não informado'}
                            {servidor.matricula && <span className="text-slate-300">• {servidor.matricula}</span>}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Building2 size={12} className="text-slate-400"/>
                            {servidor.lotacao || 'Lotação não informada'}
                        </p>
                        {servidor.comarca && (
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-400"/>
                                {servidor.comarca}
                            </p>
                        )}
                    </div>
                  </div>

                  {isAssigning && servidor.profile_id && (
                     <div className="absolute right-4 top-1/2 -translate-y-1/2">
                         <Loader2 size={16} className="animate-spin text-purple-600" />
                     </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
