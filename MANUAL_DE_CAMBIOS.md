# Manual de Cambios - Arma Multiclan Platform

> Documento que recoge, versión a versión, todos los cambios realizados desde que se comenzó a trabajar en el proyecto a partir de la v2.2.0. Para cada modificación se explica **qué** se hizo, **por qué** se hizo y **dónde** se hizo, con el detalle suficiente para no dejar ninguna duda.

---

## Tabla de contenidos

1. [v2.2.0 - Gestión de estados, avatares, paginación y seguridad](#v220---gestión-de-estados-avatares-paginación-y-seguridad)
2. [v2.3.0 - Calendario visual de eventos](#v230---calendario-visual-de-eventos)
3. [v2.4.0 - Dockerización del proyecto](#v240---dockerización-del-proyecto)
4. [v2.5.0 - Correcciones de despliegue real en Docker](#v250---correcciones-de-despliegue-real-en-docker)
5. [Mapa de archivos afectados](#mapa-de-archivos-afectados)

---

## v2.2.0 - Gestión de estados, avatares, paginación y seguridad

### 2.2.1 Toggle de estado de eventos (ACTIVO <-> INACTIVO)

**Problema**: No existía forma de pausar temporalmente un evento sin eliminarlo. Un evento solo podía estar ACTIVO o FINALIZADO (de forma automática al pasar la fecha).

**Solución**: Se creó un botón de toggle en la página de detalle del evento que permite a un administrador o líder del clan creador cambiar el estado entre ACTIVO e INACTIVO. La lógica es la siguiente:

- **ACTIVO**: el evento está abierto; los usuarios pueden apuntarse, los administradores pueden asignar, y todo funciona con normalidad.
- **INACTIVO**: el evento queda "pausado". Nadie puede apuntarse ni ser asignado, pero sigue siendo editable y se puede reactivar en cualquier momento.
- **FINALIZADO**: estado al que se llega automáticamente cuando pasa la fecha del evento; no se puede modificar nada.

El botón de toggle solo aparece si el usuario tiene permisos (administrador o líder del clan creador) y el evento no está finalizado.

**Archivos implicados**:

| Archivo | Cambio |
|---------|--------|
| `backend/src/controllers/event.controller.ts` | Nuevo endpoint `PUT /events/:id/status` |
| `backend/src/services/event.service.ts` | Lógica de transición de estado con validación |
| `frontend/src/pages/events/EventDetailPage.tsx` | Botón toggle con icono `<Power />` de Lucide React |
| `frontend/src/services/eventService.ts` | Nuevo método `changeStatus(id, status)` |
| `frontend/src/hooks/useEvents.ts` | Nuevo hook `useChangeEventStatus` (React Query mutation) |

**Cómo funciona el toggle en el frontend**: Cuando se pulsa el botón, se llama a `changeEventStatus.mutateAsync(newStatus)`. Si el estado actual es `ACTIVE`, el nuevo será `INACTIVE`, y viceversa. Tras la respuesta exitosa, React Query invalida la caché del evento y la UI se actualiza inmediatamente.

---

### 2.2.2 Gestión de avatar de clan (eliminar)

**Problema**: Una vez subido un logo de clan, no había forma de eliminarlo desde la interfaz. El único camino era acceder directamente a la base de datos.

**Solución**: Se añadió un botón "Quitar" en la página de edición de clan que:

1. Llama a un nuevo endpoint `DELETE /clans/:id/avatar` en el backend.
2. El backend elimina el archivo físico del servidor (`/public/uploads/clans/...`).
3. Pone el campo `avatarUrl` a `null` en la base de datos.
4. El frontend invalida la caché y el avatar desaparece de la interfaz.

**Archivos implicados**:

| Archivo | Cambio |
|---------|--------|
| `backend/src/controllers/clan.controller.ts` | Nuevo método `deleteAvatar` |
| `backend/src/services/clan.service.ts` | Soporte para `avatarUrl: null` en update |
| `backend/src/routes/clan.routes.ts` | Nueva ruta `DELETE /:id/avatar` |
| `frontend/src/services/clanService.ts` | Nuevo método `deleteClanAvatar(id)` |
| `frontend/src/hooks/useClans.ts` | Nuevo hook `useDeleteClanAvatar` |
| `frontend/src/pages/clanes/EditClanPage.tsx` | Botón "Quitar", validación de 2 MB |

---

### 2.2.3 Corrección de subida de avatar (error 400 Bad Request)

**Problema**: Al intentar subir un avatar de clan, el servidor respondía con error 400. El origen del problema era que Axios establece un `Content-Type: application/json` de forma global, y cuando se envía un `FormData`, el navegador necesita poner su propio `Content-Type` con el `boundary` correcto. Al colisionar ambos, el backend no podía parsear la petición.

**Solución**: Se añadió un interceptor de request en el cliente Axios (`frontend/src/services/api.ts`) que detecta si los datos son una instancia de `FormData`. Si lo son, elimina la cabecera `Content-Type` para que Axios/el navegador la establezcan automáticamente con el `boundary` correcto.

```typescript
// Fragmento simplificado del interceptor
if (config.data instanceof FormData) {
  config.headers.delete('Content-Type');
}
```

**Por qué importa**: Sin este interceptor, cualquier subida de archivos (avatares de clan, briefings PDF, modsets HTML) fallaba con error 400. Es un problema habitual cuando se usa Axios con `FormData` y se tiene una cabecera `Content-Type` por defecto.

---

### 2.2.4 Paginación en lista de eventos

**Problema**: A medida que se creaban eventos, la lista crecía indefinidamente y la carga era lenta. No había paginación.

**Solución**: Se implementó paginación en la página de eventos con 12 elementos por página. Se añadió un componente de paginación visual con navegación por páginas (primera, anterior, siguiente, última) y se muestra el total de eventos disponibles. El backend ya soportaba paginación mediante los parámetros `page` y `limit`; el cambio fue principalmente de frontend.

**Archivo principal**: `frontend/src/pages/events/EventsPage.tsx`

---

### 2.2.5 Filtros de eventos mejorados

**Problema**: El filtro de estado de eventos tenía como valor por defecto "Todos", lo que mostraba eventos finalizados e inactivos mezclados con los activos. Además, existía un checkbox "Solo próximos eventos" que era redundante con el nuevo filtro de estado.

**Solución**:

- El filtro de estado ahora tiene como valor por defecto **"Activos"**, que es lo que el usuario quiere ver la mayor parte del tiempo.
- Se añadió la opción **"Inactivos"** al selector de estado (antes solo existían "Todos", "Activos" y "Finalizados").
- Se eliminó el checkbox "Solo próximos eventos" para simplificar la interfaz.

**Archivos implicados**:

| Archivo | Cambio |
|---------|--------|
| `frontend/src/pages/events/EventsPage.tsx` | Filtro de estado por defecto `ACTIVE` |
| `frontend/src/components/events/EventFilters.tsx` | Añadida opción INACTIVE, eliminado checkbox |
| `frontend/src/components/events/EventCard.tsx` | Colores de badge consistentes para todos los estados |

---

### 2.2.6 Corrección del dashboard (contadores erróneos)

**Problema**: En la página de dashboard, los contadores "Próximos Eventos" y "Usuarios" mostraban `0` aunque hubiera datos. El problema era que el código del frontend leía la propiedad `count` de la respuesta API cuando la propiedad correcta se llamaba `total`.

**Solución**: Se cambió `data.count` por `data.total` en los componentes del dashboard.

**Archivo**: `frontend/src/pages/dashboard/DashboardPage.tsx`

---

### 2.2.7 Eliminación de función duplicada `changeEventStatus`

**Problema**: Tanto en `event.controller.ts` como en `event.service.ts` existían dos implementaciones distintas de la función `changeEventStatus`. La primera delegaba la comprobación de permisos al servicio; la segunda hacía la comprobación directamente en el controlador. Al existir ambas, solo se ejecutaba la primera (la que estaba más arriba en el archivo), y la segunda nunca se llamaba.

**Solución**: Se eliminó la primera implementación en ambos archivos (controller y service) y se conservó la segunda, que es la que hace la comprobación de permisos en el controlador antes de llamar al servicio. También se eliminó el import de `UserRole` en el servicio, que ya no se usaba.

**Archivos implicados**:

| Archivo | Cambio |
|---------|--------|
| `backend/src/controllers/event.controller.ts` | Eliminada primera implementación (lineas ~172-199) |
| `backend/src/services/event.service.ts` | Eliminada primera implementación (lineas ~799-865), limpieza de import |

---

### 2.2.8 Protección de eventos finalizados e inactivos (seguridad)

**Problema**: Aunque los usuarios normales no podían apuntarse a eventos finalizados, los administradores y líderes de clan **sí** podían seguir asignando y desasignando usuarios mediante los botones de administración. Esto era un agujero de seguridad y un error lógico: si un evento ha terminado, nadie debería poder modificar las asignaciones.

**Solución**: Se aplicaron validaciones tanto en backend como en frontend.

**Backend** (`backend/src/services/slot.service.ts`):

- `adminAssignSlot`: se añadieron comprobaciones al inicio del método que lanzan error si el evento está `FINISHED` ("No se puede asignar usuarios a un evento finalizado") o `INACTIVE` ("No se puede asignar usuarios a un evento inactivo").
- `adminUnassignSlot`: se añadió comprobación que lanza error si el evento está `FINISHED` ("No se puede modificar un evento finalizado"). Se permite desasignar en INACTIVE porque el evento puede reactivarse y podría ser necesario reordenar.

**Frontend** (`frontend/src/components/events/SlotItem.tsx`):

- `canAdminAssign` ahora exige que `eventStatus === 'ACTIVE'` para mostrar el botón de asignación.
- `canAdminUnassign` exige que el evento no esté `FINISHED` (permite INACTIVE).
- De esta forma, los botones de administración desaparecen de la interfaz cuando no procede usarlos, y aunque alguien intentara llamar al endpoint directamente, el backend rechazaría la operación.

---

## v2.3.0 - Calendario visual de eventos

### 2.3.1 Contexto y decisión de diseño

**Problema**: La lista de eventos era funcional pero limitada: para ver qué eventos hay en un mes concreto, había que paginar o filtrar manualmente. Faltaba una vista de calendario que permitiera de un vistazo ver la distribución temporal de los eventos.

**Decisión**: Se optó por un **calendario custom** en lugar de usar una librería externa (como FullCalendar o react-big-calendar) por tres razones:

1. **Menor tamaño de bundle**: no se añade ninguna dependencia nueva.
2. **date-fns ya estaba instalada**: todas las operaciones de fecha (inicio/fin de mes, iterar días, comparar fechas) se resuelven con funciones de date-fns.
3. **Control total del tema**: el calendario se integra perfectamente con el sistema de modo claro/oscuro militar existente sin necesidad de sobreescribir estilos de terceros.

Se implementó como un **toggle** en la misma página de eventos, no como una página separada, para compartir los filtros de búsqueda y mantener una UX fluida.

---

### 2.3.2 Componentes creados

Se crearon 7 archivos nuevos en el frontend, organizados así:

```
frontend/src/components/events/
├── ViewToggle.tsx                      # Botones Lista / Calendario
└── EventCalendar/
    ├── index.ts                        # Barrel export
    ├── EventCalendar.tsx               # Contenedor principal
    ├── CalendarHeader.tsx              # Navegación de meses
    ├── CalendarGrid.tsx                # Grid de 7 columnas (Lun-Dom)
    ├── CalendarDay.tsx                 # Celda de un día
    └── CalendarEventItem.tsx           # Evento dentro de una celda
```

**ViewToggle.tsx**: Dos botones con iconos de Lucide (`List` y `CalendarDays`). El botón activo se destaca en verde (`bg-primary-600`); el inactivo queda en gris neutro. En pantallas pequeñas solo muestra el icono; en pantallas `sm:` y superiores muestra icono + texto.

**EventCalendar.tsx**: Componente contenedor que gestiona el estado del mes actual (`currentDate`). Expone tres acciones de navegación: mes anterior (`subMonths`), mes siguiente (`addMonths`) y volver a hoy. Si los datos están cargando, muestra el spinner. Renderiza `CalendarHeader` + `CalendarGrid`.

**CalendarHeader.tsx**: Muestra el nombre del mes y año en español (usando `format(date, "MMMM 'de' yyyy", { locale: es })`). Tiene tres botones: `ChevronLeft` (mes anterior), "Hoy" (volver al mes actual), y `ChevronRight` (mes siguiente).

**CalendarGrid.tsx**: Genera una cuadrícula de 7 columnas. Para calcular las celdas visibles:

1. Obtiene el primer día del mes con `startOfMonth`.
2. Obtiene el último día del mes con `endOfMonth`.
3. Retrocede al lunes de la semana del primer día con `startOfWeek(..., { weekStartsOn: 1 })`.
4. Avanza hasta el domingo de la semana del último día con `endOfWeek(..., { weekStartsOn: 1 })`.
5. Genera todas las fechas del intervalo con `eachDayOfInterval`.

Agrupa los eventos por fecha (comparando con `isSameDay`) y pasa los eventos correspondientes a cada celda `CalendarDay`.

**CalendarDay.tsx**: Representa una celda del calendario. Tiene tres estados visuales:

- **Día de otro mes**: texto atenuado (`text-military-300 dark:text-gray-600`).
- **Día del mes actual**: texto normal.
- **Hoy**: fondo destacado (`bg-primary-50 dark:bg-primary-900/20`) con borde verde.

Muestra hasta 3 eventos y, si hay más, un texto "+X más" que indica cuántos faltan. La celda tiene altura mínima `h-24` en desktop y `h-16` en móvil.

**CalendarEventItem.tsx**: Cada evento se muestra como una pastilla con colores según su estado:

- **ACTIVE**: verde (`bg-green-100 text-green-800`).
- **INACTIVE**: ámbar (`bg-amber-100 text-amber-800`).
- **FINISHED**: gris (`bg-gray-100 text-gray-600`).

Muestra la hora (formato `HH:mm`) y el nombre del evento truncado. Al hacer clic, navega a `/events/:id` usando `useNavigate` de React Router.

---

### 2.3.3 Modificación de EventsPage.tsx

La página de eventos existente se modificó para integrar el calendario:

1. **Nuevo estado**: `const [view, setView] = useState<'list' | 'calendar'>('list')`.
2. **ViewToggle en el header**: se colocó junto al botón "Crear Evento".
3. **Renderizado condicional**: si `view === 'calendar'`, se muestra `<EventCalendar>`; si `view === 'list'`, se muestra el grid de tarjetas con paginación.
4. **Límite de datos**: en vista calendario se cargan hasta 100 eventos (`CALENDAR_ITEMS_LIMIT`) para poder mostrar un mes completo; en vista lista se mantienen 12 por página.
5. **Filtros compartidos**: los filtros de búsqueda, estado y juego aplican por igual a ambas vistas, sin duplicar lógica.

---

## v2.4.0 - Dockerización del proyecto

### 2.4.1 Contexto

**Problema**: Para desplegar el proyecto en un servidor se requería instalar manualmente Node.js, PostgreSQL, configurar nginx, etc. Esto es propenso a errores y difícil de replicar.

**Solución**: Se dockerizó toda la plataforma con Docker Compose, creando un stack de 3 servicios (PostgreSQL, Backend, Frontend) que se levanta con un solo comando.

---

### 2.4.2 Backend Dockerfile

Se creó `backend/Dockerfile` con un **build multi-stage** para optimizar el tamaño de la imagen:

**Etapa 1 - Builder**:
- Parte de `node:20-alpine`.
- Copia `package.json` y `package-lock.json`, ejecuta `npm ci` (instalación limpia y reproducible).
- Copia el schema de Prisma y ejecuta `npx prisma generate` para generar el cliente.
- Copia el código fuente y ejecuta `npm run build` (compilación TypeScript a JavaScript).

**Etapa 2 - Producción**:
- Parte de `node:20-alpine`.
- Instala `openssl` (requerido por Prisma en Alpine).
- Crea un usuario no-root `nodejs` con UID 1001 (seguridad: no ejecutar como root).
- Copia desde el builder: `node_modules`, `dist/`, `prisma/`, `package.json`.
- Crea directorios de uploads (`clans/` y `events/`) con permisos correctos.
- Define healthcheck con `wget` a `http://localhost:3000/health`.
- Comando de inicio: `npx prisma migrate deploy && node dist/index.js` (aplica migraciones pendientes antes de arrancar).

**Por qué multi-stage**: la imagen final no incluye el código fuente TypeScript, las devDependencies ni las herramientas de compilación, reduciendo el tamaño final significativamente.

---

### 2.4.3 Frontend Dockerfile

Se creó `frontend/Dockerfile` también con build multi-stage:

**Etapa 1 - Builder**:
- Parte de `node:20-alpine`.
- Recibe `VITE_API_URL` como argumento de build (`ARG`). Esto es importante porque Vite "quema" las variables de entorno en el código durante la compilación; no se pueden cambiar en tiempo de ejecución.
- Instala dependencias y ejecuta `npm run build`, produciendo archivos estáticos en `dist/`.

**Etapa 2 - Producción**:
- Parte de `nginx:alpine`.
- Copia la configuración personalizada de nginx.
- Copia los archivos estáticos del builder a la carpeta de nginx.
- Expone el puerto 80.

**Por qué nginx**: React es una SPA (Single Page Application). Necesita un servidor web que sirva `index.html` para cualquier ruta que no sea un archivo estático. Nginx cumple este papel perfectamente y, además, actúa como reverse proxy hacia el backend.

---

### 2.4.4 docker-compose.yml

Se creó `docker-compose.yml` con la definición de los 3 servicios:

**PostgreSQL** (`postgres:16-alpine`):
- Healthcheck con `pg_isready` para que el backend no arranque hasta que la base de datos esté lista.
- Volumen persistente `postgres_data` para que los datos sobrevivan a reinicios del contenedor.

**Backend** (`arma-backend`):
- Depende de PostgreSQL con `condition: service_healthy` (no arranca hasta que el healthcheck de Postgres pase).
- Recibe todas las variables de entorno desde `.env` (base de datos, JWT, Discord, cookies).
- Volumen persistente `uploads_data` para los archivos subidos.
- Healthcheck propio que verifica que el endpoint `/health` responde.

**Frontend** (`arma-frontend`):
- Depende del backend con `condition: service_healthy`.
- Recibe `VITE_API_URL` como argumento de build (no como variable de entorno en tiempo de ejecución).
- Expone el puerto configurado (por defecto 80).

**Red**: Los tres servicios comparten la red `arma-network` (bridge), lo que les permite comunicarse por nombre de servicio (e.g., `http://backend:3000`).

---

### 2.4.5 Archivos complementarios

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.prod.yml` | Override para producción (recursos, logs, restart policies) |
| `.env.example` | Plantilla con todas las variables de entorno documentadas |
| `DEPLOYMENT.md` | Guía paso a paso de despliegue, backups, HTTPS, monitoreo |
| `backend/.dockerignore` | Excluye `node_modules`, `.env`, logs del contexto de build |
| `frontend/.dockerignore` | Excluye `node_modules`, `.env`, `dist` del contexto de build |
| `frontend/nginx.conf` | Configuración de nginx (SPA + gzip + cache + seguridad) |

---

## v2.5.0 - Correcciones de despliegue real en Docker

### 2.5.0 Contexto

Tras el primer despliegue real en un servidor, se identificaron **12 problemas** que impedían el funcionamiento correcto. A continuación se detalla cada uno con su diagnóstico y solución.

---

### 2.5.1 `npm ci` fallaba en el frontend

**Síntoma**: El build de Docker del frontend fallaba durante `npm ci` con errores de dependencias que no coincidían.

**Causa**: `npm ci` es estricto: exige que `package-lock.json` esté perfectamente sincronizado con `package.json`. Si se añaden o actualizan dependencias editando `package.json` manualmente sin ejecutar `npm install`, el lockfile queda desincronizado.

**Solución**: Se regeneró `frontend/package-lock.json` ejecutando `npm install --package-lock-only`, que actualiza el lockfile sin instalar realmente los paquetes.

**Archivo**: `frontend/package-lock.json`

---

### 2.5.2 Prisma no encontraba binarios para Alpine Linux

**Síntoma**: El backend arrancaba pero fallaba al intentar cualquier operación de base de datos con un error sobre binarios de Prisma no encontrados.

**Causa**: Prisma necesita binarios nativos compilados para el sistema operativo y la versión de OpenSSL del entorno de ejecución. Alpine Linux usa `musl` en lugar de `glibc`, y la versión de OpenSSL en Alpine 3.x es la 3.0.x. Por defecto, Prisma solo genera binarios para el sistema operativo de desarrollo (por ejemplo, Windows).

**Solución**: Se añadió `binaryTargets` al bloque `generator` de `schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

- `"native"` genera los binarios para la máquina de desarrollo (Windows, macOS, etc.).
- `"linux-musl-openssl-3.0.x"` genera los binarios específicos para Alpine Linux dentro de Docker.

**Archivo**: `backend/prisma/schema.prisma`

---

### 2.5.3 Healthcheck del backend siempre fallaba

**Síntoma**: Docker marcaba el contenedor del backend como `unhealthy` y el frontend nunca arrancaba (ya que depende de que el backend esté sano).

**Causa**: El healthcheck apuntaba a `http://localhost:3000/api/health`, pero la ruta real registrada en Express era `http://localhost:3000/health` (sin el prefijo `/api`). Todas las rutas de la API tienen prefijo `/api`, pero el health check es una ruta de nivel superior.

**Solución**: Se corrigió la URL en dos lugares:

| Archivo | Antes | Después |
|---------|-------|---------|
| `backend/Dockerfile` | `/api/health` | `/health` |
| `docker-compose.yml` | `/api/health` | `/health` |

También se añadió `start_period: 15s` al healthcheck del backend en `docker-compose.yml`, dándole tiempo para ejecutar las migraciones de Prisma antes de empezar a comprobar la salud.

---

### 2.5.4 Nginx como reverse proxy (la pieza clave)

**Síntoma**: Al acceder desde otra máquina de la red (o desde internet), el frontend cargaba pero todas las llamadas a la API fallaban con errores de red o CORS.

**Causa**: La configuración original tenía `VITE_API_URL=http://localhost:3000/api`. Esta URL se "quema" en el código JavaScript durante la compilación. Cuando un usuario accede desde otra máquina, su navegador intenta conectar a `localhost:3000`, que es la propia máquina del usuario, no el servidor.

**Solución**: Se transformó nginx de un simple servidor de archivos estáticos a un **reverse proxy** completo. Ahora:

1. `VITE_API_URL=/api` (ruta relativa, sin hostname).
2. El navegador hace las peticiones a `/api/*` del mismo host y puerto que sirvió el frontend.
3. Nginx intercepta esas peticiones y las reenvía internamente a `http://backend:3000/api/`.
4. Para el navegador, la API y el frontend son el mismo origen. No hay problemas de CORS.

Se añadieron dos bloques de proxy en `frontend/nginx.conf`:

```nginx
# API del backend
location /api/ {
    proxy_pass http://backend:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
    client_max_body_size 10M;
}

# Archivos subidos (avatares, briefings, modsets)
location /uploads/ {
    proxy_pass http://backend:3000/uploads/;
    proxy_http_version 1.1;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**Por qué es tan importante**: Esta única modificación resuelve de raíz el problema de "funciona en localhost pero no desde otra máquina". Al usar rutas relativas, el frontend funciona desde cualquier IP, dominio o puerto sin necesidad de recompilar.

**Archivo**: `frontend/nginx.conf`

---

### 2.5.5 CORS multi-origen

**Síntoma**: Aunque el reverse proxy resuelve el caso principal, hay escenarios donde un cliente puede hablar directamente con el backend (herramientas de desarrollo, scripts, clientes en la LAN que no pasan por nginx).

**Causa**: La configuración CORS del backend solo permitía `FRONTEND_URL` y `http://localhost:5173`. Si alguien accedía desde `http://192.168.1.20:3000` directamente, CORS lo bloqueaba.

**Solución**: Se añadió soporte para la variable de entorno `CORS_EXTRA_ORIGINS` en `backend/src/index.ts`:

```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  ...(process.env.CORS_EXTRA_ORIGINS
      ? process.env.CORS_EXTRA_ORIGINS.split(',')
      : []),
].filter(Boolean) as string[];
```

En el `.env` se puede configurar así:

```env
CORS_EXTRA_ORIGINS=http://192.168.1.20:3000,http://10.0.0.5:3000
```

**Archivo**: `backend/src/index.ts`

---

### 2.5.6 `VITE_API_URL` cambiado a ruta relativa

**Síntoma**: Relacionado con 2.5.4. Cualquier despliegue requería recompilar el frontend con la IP/dominio correctos.

**Solución**: Se cambió el valor por defecto de `VITE_API_URL` de `http://localhost:3000/api` a `/api` en `docker-compose.yml`:

```yaml
args:
  VITE_API_URL: ${VITE_API_URL:-/api}
```

Con `/api` como ruta relativa, el navegador construye la URL completa automáticamente a partir del host actual. Si accedes desde `http://192.168.1.50:8080`, las peticiones van a `http://192.168.1.50:8080/api/...`. Si accedes desde `http://midominio.com`, van a `http://midominio.com/api/...`.

**Archivos**: `docker-compose.yml`, `.env.example`

---

### 2.5.7 Cookie `Secure` forzada en producción

**Síntoma**: Las cookies JWT no se guardaban en el navegador al desplegar en producción. El login parecía exitoso (el servidor devolvía 200), pero al navegar a otra página la sesión se perdía.

**Causa**: La función `getCookieOptions()` en `jwt.ts` tenía esta lógica:

```typescript
// ANTES (incorrecto)
const isSecure = process.env.COOKIE_SECURE === 'true' || isProduction;
```

Esto significa que en producción (`NODE_ENV=production`), `secure` siempre era `true`, independientemente de lo que dijera `COOKIE_SECURE` en el `.env`. Si el servidor usaba HTTP (sin HTTPS), el navegador descartaba silenciosamente cualquier cookie con `Secure=true`.

**Solución**: Se eliminó el `|| isProduction`:

```typescript
// DESPUÉS (correcto)
const isSecure = process.env.COOKIE_SECURE === 'true';
```

Ahora la cookie `Secure` se controla exclusivamente desde el `.env`. Si usas HTTP, pones `COOKIE_SECURE=false`; si tienes HTTPS, pones `COOKIE_SECURE=true`.

**Archivo**: `backend/src/utils/jwt.ts`

---

### 2.5.8 `clearCookie` sin opciones coincidentes

**Síntoma**: Al hacer logout, la cookie JWT no se eliminaba. El usuario hacía logout pero al recargar la página seguía logueado.

**Causa**: Los navegadores implementan las cookies según la especificación RFC 6265, que exige que para eliminar una cookie, la cabecera `Set-Cookie` de eliminación debe incluir **exactamente** las mismas opciones (path, domain, secure, sameSite) que se usaron al crearla. Si alguna opción difiere, el navegador ignora la eliminación silenciosamente.

El código original hacía:

```typescript
// ANTES - incompleto
res.clearCookie('token');  // Sin opciones
```

Pero la cookie se había creado con `httpOnly: true, secure: ..., sameSite: ..., path: '/'`. Al no especificar estas opciones en `clearCookie`, el navegador la ignoraba.

**Solución**: Se refactorizó `clearJWTCookie()` para reutilizar `getCookieOptions()`:

```typescript
// DESPUÉS - correcto
const opts = getCookieOptions();
res.clearCookie('token', {
  httpOnly: opts.httpOnly,
  secure: opts.secure,
  sameSite: opts.sameSite,
  path: opts.path,
});
```

**El mismo problema afectaba a las cookies temporales de Discord OAuth**:

- `discord_oauth_state` (usada durante el login con Discord).
- `discord_link_state` (usada al vincular una cuenta Discord).

Se corrigieron ambas en `auth.controller.ts` usando las mismas opciones:

```typescript
const cookieOpts = getCookieOptions();
res.clearCookie('discord_oauth_state', {
  httpOnly: cookieOpts.httpOnly,
  secure: cookieOpts.secure,
  sameSite: cookieOpts.sameSite,
  path: cookieOpts.path,
});
```

**Archivos**: `backend/src/utils/jwt.ts`, `backend/src/controllers/auth.controller.ts`

---

### 2.5.9 `COOKIE_SAMESITE` por defecto `strict` rompía OAuth

**Síntoma**: El flujo de login con Discord fallaba. El usuario era redirigido a Discord, autorizaba, pero al volver al backend la cookie `discord_oauth_state` no estaba presente y se mostraba un error "state mismatch".

**Causa**: `COOKIE_SAMESITE` estaba configurado por defecto como `strict`. Con `SameSite=Strict`, el navegador **no envía cookies** en redirecciones entre sitios. El flujo OAuth funciona así:

1. Usuario va a `tu-servidor.com/api/auth/discord/start` → se crea cookie `discord_oauth_state`.
2. Se redirige a `discord.com/oauth2/authorize`.
3. Usuario autoriza y Discord redirige a `tu-servidor.com/api/auth/discord/callback`.

En el paso 3, como la redirección viene de `discord.com` (otro sitio), el navegador con `SameSite=Strict` **no incluye** la cookie `discord_oauth_state`. El backend no puede validar el state y rechaza la petición.

**Solución**: Se cambió el valor por defecto a `lax`:

```yaml
# docker-compose.yml
COOKIE_SAMESITE: ${COOKIE_SAMESITE:-lax}
```

Con `SameSite=Lax`, las cookies **sí se envían** en navegaciones top-level (redirecciones, clicks en enlaces) pero **no** en peticiones cross-site embebidas (iframes, AJAX desde otro dominio). Esto es seguro y compatible con OAuth.

**Archivos**: `docker-compose.yml`, `.env.example`

---

### 2.5.10 Trust proxy en Express

**Síntoma**: El rate limiting bloqueaba a todos los usuarios como si fueran la misma IP. Los logs de auditoría mostraban siempre la IP interna de Docker (172.x.x.x) en lugar de la IP real del cliente.

**Causa**: Express, por defecto, obtiene la IP del cliente de la conexión TCP directa. Detrás de nginx, la conexión TCP viene de la IP interna de Docker. La IP real del cliente se pasa en la cabecera `X-Forwarded-For`, pero Express no la lee a menos que se le indique.

**Solución**: Se añadió `app.set('trust proxy', 1)` justo después de crear la instancia de Express:

```typescript
const app = express();
app.set('trust proxy', 1);
```

El `1` significa "confía en un nivel de proxy". Express ahora lee `X-Forwarded-For` y `X-Forwarded-Proto` de las cabeceras que nginx añade, obteniendo la IP y el protocolo reales del cliente.

**Archivo**: `backend/src/index.ts`

---

### 2.5.11 Nginx `$host` eliminaba el puerto

**Síntoma**: Al acceder al servidor en un puerto no estándar (por ejemplo, `http://mi-servidor.com:45375`), algunas redirecciones del backend perdían el puerto y redirigían a `http://mi-servidor.com` (sin puerto), que no funcionaba.

**Causa**: En la configuración de nginx, se usaba `proxy_set_header Host $host`. La variable `$host` de nginx contiene solo el hostname, **sin el puerto**. Cuando el backend leía la cabecera `Host` para construir URLs de redirección, obtenía `mi-servidor.com` en lugar de `mi-servidor.com:45375`.

**Solución**: Se cambió `$host` por `$http_host`:

```nginx
proxy_set_header Host $http_host;
```

`$http_host` contiene el valor completo de la cabecera Host enviada por el navegador, **incluyendo el puerto** si es no estándar.

**Archivo**: `frontend/nginx.conf`

---

### 2.5.12 Migración OAuthAccount

**Síntoma**: Se reportó que faltaba la tabla `OAuthAccount` en la base de datos.

**Diagnóstico**: La migración ya existía en el repositorio (`prisma/migrations/20260122074054_add_oauth_account/`). El problema era que no se había ejecutado en el servidor.

**Solución**: No fue necesario crear nada nuevo. El comando de inicio del backend (`npx prisma migrate deploy && node dist/index.js`) ejecuta automáticamente las migraciones pendientes al arrancar el contenedor. Solo era necesario reiniciar el backend para que la migración se aplicara.

---

### 2.5.13 Actualización de .env.example

Se reescribió el archivo `.env.example` con documentación exhaustiva de cada variable:

- **Secciones claramente separadas**: Base de datos, Backend, Frontend, CORS, Discord OAuth2, Cookies.
- **Valores por defecto seguros**: `COOKIE_SECURE=false`, `COOKIE_SAMESITE=lax`.
- **Comentarios explicativos**: cada variable tiene una explicación de para qué sirve y cuándo cambiarla.
- **Ejemplos para puertos no estándar**: documentado que `FRONTEND_URL` debe incluir el puerto si no es 80/443.
- **Notas de seguridad**: advertencias sobre `COOKIE_SECURE=true` requiriendo HTTPS.

**Archivo**: `.env.example`

---

## Mapa de archivos afectados

A continuación se recoge una tabla que relaciona cada archivo modificado o creado con las versiones donde fue tocado, facilitando la trazabilidad.

### Archivos creados

| Archivo | Versión | Descripción |
|---------|---------|-------------|
| `frontend/src/components/events/ViewToggle.tsx` | v2.3.0 | Toggle lista/calendario |
| `frontend/src/components/events/EventCalendar/index.ts` | v2.3.0 | Barrel export |
| `frontend/src/components/events/EventCalendar/EventCalendar.tsx` | v2.3.0 | Contenedor del calendario |
| `frontend/src/components/events/EventCalendar/CalendarHeader.tsx` | v2.3.0 | Navegación de meses |
| `frontend/src/components/events/EventCalendar/CalendarGrid.tsx` | v2.3.0 | Grid de 7 columnas |
| `frontend/src/components/events/EventCalendar/CalendarDay.tsx` | v2.3.0 | Celda de un día |
| `frontend/src/components/events/EventCalendar/CalendarEventItem.tsx` | v2.3.0 | Evento dentro de celda |
| `backend/Dockerfile` | v2.4.0 | Imagen Docker del backend |
| `frontend/Dockerfile` | v2.4.0 | Imagen Docker del frontend |
| `frontend/nginx.conf` | v2.4.0 | Configuración de nginx |
| `docker-compose.yml` | v2.4.0 | Orquestación de servicios |
| `docker-compose.prod.yml` | v2.4.0 | Override de producción |
| `.env.example` | v2.4.0 | Plantilla de variables de entorno |
| `DEPLOYMENT.md` | v2.4.0 | Guía de despliegue |
| `backend/.dockerignore` | v2.4.0 | Exclusiones del build Docker |
| `frontend/.dockerignore` | v2.4.0 | Exclusiones del build Docker |

### Archivos modificados

| Archivo | Versiones | Cambios principales |
|---------|-----------|---------------------|
| `backend/src/controllers/event.controller.ts` | v2.2.0 | Eliminada función duplicada `changeEventStatus` |
| `backend/src/services/event.service.ts` | v2.2.0 | Eliminada función duplicada, limpieza imports |
| `backend/src/services/slot.service.ts` | v2.2.0 | Validación de estado en `adminAssignSlot` / `adminUnassignSlot` |
| `backend/src/controllers/clan.controller.ts` | v2.2.0 | Nuevo método `deleteAvatar` |
| `backend/src/services/clan.service.ts` | v2.2.0 | Soporte para `avatarUrl: null` |
| `backend/src/routes/clan.routes.ts` | v2.2.0 | Nueva ruta `DELETE /:id/avatar` |
| `frontend/src/services/api.ts` | v2.2.0 | Interceptor para FormData |
| `frontend/src/services/clanService.ts` | v2.2.0 | Método `deleteAvatar` |
| `frontend/src/services/eventService.ts` | v2.2.0 | Método `changeStatus` |
| `frontend/src/hooks/useClans.ts` | v2.2.0 | Hook `useDeleteClanAvatar` |
| `frontend/src/hooks/useEvents.ts` | v2.2.0 | Hook `useChangeEventStatus` |
| `frontend/src/pages/clanes/EditClanPage.tsx` | v2.2.0 | Validación 2 MB, botón quitar avatar |
| `frontend/src/pages/events/EventsPage.tsx` | v2.2.0, v2.3.0 | Filtros, paginación, toggle vista, calendario |
| `frontend/src/pages/events/EventDetailPage.tsx` | v2.2.0 | Botón toggle de estado |
| `frontend/src/pages/dashboard/DashboardPage.tsx` | v2.2.0 | Corrección `count` → `total` |
| `frontend/src/components/events/EventFilters.tsx` | v2.2.0 | Opción INACTIVE, sin checkbox |
| `frontend/src/components/events/EventCard.tsx` | v2.2.0 | Colores de badge consistentes |
| `frontend/src/components/events/SlotItem.tsx` | v2.2.0 | Validación de estado en admin actions |
| `backend/prisma/schema.prisma` | v2.5.0 | `binaryTargets` para Alpine |
| `backend/Dockerfile` | v2.5.0 | URL healthcheck corregida |
| `docker-compose.yml` | v2.5.0 | Healthcheck, CORS_EXTRA_ORIGINS, defaults |
| `frontend/nginx.conf` | v2.5.0 | Reverse proxy `/api/` y `/uploads/`, `$http_host` |
| `backend/src/index.ts` | v2.5.0 | Trust proxy, CORS multi-origen |
| `backend/src/utils/jwt.ts` | v2.5.0 | Cookie Secure sin override, `clearCookie` consistente |
| `backend/src/controllers/auth.controller.ts` | v2.5.0 | `clearCookie` con opciones completas |
| `.env.example` | v2.5.0 | Documentación completa, defaults para multi-máquina |
| `frontend/package-lock.json` | v2.5.0 | Regenerado |
| `README.md` | v2.2.0, v2.3.0, v2.4.0, v2.5.0 | Actualizado en cada versión |
| `CHANGELOG.md` | v2.2.0, v2.3.0, v2.4.0, v2.5.0 | Actualizado en cada versión |

---

## Diagrama de arquitectura final (v2.5.0)

```
                    Internet / LAN
                         │
                         ▼
              ┌─────────────────────┐
              │    Nginx (puerto 80) │  ← frontend container
              │   Archivos estáticos │
              │   (React SPA build)  │
              ├─────────────────────┤
              │  /api/*  → proxy    ─┼──► backend:3000  ← backend container
              │  /uploads/* → proxy ─┼──► backend:3000
              │  /*      → index.html│
              └─────────────────────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │ PostgreSQL│ ← postgres container
                                    │ (puerto   │
                                    │  5432)    │
                                    └──────────┘
```

Todos los contenedores comparten la red interna `arma-network`. Desde fuera solo es necesario exponer el puerto de nginx (80 o el que se configure en `FRONTEND_PORT`).

---

*Documento generado como referencia técnica interna del proyecto Arma Multiclan Platform.*
