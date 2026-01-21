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

  // Limpiar espacios y tags vacíos para detectar si realmente está vacío
  const isReallyEmpty = !content || content.trim() === '' || content.trim() === '<p></p>';

  return (
    <div className="space-y-3">
      {/* Editor siempre visible */}
      <BriefingEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
      />

      {/* Botón para plantillas */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setShowTemplateSelector(true)}
          className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          {isReallyEmpty ? 'Usar Plantilla' : 'Cambiar Plantilla'}
        </button>

        {!isReallyEmpty && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Limpiar contenido
          </button>
        )}
      </div>

      {/* Modal selector de plantillas */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}