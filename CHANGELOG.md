# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] - 2025-01-19

### 🎉 Lanzamiento Inicial

#### ✨ Agregado

**Gestión de Clanes:**
- Sistema completo de creación, edición y eliminación de clanes
- Subida de logos personalizados (JPG, PNG, WEBP)
- Visualización de miembros con avatares
- Permisos diferenciados (Admin puede editar cualquier clan, Líder solo su clan)

**Sistema de Avatares:**
- Usuarios utilizan el logo de su clan como avatar
- Bordes de colores por rol (Rojo=Admin, Amarillo=Líder, Azul=Usuario)
- Avatares visibles en navbar, eventos, clanes y gestión de usuarios
- Componente UserAvatar reutilizable

**Gestión de Eventos:**
- Creación de eventos con escuadras y slots personalizables
- Creación desde plantilla (reutilizar estructura de eventos anteriores)
- Edición completa de eventos:
  - Información básica (nombre, descripción, fecha, hora, briefing)
  - Estructura dinámica de escuadras y slots
  - Agregar/eliminar escuadras
  - Modificar roles de slots
- Eliminación de eventos (Admin/Creador/Líder del clan)
- Briefing con soporte HTML

**Sistema de Slots:**
- Usuarios se apuntan y desapuntan de slots
- Admin puede asignar cualquier usuario a cualquier slot
- Líder de clan puede asignar usuarios de su clan
- Mover usuarios entre slots automáticamente
- Admin/Líder pueden desapuntar usuarios
- Validación de un slot por usuario por evento
- Estados de slots (LIBRE, OCUPADO, AUSENTE)

**Gestión de Usuarios:**
- Registro con validación de clan
- Login seguro con JWT
- Estados: Activo, Pendiente, Bloqueado, Baneado
- Panel de administración:
  - Validar usuarios pendientes
  - Cambiar roles
  - Bloquear/desbloquear cuentas
  - Eliminar usuarios
- Búsqueda y filtros

**Seguridad:**
- Autenticación JWT
- Contraseñas encriptadas con bcrypt
- Middleware de autenticación
- Rutas protegidas por rol
- Validación de entrada en frontend y backend
- Sanitización de datos
- Audit logs para acciones importantes

**UI/UX:**
- Diseño responsive (mobile-first)
- Tema militar personalizado (Tailwind CSS)
- Componentes reutilizables (Card, Badge, LoadingSpinner)
- Navegación intuitiva
- Feedback visual para acciones (loading, errores, éxitos)
- Confirmaciones para acciones destructivas

#### 🔧 Técnico

**Backend:**
- Node.js + TypeScript + Express
- PostgreSQL con Prisma ORM
- Arquitectura MVC
- Upload de archivos con Multer
- Logging con Winston
- Validaciones robustas

**Frontend:**
- React + TypeScript + Vite
- React Router para navegación
- TanStack Query para estado del servidor
- Zustand para estado global
- Axios para HTTP
- date-fns para manejo de fechas
- Lucide React para iconos

**Base de Datos:**
- 9 modelos principales (User, Clan, Event, Squad, Slot, AuditLog, etc.)
- Relaciones bien definidas
- Cascadas para integridad referencial
- Seed con datos de prueba

---

## [Unreleased]

### 🎯 Próximas Funcionalidades

**Planificadas:**
- Estadísticas y reportes
- Notificaciones en tiempo real
- Bot de Discord para gestión de roles
- Calendario visual de eventos
- Exportar reportes (Excel/PDF)
- Sistema de asistencia/confirmación
- Historial de eventos por usuario

---

## [2.2.0] - 2025-01-28

### ✨ Agregado

**Toggle de Estado de Eventos (ACTIVO ↔ INACTIVO):**
- Botón para activar/desactivar eventos desde la página de detalle
- Solo Admin o Líder del clan creador pueden cambiar el estado
- Eventos INACTIVOS: no se puede apuntar ni asignar usuarios, pero sí editar
- Eventos FINALIZADOS: no se puede modificar nada
- Nuevo hook `useChangeEventStatus` en frontend
- Nuevo endpoint PUT `/events/:id/status` en backend

**Gestión de Avatar de Clan:**
- Botón "Quitar" para eliminar el avatar del clan
- Elimina el archivo del servidor y actualiza la base de datos
- Nuevo endpoint DELETE `/clans/:id/avatar`
- Nuevo hook `useDeleteClanAvatar` en frontend

