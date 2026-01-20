// frontend/src/pages/events/EditCommunicationTreePage.tsx

import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Radio } from 'lucide-react';
import { useEvent } from '../../hooks/useEvents';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Card } from '../../components/ui/Card';
import CommunicationTreeEditor from '../../components/events/CommunicationTree/CommunicationTreeEditor';

export default function EditCommunicationTreePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error } = useEvent(id!);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data?.event) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Error al cargar el evento</p>
        <Link
          to="/events"
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver a eventos
        </Link>
      </div>
    );
  }

  const event = data.event;

  // Verificar permisos - CORREGIDO
  const canEdit =
    user?.role === 'ADMIN' ||
    event.creatorId === user?.id ||
    (user?.role === 'CLAN_LEADER' && 
     user?.clan?.id && 
     event.creator?.clan?.id === user.clan.id);

  if (!canEdit) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">
          No tienes permisos para editar el árbol de comunicaciones de este evento
        </p>
        <Link
          to={`/events/${id}`}
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver al evento
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/events/${id}`}
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al evento
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Radio className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-military-900">
            Editar Árbol de Comunicaciones
          </h1>
        </div>
        <p className="text-military-600">
          Evento: <span className="font-medium text-military-900">{event.name}</span>
        </p>
      </div>

      {/* Instrucciones */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold">💡</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-blue-900 mb-2">Cómo usar el editor:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Crear nodo:</strong> Click en "Crear Nodo"</li>
              <li>• <strong>Auto-generar:</strong> Click en "Auto-generar" para crear el árbol automáticamente desde las escuadras</li>
              <li>• <strong>Editar nodo:</strong> Doble click sobre un nodo</li>
              <li>• <strong>Mover nodos:</strong> Arrastra los nodos para reorganizar</li>
              <li>• <strong>Eliminar nodo:</strong> Usa el botón de eliminar en la lista inferior</li>
              <li>• <strong>Guardar posiciones:</strong> Click en "Guardar Posiciones" después de mover nodos</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Editor */}
      <CommunicationTreeEditor eventId={id!} />

      {/* Leyenda de colores */}
      <Card className="mt-6">
        <h3 className="font-bold text-gray-900 mb-3">Leyenda de Tipos de Nodo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Comando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Escuadra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Elemento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Apoyo</span>
          </div>
        </div>
      </Card>
    </div>
  );
}