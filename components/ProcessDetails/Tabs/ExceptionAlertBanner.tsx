import React from 'react';
import { AlertTriangle, Shield, DollarSign, FileText, ArrowRight } from 'lucide-react';
import { JuriException, formatExceptionType, formatExceptionValue } from '../../../hooks/useExceptionDetection';

interface ExceptionAlertBannerProps {
  exceptions: JuriException[];
  onRequestAuthorization?: () => void;
  hasOficioAttached?: boolean;
}

/**
 * Banner de alerta que aparece quando um processo Extra-Júri
 * excede os limites autorizados e precisa de autorização especial
 */
export const ExceptionAlertBanner: React.FC<ExceptionAlertBannerProps> = ({
  exceptions,
  onRequestAuthorization,
  hasOficioAttached = false
}) => {
  if (!exceptions || exceptions.length === 0) return null;

  const getExceptionIcon = (tipo: JuriException['tipo']) => {
    if (tipo === 'POLICIAIS') return Shield;
    return DollarSign;
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-amber-100 rounded-xl">
          <AlertTriangle size={28} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-black text-amber-800 mb-1">
            Autorização Especial Necessária
          </h3>
          <p className="text-amber-700 text-sm">
            Este processo contém valores acima dos limites autorizados. 
            Será necessário autorização do <strong>Ordenador de Despesas (SEFIN)</strong>.
          </p>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white/80 rounded-xl border border-amber-200 overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-amber-100/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black text-amber-800 uppercase tracking-wider">
                Exceção
              </th>
              <th className="px-4 py-3 text-center text-xs font-black text-amber-800 uppercase tracking-wider">
                Solicitado
              </th>
              <th className="px-4 py-3 text-center text-xs font-black text-amber-800 uppercase tracking-wider">
                Limite
              </th>
              <th className="px-4 py-3 text-center text-xs font-black text-amber-800 uppercase tracking-wider">
                Excedente
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {exceptions.map((exc, index) => {
              const Icon = getExceptionIcon(exc.tipo);
              return (
                <tr key={index} className="hover:bg-amber-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-amber-600" />
                      <span className="font-bold text-slate-700">
                        {formatExceptionType(exc.tipo)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-red-600">
                      {formatExceptionValue(exc.tipo, exc.solicitado)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-slate-500">
                      {formatExceptionValue(exc.tipo, exc.limite)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      +{formatExceptionValue(exc.tipo, exc.excedente)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Requirements Section */}
      <div className="bg-white/60 rounded-xl p-4 mb-4">
        <h4 className="font-bold text-amber-800 mb-3 text-sm">Documentos Obrigatórios:</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              hasOficioAttached ? 'bg-emerald-100' : 'bg-slate-100'
            }`}>
              {hasOficioAttached ? (
                <span className="text-emerald-600 text-sm">✓</span>
              ) : (
                <span className="text-slate-400 text-sm">1</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className={hasOficioAttached ? 'text-emerald-600' : 'text-slate-400'} />
              <span className={`text-sm ${hasOficioAttached ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                Ofício de Justificativa (anexado pelo Gestor)
              </span>
              {!hasOficioAttached && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">
                  Pendente
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100">
              <span className="text-slate-400 text-sm">2</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span className="text-sm text-slate-600">
                Autorização do Ordenador (gerada pela AJSEFIN)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Explanation */}
      <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2 text-sm">Fluxo de Autorização:</h4>
        <div className="flex items-center gap-2 text-xs text-blue-700 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 rounded-lg font-medium">SOSFU</span>
          <ArrowRight size={14} />
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg font-medium">AJSEFIN</span>
          <ArrowRight size={14} />
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-medium">Ordenador (SEFIN)</span>
          <ArrowRight size={14} />
          <span className="px-2 py-1 bg-blue-100 rounded-lg font-medium">SOSFU</span>
        </div>
      </div>

      {/* Action Button */}
      {onRequestAuthorization && (
        <div className="flex justify-end">
          <button
            onClick={onRequestAuthorization}
            disabled={!hasOficioAttached}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              hasOficioAttached
                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <FileText size={18} />
            Encaminhar para AJSEFIN
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {!hasOficioAttached && (
        <p className="text-center text-amber-700 text-xs mt-3">
          ⚠️ Verifique se o Gestor anexou o ofício de justificativa no Dossiê antes de encaminhar.
        </p>
      )}
    </div>
  );
};

export default ExceptionAlertBanner;
