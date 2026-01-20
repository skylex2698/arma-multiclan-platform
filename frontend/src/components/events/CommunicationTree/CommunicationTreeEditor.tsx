// frontend/src/components/events/CommunicationTree/CommunicationTreeEditor.tsx

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import NodeModal from './NodeModal';
import {
  useCommunicationTree,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
  useUpdatePositions,
  useAutoGenerateTree,
} from '../../../hooks/useCommunicationTree';
import { Plus, Download, Trash2, Wand2, Save, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { CommunicationNode, CreateNodeDto, UpdateNodeDto } from '../../../types/communicationTree';

interface CommunicationTreeEditorProps {
  eventId: string;
}

// Definir nodeTypes FUERA del componente para evitar recreación
const nodeTypes = {
  custom: CustomNode,
};

export default function CommunicationTreeEditor({ eventId }: CommunicationTreeEditorProps) {
  const { data: backendNodes, isLoading, error } = useCommunicationTree(eventId);
  const createNode = useCreateNode(eventId);
  const updateNode = useUpdateNode(eventId);
  const deleteNode = useDeleteNode(eventId);
  const updatePositions = useUpdatePositions(eventId);
  const autoGenerate = useAutoGenerateTree(eventId);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CommunicationNode | undefined>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // DEBUG: Log cuando cambian los datos del backend
  useEffect(() => {
    console.log('🔍 Backend nodes changed:', backendNodes);
    console.log('🔍 Is array?', Array.isArray(backendNodes));
    console.log('🔍 Length:', backendNodes?.length);
  }, [backendNodes]);

  // Convertir nodos del backend a React Flow usando useEffect
  useEffect(() => {
    if (!backendNodes || !Array.isArray(backendNodes)) {
      console.log('⚠️ No backend nodes or not an array');
      return;
    }

    console.log('✅ Converting backend nodes to flow nodes:', backendNodes);

    const flowNodes: Node[] = backendNodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: { x: node.positionX, y: node.positionY },
      data: {
        label: node.name,
        frequency: node.frequency,
        type: node.type,
      },
    }));

    const flowEdges: Edge[] = backendNodes
      .filter((node) => node.parentId)
      .map((node) => ({
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId!,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#64748b', strokeWidth: 2 },
      }));

    console.log('✅ Flow nodes created:', flowNodes.length);
    console.log('✅ Flow edges created:', flowEdges.length);

    setNodes(flowNodes);
    setEdges(flowEdges);
    setHasUnsavedChanges(false);
  }, [backendNodes, setNodes, setEdges]);

  // Manejar cambios en los nodos (drag)
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      // Detectar si hubo un cambio de posición
      const hasPositionChange = changes.some((c) => c.type === 'position' && !(c as any).dragging);
      if (hasPositionChange) {
        setHasUnsavedChanges(true);
      }
    },
    [onNodesChange]
  );

  // Guardar posiciones
  const handleSavePositions = async () => {
    const positions = nodes.map((node) => ({
      id: node.id,
      positionX: node.position.x,
      positionY: node.position.y,
    }));

    try {
      await updatePositions.mutateAsync({ positions });
      setHasUnsavedChanges(false);
      alert('✅ Posiciones guardadas correctamente');
    } catch (error) {
      console.error('Error saving positions:', error);
      alert('❌ Error al guardar las posiciones');
    }
  };

  // Crear nodo
  const handleCreateNode = async (data: CreateNodeDto | UpdateNodeDto) => {
    try {
      console.log('Creating node with data:', data);
      await createNode.mutateAsync(data as CreateNodeDto);
      setIsModalOpen(false);
      alert('✅ Nodo creado correctamente');
    } catch (error) {
      console.error('Error creating node:', error);
      alert('❌ Error al crear el nodo');
    }
  };

  // Editar nodo
  const handleUpdateNode = async (data: CreateNodeDto | UpdateNodeDto) => {
    if (!selectedNode) return;

    try {
      await updateNode.mutateAsync({ nodeId: selectedNode.id, data: data as UpdateNodeDto });
      setIsModalOpen(false);
      setSelectedNode(undefined);
      alert('✅ Nodo actualizado correctamente');
    } catch (error) {
      console.error('Error updating node:', error);
      alert('❌ Error al actualizar el nodo');
    }
  };

  // Eliminar nodo
  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este nodo? Se eliminarán también sus hijos.')) {
      return;
    }

    try {
      await deleteNode.mutateAsync(nodeId);
      alert('✅ Nodo eliminado correctamente');
    } catch (error) {
      console.error('Error deleting node:', error);
      alert('❌ Error al eliminar el nodo');
    }
  };

  // Auto-generar árbol
  const handleAutoGenerate = async () => {
    if (
      backendNodes &&
      backendNodes.length > 0 &&
      !confirm('¿Estás seguro? Esto eliminará el árbol actual y creará uno nuevo desde las escuadras.')
    ) {
      return;
    }

    try {
      console.log('🔄 Starting auto-generate...');
      const result = await autoGenerate.mutateAsync();
      console.log('✅ Auto-generate result:', result);
      alert('✅ Árbol generado correctamente con ' + (result?.length || 0) + ' nodos');
    } catch (error) {
      console.error('❌ Error auto-generating tree:', error);
      alert('❌ Error al generar el árbol automáticamente');
    }
  };

  // Exportar a PNG
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
      alert('✅ Imagen exportada correctamente');
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      alert('❌ Error al exportar la imagen');
    }
  };

  // Hacer doble click en un nodo para editar
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const backendNode = backendNodes?.find((n) => n.id === node.id);
      if (backendNode) {
        setSelectedNode(backendNode);
        setIsModalOpen(true);
      }
    },
    [backendNodes]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-3 text-gray-600">Cargando árbol de comunicaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-500">Error al cargar el árbol</p>
        <pre className="mt-2 text-xs text-gray-600">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <>
      {/* DEBUG INFO */}
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm font-mono">
          🐛 DEBUG: Backend nodes: {backendNodes?.length || 0} | Flow nodes: {nodes.length} | Flow edges: {edges.length}
        </p>
      </div>

      <div className="w-full h-[700px] bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={handleNodeDoubleClick}
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

          {/* Panel de herramientas */}
          <Panel position="top-right" className="space-y-2">
            {/* Crear nodo */}
            <button
              onClick={() => {
                setSelectedNode(undefined);
                setIsModalOpen(true);
              }}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors w-full"
            >
              <Plus className="w-4 h-4" />
              Crear Nodo
            </button>

            {/* Auto-generar */}
            <button
              onClick={handleAutoGenerate}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors w-full disabled:opacity-50"
              disabled={autoGenerate.isPending}
            >
              {autoGenerate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Auto-generar
                </>
              )}
            </button>

            {/* Guardar posiciones */}
            {hasUnsavedChanges && (
              <button
                onClick={handleSavePositions}
                type="button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors w-full animate-pulse disabled:opacity-50"
                disabled={updatePositions.isPending}
              >
                <Save className="w-4 h-4" />
                {updatePositions.isPending ? 'Guardando...' : 'Guardar Posiciones'}
              </button>
            )}

            {/* Exportar */}
            <button
              onClick={handleExportToPNG}
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-colors w-full"
            >
              <Download className="w-4 h-4" />
              Exportar PNG
            </button>
          </Panel>

          {/* Instrucciones */}
          <Panel position="bottom-left">
            <div className="bg-gray-900 bg-opacity-90 text-white text-xs px-3 py-2 rounded-lg space-y-1">
              <p>💡 <strong>Doble click</strong> en un nodo para editarlo</p>
              <p>🖱️ <strong>Arrastra</strong> los nodos para reorganizar</p>
              <p>🔍 <strong>Rueda del ratón</strong> para zoom</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Lista de nodos para eliminar */}
      {backendNodes && backendNodes.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="font-bold text-gray-900 mb-3">Nodos del Árbol ({backendNodes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {backendNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {node.name}
                  </p>
                  {node.frequency && (
                    <p className="text-xs text-gray-500">{node.frequency}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteNode(node.id)}
                  type="button"
                  className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar nodo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para crear/editar */}
      <NodeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNode(undefined);
        }}
        onSubmit={selectedNode ? handleUpdateNode : handleCreateNode}
        node={selectedNode}
        nodes={backendNodes || []}
        isLoading={createNode.isPending || updateNode.isPending}
      />
    </>
  );
}