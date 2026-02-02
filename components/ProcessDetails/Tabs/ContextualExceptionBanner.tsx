import React from 'react';
import { 
  AlertTriangle, 
  Shield, 
  DollarSign, 
  FileText, 
  ArrowRight, 
  CheckCircle2,
  Send,
  ClipboardCheck,
  PenLine,
  Sparkles
} from 'lucide-react';
import { JuriException, formatExceptionType, formatExceptionValue } from '../../../hooks/useExceptionDetection';

type UserRole = 'USER' | 'SUPRIDO' | 'GESTOR' | 'SOSFU' | 'AJSEFIN' | 'SEFIN' | 'ORDENADOR' | 'SODPA' | 'SGP' | 'PRESIDENCIA';
type AuthorizationStatus = 'PENDING' | 'AWAITING_GESTOR' | 'AWAITING_SOSFU' | 'AWAITING_AJSEFIN' | 'AWAITING_ORDENADOR' | 'AUTHORIZED';

interface ContextualExceptionBannerProps {
  exceptions: JuriException[];
  currentRole: UserRole;
  authorizationStatus?: AuthorizationStatus;
  hasOficioAttached?: boolean;
  hasCertidaoAttached?: boolean;
  hasAutorizacaoAttached?: boolean;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
}

/**
 * Banner contextual que se adapta ao perfil do usuário e fase do processo
 * Exibe instruções específicas para cada papel no fluxo de autorização especial
 */
