import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-red-50">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Ops! Algo deu errado.</h1>
            <p className="text-slate-500 mb-6 text-sm font-medium">
              Ocorreu um erro inesperado na interface. Tente recarregar a página.
            </p>
            
            {this.state.error && (
              <div className="bg-slate-50 p-4 rounded-xl text-left overflow-auto max-h-40 mb-6 border border-slate-100">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Detalhes do Erro</p>
                 <code className="text-xs text-red-600 font-mono block break-words">
                   {this.state.error.message}
                 </code>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <RefreshCw size={18} />
              Recarregar Sistema
            </button>
            
            <p className="mt-6 text-xs text-slate-400">
              Se o problema persistir, contate o suporte técnico SOSFU.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
