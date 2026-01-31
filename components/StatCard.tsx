import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600'
  },
  green: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600'
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600'
  },
  red: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-50',
    iconText: 'text-red-600',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600'
  },
  purple: {
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-50',
    iconText: 'text-purple-600',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600'
  },
  slate: {
    border: 'border-l-slate-500',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    trendPositive: 'text-green-600',
    trendNegative: 'text-red-600'
  }
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
  onClick
}) => {
  const colors = colorMap[colorScheme];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 border-l-4 ${colors.border} hover:shadow-lg transition-all ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${colors.iconBg}`}>
          <Icon size={24} className={colors.iconText} />
        </div>
        {trend && (
          <span className={`text-sm font-bold ${trend.isPositive ? colors.trendPositive : colors.trendNegative}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <span className="text-3xl font-bold text-gray-800">{value}</span>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">{title}</p>
      </div>
    </div>
  );
};

export default StatCard;
