# 🎮 Arma Multiclan Platform

Plataforma web para gestión de eventos multijugador de Arma 3 y Arma Reforger entre múltiples clanes.

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Características

### 🛡️ Gestión de Clanes
- **Crear y administrar clanes** con nombre, tag y descripción
- **Subir logos personalizados** (.jpg, .png, .webp, máx. 2MB)
- **Eliminar avatar** del clan desde el panel de edición
- **Sistema de miembros** con roles diferenciados
- **Permisos por rol**: Admin, Líder de Clan, Usuario

### 👤 Sistema de Avatares
- **Avatares basados en logos de clan**
- **Bordes de colores** según rol:
  - 🔴 Rojo = Administrador
  - 🟡 Amarillo = Líder de Clan
  - 🔵 Azul = Usuario
- Visible en navbar, eventos, clanes y gestión de usuarios

### 📅 Gestión de Eventos
- **Crear eventos** con fecha, hora, tipo de juego y briefing
- **Plantillas reutilizables** - Crea eventos basados en eventos anteriores
- **Estados de eventos**:
  - ACTIVO: Evento abierto para inscripciones y modificaciones
  - INACTIVO: Evento pausado (nadie puede apuntarse, pero se puede editar y reactivar)
  - FINALIZADO: Auto-finalización cuando pasa la fecha (no se puede modificar)
- **Toggle de estado**: Admin/Líder pueden activar/desactivar eventos
- **Edición completa**:
  - Información básica (nombre, fecha, descripción)
  - Estructura de escuadras y slots
  - Agregar/eliminar escuadras dinámicamente
  - Modificar roles de slots
- **Archivos del evento**:
  - Subir PDF de briefing (máx. 10MB)
  - Subir HTML de modset Arma 3 (máx. 10MB)
  - Descargar/eliminar archivos
  - Validación de tipos de archivo
- **Sistema de inscripción**:
  - Usuarios se apuntan/desapuntan
  - Admin/Líder asignan usuarios a slots
  - Mover usuarios entre slots
  - Desapuntar usuarios
- **Visualización en 3 columnas** - Layout responsive para escuadras

### 👥 Gestión de Usuarios
- **Registro con validación de clan**
- **Login seguro** con JWT
- **Estados de usuario**: Activo, Pendiente, Bloqueado, Baneado
- **Panel de administración**:
  - Validar usuarios pendientes
  - Cambiar roles
  - Bloquear/desbloquear cuentas
  - Eliminar usuarios

### 🔐 Sistema de Permisos
- **Administrador**: Control total
- **Líder de Clan**: Gestiona su clan y asigna miembros a eventos
- **Usuario**: Participa en eventos

### 🔗 Integración con Discord
- **OAuth2 Login**: Inicia sesión con tu cuenta de Discord
- **Vinculación de cuentas**: Conecta Discord a tu cuenta existente
- **Actualización automática de tokens**: Refresh transparente sin pérdida de sesión
- **Acceso a Discord API**:
  - Obtener información de usuario
  - Listar conexiones vinculadas
  - Ver servidores del usuario
- **Seguridad**: Tokens en cookies httpOnly, validación anti-CSRF, CORS configurado

📖 **[Ver documentación completa](docs/discord-integration.md)**

---

## 🚀 Tecnologías

### Backend
- **Node.js** + **TypeScript**
- **Express 5** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Subida de archivos
- **Winston** - Logging
- **cookie-parser** - Manejo de cookies httpOnly
- **Discord OAuth2** - Autenticación con Discord

### Frontend
- **React** + **TypeScript**
- **Vite** - Build tool
- **React Router** - Navegación
- **TanStack Query** - Estado del servidor
- **Zustand** - Estado global
- **Axios** - HTTP client
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas

---

## 📦 Instalación

### Requisitos Previos
- Node.js 18+ y npm
- PostgreSQL 14+
- Git

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd arma-multiclan-platform
```

### 2. Configurar Backend
```bash
cd backend
npm install
```

Crea `.env`:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/arma_platform"
JWT_SECRET="tu-secreto-super-seguro-cambialo-en-produccion"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Discord OAuth2 (opcional - para login con Discord)
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"

# Cookies (opcional - ajustar en producción)
COOKIE_SECURE="false"
COOKIE_SAMESITE="lax"
```

Ejecutar migraciones:
```bash
npx prisma migrate dev
npx prisma db seed  # Datos de prueba
```

Iniciar servidor:
```bash
npm run dev
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```

