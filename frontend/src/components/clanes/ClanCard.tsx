import { Users, Shield, ChevronRight, RotateCcw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Clan } from '../../types';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../../utils/url';
import { useState } from 'react';

interface ClanCardProps {
  clan: Clan;
  isDeleted?: boolean;
  onRestore?: () => void;
  isRestoring?: boolean;
}

export function ClanCard({ clan, isDeleted, onRestore, isRestoring }: ClanCardProps) {
  const [imageError, setImageError] = useState(false);
  const avatarUrl = !imageError ? getAssetUrl(clan.avatarUrl) : null;

  const cardContent = (
    <Card className={`${isDeleted ? 'border-red-300 dark:border-red-800 opacity-75 hover:opacity-100' : 'hover:shadow-lg'} flex h-full cursor-pointer flex-col transition-all`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-military-700 bg-military-900 p-1 shadow-sm dark:border-gray-500 dark:bg-gray-800">
              <img
                src={avatarUrl}
                alt={clan.name}
                className="h-full w-full rounded-full object-contain"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="bg-primary-100 p-3 rounded-full">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
          )}
          <div>
            <h3 className={`text-xl font-bold ${isDeleted ? 'text-red-900 dark:text-red-200' : 'text-military-900 dark:text-gray-100'}`}>
              {clan.name}
            </h3>
            <div className="flex gap-2 mt-1">
              {clan.tag && (
                <Badge variant="info">
                  {clan.tag}
                </Badge>
              )}
              {isDeleted && (
                <Badge variant="danger">
                  Eliminado
                </Badge>
              )}
            </div>
          </div>
        </div>
        {!isDeleted && <ChevronRight className="h-5 w-5 text-military-400 dark:text-gray-500" />}
      </div>

      <div className="mb-4 min-h-[2.75rem]">
        <p
          className={`line-clamp-2 text-sm text-military-600 dark:text-gray-400 ${
            clan.description ? '' : 'invisible'
          }`}
        >
          {clan.description || 'Sin descripcion'}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-military-200 pt-4 dark:border-gray-700">
        <div className="flex items-center text-military-600 dark:text-gray-400">
          <Users className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {clan.memberCount || 0} {clan.memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
        </div>
        {!isDeleted && (
          <span className="text-xs text-military-500 dark:text-gray-500">
            Ver detalles →
          </span>
        )}
      </div>

      {/* Botón restaurar (solo para clanes eliminados) */}
      {isDeleted && onRestore && (
        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRestore();
            }}
            disabled={isRestoring}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRestoring ? 'animate-spin' : ''}`} />
            {isRestoring ? 'Restaurando...' : 'Restaurar Clan'}
          </button>
        </div>
      )}
    </Card>
  );

  if (isDeleted) {
    return <div className="h-full">{cardContent}</div>;
  }

  return (
    <Link to={`/clanes/${clan.id}`} className="block h-full">
      {cardContent}
    </Link>
  );
}
