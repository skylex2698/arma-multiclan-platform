import { User as UserIcon } from 'lucide-react';
import type { User } from '../../types';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

export function UserAvatar({ user, size = 'md', showBorder = true }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  // Determinar color del borde según el rol
  const getBorderColor = () => {
    if (!showBorder) return '';
    
    switch (user.role) {
      case 'ADMIN':
        return 'border-4 border-red-500';
      case 'CLAN_LEADER':
        return 'border-4 border-yellow-500';
      default:
        return 'border-4 border-blue-500';
    }
  };

  // Usar logo del clan si existe
  const avatarUrl = user.clan?.avatarUrl
    ? `http://localhost:3000${user.clan.avatarUrl}`
    : null;

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${getBorderColor()}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.nickname}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Si falla la imagen, mostrar icono por defecto
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-military-200 flex items-center justify-center">
                  <svg class="${iconSizes[size]} text-military-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              `;
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-military-200 flex items-center justify-center">
          <UserIcon className={`${iconSizes[size]} text-military-600`} />
        </div>
      )}
    </div>
  );
}