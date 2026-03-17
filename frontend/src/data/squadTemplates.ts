export interface SquadTemplate {
  id: string;
  name: string;
  description: string;
  suggestedSquadName: string;
  roles: string[];
}

export const squadTemplates: SquadTemplate[] = [
  {
    id: 'rifle-standard',
    name: 'Escuadra de Fusileros Estándar',
    description:
      'Jefe de Escuadra, Jefe de Equipo, Ametrallador Ligero, Granadero, Fusilero, Jefe de Equipo, Ametrallador Ligero, Granadero, Fusilero',
    suggestedSquadName: 'Fusileros Estándar',
    roles: [
      'Jefe de Escuadra',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Granadero',
      'Fusilero',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Granadero',
      'Fusilero',
    ],
  },
  {
    id: 'rifle-reinforced',
    name: 'Escuadra de Fusileros Reforzada',
    description:
      'Jefe de Escuadra, Médico, Jefe de Equipo, Ametrallador Ligero, Granadero, Tirador Designado, Jefe de Equipo, Ametrallador Ligero, Granadero, Fusilero',
    suggestedSquadName: 'Fusileros Reforzada',
    roles: [
      'Jefe de Escuadra',
      'Médico',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Granadero',
      'Tirador Designado',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Granadero',
      'Fusilero',
    ],
  },
  {
    id: 'assault',
    name: 'Escuadra de Asalto',
    description:
      'Jefe de Escuadra, Fusilero, Granadero, Ametrallador Ligero, Médico, Jefe de Equipo, Ametrallador Ligero, Granadero, Fusilero, Ingeniero de Combate',
    suggestedSquadName: 'Asalto',
    roles: [
      'Jefe de Escuadra',
      'Fusilero',
      'Granadero',
      'Ametrallador Ligero',
      'Médico',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Granadero',
      'Fusilero',
      'Ingeniero de Combate',
    ],
  },
  {
    id: 'support-weapons',
    name: 'Escuadra de Apoyo / Armas',
    description:
      'Jefe de Escuadra, Ametrallador Ligero, Asistente de Ametrallador, Portador de Munición, Ametrallador Ligero, Asistente de Ametrallador, Operador Antitanque, Asistente Antitanque, Fusilero',
    suggestedSquadName: 'Apoyo / Armas',
    roles: [
      'Jefe de Escuadra',
      'Ametrallador Ligero',
      'Asistente de Ametrallador',
      'Portador de Munición',
      'Ametrallador Ligero',
      'Asistente de Ametrallador',
      'Operador Antitanque',
      'Asistente Antitanque',
      'Fusilero',
    ],
  },
  {
    id: 'anti-tank',
    name: 'Escuadra Antitanque',
    description:
      'Jefe de Escuadra, Operador Antitanque, Asistente Antitanque, Fusilero, Jefe de Equipo, Operador Antitanque, Asistente Antitanque, Ametrallador Ligero',
    suggestedSquadName: 'Antitanque',
    roles: [
      'Jefe de Escuadra',
      'Operador Antitanque',
      'Asistente Antitanque',
      'Fusilero',
      'Jefe de Equipo',
      'Operador Antitanque',
      'Asistente Antitanque',
      'Ametrallador Ligero',
    ],
  },
  {
    id: 'recon',
    name: 'Escuadra de Reconocimiento',
    description:
      'Jefe de Escuadra, Tirador Designado, Fusilero, Operador de Radio, Jefe de Equipo, Tirador Designado, Ametrallador Ligero, Médico',
    suggestedSquadName: 'Reconocimiento',
    roles: [
      'Jefe de Escuadra',
      'Tirador Designado',
      'Fusilero',
      'Operador de Radio',
      'Jefe de Equipo',
      'Tirador Designado',
      'Ametrallador Ligero',
      'Médico',
    ],
  },
  {
    id: 'combat-engineers',
    name: 'Escuadra de Ingenieros de Combate',
    description:
      'Jefe de Escuadra, Jefe de Equipo / Ingeniero, Ingeniero de Combate, Ingeniero de Combate, Fusilero, Jefe de Equipo / Ingeniero, Ingeniero de Combate, Ametrallador Ligero, Fusilero',
    suggestedSquadName: 'Ingenieros de Combate',
    roles: [
      'Jefe de Escuadra',
      'Jefe de Equipo / Ingeniero',
      'Ingeniero de Combate',
      'Ingeniero de Combate',
      'Fusilero',
      'Jefe de Equipo / Ingeniero',
      'Ingeniero de Combate',
      'Ametrallador Ligero',
      'Fusilero',
    ],
  },
  {
    id: 'mechanized',
    name: 'Escuadra Mecanizada',
    description:
      'Comandante de Vehículo, Conductor, Artillero, Jefe de Equipo, Ametrallador Ligero, Granadero, Jefe de Equipo, Operador Antitanque, Fusilero',
    suggestedSquadName: 'Mecanizada',
    roles: [
      'Comandante de Vehículo',
      'Conductor',
      'Artillero',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Granadero',
      'Jefe de Equipo',
      'Operador Antitanque',
      'Fusilero',
    ],
  },
  {
    id: 'special-purpose',
    name: 'Escuadra de Propósito Especial',
    description:
      'Jefe de Escuadra, Ametrallador Ligero, Granadero, Operador Antitanque, Médico, Jefe de Equipo, Ametrallador Ligero, Tirador Designado, Granadero, Operador de Radio',
    suggestedSquadName: 'Propósito Especial',
    roles: [
      'Jefe de Escuadra',
      'Ametrallador Ligero',
      'Granadero',
      'Operador Antitanque',
      'Médico',
      'Jefe de Equipo',
      'Ametrallador Ligero',
      'Tirador Designado',
      'Granadero',
      'Operador de Radio',
    ],
  },
];

export const getSquadTemplateById = (templateId: string) =>
  squadTemplates.find((template) => template.id === templateId);
