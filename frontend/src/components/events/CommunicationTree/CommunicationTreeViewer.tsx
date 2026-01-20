// frontend/src/components/events/CommunicationTree/CommunicationTreeViewer.tsx

import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import { useCommunicationTree } from '../../../hooks/useCommunicationTree';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

interface CommunicationTreeViewerProps {
  eventId: string;
}

const nodeTypes = {
  custom: CustomNode,
};

const CommunicationTreeViewer = ({ eventId }: CommunicationTreeViewerProps) => {
  const { data: nodes, isLoading, error } = useCommunicationTree(eventId);

  // Convertir los nodos del backend a formato de React Flow
  const flowNodes: Node[] = useMemo(() => {
    if (!nodes) return [];

    return nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: { x: node.positionX, y: node.positionY },
      data: {
        label: node.name,
        frequency: node.frequency,
        type: node.type,
      },
    }));
  }, [nodes]);

  // Crear las conexiones (edges) basadas en parentId
  const flowEdges: Edge[] = useMemo(() => {
    if (!nodes) return [];

    return nodes
      .filter((node) => node.parentId)
      .map((node) => ({
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId!,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 },
      }));
  }, [nodes]);

  // Función para exportar a PNG
  const handleExportToPNG = async () => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#1f2937',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `communication-tree-${eventId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error al cargar el árbol de comunicaciones</p>
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <p>No hay árbol de comunicaciones configurado</p>
        <p className="text-sm mt-2">
          El administrador del evento puede crear uno
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-gray-800 rounded-lg overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color="#4b5563" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.data.type) {
              case 'COMMAND':
                return '#ef4444';
              case 'SQUAD':
                return '#3b82f6';
              case 'ELEMENT':
                return '#10b981';
              case 'SUPPORT':
                return '#eab308';
              default:
                return '#6b7280';
            }
          }}
        />

        {/* Panel de acciones */}
        <Panel position="top-right">
          <button
            onClick={handleExportToPNG}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PNG
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export default CommunicationTreeViewer;