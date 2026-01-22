import logoLight from '../../assets/logo-light.svg';
import logoDark from '../../assets/logo-dark.svg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  withGlow?: boolean;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
  '2xl': 'h-32 w-32',
  '3xl': 'h-40 w-40',
};

export function Logo({ size = 'md', className = '', withGlow = false }: LogoProps) {
  // Efecto de brillo sutil que no distorsiona el logo
  const glowStyles = withGlow ? {
    light: 'drop-shadow-[0_0_20px_rgba(218,165,32,0.6)] drop-shadow-[0_0_40px_rgba(218,165,32,0.3)]',
    dark: 'drop-shadow-[0_0_20px_rgba(34,197,94,0.6)] drop-shadow-[0_0_40px_rgba(34,197,94,0.3)]',
  } : { light: '', dark: '' };

  return (
    <>
      {/* Logo modo claro (dorado) */}
      <img
        src={logoLight}
        alt="Logo"
        className={`dark:hidden ${sizeClasses[size]} ${glowStyles.light} ${className}`}
      />
      {/* Logo modo oscuro (verde) */}
      <img
        src={logoDark}
        alt="Logo"
        className={`hidden dark:block ${sizeClasses[size]} ${glowStyles.dark} ${className}`}
      />
    </>
  );
}
