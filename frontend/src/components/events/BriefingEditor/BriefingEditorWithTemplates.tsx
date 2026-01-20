// frontend/src/components/events/BriefingEditor/BriefingEditorWithTemplates.tsx
// Wrapper que combina el editor con el selector de plantillas

import { useState } from 'react';
import { BriefingEditor } from './BriefingEditor';
import { TemplateSelector } from './TemplateSelector';
import { FileText } from 'lucide-react';
import type { BriefingTemplate } from '../../../data/briefingTemplates';

interface BriefingEditorWithTemplatesProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function BriefingEditorWithTemplates({
  content,
  onChange,
  placeholder
}: BriefingEditorWithTemplatesProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleSelectTemplate = (template: BriefingTemplate) => {
    onChange(template.content);
  };

  return (
    <div className="space-y-3">
      {/* Botón para abrir selector de plantillas */}
      {!content && (
        <div className="flex items-center justify-center p-6 bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg">
          <div className="text-center">
            <FileText className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700 mb-3">
              ¿Quieres empezar con una plantilla?
            </p>
            <button
              type="button"
              onClick={() => setShowTemplateSelector(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Plantillas
            </button>
          </div>
        </div>
      )}

      {/* Botón en la esquina si ya hay contenido */}
      {content && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowTemplateSelector(true)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Cambiar Plantilla
          </button>
        </div>
      )}

      {/* Editor */}
      <BriefingEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
      />

      {/* Modal selector de plantillas */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}