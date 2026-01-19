# 🎮 Arma Multiclan Platform

Plataforma web para gestión de eventos multijugador de Arma 3 y Arma Reforger entre múltiples clanes.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Características

### 🛡️ Gestión de Clanes
- **Crear y administrar clanes** con nombre, tag y descripción
- **Subir logos personalizados** (.jpg, .png, .webp)
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
- **Edición completa**:
  - Información básica (nombre, fecha, descripción)
  - Estructura de escuadras y slots
  - Agregar/eliminar escuadras dinámicamente
  - Modificar roles de slots
- **Sistema de inscripción**:
  - Usuarios se apuntan/desapuntan
  - Admin/Líder asignan usuarios a slots
  - Mover usuarios entre slots
  - Desapuntar usuarios

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

---

## 🚀 Tecnologías

### Backend
- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas
- **Multer** - Subida de archivos
- **Winston** - Logging

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
│   │   ├── middlewares/       # Auth, validaciones
│   │   ├── routes/            # Rutas de API
│   │   ├── services/          # Lógica de negocio
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilidades
│   │   └── index.ts           # Entry point
│   └── public/uploads/        # Archivos subidos
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── clanes/
│   │   │   ├── events/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Páginas
│   │   ├── services/          # API calls
│   │   ├── store/             # Estado global
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx
│   └── public/
│
└── README.md
```

---

## 🔒 Seguridad

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ Validación de entrada en frontend y backend
- ✅ Sanitización de datos
- ✅ Subida de archivos restringida (tipos y tamaños)
- ✅ CORS configurado
- ✅ Logs de auditoría para acciones importantes

---

## 🛣️ Roadmap

### Próximas Funcionalidades
- [ ] **Perfil de usuario** - Ver y editar perfil personal
- [ ] **Estadísticas** - Dashboard con métricas de eventos
- [ ] **Notificaciones** - Alertas de eventos y cambios
- [ ] **Integración Discord** - OAuth y bot de notificaciones
- [ ] **Calendario visual** - Vista de eventos en calendario
- [ ] **Modo oscuro** - Tema oscuro para la interfaz
- [ ] **Exportar reportes** - Excel/PDF de eventos y asistencia

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