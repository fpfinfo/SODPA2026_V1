import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  count: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: string; // e.g., 'border-l-blue-500' or just 'border-blue-500' depending on usage
  iconBgClass: string; // e.g., 'bg-blue-100'
  iconColorClass: string; // e.g., 'text-blue-600'
  footer?: React.ReactNode;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  count, 
  subtitle, 
  icon: Icon, 
  colorClass, 
  iconBgClass, 
  iconColorClass,
  footer,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border-l-4 ${colorClass} p-5 flex flex-col justify-between h-40 transition-transform hover:scale-[1.02] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${iconBgClass} ${iconColorClass}`}>
          <Icon size={20} />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</span>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mt-2">{count}</h2>
        {subtitle && <p className="text-xs font-semibold text-gray-400 mt-1 uppercase">{subtitle}</p>}
      </div>

      {footer && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          {footer}
        </div>
      )}
    </div>
  );
};

export default StatCard;
