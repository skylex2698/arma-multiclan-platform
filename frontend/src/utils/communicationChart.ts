import type { Event, Squad } from '../types';

type ChartThemeMode = 'light' | 'dark';

export interface CommunicationChartSummary {
  commandSquad: Squad | null;
  linkedSquads: Squad[];
  unlinkedSquads: Squad[];
  squadsWithoutInternalFrequency: Squad[];
  internalFrequencyCount: number;
}

export interface CommunicationChartData extends CommunicationChartSummary {
  definition: string;
  orderedSquads: Squad[];
}

const sanitizeMermaidText = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildNodeLabel = (squad: Squad) => {
  const segments = [sanitizeMermaidText(squad.name)];

  if (squad.frequency?.trim()) {
    segments.push(`INT ${sanitizeMermaidText(squad.frequency.trim())}`);
  } else {
    segments.push('INT pendiente');
  }

  if (squad.isCommand) {
    segments.push('Mando');
  }

  return segments.join('<br/>');
};

export const buildCommunicationChart = (
  event: Pick<Event, 'squads'>,
  themeMode: ChartThemeMode
): CommunicationChartData => {
  const orderedSquads = [...event.squads].sort((left, right) => left.order - right.order);
  const squadIds = new Set(orderedSquads.map((squad) => squad.id));
  const squadNodeIds = new Map(
    orderedSquads.map((squad, index) => [squad.id, `squad_${index + 1}`])
  );

  const commandSquad = orderedSquads.find((squad) => squad.isCommand) || null;
  const linkedSquads = orderedSquads.filter(
    (squad) => Boolean(squad.parentSquadId && squadIds.has(squad.parentSquadId))
  );
  const unlinkedSquads = orderedSquads.filter(
    (squad) =>
      !squad.isCommand &&
      (!squad.parentSquadId || !squadIds.has(squad.parentSquadId))
  );
  const squadsWithoutInternalFrequency = orderedSquads.filter(
    (squad) => !squad.frequency?.trim()
  );
  const internalFrequencyCount = orderedSquads.length - squadsWithoutInternalFrequency.length;

  const classDefinitions =
    themeMode === 'dark'
      ? [
          'classDef command fill:#082f49,stroke:#38bdf8,color:#f8fafc,stroke-width:2px;',
          'classDef squad fill:#111827,stroke:#60a5fa,color:#e5eef7,stroke-width:1.5px;',
          'classDef pending fill:#3b1d12,stroke:#fb923c,color:#fde68a,stroke-width:1.5px;',
          'classDef isolated fill:#0f172a,stroke:#22d3ee,color:#cffafe,stroke-width:1.5px;',
        ]
      : [
          'classDef command fill:#0f172a,stroke:#38bdf8,color:#f8fafc,stroke-width:2px;',
          'classDef squad fill:#f8fafc,stroke:#94a3b8,color:#0f172a,stroke-width:1.5px;',
          'classDef pending fill:#fff7ed,stroke:#fb923c,color:#9a3412,stroke-width:1.5px;',
          'classDef isolated fill:#ecfeff,stroke:#06b6d4,color:#164e63,stroke-width:1.5px;',
        ];

  const definitionLines = [
    'flowchart TD',
    ...classDefinitions,
  ];

  for (const squad of orderedSquads) {
    definitionLines.push(
      `${squadNodeIds.get(squad.id)}["${buildNodeLabel(squad)}"]`
    );
  }

  for (const squad of linkedSquads) {
    const parentNodeId = squadNodeIds.get(squad.parentSquadId!);
    const childNodeId = squadNodeIds.get(squad.id);

    if (!parentNodeId || !childNodeId) {
      continue;
    }

    const edgeLabel = squad.parentFrequency?.trim()
      ? `|ENLACE ${sanitizeMermaidText(squad.parentFrequency.trim())}|`
      : '';

    definitionLines.push(`${parentNodeId} -->${edgeLabel} ${childNodeId}`);
  }

  for (const squad of orderedSquads) {
    const nodeId = squadNodeIds.get(squad.id);
    if (!nodeId) {
      continue;
    }

    if (squad.isCommand) {
      definitionLines.push(`class ${nodeId} command;`);
      continue;
    }

    if (!squad.frequency?.trim()) {
      definitionLines.push(`class ${nodeId} pending;`);
      continue;
    }

    if (!squad.parentSquadId || !squadIds.has(squad.parentSquadId)) {
      definitionLines.push(`class ${nodeId} isolated;`);
      continue;
    }

    definitionLines.push(`class ${nodeId} squad;`);
  }

  return {
    definition: definitionLines.join('\n'),
    commandSquad,
    linkedSquads,
    unlinkedSquads,
    squadsWithoutInternalFrequency,
    internalFrequencyCount,
    orderedSquads,
  };
};
