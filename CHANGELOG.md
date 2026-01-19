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

**En Desarrollo:**
- Perfil de usuario (ver y editar información personal)

**Planificadas:**
- Estadísticas y reportes
- Notificaciones en tiempo real
- Integración con Discord (OAuth + Bot)
- Calendario visual de eventos
- Modo oscuro
- Exportar reportes (Excel/PDF)
- Sistema de asistencia/confirmación
- Historial de eventos por usuario

---

## Tipos de Cambios

- **Agregado** - Para nuevas características
- **Cambiado** - Para cambios en fu

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