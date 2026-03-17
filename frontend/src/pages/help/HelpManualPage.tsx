import { BookOpen, Calendar, Compass, HelpCircle, Layers3, Radio, Shield, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';

const sections = [
  {
    id: 'roles',
    icon: Users,
    title: 'Roles en la plataforma',
    intro:
      'Cada persona en la plataforma tiene un rol asignado. Ese rol no solo define a qué secciones puedes acceder, sino qué se espera de ti. No es lo mismo consultar un evento que montarlo desde cero.',
    entries: [
      {
        title: 'Operador',
        paragraphs: [
          'Es el rol base. Si acabas de registrarte y te han validado, esto es lo que tienes.',
          'Puedes ver el dashboard con tu actividad, consultar el listado de operaciones, explorar los clanes registrados y gestionar tu propio perfil. Cuando una misión tenga plazas abiertas, puedes inscribirte libremente y salir cuando quieras. Antes de cada evento tienes acceso al briefing completo, a la composición de las escuadras y a las frecuencias asignadas para comunicaciones.',
          'Si encuentras algo que no funciona o se te ocurre una forma de mejorar la plataforma, el menú de Ayuda es tu canal directo con administración. Úsalo sin miedo: es exactamente para eso.',
        ],
      },
      {
        title: 'Administrador de clan',
        paragraphs: [
          'Eres quien mantiene tu clan operativo dentro de la plataforma. Tu responsabilidad va más allá de participar en misiones: validas miembros, preparas eventos y cuidas la imagen del grupo.',
          'Puedes aceptar o rechazar a los usuarios que soliciten entrar en tu clan, y gestionar cualquier solicitud relacionada con la pertenencia al grupo. Tienes control total sobre los eventos de tu ámbito: crearlos desde cero, editarlos, desactivarlos temporalmente o recuperarlos si fueron archivados. Dentro de cada evento puedes organizar las escuadras, reservar plazas para tu clan, subir archivos de apoyo y configurar las comunicaciones. También gestionas la ficha de tu clan — nombre, tag, logo y toda la identidad visual que el resto de la plataforma ve cuando mira a tu organización.',
        ],
      },
      {
        title: 'Oficial de operaciones',
        paragraphs: [
          'Tu trabajo es la parte táctica. No gestionas personas, gestionas misiones: montar la estructura de un evento, definir las escuadras, asignar frecuencias y asegurar que todo esté preparado antes de que nadie se conecte.',
          'Puedes crear y editar operaciones completas con todo lo que eso implica: briefing, slots, comunicaciones y archivos asociados. Gestionas el estado de cada evento y organizas su estructura interna — escuadras, frecuencias, enlaces entre unidades y reservas por clan. Lo que no entra en tu perfil es la gestión de usuarios. Tu foco está en que la operación esté montada correctamente, no en quién tiene o no tiene acceso a la plataforma.',
        ],
      },
      {
        title: 'Oficial de personal',
        paragraphs: [
          'Te encargas de que la plantilla humana esté limpia. Altas, validaciones, identidades de juego y control básico de miembros — ese es tu terreno.',
          'Accedes al área de personal y puedes validar el estado de los usuarios dentro de tu ámbito de responsabilidad. Si hace falta completar plazas con personal que no está registrado en la plataforma, puedes crear perfiles externos directamente. Cuando el flujo lo requiera, también puedes revisar y confirmar las identidades de juego asociadas a cada miembro. Tu rol no está pensado para diseñar operaciones ni tocar la estructura de los eventos. Tu foco es que la gente esté dada de alta, validada y correctamente ubicada.',
        ],
      },
    ],
  },
  {
    id: 'dashboard',
    icon: Compass,
    title: 'Dashboard',
    lead: 'Tu punto de entrada cada vez que abres la plataforma.',
    paragraphs: [
      'Nada más entrar ves lo esencial de un vistazo: cuántos eventos hay activos, en cuáles estás inscrito, la ocupación media de plazas y cuántos clanes están registrados en la plataforma. Son cuatro cifras que te sitúan al instante.',
      'Justo debajo aparecen acciones rápidas, y aquí es donde el dashboard se adapta a ti. Si eres operador, verás accesos básicos como explorar eventos. Si tu rol incluye gestión, aparecerán atajos directos a validaciones pendientes, solicitudes de clan, creación de misiones y acceso a personal. No tienes que buscar nada: lo que necesita tu atención ya está ahí.',
      'El dashboard no pretende sustituir al resto de módulos. Piensa en él como la primera parada del día: un vistazo rápido para decidir a dónde ir después.',
    ],
  },
  {
    id: 'operations',
    icon: Calendar,
    title: 'Operaciones',
    lead: 'El centro de trabajo donde se preparan, publican y gestionan las misiones.',
    paragraphs: [
      'Operaciones reúne todo lo relacionado con eventos: el listado completo, el acceso al detalle de cada uno, la creación de nuevos y el seguimiento de los existentes. Es la sección donde más tiempo vas a pasar si tu rol implica preparar o participar en misiones.',
      'Dentro de cada evento puedes moverte entre pestañas. Briefing muestra el contexto de la misión: descripción, fecha, hora, juego y toda la información operativa que se haya definido. Escuadras presenta la composición táctica — quién va dónde, qué puestos están cubiertos y cuáles siguen libres. Comunicaciones muestra las frecuencias asignadas y, si se han definido, la cadena de mando entre escuadras representada como un diagrama visual. Cuando un evento ha finalizado y tu rol lo permite, aparece una pestaña adicional de Asistencia para registrar quién participó realmente.',
      'Desde el detalle de cualquier evento también se accede a las reservas por clan, las exportaciones (slotlist y whitelist) y la publicación compartida. Si la operación lo permite, puedes generar un enlace público para compartir fuera de la plataforma con personas que no tienen cuenta.',
    ],
  },
  {
    id: 'events',
    icon: BookOpen,
    title: 'Crear y editar eventos',
    lead: 'Qué hay que rellenar, qué significa cada parte y dónde conviene poner atención.',
    paragraphs: [
      'Lo primero que defines al crear un evento es su estructura general: a qué juego pertenece, la fecha y hora de la misión, la zona horaria de referencia, si es público o privado, y el texto del briefing.',
      'La visibilidad merece una nota aparte. Un evento público es visible para todos los usuarios de la plataforma. Un evento privado solo es visible para los clanes que invites expresamente. La invitación privada es la herramienta clave para operaciones multiclan: permite coordinar entre varias unidades sin que el evento quede abierto a todo el mundo.',
      'La zona horaria es importante y funciona de forma automática. Tú defines la hora de la misión en la zona horaria que elijas, y la plataforma se encarga de convertirla para que cada usuario la vea según la configuración de su propio perfil. Si un evento se programa a las 20:00 CET, alguien con el perfil en horario GMT lo verá a las 19:00. No tienes que hacer cálculos — pero sí asegurarte de que la zona horaria del evento es la correcta desde el principio.',
      'Los campos de servidor, PDF de briefing y modset están pensados para cerrar la parte operativa: toda la información que los participantes necesitan antes de conectarse, empaquetada en un solo sitio.',
    ],
  },
  {
    id: 'squads',
    icon: Layers3,
    title: 'Escuadras y roles',
    lead: 'La estructura táctica de cada misión se define aquí.',
    paragraphs: [
      'Las escuadras son la unidad organizativa básica de un evento. Cada escuadra contiene una serie de slots — puestos tácticos como líder de escuadra, tirador, conductor, sanitario o cualquier otro que necesites definir.',
      'Puedes crear escuadras vacías y montar cada puesto a mano, o puedes partir de una plantilla que carga los roles estándar de golpe. La plantilla te ahorra tiempo en la configuración inicial; después puedes ajustar, añadir o quitar lo que necesites.',
      'El orden de los slots dentro de cada escuadra no es decorativo. Define cómo se presenta la composición al resto de usuarios y cómo se lee la estructura de la unidad. Si el líder de escuadra aparece primero, es porque tú lo has colocado ahí.',
      'Si necesitas repetir una composición parecida — por ejemplo, tres escuadras de fusileros con la misma estructura — puedes duplicar una escuadra existente. La plataforma le asigna automáticamente un nombre y una identidad nuevos para que no haya confusión entre la original y la copia. A partir de ahí, cada una es independiente.',
      'Un detalle que conviene tener claro: editar un slot significa cambiar el puesto táctico, no la persona asignada. Si quieres cambiar "Tirador" por "Operador AT", eso se hace editando el slot. La asignación de usuarios concretos a cada plaza se gestiona después, desde la vista del evento, ya sea por alguien con permisos de gestión o por los propios participantes inscribiéndose.',
    ],
  },
  {
    id: 'communications',
    icon: Radio,
    title: 'Frecuencias, enlaces y mando',
    lead: 'Cómo se modelan las comunicaciones entre unidades.',
    paragraphs: [
      'Esta es probablemente la parte del editor que más contexto necesita, porque modela algo que en la realidad también es complejo: la cadena de mando y las comunicaciones entre escuadras.',
      'Cada escuadra tiene una frecuencia interna. Es su canal de trabajo principal — el que usan los miembros de esa escuadra para coordinarse entre ellos durante la misión.',
      'Si marcas una escuadra como nodo de mando, la conviertes en el elemento de coordinación general del evento. Normalmente se usa para el puesto de mando, el estado mayor o cualquier elemento cuya función principal sea coordinar al resto de unidades. Solo puede haber un nodo de mando por evento.',
      'Cuando una escuadra necesita reportar a otra, defines un enlace externo. Seleccionas la escuadra superior — a la que reporta — y, opcionalmente, la frecuencia de enlace que usarán para esa comunicación. En la práctica, esto significa que una escuadra puede operar con dos frecuencias: la interna para su trabajo local y la de enlace para hablar con el escalón superior. Así es como se modela una cadena de mando real.',
      'La pestaña de Comunicaciones del evento genera automáticamente un diagrama visual con toda esta estructura: quién reporta a quién, qué frecuencias usa cada escuadra y cómo fluye la información. Ese diagrama se puede copiar como código Mermaid o descargar como SVG.',
      'El editor incluye su propia ayuda contextual con ejemplos de cadenas de mando. Esta guía complementa esa ayuda — no la sustituye. Cuando estés montando las comunicaciones de un evento, consulta ambas.',
    ],
  },
  {
    id: 'reservations',
    icon: Shield,
    title: 'Reservas por clan',
    lead: 'Cómo apartar escuadras para que cada unidad sepa exactamente cuál es su sitio.',
    paragraphs: [
      'Reservar una escuadra significa apartarla para un clan concreto dentro de una operación. Es como poner el nombre de una unidad en una silla antes de que empiece la reunión.',
      'Esto es especialmente útil — casi imprescindible — en operaciones multiclan, donde varias organizaciones comparten un mismo evento y cada una necesita saber qué segmento le corresponde. Sin reservas, la asignación de plazas sería un caos de coordinación manual.',
      'Pero hay un matiz importante: una reserva no rellena automáticamente las plazas. Solo define quién tiene prioridad o control sobre esa escuadra. Los slots siguen vacíos hasta que alguien los ocupe. La reserva dice "esta escuadra es para vosotros"; después, las plazas se gestionan con normalidad — los usuarios con permisos de slots pueden asignar gente directamente, o los propios participantes se inscriben si el flujo del evento lo permite.',
      'Las reservas solo están disponibles en eventos privados y se configuran durante la creación o edición del evento.',
    ],
  },
  {
    id: 'clans',
    icon: Users,
    title: 'Clanes',
    lead: 'El directorio de organizaciones y la puerta a su gestión.',
    paragraphs: [
      'El módulo de Clanes es el catálogo de todas las organizaciones registradas en la plataforma. Puedes buscar por nombre o por tag y acceder a la ficha de cualquier grupo para ver su tamaño, su logo y su contexto general.',
      'Para la mayoría de usuarios, Clanes funciona como consulta pura: ver quién está, cuántos miembros tiene cada organización y cómo se presentan dentro de la plataforma.',
      'Si tu rol incluye gestión de clan, este mismo módulo se convierte también en tu herramienta de trabajo: editar la ficha del grupo, actualizar el logo, revisar la lista de miembros y mantener la información al día.',
      'Los administradores de plataforma tienen acceso adicional para crear clanes nuevos desde cero, revisar los que han sido eliminados y restaurarlos si es necesario.',
    ],
  },
  {
    id: 'navigation',
    icon: HelpCircle,
    title: 'Navegación general',
    lead: 'Cómo está organizada la interfaz para que pierdas el menor tiempo posible.',
    paragraphs: [
      'La plataforma está estructurada por contexto de trabajo. Dashboard para orientarte, Operaciones para trabajar en misiones, Clanes para consultar o gestionar organizaciones y Personal para la administración de miembros. Cada sección tiene un propósito claro, y la idea es que sepas a cuál ir según lo que necesites hacer.',
      'La interfaz intenta mostrarte solo lo que puedes usar. Si un botón o una acción aparecen destacados, normalmente es porque tu rol tiene permiso para actuar ahí. Si no ves un acceso que esperabas encontrar, probablemente sea porque tu perfil no lo incluye — no porque esté escondido.',
      'En móvil, la navegación principal se concentra en el menú lateral. En escritorio, el acceso a Ayuda y a tu perfil está siempre en la esquina superior derecha, disponible desde cualquier página.',
      'Tu perfil es donde configuras tu zona horaria, tu nickname, tu email y tus identidades de juego. La zona horaria que elijas aquí es la que la plataforma usará para mostrarte las fechas y horas de todos los eventos.',
    ],
  },
  {
    id: 'help',
    icon: HelpCircle,
    title: '¿Algo no va bien? ¿Se te ocurre algo mejor?',
    lead: 'Ayuda es el punto único para consultar esta guía y comunicarte con administración.',
    paragraphs: [
      'El menú de Ayuda es tu punto único para tres cosas: consultar esta guía, informar de un problema y proponer una mejora.',
      'Usa Informar de un problema cuando algo no funciona, da un error o el comportamiento que ves no coincide con lo que esperabas. No necesitas ser técnico ni dar detalles de código — simplemente describe lo que pasó. La plataforma adjunta automáticamente la ruta de la página desde la que escribes, así que administración ya tiene el contexto técnico básico.',
      'Usa Proponer una mejora cuando todo funcione pero creas que podría ser más claro, más rápido o más cómodo. Las ideas de quienes usan la plataforma a diario son las que más valor tienen para mejorarla.',
    ],
  },
] as const;

function SectionCard({
  icon: Icon,
  title,
  lead,
  paragraphs,
}: {
  icon: typeof Compass;
  title: string;
  lead: string;
  paragraphs: readonly string[];
}) {
  return (
    <Card className="rounded-2xl border-military-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-military-100 text-military-800 dark:bg-gray-700 dark:text-gray-100">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-military-950 dark:text-gray-100">
            {title}
          </h2>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-military-500 dark:text-gray-400">
            {lead}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5 text-sm leading-7 text-military-700 dark:text-gray-300">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </Card>
  );
}

export default function HelpManualPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="page-header">
        <div className="max-w-4xl">
          <h1 className="page-title">Guía de uso</h1>
          <p className="page-subtitle text-base leading-7">
            <strong>
              Todo lo que necesitas para moverte con soltura por la plataforma, entender qué puedes hacer según tu rol y sacarle partido a cada módulo sin perderte por el camino.
            </strong>
          </p>
        </div>
      </header>

      <Card className="rounded-3xl border-military-200 bg-gradient-to-br from-white via-military-50/80 to-military-100/70 p-7 dark:border-gray-700 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-military-600 dark:text-gray-400">
            Antes de empezar
          </p>
          <div className="mt-4 space-y-4 text-sm leading-7 text-military-700 dark:text-gray-300">
            <p>
              Esta guía no va a repetirte lo que ya dice cada campo de cada formulario. La mayoría de cosas en la plataforma se explican solas: si ves un botón que dice &quot;Crear evento&quot;, sabes lo que hace. Lo que sí necesita contexto es otra cosa: entender qué puedes hacer tú y qué no, cómo encajan las escuadras dentro de un evento, qué significa reservar una plaza para un clan, cómo se modelan las cadenas de comunicación y por dónde conviene empezar cuando abres la plataforma por primera vez.
            </p>
            <p>Para eso está este documento.</p>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="section-title">Roles en la plataforma</h2>
          <p className="section-caption">
            Qué puede hacer cada perfil y qué se espera de él dentro del flujo de trabajo.
          </p>
        </div>

        <Card className="rounded-2xl border-military-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-5 text-sm leading-7 text-military-700 dark:text-gray-300">
            <p>
              Cada persona en la plataforma tiene un rol asignado. Ese rol no solo define a qué secciones puedes acceder, sino qué se espera de ti. No es lo mismo consultar un evento que montarlo desde cero.
            </p>

            {sections[0].entries?.map((entry) => (
              <div key={entry.title} className="rounded-2xl border border-military-200/80 bg-military-50/50 p-5 dark:border-gray-700 dark:bg-gray-900/40">
                <h3 className="text-xl font-semibold text-military-950 dark:text-gray-100">
                  {entry.title}
                </h3>
                <div className="mt-3 space-y-4">
                  {entry.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {sections.slice(1).map((section) => (
          <SectionCard
            key={section.id}
            icon={section.icon}
            title={section.title}
            lead={section.lead || ''}
            paragraphs={section.paragraphs || []}
          />
        ))}
      </div>
    </div>
  );
}
