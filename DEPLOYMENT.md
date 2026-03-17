# Despliegue

Guía operativa para levantar la plataforma en una máquina nueva.

## Requisitos

- Docker
- Docker Compose v2
- `openssl`

## Primer despliegue

### Recomendado

```bash
git clone <repo>
cd arma-multiclan-platform
./scripts/first-up.sh
```

### Manual

```bash
cp .env.example .env
docker compose up --build -d
```

## Qué ocurre al arrancar

En el primer arranque:
- PostgreSQL crea la base;
- backend aplica migraciones Prisma;
- backend inicializa el admin bootstrap si no existe;
- frontend construye la SPA y expone Nginx;
- uploads y base de datos quedan persistidos en volúmenes Docker.

## Puertos por defecto

- `8081`: frontend HTTP
- `8000`: frontend HTTPS
- `3000`: backend
- `5432`: PostgreSQL

## Variables mínimas a revisar

En `.env`:

```env
POSTGRES_PASSWORD=...
JWT_SECRET=...
FRONTEND_URL=https://localhost
COOKIE_SECURE=true
```

Si usas Discord:

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://tu-dominio/api/auth/discord/callback
```

## Comandos útiles

Levantar:

```bash
docker compose up -d
```

Reconstruir:

```bash
docker compose up -d --build
```

Estado:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs -f
```

Parar:

```bash
docker compose down
```

Parar borrando datos persistentes:

```bash
docker compose down -v
```

## Actualización del proyecto

En una actualización normal:

```bash
git pull
docker compose up -d --build
```

No hace falta copiar `node_modules` ni builds previos.

## Backup

Backup lógico de PostgreSQL:

```bash
docker compose exec -T postgres pg_dump -U arma_user arma_platform > backup.sql
```

Restore:

```bash
cat backup.sql | docker compose exec -T postgres psql -U arma_user arma_platform
```

## Verificación post-despliegue

Comprobar:
- `docker compose ps`
- `backend` en `healthy`
- `frontend` en `healthy`
- `postgres` en `healthy`

API de salud:

```bash
docker compose exec -T backend wget -qO- http://localhost:3000/health
```

## Limpieza de artefactos locales

Si vas a empaquetar el proyecto:

```bash
rm -rf backend/node_modules frontend/node_modules backend/dist frontend/dist
```

Eso no afecta a Docker. Son artefactos regenerables.

## Problemas frecuentes

### El backend no conecta a PostgreSQL

Revisa:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- si cambiaste credenciales después del primer arranque, recrea volúmenes con `docker compose down -v`

### Discord no redirige correctamente

Revisa:
- `DISCORD_REDIRECT_URI`
- `FRONTEND_URL`
- el dominio y puerto exactos registrados en Discord

### Cookies no persisten

Revisa:
- `COOKIE_SECURE`
- si usas HTTP local, no fuerces `COOKIE_SECURE=true`

### El frontend carga pero la API falla

Revisa:
- `VITE_API_URL`
- proxy de Nginx
- estado `healthy` del backend
