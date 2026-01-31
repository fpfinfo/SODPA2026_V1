import React, { useState } from 'react';
import { X, MapPin, Calendar, ShieldAlert, Globe, Phone, User, Plane } from 'lucide-react';
import { ACTIVE_TRAVELERS, ActiveTraveler } from './types';

interface RepresentationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RepresentationMapModal: React.FC<RepresentationMapModalProps> = ({ isOpen, onClose }) => {
  const [selectedTraveler, setSelectedTraveler] = useState<ActiveTraveler | null>(null);

  if (!isOpen) return null;

  const riskCount = ACTIVE_TRAVELERS.filter(t => t.status === 'RISK').length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 bg-opacity-90 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden border border-slate-700">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Globe className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Mapa de Representação Institucional</h3>
              <p className="text-xs text-slate-400">Monitoramento em Tempo Real de Magistrados e Servidores</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {riskCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-400 uppercase">{riskCount} Em Área de Risco</span>
              </div>
            )}
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-slate-800 overflow-hidden group">
          
          {/* Abstract World Map Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-700 group-hover:scale-[1.02]" style={{ 
            backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'invert(1) hue-rotate(180deg) saturate(0.5)'
          }}></div>

          {/* Grid Overlay for Tech Look */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>

          {/* Pins */}
          {ACTIVE_TRAVELERS.map(traveler => (
            <div 
              key={traveler.id}
              className="absolute group/pin cursor-pointer z-10"
              style={{ top: traveler.coords.top, left: traveler.coords.left }}
              onClick={(e) => { e.stopPropagation(); setSelectedTraveler(traveler); }}
            >
              {/* Ripple Effect for Risk */}
              {traveler.status === 'RISK' && (
                <div className="absolute -top-3 -left-3 w-14 h-14 bg-red-500/20 rounded-full animate-ping"></div>
              )}
              
              {/* Pin Icon */}
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all transform group-hover/pin:scale-125 duration-300 ${
                traveler.status === 'RISK' ? 'bg-red-600 border-red-400 z-20' : 
                traveler.status === 'RETURNING' ? 'bg-amber-600 border-amber-400 z-15' :
                'bg-blue-600 border-blue-400 z-10'
              }`}>
                {traveler.status === 'RETURNING' ? <Plane size={18} className="text-white" /> : <User size={18} className="text-white" />}
                
                {/* Status Indicator Dot */}
                <span className={`absolute -top-1 -right-1 flex h-3 w-3 rounded-full border-2 border-slate-900 ${
                  traveler.status === 'RISK' ? 'bg-red-500' : 
                  traveler.status === 'RETURNING' ? 'bg-amber-500' :
                  'bg-green-500'
                }`}></span>
              </div>

              {/* Tooltip Label (Hover) */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-600 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-all pointer-events-none shadow-xl transform translate-y-1 group-hover/pin:translate-y-0">
                {traveler.location}
              </div>
            </div>
          ))}

          {/* Traveler Details Sidebar (Overlay Card) */}
          {selectedTraveler && (
            <div className="absolute top-6 right-6 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-600 rounded-2xl p-6 shadow-2xl animate-fade-in z-30">
              <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-xl border-2 border-slate-600 shadow-inner">
                    {selectedTraveler.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base leading-tight">{selectedTraveler.name}</h4>
                    <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mt-1">{selectedTraveler.role}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTraveler(null)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-full p-1">
                  <X size={16}/>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <MapPin size={10} /> Localização Atual
                    </div>
                    <div className="text-white font-medium text-sm">{selectedTraveler.location}</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
                      <Calendar size={10} /> Em trânsito desde
                    </div>
                    <div className="text-white font-medium text-sm">{selectedTraveler.since}</div>
                  </div>
                </div>

                {selectedTraveler.status === 'RISK' ? (
                  <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/50">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase mb-2">
                      <ShieldAlert size={14} /> Alerta de Risco Ativo
                    </div>
                    <p className="text-red-100 text-sm leading-snug mb-3">
                      {selectedTraveler.riskReason}
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Phone size={12} /> Contatar GSI
                      </button>
                    </div>
                  </div>
                ) : selectedTraveler.status === 'RETURNING' ? (
                  <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 flex items-center gap-3 text-amber-400">
                    <div className="p-2 bg-amber-500/20 rounded-full">
                      <Plane size={16} /> 
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">Retornando</p>
                      <p className="text-xs font-normal opacity-80">Retorno previsto: {selectedTraveler.returnDate ? new Date(selectedTraveler.returnDate).toLocaleDateString('pt-BR') : 'Em breve'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30 flex items-center gap-3 text-green-400 text-xs font-bold">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <ShieldAlert size={16} /> 
                    </div>
                    <div>
                      <p className="text-white text-sm">Situação Normalizada</p>
                      <p className="font-normal opacity-80">Nenhum incidente reportado.</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-2 text-center">
                  <button className="text-xs text-slate-500 hover:text-slate-300 underline">Ver histórico de deslocamento</button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-lg border border-slate-700 rounded-xl p-4 z-20">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Legenda</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-400"></div>
                Em Missão (Seguro)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-400"></div>
                Retornando
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400 animate-pulse"></div>
                Área de Risco
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepresentationMapModal;
