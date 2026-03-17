# Arma Multiclan Platform

Plataforma web para gestionar clanes, usuarios y operaciones de Arma 3 y Arma Reforger con foco en despliegue Docker, portabilidad y operación comunitaria.

## Estado actual

El proyecto está funcional y desplegable con `docker compose`.

Incluye:
- autenticación local y login/vinculación con Discord;
- catálogo de juegos administrable;
- clanes con avatar, edición, soft-delete y restauración;
- usuarios con roles, permisos efectivos y overrides;
- eventos públicos y privados;
- invitaciones de clanes a eventos privados;
- escuadras, slots, reservas por clan y plantillas de escuadra;
- share público de eventos;
- briefing HTML, briefing PDF y modset HTML;
- zona horaria por usuario;
- onboarding de registro con solicitud de nuevo clan;
- aprobación administrativa que crea automáticamente el clan y convierte al solicitante en líder del clan;
- QA backend para flujos críticos.

## Stack

- Backend: Node.js, TypeScript, Express 5, Prisma, PostgreSQL
- Frontend: React, TypeScript, Vite, TanStack Query, Zustand, Tailwind
- Infra: Docker, Docker Compose, Nginx

## Arranque rápido

### Opción recomendada

```bash
./scripts/first-up.sh
```

Ese script:
- crea `.env` desde `.env.example` si falta;
- genera `JWT_SECRET` si sigue con el placeholder;
- limpia `node_modules` y `dist` locales;
- ejecuta `docker compose up --build -d`;
- limpia imágenes colgantes;
- muestra el estado final.

### Opción manual

```bash
cp .env.example .env
docker compose up --build -d
```

## Servicios por defecto

- Frontend HTTP: `http://localhost:8081`
- Frontend HTTPS: `https://localhost:8000`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Variables importantes

Revisa en `.env` al menos:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `FRONTEND_URL`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `COOKIE_SECURE`

## Flujos relevantes

### Registro con clan existente

El usuario se registra, queda `PENDING` y debe ser validado por admin o líder de clan según corresponda.

### Registro solicitando nuevo clan

El usuario crea cuenta y genera una `ClanCreationRequest`.

Cuando un admin la aprueba:
- se crea el clan automáticamente;
- el usuario pasa a `ACTIVE`;
- el usuario queda asignado al clan;
- el usuario pasa a `CLAN_LEADER`.

### Eventos privados

Un evento privado puede ser visible para:
- admins;
- clan creador;
- clanes invitados;
- clanes con escuadras reservadas.

## QA y validación

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run build
```

La validación más reciente del proyecto incluye arranque limpio en Docker desde copia tipo clon y verificación de servicios sanos.

## Estructura

```text
backend/     API, Prisma, servicios, tests
frontend/    aplicación React
docker/      certificados y utilidades de despliegue
docs/        documentación puntual
scripts/     automatización operativa
```

## Archivos útiles

- [DEPLOYMENT.md](DEPLOYMENT.md): despliegue y operación
- [CHANGELOG.md](CHANGELOG.md): resumen del estado entregado
- [MANUAL_DE_CAMBIOS.md](MANUAL_DE_CAMBIOS.md): síntesis funcional de lo implementado
- [docs/discord-integration.md](docs/discord-integration.md): flujo Discord

## Notas operativas

- No hace falta guardar `node_modules` ni `dist`.
- Los datos persistentes viven en volúmenes Docker.
- Si quieres reinicio total de datos, usa `docker compose down -v`.
- Para mover el proyecto a otra máquina puedes generar un paquete portable con `./scripts/create-transfer-tar.sh`.
- El paquete excluye `.git`, `node_modules`, `dist` y caches regenerables. La configuración de `.env` sí se incluye si existe en el árbol.
