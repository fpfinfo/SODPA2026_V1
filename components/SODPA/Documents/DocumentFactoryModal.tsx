import React, { useState } from 'react';
import { 
  X, 
  Gavel, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  Scale, 
  FileEdit,
  ArrowLeft,
  Save,
  Printer
} from 'lucide-react';

interface DocumentType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  template: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'DESPACHO',
    label: 'DESPACHO',
    description: 'Ato de impulsionamento processual',
    icon: Gavel,
    color: 'bg-blue-50 text-blue-600',
    template: 'Vistos, etc.\n\n1. Trata-se de solicitação de...'
  },
  {
    id: 'OFICIO',
    label: 'OFÍCIO',
    description: 'Comunicação externa oficial',
    icon: FileText,
    color: 'bg-indigo-50 text-indigo-600',
    template: 'OFÍCIO Nº XXX/2026\n\nAo Senhor(a)...\n\nAssunto: Solicitação de...'
  },
  {
    id: 'MEMORANDO',
    label: 'MEMORANDO',
    description: 'Comunicação interna entre setores',
    icon: MessageSquare,
    color: 'bg-amber-50 text-amber-600',
    template: 'MEMORANDO Nº XXX/2026\n\nDe: Setor X\nPara: Setor Y\n\nAssunto: ...'
  },
  {
    id: 'CERTIDAO',
    label: 'CERTIDÃO',
    description: 'Atestado de fato ou situação',
    icon: CheckCircle,
    color: 'bg-emerald-50 text-emerald-600',
    template: 'CERTIFICO, para os devidos fins, que...'
  },
  {
    id: 'PARECER',
    label: 'PARECER',
    description: 'Opinião técnica ou jurídica',
    icon: Scale,
    color: 'bg-purple-50 text-purple-600',
    template: 'PARECER TÉCNICO Nº XXX/2026\n\n1. RELATÓRIO\n...\n2. ANÁLISE\n...\n3. CONCLUSÃO\n...'
  },
  {
    id: 'DECISAO',
    label: 'DECISÃO',
    description: 'Ato decisório de autoridade',
    icon: FileEdit,
    color: 'bg-rose-50 text-rose-600',
    template: 'DECISÃO\n\nVistos.\n\nTrata-se de...\n\nDECIDO.\n\n...'
  }
];

interface DocumentFactoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docType: string, content: string) => Promise<void>;
  protocolo?: string;
}

export const DocumentFactoryModal: React.FC<DocumentFactoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  protocolo = "TJPA-EXT-2026-XXXX"
}) => {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (type: DocumentType) => {
    setSelectedType(type);
    setContent(type.template);
  };

  const handleSave = async () => {
    if (!selectedType) return;
    setIsSaving(true);
    try {
      await onSave(selectedType.label, content);
      onClose();
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">
              {selectedType ? selectedType.label : 'Novo Documento'}
            </h2>
            <p className="text-xs font-semibold text-gray-400 mt-1 tracking-widest">
              PROTOCOLO: {protocolo}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
          {!selectedType ? (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione o Tipo de Documento</h3>
                <p className="text-gray-500">Escolha um modelo abaixo para começar a editar</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DOCUMENT_TYPES.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect(doc)}
                    className="flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 group text-left"
                  >
                    <div className={`p-3 rounded-xl mb-4 ${doc.color} group-hover:scale-110 transition-transform duration-300`}>
                      <doc.icon size={24} />
                    </div>
                    <span className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                      {doc.label}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {doc.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {/* Editor Toolbar (Mock) */}
              <div className="mb-4 flex items-center justify-between">
                <button 
                  onClick={() => setSelectedType(null)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Voltar para seleção
                </button>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg">
                    <Printer size={18} />
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                  >
                    <Save size={18} />
                    {isSaving ? 'Salvando...' : 'Salvar Documento'}
                  </button>
                </div>
              </div>

              {/* A4 Page Editor */}
              <div className="flex-1 bg-white rounded shadow-sm border border-gray-200 p-12 min-h-[600px] outline-none overflow-y-auto">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full resize-none outline-none font-serif text-gray-800 leading-relaxed text-lg"
                  placeholder="Digite o conteúdo do documento..."
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
