/**
 * DocumentHeader Component
 * Official TJPA header with brasão for document preview
 */

import React from 'react';

const BRASAO_TJPA_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/217479058_brasao-tjpa.png';

interface DocumentHeaderProps {
  title?: string;
  subtitle?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  title = 'Tribunal de Justiça do Estado do Pará',
  subtitle = 'Secretaria de Planejamento, Coordenação e Finanças',
}) => {
  return (
    <div className="text-center py-8 border-b border-slate-200 bg-white">
      <img 
        src={BRASAO_TJPA_URL} 
        alt="Brasão TJPA" 
        className="w-20 h-auto mx-auto mb-4"
      />
      <h1 className="text-sm font-bold uppercase tracking-widest text-slate-900">
        {title}
      </h1>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">
        {subtitle}
      </p>
    </div>
  );
};
