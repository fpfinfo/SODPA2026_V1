import React, { useMemo } from 'react';
import { AlertTriangle, Info, Shield, DollarSign, ArrowRight, Clock } from 'lucide-react';

interface JuriExceptionInlineAlertProps {
  policiais?: number;
  almocoValue?: number;
  jantarValue?: number;
  lancheValue?: number;
  diasAteEvento?: number | null;
  diasAtraso?: number | null; // For PC fora do prazo
  userRole: 'USER' | 'SUPRIDO' | 'GESTOR' | 'SOSFU' | 'AJSEFIN' | 'SEFIN' | 'SODPA' | 'SGP' | 'PRESIDENCIA';
}

// Limits configuration
const LIMITS = {
  policiais: 5,
  almoco: 30.00,
  jantar: 30.00,
  lanche: 11.00,
  prazo_minimo_dias: 7,
  pc_prazo_dias: 30
};

/**
 * Inline alert component that shows when values exceed limits
 * Adapts message based on user role
 */
export const JuriExceptionInlineAlert: React.FC<JuriExceptionInlineAlertProps> = ({
  policiais = 0,
  almocoValue = 0,
  jantarValue = 0,
  lancheValue = 0,
  diasAteEvento,
  diasAtraso,
  userRole
}) => {
  const exceptions = useMemo(() => {
    const exc: { tipo: string; solicitado: number; limite: number }[] = [];
    
    if (policiais > LIMITS.policiais) {
      exc.push({ tipo: 'policiais', solicitado: policiais, limite: LIMITS.policiais });
    }
    if (almocoValue > LIMITS.almoco) {
      exc.push({ tipo: 'almoco', solicitado: almocoValue, limite: LIMITS.almoco });
    }
    if (jantarValue > LIMITS.jantar) {
      exc.push({ tipo: 'jantar', solicitado: jantarValue, limite: LIMITS.jantar });
    }
    if (lancheValue > LIMITS.lanche) {
      exc.push({ tipo: 'lanche', solicitado: lancheValue, limite: LIMITS.lanche });
    }
    // Check deadline exception (prazo antecedência)
    if (diasAteEvento !== null && diasAteEvento !== undefined && diasAteEvento >= 0 && diasAteEvento < LIMITS.prazo_minimo_dias) {
      exc.push({ tipo: 'prazo', solicitado: diasAteEvento, limite: LIMITS.prazo_minimo_dias });
    }
    // Check PC atraso exception
    if (diasAtraso !== null && diasAtraso !== undefined && diasAtraso > LIMITS.pc_prazo_dias) {
      exc.push({ tipo: 'pc_atraso', solicitado: diasAtraso, limite: LIMITS.pc_prazo_dias });
    }
    
    return exc;
  }, [policiais, almocoValue, jantarValue, lancheValue, diasAteEvento, diasAtraso]);

  if (exceptions.length === 0) return null;

  const hasPrazoException = exceptions.some(e => e.tipo === 'prazo');
  const hasPCAtrasaException = exceptions.some(e => e.tipo === 'pc_atraso');
  const hasValueException = exceptions.some(e => e.tipo !== 'prazo' && e.tipo !== 'pc_atraso');

  const getMessage = () => {
    // Priority: if only PC atraso exception, show PC message
    if (hasPCAtrasaException && !hasValueException && !hasPrazoException) {
      switch (userRole) {
        case 'SUPRIDO':
          return {
            title: 'Prestação de Contas Fora do Prazo',
            message: 'Esta prestação de contas está sendo enviada após o prazo legal de 30 dias. Seu Gestor deverá anexar um ofício justificando o atraso para autorização do Ordenador.',
            color: 'amber',
            icon: Clock
          };
        case 'GESTOR':
          return {
            title: 'Ação Necessária - PC Atrasada',
            message: 'Esta prestação de contas foi enviada fora do prazo de 30 dias. Anexe um Ofício de Justificativa explicando o motivo do atraso.',
            color: 'purple',
            icon: AlertTriangle
          };
        default:
          return {
            title: 'Autorização Especial - PC Atrasada',
            message: 'Esta prestação de contas requer autorização por atraso na apresentação.',
            color: 'blue',
            icon: AlertTriangle
          };
      }
    }
    
    // Priority: if only prazo exception, show prazo message
    if (hasPrazoException && !hasValueException && !hasPCAtrasaException) {
      switch (userRole) {
        case 'SUPRIDO':
          return {
            title: 'Prazo de Antecedência Insuficiente',
            message: 'O evento está com menos de 7 dias de antecedência. Seu Gestor deverá anexar um ofício de justificativa para que o Ordenador de Despesas autorize esta solicitação.',
            color: 'amber',
            icon: Info
          };
        case 'GESTOR':
          return {
            title: 'Ação Necessária - Prazo Insuficiente',
            message: 'Esta solicitação foi feita com menos de 7 dias de antecedência. Anexe um Ofício de Justificativa explicando a urgência.',
            color: 'purple',
            icon: AlertTriangle
          };
        default:
          return {
            title: 'Autorização Especial - Prazo',
            message: 'Esta solicitação requer autorização por prazo insuficiente.',
            color: 'blue',
            icon: AlertTriangle
          };
      }
    }
    
    // Mixed or only value exceptions
    switch (userRole) {
      case 'SUPRIDO':
        return {
          title: (hasPrazoException || hasPCAtrasaException) ? 'Valores e Prazos Fora dos Limites' : 'Valores Acima dos Limites',
          message: 'Sua solicitação contém valores ou prazos que excedem os limites autorizados. O Gestor deverá anexar um ofício de justificativa para que o Ordenador de Despesas autorize.',
          color: 'amber',
          icon: Info
        };
      case 'GESTOR':
        return {
          title: 'Ação Necessária',
          message: 'Este processo contém valores/prazos fora dos limites. Anexe um Ofício de Justificativa junto à Certidão de Atesto explicando a necessidade.',
          color: 'purple',
          icon: AlertTriangle
        };
      case 'SOSFU':
        return {
          title: 'Limite de Policiais Excedido',
          message: 'Este processo contém mais policiais que o permitido. Gere um Despacho solicitando análise à AJSEFIN e tramite o processo para obter autorização do Ordenador.',
          color: 'amber',
          icon: Shield
        };
      default:
        return {
          title: 'Autorização Especial Necessária',
          message: 'Este processo requer autorização do Ordenador de Despesas (SEFIN).',
          color: 'blue',
          icon: AlertTriangle
        };
    }
  };

  const config = getMessage();
  const Icon = config.icon;

  const colorClasses = {
    amber: 'bg-amber-50 border-amber-300 text-amber-800',
    purple: 'bg-purple-50 border-purple-300 text-purple-800',
    blue: 'bg-blue-50 border-blue-300 text-blue-800'
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClasses[config.color as keyof typeof colorClasses]} animate-in fade-in duration-300`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          config.color === 'amber' ? 'bg-amber-100' : 
          config.color === 'purple' ? 'bg-purple-100' : 'bg-blue-100'
        }`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-black text-sm mb-1">{config.title}</h4>
          <p className="text-sm opacity-80 mb-3">{config.message}</p>
          
          {/* Exceptions list */}
          <div className="flex flex-wrap gap-2">
            {exceptions.map((exc, index) => (
              <span 
                key={index}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                  config.color === 'amber' ? 'bg-amber-100' : 
                  config.color === 'purple' ? 'bg-purple-100' : 'bg-blue-100'
                }`}
              >
                {exc.tipo === 'policiais' ? <Shield size={12} /> : (exc.tipo === 'prazo' || exc.tipo === 'pc_atraso') ? <Clock size={12} /> : <DollarSign size={12} />}
                {exc.tipo === 'policiais' 
                  ? `${exc.solicitado} policiais (limite: ${exc.limite})`
                  : exc.tipo === 'prazo'
                  ? `${exc.solicitado} dias (mínimo: ${exc.limite})`
                  : exc.tipo === 'pc_atraso'
                  ? `${exc.solicitado} dias (limite: ${exc.limite})`
                  : `${exc.tipo}: R$ ${exc.solicitado.toFixed(2)} (limite: R$ ${exc.limite.toFixed(2)})`
                }
              </span>
            ))}
          </div>

          {/* Workflow hint */}
          <div className="mt-3 pt-3 border-t border-current/10 flex items-center gap-1 text-[10px] opacity-60 font-medium uppercase tracking-wider">
            <span>Fluxo:</span>
            <span className={userRole === 'SUPRIDO' ? 'font-black' : ''}>Suprido</span>
            <ArrowRight size={10} />
            <span className={userRole === 'GESTOR' ? 'font-black' : ''}>Gestor + Ofício</span>
            <ArrowRight size={10} />
            <span>SOSFU</span>
            <ArrowRight size={10} />
            <span>AJSEFIN</span>
            <ArrowRight size={10} />
            <span>Ordenador</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JuriExceptionInlineAlert;
