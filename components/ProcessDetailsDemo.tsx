import React, { useState } from 'react';
import { UniversalProcessDetailsPage } from '../ProcessDetails';
import { FileText, Zap } from 'lucide-react';

/**
 * 🎯 EXEMPLO DE USO: UniversalProcessDetailsPage
 * 
 * Este componente demonstra como usar o UniversalProcessDetailsPage
 * em qualquer dashboard. Copie este padrão para seus dashboards.
 */

export const ProcessDetailsDemo: React.FC = () => {
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [showDocumentWizard, setShowDocumentWizard] = useState(false);
  const [showTramitarModal, setShowTramitarModal] = useState(false);

  // ID do usuário logado (pegar do contexto/auth)
  const currentUserId = 'demo-user-id';

  // Exemplo de processos para demonstração
  const demoProcesses = [
    { id: 'proc-1', nup: 'TJPA-EXT-2026-1272', tipo: 'Extra-Emergencial', status: 'pendente_atesto' },
    { id: 'proc-2', nup: 'TJPA-JURI-2026-0345', tipo: 'Sessão de Júri', status: 'atestado' },
  ];

  // Se um processo foi selecionado, mostrar a página de detalhes
  if (selectedProcessId) {
    return (
      <>
        <UniversalProcessDetailsPage
          processId={selectedProcessId}
          currentUserId={currentUserId}
          onClose={() => setSelectedProcessId(null)}
          
          // 🎨 CUSTOMIZAÇÃO POR PERFIL:
          // Para Suprido: canTramitar={false}
          // Para Gestor: canTramitar={true}, canGenerateAtesto={true}
          // Para SOSFU: canTramitar={true}
          
          canTramitar={true}
          canGenerateAtesto={true}
          canCreateDocument={true}
          
          // 🎬 CALLBACKS PARA AÇÕES:
          onTramitar={() => {
            console.log('🚀 Tramitar processo:', selectedProcessId);
            setShowTramitarModal(true);
          }}
          
          onGenerateAtesto={() => {
            console.log('📋 Gerar Atesto:', selectedProcessId);
            alert('Gerando Certidão de Atesto...');
          }}
          
          onCreateDocument={() => {
            console.log('➕ Novo Documento:', selectedProcessId);
            setShowDocumentWizard(true);
          }}
        />

        {/* Seus modais existentes continuam funcionando normalmente */}
        {showTramitarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md">
              <h3 className="text-xl font-bold mb-4">Modal de Tramitação</h3>
              <p className="text-slate-600 mb-6">Aqui vai seu TramitarModal existente...</p>
              <button
                onClick={() => setShowTramitarModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {showDocumentWizard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md">
              <h3 className="text-xl font-bold mb-4">DocumentCreationWizard</h3>
              <p className="text-slate-600 mb-6">Aqui vai seu wizard existente...</p>
              <button
                onClick={() => setShowDocumentWizard(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Lista de processos (tela inicial - dashboard)
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap size={32} />
            <h1 className="text-3xl font-black">Demo: UniversalProcessDetailsPage</h1>
          </div>
          <p className="text-blue-100">
            Clique em um processo abaixo para ver a nova página de detalhes em ação!
          </p>
        </div>

        {/* Instruções */}
        <div className="bg-white rounded-3xl p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-lg font-black text-slate-900 mb-3">📋 Como Usar Este Componente:</h2>
          <ol className="space-y-2 text-sm text-slate-700">
            <li>1. <strong>Selecione um processo</strong> na lista abaixo</li>
            <li>2. <strong>Navegue pelas tabs:</strong> Detalhes, Dossiê Digital, Histórico</li>
            <li>3. <strong>Teste os botões de ação:</strong> Tramitar, Gerar Atesto, Novo Documento</li>
            <li>4. <strong>Clique em "Voltar"</strong> para retornar à lista</li>
          </ol>
        </div>

        {/* Lista de Processos */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900">Processos Disponíveis</h2>
          
          {demoProcesses.map((process) => (
            <button
              key={process.id}
              onClick={() => setSelectedProcessId(process.id)}
              className="w-full bg-white rounded-3xl p-6 border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <FileText className="text-blue-600 group-hover:text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">{process.nup}</p>
                    <p className="text-sm text-slate-600">{process.tipo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                    {process.status}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <svg className="w-4 h-4 text-blue-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer com dicas */}
        <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-200">
          <h3 className="text-sm font-black text-green-900 mb-2">✅ Pronto para Produção!</h3>
          <p className="text-sm text-green-700">
            Este padrão está pronto para ser usado em <strong>SupridoDashboard</strong>, <strong>GestorDashboard</strong>, 
            <strong> SOSFUDashboard</strong>, e qualquer outro dashboard. Veja o <code className="px-2 py-1 bg-green-100 rounded">integration_guide.md</code> para mais detalhes.
          </p>
        </div>
      </div>
    </div>
  );
};
