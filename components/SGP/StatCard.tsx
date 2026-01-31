import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  subtitle?: string;
  count: number;
  icon: LucideIcon;
  colorClass?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  footer?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  subtitle,
  count,
  icon: Icon,
  colorClass = 'border-l-indigo-500',
  iconBgClass = 'bg-indigo-50',
  iconColorClass = 'text-indigo-600',
  footer
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 border-l-4 ${colorClass} hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBgClass}`}>
          <Icon size={20} className={iconColorClass} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-800">{count}</span>
        {footer && <div className="text-right">{footer}</div>}
      </div>
    </div>
  );
};

export default StatCard;
