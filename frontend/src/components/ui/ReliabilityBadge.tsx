interface ReliabilityBadgeProps {
  score: number | null;
  size?: 'sm' | 'md';
  className?: string;
}

export function ReliabilityBadge({ score, size = 'sm', className = '' }: ReliabilityBadgeProps) {
  if (score === null || score === undefined) return null;

  const getColor = (s: number) => {
    if (s >= 80)
      return 'bg-green-100 text-green-800 ring-green-200 dark:bg-green-600/30 dark:text-green-200 dark:ring-green-500/50';
    if (s >= 50)
      return 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-600/30 dark:text-amber-200 dark:ring-amber-500/50';
    return 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-600/30 dark:text-red-200 dark:ring-red-500/50';
  };

  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ${getColor(score)} ${sizeClasses} ${className}`}
      title={`Fiabilidad: ${score}%`}
    >
      {score}%
    </span>
  );
}
