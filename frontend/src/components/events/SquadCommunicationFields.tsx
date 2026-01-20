// frontend/src/components/events/SquadFormFields.tsx
// NUEVO COMPONENTE - Campos adicionales para el formulario de escuadras

import { Radio, Shield, Link as LinkIcon } from 'lucide-react';

interface SquadFormFieldsProps {
  frequency: string;
  isCommand: boolean;
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
  parentSquadId,
  parentFrequency,
  availableSquads,
  onFrequencyChange,
  onIsCommandChange,
  onParentSquadIdChange,
  onParentFrequencyChange,
}: SquadFormFieldsProps) {
  return (
    <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Radio className="w-5 h-5" />
        Configuración de Comunicaciones
      </h3>
      
      {/* Frecuencia Interna */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frecuencia Interna (opcional)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Radio className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={frequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
            placeholder="ej: 42.00, 123.45"
            pattern="^\d+(\.\d{1,2})?$"
            className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Frecuencia que usa la escuadra internamente (formato: xxx.xx)
        </p>
      </div>

      {/* Es Comando */}
      <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <input
          type="checkbox"
          id="isCommand"
          checked={isCommand}
          onChange={(e) => onIsCommandChange(e.target.checked)}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor="isCommand" className="flex items-center gap-2 text-sm font-medium text-gray-900 cursor-pointer">
          <Shield className="w-4 h-4 text-red-600" />
          Es un Nodo de Mando (COMMAND)
        </label>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Marca esto si esta escuadra es el mando principal del evento
      </p>

      {/* Escuadra Padre */}
      {!isCommand && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Escuadra Padre (Jerarquía)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={parentSquadId}
              onChange={(e) => onParentSquadIdChange(e.target.value)}
              className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sin padre (raíz)</option>
              {availableSquads.map((squad) => (
                <option key={squad.id} value={squad.id}>
                  {squad.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Define la jerarquía (ej: HIERRO 1 reporta a BRAVO)
          </p>
        </div>
      )}

      {/* Frecuencia con el Padre */}
      {!isCommand && parentSquadId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frecuencia para comunicarse con el Padre
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Radio className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={parentFrequency}
              onChange={(e) => onParentFrequencyChange(e.target.value)}
              placeholder="ej: 41.00"
              pattern="^\d+(\.\d{1,2})?$"
              className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Frecuencia usada para reportar a la escuadra padre
          </p>
        </div>
      )}

      {/* Ejemplo Visual */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs font-medium text-blue-900 mb-1">💡 Ejemplo:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>ALPHA MANDO:</strong> Frecuencia 41.00, Es Comando ✓</li>
          <li>• <strong>BRAVO:</strong> Frecuencia 42.00, Padre: ALPHA MANDO, Frec. Padre: 41.00</li>
          <li>• <strong>HIERRO 1:</strong> Frecuencia 42.00, Padre: BRAVO, Frec. Padre: 42.00</li>
        </ul>
      </div>
    </div>
  );
}