**Paginación en Lista de Eventos:**
- Componente de paginación con navegación por páginas
- 12 eventos por página
- Muestra total de eventos disponibles

**Filtros de Eventos Mejorados:**
- Filtro de estado por defecto en "Activos" (antes era "Todos")
- Añadida opción "Inactivos" al selector de estado
- Eliminado checkbox "Solo próximos eventos" (redundante)
- Filtro "Todos" ahora muestra correctamente todos los estados

### 🔧 Cambiado

**Validación de Subida de Avatar:**
- Límite de tamaño de imagen reducido a 2MB (antes 5MB en frontend)
- Ahora consistente entre frontend y backend

**Manejo de FormData en Axios:**
- Añadido interceptor de request para eliminar Content-Type en FormData
- Axios ahora configura automáticamente el boundary correcto
- Resuelto error 400 al subir avatares de clan

### 🐛 Corregido

**Dashboard:**
- Corregido contador de "Próximos Eventos" (usaba `count` en vez de `total`)
- Corregido contador de "Usuarios" (mismo problema)

**Backend:**
- Eliminada función duplicada `changeEventStatus` en event.controller.ts
- Eliminada función duplicada `changeEventStatus` en event.service.ts
- Limpieza de import `UserRole` no usado en event.service.ts

### 🔒 Seguridad

**Protección de Eventos Finalizados:**
- Bloqueado `adminAssignSlot` en eventos FINISHED e INACTIVE
- Bloqueado `adminUnassignSlot` en eventos FINISHED
- Frontend oculta botones de asignación en eventos no activos
- Admin y Líder ya no pueden asignar usuarios a eventos finalizados

### 📚 Archivos Modificados

**Backend:**
- `src/controllers/event.controller.ts` - Eliminada función duplicada
- `src/services/event.service.ts` - Eliminada función duplicada, limpieza imports
- `src/services/slot.service.ts` - Añadida validación de estado en admin assign/unassign
- `src/services/clan.service.ts` - Soporte para avatarUrl null
- `src/controllers/clan.controller.ts` - Nuevo método deleteAvatar
- `src/routes/clan.routes.ts` - Nueva ruta DELETE /:id/avatar

**Frontend:**
- `src/services/api.ts` - Interceptor para FormData
- `src/services/clanService.ts` - Método deleteAvatar
- `src/services/eventService.ts` - Método changeStatus
- `src/hooks/useClans.ts` - Hook useDeleteClanAvatar
- `src/hooks/useEvents.ts` - Hook useChangeEventStatus
- `src/pages/clanes/EditClanPage.tsx` - Validación 2MB, botón quitar avatar
- `src/pages/events/EventsPage.tsx` - Filtros mejorados, estado por defecto
- `src/pages/events/EventDetailPage.tsx` - Botón toggle estado
- `src/pages/dashboard/DashboardPage.tsx` - Corregido uso de `total`
- `src/components/events/EventFilters.tsx` - Opción INACTIVE, sin checkbox
- `src/components/events/EventCard.tsx` - Colores de badge consistentes
- `src/components/events/SlotItem.tsx` - Validación de estado para admin actions

---

## [2.1.0] - 2025-01-27

### ✨ Agregado

**Sistema de Estados de Eventos:**
- Nuevo estado FINISHED para eventos completados
- Auto-finalización de eventos cuando pasa la fecha programada
- Transición automática: ACTIVE → FINISHED
- Protección: Eventos finalizados no permiten cambios de slots ni edición

**Subida de Archivos para Eventos:**
- Subida de archivos PDF de briefing (máximo 10MB)
- Subida de archivos HTML de modset para Arma 3 (máximo 10MB)
- Validación de tipos de archivo por extensión y magic bytes
- Validación de contenido HTML para prevenir scripts maliciosos
- Botones para descargar, abrir en nueva pestaña y eliminar archivos
- Permisos: Solo creador, admin o líder de clan pueden gestionar archivos

**Backend - Archivos:**
- Configuración de Multer para briefing (PDF) y modset (HTML)
- Endpoints POST/DELETE para /events/:id/briefing-file
- Endpoints POST/DELETE para /events/:id/modset-file
- Validación de permisos por rol y estado del evento
- Almacenamiento en /public/uploads/events/

**Frontend - Archivos:**
- Hooks useUploadBriefingFile, useUploadModsetFile
- Hooks useDeleteBriefingFile, useDeleteModsetFile
- UI completa en pestaña Briefing para gestión de archivos
- Indicadores de carga durante subida
- Mensajes de error descriptivos

