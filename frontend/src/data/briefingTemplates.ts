// frontend/src/data/briefingTemplates.ts
// Plantillas predefinidas de briefing

export interface BriefingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'assault' | 'defense' | 'recon' | 'training' | 'custom';
  content: string;
}

export const briefingTemplates: BriefingTemplate[] = [
  {
    id: 'assault-1',
    name: 'Misión de Asalto Estándar',
    description: 'Plantilla para misiones de asalto a posiciones enemigas',
    category: 'assault',
    content: `
<h1>BRIEFING DE MISIÓN - ASALTO</h1>

<h2>📍 SITUACIÓN</h2>
<p>Las fuerzas enemigas han establecido una posición defensiva en [UBICACIÓN]. Nuestra misión es neutralizar esta amenaza y asegurar el área.</p>

<h2>🎯 MISIÓN</h2>
<p><strong>Objetivo Principal:</strong> Asaltar y capturar [OBJETIVO]</p>
<p><strong>Objetivos Secundarios:</strong></p>
<ul>
  <li>Neutralizar personal enemigo en el área</li>
  <li>Asegurar equipo y munición enemiga</li>
  <li>Establecer perímetro defensivo</li>
</ul>

<h2>⚙️ EJECUCIÓN</h2>
<h3>Fase 1: Aproximación</h3>
<p>Las unidades se aproximarán desde [DIRECCIÓN] manteniendo formación táctica.</p>

<h3>Fase 2: Asalto</h3>
<p>Al contacto visual con el enemigo, iniciar supresión y avance coordinado.</p>

<h3>Fase 3: Consolidación</h3>
<p>Una vez capturado el objetivo, establecer defensa perimetral y reportar.</p>

<h2>🔧 LOGÍSTICA</h2>
<ul>
  <li><strong>Munición:</strong> Estándar de combate + 2 cargadores extra</li>
  <li><strong>Equipamiento especial:</strong> A determinar por líder de escuadra</li>
  <li><strong>Evacuación médica:</strong> Helicóptero en standby en [POSICIÓN]</li>
</ul>

<h2>📡 COMUNICACIONES</h2>
<ul>
  <li><strong>Red de Comando:</strong> 41.00 MHz</li>
  <li><strong>Red de Escuadra:</strong> 42.00 MHz</li>
  <li><strong>Emergencias:</strong> 40.00 MHz</li>
</ul>

<h2>⚠️ REGLAS DE ENFRENTAMIENTO</h2>
<p>Fuego libre sobre fuerzas enemigas confirmadas. Minimizar daño colateral.</p>
    `
  },
  {
    id: 'defense-1',
    name: 'Misión Defensiva',
    description: 'Plantilla para misiones de defensa de posición',
    category: 'defense',
    content: `
<h1>BRIEFING DE MISIÓN - DEFENSA</h1>

<h2>📍 SITUACIÓN</h2>
<p>Inteligencia indica un posible ataque enemigo contra nuestra posición en [UBICACIÓN]. Debemos preparar defensas y repeler el ataque.</p>

<h2>🎯 MISIÓN</h2>
<p><strong>Objetivo Principal:</strong> Defender [UBICACIÓN] contra ataque enemigo</p>
<p><strong>Objetivos Secundarios:</strong></p>
<ul>
  <li>Mantener todas las posiciones clave</li>
  <li>Infligir máximas bajas al enemigo</li>
  <li>Preservar personal y equipo propio</li>
</ul>

<h2>⚙️ EJECUCIÓN</h2>
<h3>Fase 1: Preparación</h3>
<p>Establecer posiciones defensivas, fortificaciones y campos de fuego.</p>

<h3>Fase 2: Alerta</h3>
<p>Al detectar aproximación enemiga, preparar para contacto y reportar.</p>

<h3>Fase 3: Defensa Activa</h3>
<p>Repeler ataque con fuego coordinado. Contraatacar si es viable.</p>

<h2>🗺️ POSICIONES ASIGNADAS</h2>
<ul>
  <li><strong>Posición Norte:</strong> Escuadra Alfa</li>
  <li><strong>Posición Este:</strong> Escuadra Bravo</li>
  <li><strong>Posición Sur:</strong> Escuadra Charlie</li>
  <li><strong>Reserva:</strong> Escuadra Delta</li>
</ul>

<h2>🔧 LOGÍSTICA</h2>
<ul>
  <li><strong>Munición:</strong> Munición extra disponible en punto de suministro</li>
  <li><strong>Soporte:</strong> Morteros disponibles para fuego de apoyo</li>
  <li><strong>Evacuación:</strong> Ruta de evacuación establecida hacia [UBICACIÓN]</li>
</ul>

<h2>📡 COMUNICACIONES</h2>
<ul>
  <li><strong>Red de Comando:</strong> 41.00 MHz</li>
  <li><strong>Red Táctica:</strong> 42.00 MHz</li>
  <li><strong>Soporte de Fuego:</strong> 43.00 MHz</li>
</ul>
    `
  },
  {
    id: 'recon-1',
    name: 'Misión de Reconocimiento',
    description: 'Plantilla para misiones de reconocimiento y recopilación de inteligencia',
    category: 'recon',
    content: `
<h1>BRIEFING DE MISIÓN - RECONOCIMIENTO</h1>

<h2>📍 SITUACIÓN</h2>
<p>Necesitamos información sobre actividad enemiga en [ÁREA]. Se requiere reconocimiento discreto sin comprometer la posición.</p>

<h2>🎯 MISIÓN</h2>
<p><strong>Objetivo Principal:</strong> Realizar reconocimiento de [OBJETIVO]</p>
<p><strong>Información a recopilar:</strong></p>
<ul>
  <li>Número y tipo de fuerzas enemigas</li>
  <li>Posiciones defensivas y fortificaciones</li>
  <li>Patrones de patrulla y movimiento</li>
  <li>Ubicación de activos de alto valor</li>
</ul>

<h2>⚙️ EJECUCIÓN</h2>
<h3>Fase 1: Infiltración</h3>
<p>Aproximación encubierta al área objetivo evitando detección.</p>

<h3>Fase 2: Observación</h3>
<p>Establecer puesto de observación y recopilar información durante [DURACIÓN].</p>

<h3>Fase 3: Extracción</h3>
<p>Retirarse sin ser detectados y reportar hallazgos.</p>

<h2>🔧 EQUIPAMIENTO</h2>
<ul>
  <li>Armamento silenciado</li>
  <li>Binoculares y equipo de observación</li>
  <li>Cámara para documentación</li>
  <li>GPS y mapas actualizados</li>
</ul>

<h2>⚠️ REGLAS DE ENFRENTAMIENTO</h2>
<p><strong>NO COMPROMETER LA MISIÓN.</strong> Evitar contacto enemigo a menos que sea absolutamente necesario para la supervivencia.</p>

<h2>📡 COMUNICACIONES</h2>
<ul>
  <li><strong>Red de Comando:</strong> 41.00 MHz (solo reportes críticos)</li>
  <li><strong>Emergencias:</strong> 40.00 MHz</li>
</ul>
    `
  },
  {
    id: 'training-1',
    name: 'Entrenamiento Básico',
    description: 'Plantilla para sesiones de entrenamiento',
    category: 'training',
    content: `
<h1>SESIÓN DE ENTRENAMIENTO</h1>

<h2>🎯 OBJETIVOS DE ENTRENAMIENTO</h2>
<ul>
  <li>Objetivo 1: [Describir]</li>
  <li>Objetivo 2: [Describir]</li>
  <li>Objetivo 3: [Describir]</li>
</ul>

<h2>📋 PROGRAMA</h2>
<h3>Parte 1: Teoría (15 minutos)</h3>
<p>Explicación de conceptos y procedimientos.</p>

<h3>Parte 2: Demostración (15 minutos)</h3>
<p>Demostración práctica por parte del instructor.</p>

<h3>Parte 3: Práctica (30 minutos)</h3>
<p>Ejercicios prácticos supervisados.</p>

<h3>Parte 4: Evaluación (15 minutos)</h3>
<p>Ejercicio de evaluación y feedback.</p>

<h2>📝 REQUISITOS</h2>
<ul>
  <li>Conocimientos previos: [Especificar]</li>
  <li>Equipamiento necesario: [Listar]</li>
  <li>Duración estimada: [Tiempo]</li>
</ul>

<h2>🎓 CRITERIOS DE APROBACIÓN</h2>
<p>Para completar satisfactoriamente el entrenamiento, los participantes deben:</p>
<ul>
  <li>Demostrar comprensión de los conceptos</li>
  <li>Ejecutar procedimientos correctamente</li>
  <li>Trabajar efectivamente en equipo</li>
</ul>
    `
  },
  {
    id: 'blank',
    name: 'Plantilla en Blanco',
    description: 'Comienza desde cero',
    category: 'custom',
    content: `
<h1>Título del Briefing</h1>
<p>Comienza a escribir tu briefing aquí...</p>
    `
  }
];

export const getBriefingTemplatesByCategory = (category: BriefingTemplate['category']) => {
  return briefingTemplates.filter(t => t.category === category);
};

export const getBriefingTemplateById = (id: string) => {
  return briefingTemplates.find(t => t.id === id);
};