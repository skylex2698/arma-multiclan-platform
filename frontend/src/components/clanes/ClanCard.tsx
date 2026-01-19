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
            <div className="bg-primary-100 p-3 rounded-full">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
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