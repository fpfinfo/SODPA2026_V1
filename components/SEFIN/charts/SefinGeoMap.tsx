import React from 'react';
import { motion } from 'framer-motion';

interface GeoData {
  name: string;
  value: number;
  region: string;
}

interface SefinGeoMapProps {
  data: GeoData[];
  height?: number;
}

export const SefinGeoMap: React.FC<SefinGeoMapProps> = ({ data, height = 300 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  // Simple packing algorithm simulation (for demo purposes, we distribute them in a grid logic or random stable positions)
  // In a real app, use d3-hierarchy pack
  const bubbles = data.sort((a, b) => b.value - a.value).map((d, i) => {
    // Fake positions for visual distribution
    const size = 20 + ((d.value / maxValue) * 60); // Min 20px, Max 80px
    return {
      ...d,
      size,
      x: (i % 3) * 30 + 20 + (Math.random() * 10), // Pseudo-random stable position
      y: Math.floor(i / 3) * 30 + 20 + (Math.random() * 10),
      color: d.value > maxValue * 0.7 ? '#ef4444' : d.value > maxValue * 0.4 ? '#f59e0b' : '#10b981'
    };
  });

  return (
    <div className="w-full relative overflow-hidden bg-slate-50 rounded-xl border border-slate-100" style={{ height }}>
      <div className="absolute top-4 left-4 z-10">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mapa de Calor (Polos)</h4>
      </div>
      
      <div className="w-full h-full flex items-center justify-center flex-wrap content-center gap-4 p-8">
        {bubbles.map((bubble, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.1 }}
            className="rounded-full flex items-center justify-center relative group cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
            style={{
              width: bubble.size,
              height: bubble.size,
              backgroundColor: bubble.color,
              opacity: 0.8
            }}
          >
            <div className="text-center text-white pointer-events-none">
               <span className="text-[10px] font-bold block truncate w-full px-1">{bubble.name}</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
               <div className="font-bold">{bubble.name}</div>
               <div className="text-slate-300 region">{bubble.region}</div>
               <div className="text-emerald-400 font-mono mt-1">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bubble.value)}
               </div>
               <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="absolute bottom-4 right-4 flex gap-4 text-[10px] font-medium text-slate-500">
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Baixo Volume</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Médio</div>
         <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Alto Volume</div>
      </div>
    </div>
  );
};
