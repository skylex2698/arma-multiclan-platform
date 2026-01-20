// frontend/src/components/events/CommunicationTree/NodeModal.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { NodeType } from '../../../types/communicationTree';
import type { CommunicationNode, CreateNodeDto, UpdateNodeDto } from '../../../types/communicationTree';

interface NodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNodeDto | UpdateNodeDto) => Promise<void>;
  node?: CommunicationNode;
  nodes: CommunicationNode[];
  isLoading: boolean;
}

const NODE_TYPE_OPTIONS = [
  { value: NodeType.COMMAND, label: 'Comando', color: 'bg-red-500' },
  { value: NodeType.SQUAD, label: 'Escuadra', color: 'bg-blue-500' },
  { value: NodeType.ELEMENT, label: 'Elemento', color: 'bg-green-500' },
  { value: NodeType.SUPPORT, label: 'Apoyo', color: 'bg-yellow-500' },
];

export default function NodeModal({
  isOpen,
  onClose,
  onSubmit,
  node,
  nodes,
  isLoading,
}: NodeModalProps) {
  // Inicializar con valores del nodo o valores por defecto
  const [name, setName] = useState(node?.name || '');
  const [frequency, setFrequency] = useState(node?.frequency || '');
  const [type, setType] = useState<NodeType>(node?.type || NodeType.SQUAD);
  const [parentId, setParentId] = useState(node?.parentId || '');

  // Resetear el formulario cuando cambia el nodo o se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (node) {
        setName(node.name);
        setFrequency(node.frequency || '');
        setType(node.type);
        setParentId(node.parentId || '');
      } else {
        setName('');
        setFrequency('');
        setType(NodeType.SQUAD);
        setParentId('');
      }
    }
  }, [isOpen, node?.id]); // Solo cuando cambia isOpen o el ID del nodo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateNodeDto | UpdateNodeDto = {
      name,
      frequency: frequency || undefined,
      type,
      parentId: parentId || undefined,
    };

    await onSubmit(data);
  };

  if (!isOpen) return null;

  // Filtrar nodos que no pueden ser padres
  const availableParents = nodes.filter((n) => n.id !== node?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {node ? 'Editar Nodo' : 'Crear Nodo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: ALPHA MANDO, BRAVO, HIERRO 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Frecuencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia (opcional)
            </label>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="Ej: 41.00, 123.45"
              pattern="^\d+(\.\d{1,2})?$"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: xxx.xx (Ej: 41.00, 123.45)
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`
                    px-4 py-2 rounded-lg border-2 font-medium transition-all
                    ${
                      type === option.value
                        ? `${option.color} text-white border-transparent`
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nodo Padre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nodo Padre (opcional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin padre (Nodo raíz)</option>
              {availableParents.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} {n.frequency && `(${n.frequency})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Los nodos sin padre aparecerán en la parte superior del árbol
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : node ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}