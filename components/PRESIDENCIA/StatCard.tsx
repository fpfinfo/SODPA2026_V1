import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  count: number | string;
  icon: LucideIcon;
  colorClass?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  count,
  icon: Icon,
  colorClass = 'border-l-amber-500',
  iconBgClass = 'bg-amber-50',
  iconColorClass = 'text-amber-600',
  footer,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 ${colorClass} hover:shadow-lg transition-all cursor-pointer group ${onClick ? 'hover:-translate-y-1' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${iconBgClass} group-hover:scale-110 transition-transform`}>
          <Icon size={24} className={iconColorClass} />
        </div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-4xl font-bold text-gray-800">{count}</span>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {footer && <div className="text-right">{footer}</div>}
      </div>
    </div>
  );
};

export default StatCard;
