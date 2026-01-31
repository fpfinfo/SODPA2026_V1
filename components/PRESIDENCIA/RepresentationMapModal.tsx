import React, { useState, useMemo } from 'react';
import { ArrowLeft, MapPin, User, ShieldAlert, Globe, Phone, TrendingUp, Cloud, Clock, DollarSign, Activity, X } from 'lucide-react';

// Coordenadas da Sede (Belém - PA) ajustadas para o mapa múndi padrão
const ORIGIN_COORDS = { top: '53%', left: '30.5%' };

// Mock data enhanced with cost and type
const ACTIVE_TRAVELERS = [
  { 
      id: 1, 
      name: 'Des. Lúcia Fátima', 
      role: 'Vice-Presidência', 
      location: 'Brasília - DF', 
      coords: { top: '61%', left: '31.5%' }, // Centro-Oeste
      originCoords: ORIGIN_COORDS,
      status: 'SAFE', 
      riskLevel: 'LOW', 
      since: '20/01/2024',
      cost: 4500.00,
      purpose: 'Institucional',
      weather: '28°C Ensolarado',
      localTime: '14:30'
  },
  { 
      id: 2, 
      name: 'Juiz Roberto Valente', 
      role: 'Vara Agrária', 
      location: 'São Paulo - SP', 
      coords: { top: '67%', left: '32.5%' }, // Sudeste
      originCoords: ORIGIN_COORDS,
      status: 'SAFE', 
      riskLevel: 'LOW', 
      since: '04/02/2024',
      cost: 3200.00,
      purpose: 'Capacitação',
      weather: '19°C Chuva',
      localTime: '14:30'
  },
  { 
      id: 3, 
      name: 'Des. Antonio Santos', 
      role: 'Gabinete Des.', 
      location: 'Rio de Janeiro - RJ', 
      coords: { top: '66%', left: '33.5%' }, // Sudeste (litoral)
      originCoords: ORIGIN_COORDS,
      status: 'RISK', 
      riskLevel: 'HIGH', 
      since: '05/02/2024', 
      riskReason: 'Alerta de Segurança Pública (GSI)',
      cost: 5100.00,
      purpose: 'Evento Jurídico',
      weather: '32°C Parcialmente Nublado',
      localTime: '14:30'
  },
  { 
      id: 4, 
      name: 'Dra. Maria Clara', 
      role: 'Corregedoria', 
      location: 'Lisboa - Portugal', 
      coords: { top: '32%', left: '46.5%' }, // Europa
      originCoords: ORIGIN_COORDS,
      status: 'SAFE', 
      riskLevel: 'LOW', 
      since: '01/02/2024',
      cost: 12500.00,
      purpose: 'Cooperação Internacional',
      weather: '12°C Nublado',
      localTime: '18:30' // Fuso diferente
  },
];

type MapLayer = 'PEOPLE' | 'RISK' | 'COST';

interface RepresentationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RepresentationMapModal: React.FC<RepresentationMapModalProps> = ({ isOpen, onClose }) => {
  const [selectedTraveler, setSelectedTraveler] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('PEOPLE');

