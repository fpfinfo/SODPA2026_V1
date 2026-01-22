const fs = require('fs');

const filePath = 'components/Suprido/SupridoDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const bannerCode = `
            {/* Prestação de Contas Banner - shows when process is in accountability phase */}
            {(selectedProcess?.status === 'PRESTANDO CONTAS' || 
              selectedProcess?.status === 'A PRESTAR CONTAS' ||
              selectedProcess?.status_workflow === 'AWAITING_ACCOUNTABILITY' ||
              selectedProcess?.status_workflow === 'ACCOUNTABILITY_OPEN') && (
              <div className="rounded-[32px] p-6 flex items-center justify-between animate-in slide-in-from-top-4 duration-300 shadow-lg bg-gradient-to-r from-purple-500 to-indigo-600 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-white/20">
                    <FileText size={28} className="text-white" />
                  </div>
                  <div className="text-white">
                    <h4 className="text-lg font-black uppercase tracking-tight">
                      📋 Prestação de Contas Pendente
                    </h4>
                    <p className="text-sm text-white/80">
                      Você precisa prestar contas dos recursos utilizados.
                      {selectedProcess?.prazo_prestacao && (
                        <> Prazo: <strong>{new Date(selectedProcess.prazo_prestacao).toLocaleDateString('pt-BR')}</strong></>
                      )}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentView('PRESTACAO_CONTAS')}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-purple-700 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-purple-50 shadow-lg transition-all"
                >
                  <FileText size={18} />
                  Iniciar Prestação de Contas
                </button>
              </div>
            )}

`;

// Find the first occurrence of {subView === 'DETAILS' && (
const searchPattern = "{subView === 'DETAILS' && (";
const insertPosition = content.indexOf(searchPattern);

if (insertPosition === -1) {
  console.log('Pattern not found');
  process.exit(1);
}

// Insert the banner code before the pattern
const newContent = content.slice(0, insertPosition) + bannerCode + content.slice(insertPosition);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Banner inserted successfully at position', insertPosition);
