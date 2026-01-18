import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { RoleRequest, ROLE_LABELS } from '../../hooks/useRoleRequests';

interface RoleApprovalQueueProps {
  pendingRequests: RoleRequest[];
  onApprove: (userId: string) => Promise<void>;
  onReject: (userId: string, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export const RoleApprovalQueue: React.FC<RoleApprovalQueueProps> = ({
  pendingRequests,
  onApprove,
  onReject,
  onRefresh
}) => {
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (pendingRequests.length === 0) return null;

  return (
    <div className="bg-white rounded-[32px] shadow-lg border border-slate-200 overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex justify-between items-center">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Users size={20} className="text-purple-600"/>
          Solicitações de Acesso
          <span className="ml-2 px-2.5 py-1 bg-purple-600 text-white rounded-full text-xs font-black">{pendingRequests.length}</span>
        </h3>
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm">
          Atualizar
        </button>
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Atual</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil Solicitado</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pendingRequests.map((req: RoleRequest) => (
            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src={req.avatar_url || '/default-avatar.png'} className="w-10 h-10 rounded-xl border-2 border-white shadow" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{req.nome}</p>
                    <p className="text-xs text-slate-500">{req.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{ROLE_LABELS[req.role] || req.role}</span>
              </td>
              <td className="px-6 py-4">
                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-black">{ROLE_LABELS[req.requested_role] || req.requested_role}</span>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                {req.role_request_date ? new Date(req.role_request_date).toLocaleDateString('pt-BR') : '-'}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={async () => {
                      if (confirm(`Aprovar ${req.nome} como ${ROLE_LABELS[req.requested_role]}?`)) {
                        await onApprove(req.id);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all"
                  >
                    Aprovar
                  </button>
                  <button 
                    onClick={() => setRejectingUserId(req.id)}
                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                  >
                    Rejeitar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Rejection Modal */}
      {rejectingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-4">Rejeitar Solicitação</h3>
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição (obrigatório)..."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 h-24"
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => { setRejectingUserId(null); setRejectReason(''); }}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    alert('Informe o motivo da rejeição.');
                    return;
                  }
                  await onReject(rejectingUserId, rejectReason);
                  setRejectingUserId(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
