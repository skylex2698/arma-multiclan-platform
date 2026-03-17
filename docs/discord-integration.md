# Integración con Discord

Resumen actualizado de la integración OAuth2 con Discord.

## Qué soporta

- login con Discord;
- vinculación de una cuenta Discord a una cuenta existente;
- callback OAuth2;
- uso de cookies httpOnly para sesión;
- compatibilidad con despliegue detrás de Nginx.

## Rutas actuales

Públicas:
- `GET /api/auth/discord/start`
- `GET /api/auth/discord/callback`

Protegidas:
- `GET /api/auth/discord/link/start`
- `GET /api/auth/discord/link/callback`

## Variables necesarias

En `.env`:

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=https://tu-dominio/api/auth/discord/callback
FRONTEND_URL=https://tu-dominio
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

## Configuración en Discord Developer Portal

Debes registrar exactamente el mismo callback que uses en `.env`.

Ejemplo:

```text
https://tu-dominio/api/auth/discord/callback
```

Si usas vinculación de cuenta, añade también:

```text
https://tu-dominio/api/auth/discord/link/callback
```

## Consideraciones

- `DISCORD_REDIRECT_URI` debe coincidir carácter por carácter.
- En local por HTTP, revisa `COOKIE_SECURE=false`.
- En producción por HTTPS, usa `COOKIE_SECURE=true`.

## Flujo resumido

### Login

1. El usuario inicia el flujo en `/api/auth/discord/start`.
2. Discord redirige al callback.
3. Backend valida el `state`, resuelve la cuenta y crea la sesión.
4. Frontend consulta `/api/auth/me` para obtener el usuario.

### Vinculación

1. Usuario autenticado inicia `/api/auth/discord/link/start`.
2. Discord redirige al callback de link.
3. Backend asocia el `discordId` a la cuenta autenticada.

## Diagnóstico rápido

Si falla:
- revisa `DISCORD_CLIENT_ID`;
- revisa `DISCORD_CLIENT_SECRET`;
- revisa `DISCORD_REDIRECT_URI`;
- revisa `FRONTEND_URL`;
- revisa cookies y HTTPS.
