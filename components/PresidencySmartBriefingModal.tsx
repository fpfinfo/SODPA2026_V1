import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, FileText, User, MapPin, Calendar, DollarSign, Shield, Send, XCircle, Plane, Building2 } from 'lucide-react';
import { Request } from '../types';

interface PresidencySmartBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const PresidencySmartBriefingModal: React.FC<PresidencySmartBriefingModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirm,
  onReject
}) => {
  const [authToken, setAuthToken] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  if (!isOpen || !request) return null;

  const handleAuthorize = () => {
    if (authToken.length < 4) return;
    setIsAuthorizing(true);
    setTimeout(() => {
      onConfirm(request.id);
      setIsAuthorizing(false);
      setAuthToken('');
      onClose();
    }, 1500);
  };

  const handleReject = () => {
    onReject(request.id);
    onClose();
  };

  // Mock validations - in production these would come from backend
  const validations = [
    { label: 'Parecer Jurídico', status: request.legalOpinion ? 'OK' : 'PENDING', detail: request.legalOpinion || 'Aguardando parecer' },
    { label: 'Disponibilidade Orçamentária', status: 'OK', detail: 'Dotação verificada' },
    { label: 'Aprovação do Gestor', status: 'OK', detail: 'Deferido em ' + new Date(request.dateCreated).toLocaleDateString('pt-BR') },
    { label: 'Análise SGP', status: 'OK', detail: 'Sem impedimentos funcionais' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-amber-400" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Smart Briefing</span>
              </div>
              <h2 className="text-2xl font-serif font-bold">Autorização de Deslocamento</h2>
              <p className="text-slate-400 text-sm mt-1">{request.protocol}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* Requester Card */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-2xl">
                {request.requesterName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{request.requesterName}</h3>
                <p className="text-amber-600 font-bold text-sm">{request.category || 'Magistrado'}</p>
                <p className="text-slate-500 text-sm">{request.requesterSector}</p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <MapPin size={16} />
                <span className="text-xs font-bold uppercase">Destino</span>
              </div>
              <p className="text-slate-800 font-bold text-lg">{request.destination}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Calendar size={16} />
                <span className="text-xs font-bold uppercase">Data</span>
              </div>
              <p className="text-slate-800 font-bold text-lg">
                {request.deadline ? new Date(request.deadline).toLocaleDateString('pt-BR') : 'N/D'}
              </p>
            </div>
          </div>

          {/* Justification */}
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-700 mb-3">
              <FileText size={16} />
              <span className="text-xs font-bold uppercase">Justificativa de Interesse Público</span>
            </div>
            <p className="text-slate-700 leading-relaxed italic">"{request.description}"</p>
          </div>

          {/* Validations Checklist */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Validações Administrativas</h4>
            {validations.map((v, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border ${v.status === 'OK' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-3">
                  {v.status === 'OK' ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <AlertTriangle size={20} className="text-yellow-600" />
                  )}
                  <span className="font-medium text-slate-700">{v.label}</span>
                </div>
                <span className={`text-sm ${v.status === 'OK' ? 'text-green-600' : 'text-yellow-600'}`}>{v.detail}</span>
              </div>
            ))}
          </div>

          {/* Cost Summary */}
          <div className="bg-slate-900 rounded-xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-xs uppercase font-bold">Custo Estimado Total</span>
                <p className="text-3xl font-mono font-bold mt-1">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(request.value || 0)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-xs uppercase font-bold">Tipo</span>
                <p className="text-lg font-bold text-amber-400 mt-1 flex items-center gap-2">
                  <Plane size={18} /> {request.type}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-8 py-6 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Token de Autorização</label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Digite seu token..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
            </div>
            <button 
              onClick={handleReject}
              className="px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <XCircle size={18} /> Devolver
            </button>
            <button 
              onClick={handleAuthorize}
              disabled={authToken.length < 4 || isAuthorizing}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              {isAuthorizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Autorizando...
                </>
              ) : (
                <>
                  <Send size={18} /> Autorizar Deslocamento
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresidencySmartBriefingModal;