  // Insights Calculations
  const insights = useMemo(() => {
      const totalCost = ACTIVE_TRAVELERS.reduce((acc, curr) => acc + curr.cost, 0);
      const topDestination = 'Brasília - DF'; 
      const riskCount = ACTIVE_TRAVELERS.filter(t => t.status === 'RISK').length;
      return { totalCost, topDestination, riskCount };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 bg-opacity-95 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[90vw] h-[90vh] flex flex-col overflow-hidden border border-slate-700 relative">
        
        {/* Header - Command Center Style */}
        <div className="bg-slate-900/90 backdrop-blur px-6 py-4 flex justify-between items-center text-white border-b border-slate-700 z-50">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <Globe className="text-blue-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Sala de Situação</h3>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Monitoramento Ativo • {ACTIVE_TRAVELERS.length} Agentes em Campo</p>
                    </div>
                </div>
            </div>
            
            {/* Layer Controls */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button 
                    onClick={() => setActiveLayer('PEOPLE')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeLayer === 'PEOPLE' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    <User size={14} /> Pessoas
                </button>
                <button 
                    onClick={() => setActiveLayer('RISK')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeLayer === 'RISK' ? 'bg-red-900/50 text-red-200 shadow-sm border border-red-900' : 'text-slate-400 hover:text-white'}`}
                >
                    <ShieldAlert size={14} /> Riscos ({insights.riskCount})
                </button>
                <button 
                    onClick={() => setActiveLayer('COST')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeLayer === 'COST' ? 'bg-amber-900/50 text-amber-200 shadow-sm border border-amber-900' : 'text-slate-400 hover:text-white'}`}
                >
                    <DollarSign size={14} /> Custos
                </button>
            </div>

            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-slate-400 hover:text-white">
                <X size={24} />
            </button>
        </div>

        <div className="flex-1 relative bg-[#0f172a] overflow-hidden group">
            
            {/* Map Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-1000 group-hover:scale-[1.01]" style={{ 
                backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'invert(1) hue-rotate(180deg) saturate(0)'
            }}></div>

            {/* Grid & Radar Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
                backgroundSize: '100px 100px'
            }}></div>
            
            {/* Flight Paths (SVG Layer) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <linearGradient id="flightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
                        <stop offset="50%" stopColor="rgba(59, 130, 246, 0.5)" />
                        <stop offset="100%" stopColor="rgba(59, 130, 246, 0.1)" />
                    </linearGradient>
                </defs>
                {ACTIVE_TRAVELERS.map((t) => (
                    <g key={`path-${t.id}`}>
                        <path 
                            d={`M ${parseFloat(t.originCoords.left) * 10},${parseFloat(t.originCoords.top) * 6} Q ${(parseFloat(t.originCoords.left) + parseFloat(t.coords.left)) * 5},${(parseFloat(t.originCoords.top) + parseFloat(t.coords.top)) * 2} ${parseFloat(t.coords.left) * 10},${parseFloat(t.coords.top) * 6}`}
                            fill="none"
                            stroke="url(#flightGradient)"
                            strokeWidth="1.5"
                            className="opacity-40 animate-pulse"
                            vectorEffect="non-scaling-stroke"
                            transform="scale(0.1 0.16) translate(0, 0)"
                        />
                    </g>
                ))}
            </svg>

            {/* Origin Point (Belém) */}
            <div 
                className="absolute z-10 group/origin"
                style={{ top: ORIGIN_COORDS.top, left: ORIGIN_COORDS.left }}
            >
                <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse"></div>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-xs font-bold px-2 py-0.5 rounded text-slate-300 border border-slate-700 whitespace-nowrap opacity-0 group-hover/origin:opacity-100 transition-opacity">
                    TJPA (Sede)
                </div>
            </div>

            {/* Traveler Pins */}
            {ACTIVE_TRAVELERS.map(traveler => (
                <div 
                    key={traveler.id}
                    className="absolute group/pin cursor-pointer z-20"
                    style={{ top: traveler.coords.top, left: traveler.coords.left }}
                    onClick={(e) => { e.stopPropagation(); setSelectedTraveler(traveler); }}
                >
                    {/* Risk Ripple */}
                    {(activeLayer === 'RISK' || activeLayer === 'PEOPLE') && traveler.status === 'RISK' && (
                        <div className="absolute -top-6 -left-6 w-20 h-20 bg-red-500/20 rounded-full animate-ping duration-[2000ms]"></div>
                    )}

                    {/* Cost Bubble */}
                    {activeLayer === 'COST' && (
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-900/90 text-amber-200 text-[10px] font-mono px-2 py-1 rounded border border-amber-700 whitespace-nowrap shadow-lg">
                            R$ {traveler.cost.toLocaleString('pt-BR')}
                         </div>
                    )}
                    
                    {/* Pin Body */}
                    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,1)] transition-transform transform group-hover/pin:scale-125 duration-300 ${
                        traveler.status === 'RISK' ? 'bg-red-600 border-red-400' : 
                        activeLayer === 'COST' ? 'bg-amber-600 border-amber-400' :
                        'bg-blue-600 border-blue-400'
                    }`}>
                        {activeLayer === 'COST' ? <DollarSign size={14} className="text-white"/> : <User size={14} className="text-white" />}
                    </div>
                </div>
            ))}

            {/* --- LEFT PANEL: STRATEGIC INSIGHTS --- */}
            <div className="absolute top-6 left-6 w-72 flex flex-col gap-4 pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-5 shadow-2xl pointer-events-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-blue-400" /> Inteligência de Dados
                    </h4>
                    
                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Custo da Representação (Ativo)</span>
                            <div className="text-2xl font-mono font-bold text-white mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.totalCost)}
                            </div>
                            <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-[65%] h-full"></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                             <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Destino Top #1</span>
                                <div className="text-sm font-bold text-slate-200 mt-1">{insights.topDestination}</div>
                             </div>
                             <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Tipo Dominante</span>
                                <div className="text-sm font-bold text-slate-200 mt-1">Institucional</div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: TRAVELER DETAILS --- */}
            {selectedTraveler && (
                <div className="absolute top-6 right-6 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-600 rounded-2xl p-6 shadow-2xl animate-fade-in z-30">
                    <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                        <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xl border-2 border-slate-600 shadow-inner">
                                {selectedTraveler.name.charAt(0)}
                             </div>
                             <div>
                                 <h4 className="text-white font-bold text-base leading-tight">{selectedTraveler.name}</h4>
                                 <p className="text-xs text-amber-500 font-bold uppercase tracking-wider mt-1">{selectedTraveler.role}</p>
                             </div>
                        </div>
                        <button onClick={() => setSelectedTraveler(null)} className="text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-full p-1"><X size={16}/></button>
                    </div>

                    <div className="space-y-4">
                        {/* Live Context Data */}
                        <div className="grid grid-cols-2 gap-3">
                             <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex flex-col items-center text-center">
                                <Cloud size={18} className="text-blue-400 mb-1" />
                                <span className="text-[10px] text-blue-300 uppercase font-bold">Clima Local</span>
                                <span className="text-sm font-bold text-white">{selectedTraveler.weather}</span>
                             </div>
                             <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex flex-col items-center text-center">
                                <Clock size={18} className="text-purple-400 mb-1" />
                                <span className="text-[10px] text-purple-300 uppercase font-bold">Hora Local</span>
                                <span className="text-sm font-bold text-white">{selectedTraveler.localTime}</span>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
                                    <MapPin size={10} /> Localização Atual
                                </div>
                                <div className="text-white font-medium text-sm">{selectedTraveler.location}</div>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold mb-1">
                                    <TrendingUp size={10} /> Objetivo
                                </div>
                                <div className="text-white font-medium text-sm">{selectedTraveler.purpose}</div>
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
                                        <Phone size={12} /> GSI (Segurança)
                                    </button>
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
        </div>
      </div>
    </div>
  );
};

export default RepresentationMapModal;
