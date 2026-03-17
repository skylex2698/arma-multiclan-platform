import { useState } from 'react';
import { FileText } from 'lucide-react';
import { BriefingEditor } from './BriefingEditor';
import { TemplateSelector } from './TemplateSelector';
import type { BriefingTemplate } from '../../../data/briefingTemplates';

interface BriefingEditorWithTemplatesProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function BriefingEditorWithTemplates({
  content,
  onChange,
  placeholder,
}: BriefingEditorWithTemplatesProps) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleSelectTemplate = (template: BriefingTemplate) => {
    onChange(template.content);
  };

  const isReallyEmpty =
    !content || content.trim() === '' || content.trim() === '<p></p>';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplateSelector(true)}
            className="btn btn-outline btn-sm"
          >
            <FileText className="h-4 w-4" />
            {isReallyEmpty ? 'Usar plantilla' : 'Cambiar plantilla'}
          </button>

          {!isReallyEmpty && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="toolbar-link"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <BriefingEditor
        content={content}
        onChange={onChange}
        placeholder={placeholder}
      />

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}
