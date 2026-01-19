import { Users, Shield, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Clan } from '../../types';
import { Link } from 'react-router-dom';

interface ClanCardProps {
  clan: Clan;
}

export function ClanCard({ clan }: ClanCardProps) {
  return (
    <Link to={`/clanes/${clan.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {clan.avatarUrl ? (
              <img
                src={`http://localhost:3000${clan.avatarUrl}`}
                alt={clan.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  // Mostrar icono por defecto si falla
                  target.parentElement!.innerHTML = `
                    <div class="bg-primary-100 p-3 rounded-full">
                      <svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  `;
                }}
              />
            ) : (
              <div className="bg-primary-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-military-900">
                {clan.name}
              </h3>
              {clan.tag && (
                <Badge variant="info" className="mt-1">
                  {clan.tag}
                </Badge>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-military-400" />
        </div>

        {clan.description && (
          <p className="text-sm text-military-600 mb-4 line-clamp-2">
            {clan.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-military-200">
          <div className="flex items-center text-military-600">
            <Users className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {clan.memberCount || 0} {clan.memberCount === 1 ? 'miembro' : 'miembros'}
            </span>
          </div>
          <span className="text-xs text-military-500">
            Ver detalles →
          </span>
        </div>
      </Card>
    </Link>
  );
}