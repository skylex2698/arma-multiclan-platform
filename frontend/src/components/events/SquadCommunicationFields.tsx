import { useState } from 'react';
import { Link as LinkIcon, Radio, Shield } from 'lucide-react';
import {
  normalizeFrequencyValue,
  sanitizeFrequencyInput,
} from '../../utils/frequency';

interface SquadFormFieldsProps {
  frequency: string;
  isCommand: boolean;
  commandDisabled?: boolean;
  parentSquadId: string;
  parentFrequency: string;
  availableSquads: Array<{ id: string; name: string }>;
  onFrequencyChange: (value: string) => void;
  onIsCommandChange: (value: boolean) => void;
  onParentSquadIdChange: (value: string) => void;
  onParentFrequencyChange: (value: string) => void;
}

export function SquadCommunicationFields({
  frequency,
  isCommand,
  commandDisabled = false,
  parentSquadId,
  parentFrequency,
  availableSquads,
  onFrequencyChange,
  onIsCommandChange,
  onParentSquadIdChange,
  onParentFrequencyChange,
}: SquadFormFieldsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const handleFrequencyChange = (value: string) => {
    onFrequencyChange(sanitizeFrequencyInput(value));
  };
  const handleParentFrequencyChange = (value: string) => {
    onParentFrequencyChange(sanitizeFrequencyInput(value));
  };

  return (
    <section className="subtle-divider pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-military-900 dark:text-gray-100">
            Comunicaciones
          </h3>
          <p className="section-caption">
            Configuracion interna y jerarquia de radio de la escuadra.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHelp((current) => !current)}
            className="toolbar-link text-xs"
          >
            {showHelp ? 'Ocultar ayuda' : 'Ayuda'}
          </button>
          <button
            type="button"
            onClick={() => setShowExample((current) => !current)}
            className="toolbar-link text-xs"
          >
            {showExample ? 'Ocultar ejemplo' : 'Ver ejemplo'}
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="mt-3 rounded-md border border-military-200 bg-military-50/70 px-3 py-2 text-[12px] leading-5 text-military-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          La frecuencia interna se propone automaticamente al crear la escuadra
          a partir de la frecuencia base del evento, pero puedes ajustarla aqui.
          Si la escuadra reporta a otra, define el enlace externo y, si aplica,
          la frecuencia usada para esa comunicacion.
        </div>
      )}

      {showExample && (
        <div className="mt-3 rounded-md border border-military-200 bg-military-50/70 px-3 py-2 text-[12px] leading-5 text-military-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          ALPHA MANDO {'->'} interna 41.00 y nodo de mando. BRAVO {'->'} interna
          42.00, padre ALPHA MANDO, frecuencia padre 41.00. HIERRO 1 {'->'} interna
          42.00, padre BRAVO, frecuencia padre 42.00.
        </div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <label className="field-label">Frecuencia interna</label>
          <div className="relative">
            <Radio className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-military-400 dark:text-gray-500" />
            <input
              type="text"
              value={frequency}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              onBlur={(e) => onFrequencyChange(normalizeFrequencyValue(e.target.value))}
              placeholder="42.00"
              inputMode="decimal"
              autoComplete="off"
              className="input pl-9"
            />
          </div>
          <p className="field-help">
            Acepta `42`, `42.`, `42,5` o `42.50` y lo normaliza a `42.00`.
          </p>
        </div>

        <label className="flex min-h-[38px] cursor-pointer items-center gap-3 rounded-md border border-military-200 px-3 py-2 text-sm text-military-700 transition-colors hover:bg-military-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900/40">
          <input
            type="checkbox"
            checked={isCommand}
            onChange={(e) => onIsCommandChange(e.target.checked)}
            disabled={commandDisabled}
            className="h-4 w-4 rounded border-military-300 text-primary-600 focus:ring-primary-500"
          />
          <Shield className="h-4 w-4 text-primary-600 dark:text-tactical-400" />
          <span>Escuadra de mando</span>
        </label>

        {!isCommand && (
          <div>
            <label className="field-label">Frecuencia externa con</label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-military-400 dark:text-gray-500" />
              <select
                value={parentSquadId}
                onChange={(e) => onParentSquadIdChange(e.target.value)}
                className="input pl-9"
              >
                <option value="">Sin enlace</option>
                {availableSquads.map((squad) => (
                  <option key={squad.id} value={squad.id}>
                    {squad.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!isCommand && parentSquadId && (
          <div>
            <label className="field-label">Frecuencia de enlace</label>
            <div className="relative">
              <Radio className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-military-400 dark:text-gray-500" />
              <input
                type="text"
                value={parentFrequency}
                onChange={(e) => handleParentFrequencyChange(e.target.value)}
                onBlur={(e) =>
                  onParentFrequencyChange(normalizeFrequencyValue(e.target.value))
                }
                placeholder="41.00"
                inputMode="decimal"
                autoComplete="off"
                className="input pl-9"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
