# Frontend

Aplicación React del panel de clanes, usuarios y eventos.

## Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Tailwind CSS

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Responsabilidades principales

- autenticación y sesión;
- dashboard;
- gestión de clanes;
- gestión de usuarios;
- operaciones y detalle de eventos;
- creación y edición de eventos;
- perfil de usuario;
- onboarding de creación de clan;
- vistas públicas compartidas.

## Puntos funcionales importantes

- renderiza fechas y horas según la zona horaria del usuario;
- usa `/api` como URL recomendada del backend detrás de Nginx;
- consume permisos efectivos del usuario para mostrar acciones;
- soporta eventos públicos/privados, plantillas de escuadras y reservas por clan.

## Build

El build de producción se genera con:

```bash
npm run build
```

El resultado va a `dist/` y en despliegue Docker lo sirve Nginx.
