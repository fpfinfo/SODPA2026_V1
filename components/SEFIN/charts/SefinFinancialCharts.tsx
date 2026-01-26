import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface ChartProps {
  data: any[];
  height?: number;
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

export const BudgetExecutionChart: React.FC<ChartProps> = ({ data, height = 200 }) => {
  const maxVal = Math.max(...data.map(d => d.budget), ...data.map(d => d.actual));

  return (
    <div className="w-full relative" style={{ height }}>
      <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 pointer-events-none">
        {[1, 0.75, 0.5, 0.25, 0].map((tick) => (
          <div key={tick} className="border-b border-slate-100 w-full h-px flex items-center">
             <span className="bg-white pr-2">{formatCurrency(maxVal * tick)}</span>
          </div>
        ))}
      </div>
      
      <div className="absolute inset-0 flex items-end justify-between px-4 pt-6">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center gap-2 group w-full">
             <div className="relative flex items-end justify-center w-full gap-1 h-full">
                {/* Budget Bar */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.budget / maxVal) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="w-3 md:w-6 bg-slate-200 rounded-t-sm relative group-hover:bg-slate-300 transition-colors"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Orçado: {formatCurrency(item.budget)}
                  </div>
                </motion.div>
                
                {/* Actual Bar */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.actual / maxVal) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  className={`w-3 md:w-6 rounded-t-sm relative transition-colors ${
                    item.actual > item.budget ? 'bg-red-400' : 'bg-emerald-500'
                  }`}
                >
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                    Executado: {formatCurrency(item.actual)}
                  </div>
                </motion.div>
             </div>
             <span className="text-[10px] font-medium text-slate-500 truncate max-w-[60px]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SpendingTrendChart: React.FC<ChartProps> = ({ data, height = 200 }) => {
  const maxVal = Math.max(...data.map(d => d.value));
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / maxVal) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full relative" style={{ height }}>
       {/* Grid Lines */}
       <div className="absolute inset-0 flex flex-col justify-between text-xs text-slate-300 pointer-events-none">
        {[1, 0.5, 0].map((tick) => (
          <div key={tick} className="border-b border-dashed border-slate-100 w-full h-px flex items-center pl-10" />
        ))}
      </div>

      <svg className="w-full h-full overflow-visible preserve-3d" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Gradient Defs */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area Path */}
        <motion.path
          d={`M0,100 L0,${100 - (data[0].value / maxVal) * 100} ${data.map((d, i) => `L${(i / (data.length - 1)) * 100},${100 - (d.value / maxVal) * 100}`).join(' ')} L100,100 Z`}
          fill="url(#gradient)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        
        {/* Line Path */}
        <motion.polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Tooltips Overlay (Simple hover effects based on columns) */}
      <div className="absolute inset-0 flex justify-between items-end pb-2">
        {data.map((d, i) => (
          <div key={i} className="relative flex flex-col items-center group h-full justify-end w-4">
             {/* Invisible hover area */}
             <div className="absolute w-full h-full bg-transparent hover:bg-slate-900/5 transition-colors rounded" />
             
             {/* Tooltip */}
             <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
               {d.date}: {formatCurrency(d.value)}
             </div>
             
             {/* Dot */}
             <div className="w-2 h-2 rounded-full bg-amber-500 border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity absolute" 
                  style={{ bottom: `${(d.value / maxVal) * 100}%`, transform: 'translateY(50%)' }} />
          </div>
        ))}
      </div>
      
      {/* X Labels */}
      <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[10px] text-slate-400">
         <span>{data[0].date}</span>
         <span>{data[Math.floor(data.length / 2)].date}</span>
         <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
};
