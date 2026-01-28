import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-all';

  const variants = {
    // Miembro - Azul
    default: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-600/30 dark:text-blue-200 dark:ring-blue-500/50',
    // Líder de Clan - Ámbar/Dorado
    warning: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-600/30 dark:text-amber-200 dark:ring-amber-500/50',
    // Administrador - Rojo
    danger: 'bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-600/30 dark:text-red-200 dark:ring-red-500/50',
    // Info - Clan tag
    info: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200 dark:bg-cyan-600/30 dark:text-cyan-200 dark:ring-cyan-500/50',
    // Success - Verde
    success: 'bg-green-100 text-green-800 ring-1 ring-green-200 dark:bg-green-600/30 dark:text-green-200 dark:ring-green-500/50',
  };

  return (
    <span className={cn(baseClasses, variants[variant], className)}>
      {children}
    </span>
  );
}