export const ContextualExceptionBanner: React.FC<ContextualExceptionBannerProps> = ({
  exceptions,
  currentRole,
  authorizationStatus = 'PENDING',
  hasOficioAttached = false,
  hasCertidaoAttached = false,
  hasAutorizacaoAttached = false,
  onPrimaryAction,
  onSecondaryAction
}) => {
  if (!exceptions || exceptions.length === 0) return null;

  const getExceptionIcon = (tipo: JuriException['tipo']) => {
    if (tipo === 'POLICIAIS') return Shield;
    return DollarSign;
  };

  // Define content based on role and status
  const getRoleContent = () => {
    switch (currentRole) {
      case 'USER':  // USER é o mesmo que SUPRIDO (renomeado)
      case 'SUPRIDO':
        return {
          title: 'Atenção: Valores Acima dos Limites',
          subtitle: 'Sua solicitação contém valores que excedem os limites autorizados.',
          instructions: [
            'Você pode prosseguir com a solicitação normalmente.',
            'Seu Gestor receberá um alerta para anexar o ofício de justificativa.',
            'O processo passará por autorização do Ordenador de Despesas antes da execução.'
          ],
          icon: AlertTriangle,
          gradient: 'from-amber-500 to-orange-500',
          bgColor: 'bg-gradient-to-r from-amber-50 to-orange-50',
          borderColor: 'border-amber-300',
          textColor: 'text-amber-800',
          primaryButtonText: 'Continuar com a Solicitação',
          primaryButtonColor: 'bg-amber-600 hover:bg-amber-700',
          showDocuments: false
        };

      case 'GESTOR':
        return {
          title: 'Ação Necessária: Anexar Documentação',
          subtitle: 'Este processo requer autorização especial do Ordenador de Despesas.',
          instructions: [
            'Anexe a Certidão de Atesto normalmente.',
            'Anexe também um Ofício de Justificativa explicando a necessidade dos valores excedentes.',
            'Após anexar ambos os documentos, envie o processo para SOSFU.'
          ],
          icon: FileText,
          gradient: 'from-purple-500 to-indigo-500',
          bgColor: 'bg-gradient-to-r from-purple-50 to-indigo-50',
          borderColor: 'border-purple-300',
          textColor: 'text-purple-800',
          primaryButtonText: 'Anexar Ofício de Justificativa',
          primaryButtonColor: 'bg-purple-600 hover:bg-purple-700',
          showDocuments: true,
          documents: [
            { name: 'Certidão de Atesto', attached: hasCertidaoAttached },
            { name: 'Ofício de Justificativa', attached: hasOficioAttached }
          ]
        };

      case 'SOSFU':
        if (authorizationStatus === 'AUTHORIZED') {
          return {
            title: '✅ Autorização Concedida pelo Ordenador',
            subtitle: 'O Ordenador de Despesas autorizou os valores excepcionais. Você pode prosseguir.',
            instructions: [
              'A autorização foi assinada e anexada ao Dossiê.',
              'Revise os valores aprovados na aba de Ajustes.',
              'Prossiga com a execução da despesa normalmente.'
            ],
            icon: Sparkles,
            gradient: 'from-emerald-500 to-teal-500',
            bgColor: 'bg-gradient-to-r from-emerald-50 to-teal-50',
            borderColor: 'border-emerald-300',
            textColor: 'text-emerald-800',
            primaryButtonText: 'Prosseguir com Execução',
            primaryButtonColor: 'bg-emerald-600 hover:bg-emerald-700',
            showDocuments: true,
            documents: [
              { name: 'Ofício de Justificativa', attached: hasOficioAttached },
              { name: 'Autorização do Ordenador', attached: hasAutorizacaoAttached }
            ]
          };
        }
        return {
          title: 'Encaminhamento Necessário: AJSEFIN',
          subtitle: 'Este processo precisa de autorização do Ordenador de Despesas.',
          instructions: [
            'Verifique se o Gestor anexou o Ofício de Justificativa no Dossiê.',
            'Encaminhe o processo para AJSEFIN preparar o documento de autorização.',
            'Após assinatura do Ordenador, o processo retornará para SOSFU.'
          ],
          icon: Send,
          gradient: 'from-blue-500 to-cyan-500',
          bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          primaryButtonText: hasOficioAttached ? 'Encaminhar para AJSEFIN' : 'Verificar Dossiê',
          primaryButtonColor: hasOficioAttached ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400',
          primaryButtonDisabled: !hasOficioAttached,
          showDocuments: true,
          documents: [
            { name: 'Ofício de Justificativa', attached: hasOficioAttached, required: true },
            { name: 'Autorização do Ordenador', attached: false, pending: true }
          ]
        };

      case 'AJSEFIN':
        return {
          title: 'Preparar Documento de Autorização',
          subtitle: 'Elabore o documento para assinatura do Ordenador de Despesas.',
          instructions: [
            'Analise a justificativa apresentada pelo Gestor.',
            'Prepare o documento de Autorização de Despesa Excepcional.',
            'Encaminhe para assinatura do Ordenador (SEFIN).'
          ],
          icon: ClipboardCheck,
          gradient: 'from-violet-500 to-purple-500',
          bgColor: 'bg-gradient-to-r from-violet-50 to-purple-50',
          borderColor: 'border-violet-300',
          textColor: 'text-violet-800',
          primaryButtonText: 'Gerar Documento de Autorização',
          primaryButtonColor: 'bg-violet-600 hover:bg-violet-700',
          showDocuments: true,
          documents: [
            { name: 'Ofício de Justificativa', attached: hasOficioAttached },
            { name: 'Autorização do Ordenador', attached: false, pending: true }
          ]
        };

      case 'SEFIN':
      case 'ORDENADOR':
        return {
          title: 'Autorização de Despesa Excepcional',
          subtitle: 'Assine o documento para autorizar os valores acima dos limites.',
          instructions: [
            'Revise a justificativa e os valores solicitados.',
            'Assine o documento de Autorização de Despesa Excepcional.',
            'Após assinar, encaminhe o processo de volta para SOSFU.'
          ],
          icon: PenLine,
          gradient: 'from-rose-500 to-pink-500',
          bgColor: 'bg-gradient-to-r from-rose-50 to-pink-50',
          borderColor: 'border-rose-300',
          textColor: 'text-rose-800',
          primaryButtonText: 'Assinar e Encaminhar para SOSFU',
          primaryButtonColor: 'bg-rose-600 hover:bg-rose-700',
          showDocuments: true,
          documents: [
            { name: 'Ofício de Justificativa', attached: hasOficioAttached },
            { name: 'Autorização do Ordenador', attached: false, pendingSignature: true }
          ]
        };

      default:
        return null;
    }
  };

  const content = getRoleContent();
  if (!content) return null;

  const Icon = content.icon;

  return (
    <div className={`${content.bgColor} border-2 ${content.borderColor} rounded-2xl overflow-hidden mb-6 animate-in fade-in slide-in-from-top-2 duration-500`}>
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${content.gradient} p-4`}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{content.title}</h3>
            <p className="text-white/80 text-sm">{content.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Exceptions Table */}
        <div className="bg-white/80 rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Exceção</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Solicitado</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Limite</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-600 uppercase tracking-wider">Excedente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exceptions.map((exc, index) => {
                const ExcIcon = getExceptionIcon(exc.tipo);
                return (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ExcIcon size={16} className={content.textColor} />
                        <span className="font-bold text-slate-700">{formatExceptionType(exc.tipo)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-red-600">{formatExceptionValue(exc.tipo, exc.solicitado)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-500">{formatExceptionValue(exc.tipo, exc.limite)}</span>
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

        {/* Instructions */}
        <div className={`rounded-xl p-4 ${content.bgColor} border ${content.borderColor}`}>
          <h4 className={`font-bold ${content.textColor} mb-3 text-sm`}>O que você precisa fazer:</h4>
          <ul className="space-y-2">
            {content.instructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${content.bgColor} ${content.textColor} border ${content.borderColor}`}>
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Documents Status */}
        {content.showDocuments && content.documents && (
          <div className="bg-white/60 rounded-xl p-4 border border-slate-200">
            <h4 className="font-bold text-slate-700 mb-3 text-sm">Documentação:</h4>
            <div className="space-y-2">
              {content.documents.map((doc: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    doc.attached 
                      ? 'bg-emerald-100' 
                      : doc.pendingSignature 
                        ? 'bg-rose-100' 
                        : doc.pending 
                          ? 'bg-amber-100' 
                          : 'bg-slate-100'
                  }`}>
                    {doc.attached ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : doc.pendingSignature ? (
                      <PenLine size={14} className="text-rose-600" />
                    ) : (
                      <FileText size={14} className={doc.pending ? 'text-amber-600' : 'text-slate-400'} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${doc.attached ? 'text-emerald-700 font-medium' : 'text-slate-600'}`}>
                      {doc.name}
                    </span>
                    {doc.attached && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                        Anexado
                      </span>
                    )}
                    {!doc.attached && doc.required && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                        Obrigatório
                      </span>
                    )}
                    {doc.pendingSignature && (
                      <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold">
                        Aguardando Assinatura
                      </span>
                    )}
                    {doc.pending && !doc.pendingSignature && !doc.attached && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workflow Visual */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h4 className="font-bold text-slate-600 mb-3 text-xs uppercase tracking-wider">Fluxo de Autorização:</h4>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentRole === 'SUPRIDO' ? 'bg-amber-500 text-white scale-105 shadow-lg' : 'bg-slate-200 text-slate-600'
            }`}>Suprido</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentRole === 'GESTOR' ? 'bg-purple-500 text-white scale-105 shadow-lg' : 'bg-slate-200 text-slate-600'
            }`}>Gestor</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentRole === 'SOSFU' && authorizationStatus !== 'AUTHORIZED' ? 'bg-blue-500 text-white scale-105 shadow-lg' : 'bg-slate-200 text-slate-600'
            }`}>SOSFU</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentRole === 'AJSEFIN' ? 'bg-violet-500 text-white scale-105 shadow-lg' : 'bg-slate-200 text-slate-600'
            }`}>AJSEFIN</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              currentRole === 'SEFIN' || currentRole === 'ORDENADOR' ? 'bg-rose-500 text-white scale-105 shadow-lg' : 'bg-slate-200 text-slate-600'
            }`}>Ordenador</span>
            <ArrowRight size={14} className="text-slate-400" />
            <span className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              authorizationStatus === 'AUTHORIZED' ? 'bg-emerald-500 text-white scale-105 shadow-lg' : 'bg-slate-200 text-slate-600'
            }`}>SOSFU ✓</span>
          </div>
        </div>

        {/* Action Buttons */}
        {onPrimaryAction && (
          <div className="flex justify-end gap-3 pt-2">
            {onSecondaryAction && (
              <button
                onClick={onSecondaryAction}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
              >
                Ver Dossiê
              </button>
            )}
            <button
              onClick={onPrimaryAction}
              disabled={content.primaryButtonDisabled}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm text-white shadow-lg ${
                content.primaryButtonDisabled 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : content.primaryButtonColor
              }`}
            >
              {content.primaryButtonText}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextualExceptionBanner;
