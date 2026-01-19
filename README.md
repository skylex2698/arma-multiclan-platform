# 🎮 Arma Events Platform

Plataforma web para la gestión de eventos multiclan de Arma 3 y Arma Reforger. Sistema completo de inscripciones, gestión de escuadras, slots y clanes.

![Node.js](https://img.shields.io/badge/Node.js-24.13.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Características

### ✅ Gestión de Eventos
- Crear eventos con múltiples escuadras y slots
- Sistema de inscripciones en tiempo real
- Apuntarse/desapuntarse de slots
- Cambio automático de slot
- Briefing en formato HTML
- Filtros avanzados (juego, estado, fecha)
- Vista detallada de eventos

### ✅ Sistema de Usuarios
- Autenticación con JWT
- Roles: Usuario, Líder de Clan, Administrador
- Estados: Pendiente, Activo, Bloqueado, Baneado, Inactivo
- Validación de usuarios por admins/líderes
- Solicitudes de cambio de clan
- Historial de cambios

### ✅ Gestión de Clanes
- CRUD completo de clanes
- Asignación de usuarios a clanes
- Ver miembros por clan
- Control de permisos por rol

### ✅ Auditoría
- Registro de todas las acciones críticas
- Historial completo de cambios
- Trazabilidad de eventos

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** v24.13.0
- **TypeScript** 5.x
- **Express** - Framework web
- **Prisma** 5.22.0 - ORM
- **PostgreSQL** - Base de datos
- **JWT** - Autenticación
- **Bcrypt** - Encriptación de contraseñas

### Frontend
- **React** 18.x
- **TypeScript** 5.x
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **React Router** - Navegación
- **React Query** - Estado del servidor
- **Zustand** - Estado global
- **Axios** - HTTP client
- **date-fns** - Manejo de fechas
- **Lucide React** - Iconos

---

## 📦 Instalación

### Prerequisitos

- Node.js v24.x o superior
- PostgreSQL 16.x o superior
- npm o yarn
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/arma-multiclan-platform.git
cd arma-multiclan-platform
```

### 2. Configurar Backend
```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita el archivo .env con tus credenciales
```

**Archivo `.env` del backend:**
```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/arma_events?schema=public"
JWT_SECRET="tu_clave_secreta_muy_segura_cambiala_en_produccion"
JWT_EXPIRES_IN="7d"
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
DISCORD_CALLBACK_URL="http://localhost:3000/auth/discord/callback"
DISCORD_BOT_TOKEN=""
DISCORD_GUILD_ID=""
DISCORD_NOTIFICATION_CHANNEL_ID=""
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### 3. Configurar Base de Datos
```bash
# Ejecutar migraciones
npx prisma migrate dev

# Cargar datos de prueba (opcional)
npm run prisma:seed
```

### 4. Configurar Frontend
```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

**Archivo `.env` del frontend:**
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🚀 Iniciar el Proyecto

### Opción 1: Iniciar todo (3 terminales)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Prisma Studio (opcional):**
```bash
cd backend
npm run prisma:studio
```

### Opción 2: Modo producción

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## 🌐 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:5173 | Interfaz de usuario |
| **Backend API** | http://localhost:3000/api | API REST |
| **Health Check** | http://localhost:3000/health | Estado del servidor |
| **Prisma Studio** | http://localhost:5555 | Visualizador de BD |

---

## 👤 Usuarios de Prueba

El seed crea automáticamente los siguientes usuarios:

| Email | Password | Rol | Clan |
|-------|----------|-----|------|
| admin@arma.com | Admin123! | ADMIN | Clan Alfa |
| leader@arma.com | Leader123! | CLAN_LEADER | Clan Alfa |
| user@arma.com | User123! | USER | Clan Bravo |

**Clanes creados:**
- Clan Alfa [ALFA]
- Clan Bravo [BRAVO]
- Clan Charlie [CHARLIE]

---

## 📚 Documentación de API

### Endpoints principales

#### Autenticación
```
POST   /api/auth/register/local     - Registro de usuario
POST   /api/auth/login/local        - Login
GET    /api/auth/me                 - Usuario actual
```

#### Eventos
```
GET    /api/events                  - Listar eventos
GET    /api/events/:id              - Detalle de evento
POST   /api/events                  - Crear evento (Admin/Líder)
PUT    /api/events/:id              - Editar evento (Admin/Líder)
DELETE /api/events/:id              - Eliminar evento (Admin)
POST   /api/events/from-template    - Crear desde plantilla
PUT    /api/events/:id/status       - Cambiar estado
```

#### Slots
```
POST   /api/slots/:id/assign        - Apuntarse a slot
POST   /api/slots/:id/unassign      - Desapuntarse
POST   /api/events/:id/absence      - Marcar ausencia
```

#### Clanes
```
GET    /api/clans                   - Listar clanes
GET    /api/clans/:id               - Detalle de clan
GET    /api/clans/:id/members       - Miembros del clan
POST   /api/clans                   - Crear clan (Admin)
PUT    /api/clans/:id               - Editar clan (Admin)
DELETE /api/clans/:id               - Eliminar clan (Admin)
```

#### Usuarios
```
GET    /api/users                   - Listar usuarios
GET    /api/users/:id               - Detalle de usuario
POST   /api/users/:id/validate      - Validar usuario (Admin/Líder)
PUT    /api/users/:id/role          - Cambiar rol (Admin)
PUT    /api/users/:id/status        - Cambiar estado (Admin)
PUT    /api/users/:id/clan          - Cambiar clan (Admin)
POST   /api/users/clan-change-request           - Solicitar cambio de clan
GET    /api/users/clan-change-requests          - Ver solicitudes
POST   /api/users/clan-change-requests/:id/review - Aprobar/rechazar
```

---

## 🗂️ Estructura del Proyecto
```
arma-multiclan-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Modelo de datos
│   │   ├── seed.ts                # Datos de prueba
│   │   └── migrations/            # Migraciones
│   ├── src/
│   │   ├── config/                # Configuraciones
│   │   ├── controllers/           # Controladores
│   │   ├── middlewares/           # Middlewares
│   │   ├── routes/                # Rutas de la API
│   │   ├── services/              # Lógica de negocio
│   │   ├── types/                 # Tipos TypeScript
│   │   ├── utils/                 # Utilidades
│   │   └── index.ts               # Servidor principal
│   ├── .env                       # Variables de entorno
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── events/           # Componentes de eventos
│   │   │   ├── layout/           # Layouts
│   │   │   └── ui/               # Componentes reutilizables
│   │   ├── hooks/                # Custom hooks
│   │   ├── pages/
│   │   │   ├── auth/             # Páginas de autenticación
│   │   │   ├── events/           # Páginas de eventos
│   │   │   ├── clanes/           # Páginas de clanes
│   │   │   ├── users/            # Páginas de usuarios
│   │   │   └── dashboard/        # Dashboard
│   │   ├── services/             # Servicios de API
│   │   ├── store/                # Estado global
│   │   ├── types/                # Tipos TypeScript
│   │   ├── utils/                # Utilidades
│   │   ├── router.tsx            # Configuración de rutas
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env                      # Variables de entorno
│   └── package.json
│
└── README.md
```

---

## 🔒 Seguridad

- Contraseñas encriptadas con bcrypt (10 rounds)
- Autenticación JWT con expiración
- Validación de inputs en backend
- Sanitización de datos
- CORS configurado
- Protección de rutas por roles
- Tokens almacenados en localStorage (cliente)

---

## 🧪 Testing
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

---

## 🚢 Deployment

### Backend (Railway / Render)

1. Crear cuenta en Railway/Render
2. Conectar repositorio
3. Configurar variables de entorno
4. Agregar base de datos PostgreSQL
5. Deploy automático

### Frontend (Vercel / Netlify)

1. Crear cuenta en Vercel/Netlify
2. Conectar repositorio
3. Configurar build:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Configurar variable `VITE_API_URL` con URL del backend
5. Deploy automático

---

## 📝 Scripts Disponibles

### Backend
```bash
npm run dev              # Modo desarrollo (nodemon)
npm run build            # Compilar TypeScript
npm start                # Iniciar en producción
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:migrate   # Crear migración
npm run prisma:seed      # Cargar datos de prueba
```

### Frontend
```bash
npm run dev              # Modo desarrollo (Vite)
npm run build            # Compilar para producción
npm run preview          # Preview de producción
npm run lint             # Ejecutar ESLint
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

---

## 🙏 Agradecimientos

- Comunidad de Arma
- Anthropic (Claude AI)
- Todos los contribuidores

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

1. Abre un [Issue](https://github.com/TU_USUARIO/arma-multiclan-platform/issues)
2. Contacta por email
3. Únete a nuestro Discord (próximamente)

---

## 🗺️ Roadmap

### v1.0 (Actual)
- ✅ Sistema de autenticación
- ✅ Gestión de eventos completa
- ✅ Sistema de inscripciones
- ✅ Gestión de clanes y usuarios

### v1.1 (Próximamente)
- [ ] Integración con Discord OAuth
- [ ] Bot de Discord para notificaciones
- [ ] Exportación a Excel
- [ ] Estadísticas avanzadas

### v2.0 (Futuro)
- [ ] Sistema de roles personalizados
- [ ] Templates de eventos
- [ ] Sistema de permisos granular
- [ ] Modo oscuro
- [ ] App móvil

---

## 📊 Estado del Proyecto

- **Backend:** ████████████████████ 100%
- **Frontend:** ██████████████░░░░░░ 70%
- **Funcionalidad:** ████████████████░░░░ 85%

**Última actualización:** Enero 2026

---

## 🎮 ¡Disfruta organizando tus eventos!

Hecho con ❤️ para la comunidad de Arma