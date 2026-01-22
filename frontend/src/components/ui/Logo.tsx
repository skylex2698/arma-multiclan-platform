import logoLight from '../../assets/logo-light.png';
import logoDark from '../../assets/logo-dark.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
};

export function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <>
      {/* Logo modo claro */}
      <img
        src={logoLight}
        alt="Logo"
        className={`dark:hidden ${sizeClasses[size]} ${className}`}
      />
      {/* Logo modo oscuro */}
      <img
        src={logoDark}
        alt="Logo"
        className={`hidden dark:block ${sizeClasses[size]} ${className}`}
      />
    </>
  );
}
