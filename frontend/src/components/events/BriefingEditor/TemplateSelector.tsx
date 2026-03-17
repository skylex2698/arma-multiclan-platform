// frontend/src/components/events/BriefingEditor/TemplateSelector.tsx
// VERSIÓN CORREGIDA - Botones con type="button" para evitar submit

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
  const [showPreview, setShowPreview] = useState(true);

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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Cerrar si se hace click en el fondo
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Seleccionar Plantilla de Briefing
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Elige una plantilla para empezar más rápido
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Lista de plantillas */}
          <div className="w-1/2 overflow-y-auto border-r border-gray-200 p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-3">
              {briefingTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700/60'
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
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
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
          <div className="w-1/2 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
            {selectedTemplate ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Vista Previa
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {showPreview ? 'Ver HTML' : 'Ver Renderizado'}
                  </button>
                </div>

                {showPreview ? (
                  /* Vista renderizada */
                  <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div
                      className="briefing-content prose prose-sm max-w-none p-6 dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                    />
                  </div>
                ) : (
                  /* Vista HTML */
                  <pre className="max-h-[60vh] overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100 dark:bg-gray-950">
                    <code>{selectedTemplate.content}</code>
                  </pre>
                )}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <FileText className="w-16 h-16 mb-4" />
                <p className="text-center">
                  Selecciona una plantilla para ver la vista previa
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTemplate
              ? `${selectedTemplate.name} seleccionada`
              : 'Ninguna plantilla seleccionada'}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
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
