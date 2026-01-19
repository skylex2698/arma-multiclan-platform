import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg border border-military-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-primary-100 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-military-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-military-700">{title}</p>
        {description && (
          <p className="text-xs text-military-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}