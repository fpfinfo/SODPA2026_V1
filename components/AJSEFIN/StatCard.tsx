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
  colorClass = 'border-l-blue-500',
  iconBgClass = 'bg-blue-50',
  iconColorClass = 'text-blue-600',
  footer,
  onClick
}) => {
  return (
    <div 
      className={`bg-white rounded-xl border ${colorClass} border-l-4 shadow-sm hover:shadow-md transition-all p-5 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          <p className="text-3xl font-bold text-gray-900 mt-3">{count}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBgClass}`}>
          <Icon size={24} className={iconColorClass} />
        </div>
      </div>
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          {footer}
        </div>
      )}
    </div>
  );
};

export default StatCard;
