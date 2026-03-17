# Changelog

Resumen del estado actual entregado del proyecto.

## 2026-03-15

### Plataforma base

- despliegue completo con Docker Compose;
- backend con migraciones automáticas y admin bootstrap;
- frontend servido por Nginx;
- persistencia en volúmenes Docker;
- script de primer arranque `scripts/first-up.sh`.

### Usuarios y permisos

- autenticación local;
- recuperación y reseteo de contraseña;
- login y vinculación con Discord;
- roles `ADMIN`, `CLAN_LEADER`, `USER`;
- permisos por RBAC y overrides por usuario;
- soft-delete de usuarios;
- validación y administración de usuarios;
- fiabilidad y asistencia.

### Clanes

- creación, edición, avatar y restauración;
- listados y miembros;
- solicitudes de cambio de clan;
- cards y vistas ajustadas a UI actual.

### Registro con nuevo clan

- registro con clan existente;
- registro solicitando nuevo clan;
- revisión administrativa de solicitudes;
- aprobación que crea automáticamente el clan;
- promoción automática del solicitante a `CLAN_LEADER`;
- relación completa entre solicitud cumplida y clan creado.

### Juegos

- catálogo de juegos;
- alta, edición y borrado administrado;
- soporte para Arma 3 y Arma Reforger;
- identidades de juego por usuario.

### Eventos

- eventos públicos y privados;
- invitaciones a clanes;
- share público por token;
- briefing HTML;
- briefing PDF y modset HTML;
- soft-delete y restauración;
- descarga de slotlist y whitelist;
- vista detalle, operaciones y dashboard ajustados a zona horaria del usuario.

### Escuadras y slots

- creación y edición robusta de escuadras;
- corrección del bug de reaparición de escuadras y slots soft-deleted;
- duplicado de escuadras;
- plantillas por tipo;
- una sola escuadra de mando por evento;
- reserva de escuadras por clan;
- selector de reserva abierto a cualquier clan al crear o editar;
- nombres/frecuencias automáticos para nuevas escuadras;
- UI simplificada de plantillas.

### QA

Backend con tests para:
- registro y solicitud de nuevo clan;
- revisión administrativa de solicitud de clan;
- acceso a eventos privados;
- subida de archivos;
- edición de escuadras y filtrado de soft-delete.
