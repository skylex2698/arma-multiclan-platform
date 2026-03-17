import { useEffect, useRef } from 'react';
import { CircleHelp, FileText, Lightbulb, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HelpMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenProblemReport: () => void;
  onOpenSuggestion: () => void;
}

const helpItems = [
  {
    id: 'manual',
    title: 'Manual rapido',
    description: 'Guia breve para orientarte dentro de la plataforma.',
    icon: FileText,
    to: '/help/manual',
  },
  {
    id: 'problem',
    title: 'Informar de un problema',
    description: 'Comunica un fallo o un comportamiento inesperado.',
    icon: Siren,
  },
  {
    id: 'suggestion',
    title: 'Proponer una mejora',
    description: 'Comparte una idea para mejorar flujos o interfaz.',
    icon: Lightbulb,
  },
] as const;

export function HelpMenu({
  isOpen,
  onToggle,
  onClose,
  onOpenProblemReport,
  onOpenSuggestion,
}: HelpMenuProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, onClose]);

  return (
    <div ref={containerRef} className="relative hidden h-11 items-center lg:flex">
      <button
        type="button"
        onClick={onToggle}
        className={`p-2 rounded-lg transition-colors ${
          isOpen
            ? 'bg-military-100 text-military-700 dark:bg-military-700 dark:text-gray-200'
            : 'text-military-700 hover:bg-military-100 dark:text-gray-300 dark:hover:bg-military-700'
        }`}
        title="Ayuda"
        aria-label="Ayuda"
      >
        <CircleHelp className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-lg border border-military-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-military-200 px-4 py-3 dark:border-gray-700">
            <h2 className="text-lg font-medium text-military-950 dark:text-gray-100">
              Ayuda
            </h2>
            <p className="mt-1 text-sm leading-6 text-military-600 dark:text-gray-400">
              Soporte rápido, documentación breve y canal directo con administración.
            </p>
          </div>

          <div className="divide-y divide-military-200 dark:divide-gray-700">
            {helpItems.map((item) => {
              const Icon = item.icon;

              if (item.id === 'manual') {
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={onClose}
                    className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-military-50 dark:hover:bg-gray-700/60"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-military-100 text-military-700 dark:bg-gray-700 dark:text-gray-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-lg font-medium text-military-900 dark:text-gray-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-military-600 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              }

              const onClick =
                item.id === 'problem' ? onOpenProblemReport : onOpenSuggestion;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={onClick}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-military-50 dark:hover:bg-gray-700/60"
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-military-100 text-military-700 dark:bg-gray-700 dark:text-gray-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-lg font-medium text-military-900 dark:text-gray-100">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-military-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