### 🎨 Mejoras Visuales

**Layout de Escuadras en 3 Columnas:**
- Visualización de escuadras en grid responsive
- 1 columna en móvil, 2 en tablet, 3 en desktop
- Mejor aprovechamiento del espacio en pantallas grandes
- Alineación superior de cards con items-start

### 🔧 Técnico

**Base de Datos:**
- Nuevo campo briefingFileUrl en modelo Event
- Nuevo campo modsetFileUrl en modelo Event
- Valor FINISHED añadido al enum EventStatus
- Migraciones: add_finished_status, add_event_files

**Dependencias:**
- file-type: Validación de tipos de archivo por magic bytes

---

## Tipos de Cambios

- **Agregado** - Para nuevas características
- **Cambiado** - Para cambios en funcionalidades existentes
- **Obsoleto** - Para funcionalidades que serán eliminadas
- **Eliminado** - Para funcionalidades eliminadas
- **Corregido** - Para correcciones de bugs
- **Seguridad** - Para vulnerabilidades corregidas

---

## [1.1.0] - 2025-01-20

### ✨ Agregado

**Perfil de Usuario:**
- Página de perfil completa con avatar, rol y badges
- Edición de información personal (nickname y email)
- Cambio de contraseña con validaciones robustas
- Visualización de fecha de registro
- Enlace "Mi Perfil" en menú de usuario (navbar)

**Backend:**
- Endpoints PUT /users/profile y /users/change-password
- Middleware requireAdmin para rutas de administración
- Validación de email único en actualización
- Logging de cambios de perfil y contraseña

**Frontend:**
- Componente ProfilePage con secciones editables
- Mensajes de éxito/error en tiempo real
- Validaciones de formulario
- UI consistente con el resto de la app

### 🔧 Cambiado

- Router simplificado sin AuthLayout
- Layout de login mejorado y corregido
- MainLayout con dropdown de usuario mejorado

### 🐛 Corregido

- Manejo de fechas undefined en ProfilePage
- Imports de módulos en backend
- Router con rutas anidadas correctas
- Tipos TypeScript en hooks

---

## [2.0.0] - 2025-01-21

### ✨ Cambios Mayores

**Rediseño Completo - CCT (Centro de Coordinación Táctica):**
- Nueva identidad de marca orientada a simuladores militares
- Nombre actualizado de "Arma Platform" a "Centro de Coordinación Táctica"
- Logo militar profesional con escudo
- Paleta de colores táctica (verde militar, naranja arena)

**Sistema de Modo Claro/Oscuro:**
- Toggle interactivo en navbar (sol/luna)
- Modo Claro: Comando Diurno - tonos verde militar claro
- Modo Oscuro: Operaciones Nocturnas - gris oscuro + verde táctico
- Persistencia de preferencia en localStorage
- Transiciones suaves entre modos

**Footer Profesional:**
- Copyright 2025
- Créditos a Skylex (desarrollador)
- Referencia a Arma 3 y Arma Reforger
- Diseño responsive

### 🎨 Mejoras Visuales

**Sistema de Slots Mejorado:**
- Slots ocupados con gradientes verdes destacados
- Slots libres con colores discretos
- Slots del usuario con borde azul brillante y shadow
- Mejor diferenciación visual entre estados

**Modo Oscuro Refinado:**
- Contraste mejorado en todos los textos
- Cards con fondos apropiados (gray-800)
- Borders visibles (gray-700)
- Inputs y selects con colores consistentes
- Scrollbar personalizada

**Efectos Tácticos:**
- Grid de fondo sutil estilo mapa táctico
- Animación tactical-pulse para elementos importantes
- Scrollbar militar personalizada

### 🔧 Correcciones

- Tags de clan sin dobles corchetes ([[TAG]] → [TAG])
- Imports TypeScript corregidos
- Exports named vs default corregidos
- Warnings de non-null assertions eliminados

### 📚 Nuevos Archivos

- `src/config/app.config.ts` - Configuración centralizada
- `src/hooks/useTheme.ts` - Hook de tema con Zustand
- `src/components/ui/ThemeToggle.tsx` - Toggle de tema
- `src/components/layout/Footer.tsx` - Footer profesional

### 🔄 Archivos Actualizados

Frontend:
- MainLayout, EventCard, SlotItem, MembersList
- LoginPage, UsersPage, ClanDetailPage
- useUsers, userService
- index.css, tailwind.config.js, index.html

---