// frontend/src/components/events/BriefingEditor/TemplateSelector.tsx
// Selector de plantillas de briefing con preview

import { useState } from 'react';
import { 
  FileText, 
  Sword, 
  Shield, 
  Eye, 
  GraduationCap, 
  X,
  Check
} from 'lucide-react';
import { briefingTemplates, type BriefingTemplate } from '../../../data/briefingTemplates';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: BriefingTemplate) => void;
}

export function TemplateSelector({ isOpen, onClose, onSelect }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<BriefingTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  // Obtener icono según categoría
  const getCategoryIcon = (category: BriefingTemplate['category']) => {
    switch (category) {
      case 'assault':
        return <Sword className="w-6 h-6" />;
      case 'defense':
        return <Shield className="w-6 h-6" />;
      case 'recon':
        return <Eye className="w-6 h-6" />;
      case 'training':
        return <GraduationCap className="w-6 h-6" />;
      case 'custom':
        return <FileText className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  // Obtener color según categoría
  const getCategoryColor = (category: BriefingTemplate['category']) => {
    switch (category) {
      case 'assault':
        return 'bg-red-500 border-red-600';
      case 'defense':
        return 'bg-blue-500 border-blue-600';
      case 'recon':
        return 'bg-green-500 border-green-600';
      case 'training':
        return 'bg-yellow-500 border-yellow-600';
      case 'custom':
        return 'bg-gray-500 border-gray-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Seleccionar Plantilla de Briefing
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Elige una plantilla para empezar más rápido
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista de plantillas */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6">
            <div className="space-y-3">
              {briefingTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(false);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icono con color de categoría */}
                    <div
                      className={`p-3 rounded-lg text-white ${getCategoryColor(
                        template.category
                      )}`}
                    >
                      {getCategoryIcon(template.category)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                    </div>

                    {/* Check si está seleccionado */}
                    {selectedTemplate?.id === template.id && (
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="w-1/2 overflow-y-auto p-6 bg-gray-50">
            {selectedTemplate ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Vista Previa
                  </h3>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showPreview ? 'Ver HTML' : 'Ver Renderizado'}
                  </button>
                </div>

                {showPreview ? (
                  /* Vista renderizada */
                  <div
                    className="prose prose-sm max-w-none bg-white p-6 rounded-lg border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                  />
                ) : (
                  /* Vista HTML */
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{selectedTemplate.content}</code>
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText className="w-16 h-16 mb-4" />
                <p className="text-center">
                  Selecciona una plantilla para ver la vista previa
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedTemplate
              ? `${selectedTemplate.name} seleccionada`
              : 'Ninguna plantilla seleccionada'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSelectTemplate}
              disabled={!selectedTemplate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Usar Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}