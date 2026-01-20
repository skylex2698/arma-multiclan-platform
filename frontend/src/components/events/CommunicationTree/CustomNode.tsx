// frontend/src/components/events/CommunicationTree/CustomNode.tsx
// VERSIÓN LIMPIA - Sin parentFrequency (se mostrará en la conexión)

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeType } from '../../../types/communicationTree';
import { Radio, Users, Shield, Plane } from 'lucide-react';

interface CustomNodeProps {
  data: {
    label: string;
    frequency?: string;
    type: NodeType;
  };
}

const CustomNode = ({ data }: CustomNodeProps) => {
  // Colores según el tipo de nodo
  const getNodeColor = () => {
    switch (data.type) {
      case NodeType.COMMAND:
        return 'bg-red-500 border-red-600';
      case NodeType.SQUAD:
        return 'bg-blue-500 border-blue-600';
      case NodeType.ELEMENT:
        return 'bg-green-500 border-green-600';
      case NodeType.SUPPORT:
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  // Icono según el tipo de nodo
  const getIcon = () => {
    switch (data.type) {
      case NodeType.COMMAND:
        return <Shield className="w-5 h-5" />;
      case NodeType.SQUAD:
        return <Users className="w-5 h-5" />;
      case NodeType.ELEMENT:
        return <Users className="w-4 h-4" />;
      case NodeType.SUPPORT:
        return <Plane className="w-5 h-5" />;
      default:
        return <Radio className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-lg min-w-[160px] ${getNodeColor()} text-white`}
    >
      {/* Handle de entrada (arriba) */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white border-2 border-gray-400"
      />

      {/* Contenido del nodo */}
      <div className="flex flex-col items-center gap-2">
        {/* Icono */}
        <div className="flex items-center justify-center">
          {getIcon()}
        </div>

        {/* Nombre */}
        <div className="font-bold text-center text-sm uppercase">
          {data.label}
        </div>

        {/* Frecuencia Interna */}
        {data.frequency && (
          <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded text-xs">
            <Radio className="w-3 h-3" />
            <span className="font-mono">{data.frequency}</span>
          </div>
        )}
      </div>

      {/* Handle de salida (abajo) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white border-2 border-gray-400"
      />
    </div>
  );
};

export default memo(CustomNode);