Crea `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

Iniciar aplicación:
```bash
npm run dev
```

---

## 🎮 Uso

### Acceso Inicial

**Usuarios de prueba creados automáticamente:**

| Email | Contraseña | Rol | Clan |
|-------|-----------|-----|------|
| admin@arma.com | Admin123! | Admin | Clan Alfa |
| leader@arma.com | Leader123! | Líder | Clan Alfa |
| user@arma.com | User123! | Usuario | Clan Alfa |

### Flujo de Trabajo

1. **Login** con una de las cuentas de prueba
2. **Explorar clanes** - Ver información y miembros
3. **Crear eventos**:
   - Desde cero: Define escuadras y slots manualmente
   - Desde plantilla: Usa un evento existente como base
4. **Gestionar eventos**:
   - Editar información básica
   - Modificar estructura de escuadras/slots
   - Asignar usuarios (Admin/Líder)
5. **Participar**:
   - Apuntarse a slots disponibles
   - Ver quién está asignado

---

## 📁 Estructura del Proyecto
```
arma-multiclan-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Modelo de datos
│   │   └── seed.ts            # Datos iniciales
│   ├── src/
│   │   ├── config/            # Configuración (DB, Multer)
│   │   ├── controllers/       # Lógica de endpoints
│   │   │   ├── auth.controller.ts    # OAuth2 Discord
│   │   │   └── discord.controller.ts # Discord API
│   │   ├── middlewares/       # Auth, validaciones
│   │   ├── routes/            # Rutas de API
│   │   │   ├── auth.routes.ts
│   │   │   └── discord.routes.ts
│   │   ├── services/          # Lógica de negocio
│   │   │   ├── auth.service.ts       # Vinculación Discord
│   │   │   └── discord.service.ts    # Cliente OAuth2
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilidades
│   │   │   ├── crypto.ts      # Anti-CSRF state
│   │   │   └── jwt.ts         # Cookies httpOnly
│   │   └── index.ts           # Entry point
│   └── public/uploads/        # Archivos subidos
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── auth/          # DiscordLoginButton
│   │   │   ├── clanes/
│   │   │   ├── events/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas
│   │   │   └── auth/          # DiscordCallbackPage
│   │   ├── services/          # API calls
│   │   │   ├── api.ts         # Axios con credentials
│   │   │   └── discordApi.ts  # React Query hooks
│   │   ├── store/             # Estado global
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx
│   └── public/
│
├── docs/
│   └── discord-integration.md # Documentación completa
│
└── README.md
```

---

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Tokens Discord en cookies httpOnly (no accesibles desde JavaScript)
- ✅ Validación anti-CSRF con state para OAuth2
- ✅ Actualización automática de tokens Discord
- ✅ Validación de entrada en frontend y backend
- ✅ Sanitización de datos
- ✅ Subida de archivos restringida (tipos y tamaños: 10MB)
- ✅ Validación de archivos por magic bytes (file-type)
- ✅ Validación de HTML para prevenir scripts maliciosos
- ✅ CORS configurado con credentials
- ✅ Logs de auditoría para acciones importantes

---

## 🛣️ Roadmap

### Funcionalidades Implementadas Recientemente
- ✅ **Integración Discord OAuth2** - Login y vinculación de cuentas
- ✅ **Tokens seguros** - Cookies httpOnly con refresh automático
- ✅ **Discord API** - Acceso a información de usuario, conexiones y servidores
- ✅ **Perfil de usuario** - Ver y editar perfil personal
- ✅ **Modo claro/oscuro** - Tema con toggle y persistencia
- ✅ **Estados de eventos** - ACTIVO, INACTIVO, FINALIZADO con auto-finalización
- ✅ **Toggle de estado** - Activar/desactivar eventos desde el detalle
- ✅ **Archivos de evento** - Subida de PDF/HTML para briefing y modset
- ✅ **Layout 3 columnas** - Visualización responsive de escuadras
- ✅ **Gestión de avatares** - Subir y eliminar logos de clan
- ✅ **Paginación** - Lista de eventos y usuarios con paginación
- ✅ **Filtros mejorados** - Filtro por estado con valor por defecto "Activos"

### Próximas Funcionalidades
- [ ] **Estadísticas** - Dashboard con métricas de eventos
- [ ] **Notificaciones** - Alertas de eventos y cambios
- [ ] **Bot de Discord** - Gestión de roles y notificaciones automáticas
- [ ] **Linked Roles** - Sincronización de roles entre plataforma y Discord
- [ ] **Calendario visual** - Vista de eventos en calendario
- [ ] **Exportar reportes** - Excel/PDF de eventos y asistencia
- [ ] **Historial de participación** - Eventos pasados por usuario

### Deployment
- [ ] Backend en Railway/Render
- [ ] Frontend en Vercel
- [ ] Base de datos en Supabase/Neon
- [ ] CDN para imágenes

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 👥 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/NuevaCaracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un Pull Request

---

## 📧 Contacto

Para preguntas o sugerencias, por favor abre un issue en GitHub.

---

## 🙏 Agradecimientos

- Comunidad de Arma 3/Reforger
- Todos los clanes que inspiran este proyecto
- Contribuidores y testers

---

**Hecho con ❤️ para la comunidad de Arma**