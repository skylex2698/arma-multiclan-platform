# Manual de Cambios

Documento breve de referencia funcional del estado actual.

## Objetivo del sistema

Gestionar operaciones multiclan con control de usuarios, clanes, eventos, escuadras, slots, asistencia y permisos.

## Cambios funcionales ya incorporados

### Registro y onboarding

- registro clásico con clan existente;
- registro solicitando nuevo clan;
- aprobación administrativa de nuevo clan;
- creación automática del clan al aprobar;
- asignación automática del solicitante como líder del clan;
- unicidad real por email.

### Gestión de usuarios

- validación de usuarios pendientes;
- edición administrativa de perfil, rol y permisos;
- reseteo administrativo de contraseña;
- soft-delete de usuarios.

### Gestión de clanes

- creación y edición;
- subida y borrado de avatar;
- miembros y liderazgo;
- cambios de clan mediante solicitud;
- soft-delete y restauración.

### Gestión de eventos

- creación desde cero y desde plantilla;
- eventos públicos y privados;
- invitaciones a clanes;
- estado activo, inactivo y finalizado;
- archivos del evento;
- share público.

### Escuadras y slots

- plantillas por tipo;
- duplicado de escuadras;
- validación de una sola escuadra de mando;
- reserva de escuadras para cualquier clan durante crear/editar;
- edición estable sin reaparición de escuadras ni pax eliminados;
- soporte de jerarquía de comunicaciones.

### UX y calidad de vida

- zona horaria configurable por usuario;
- horas mostradas según el perfil del usuario;
- selector completo de zonas horarias en perfil;
- UI más clara en plantillas de escuadras;
- mensajes de error de subida más explícitos.

## Estado operativo

El sistema está pensado para:
- desplegarse con Docker Compose;
- persistir datos en volúmenes;
- poder clonar, configurar `.env` y levantar con `docker compose up --build -d`.

## Validación hecha

Se comprobó:
- build backend;
- build frontend;
- tests backend;
- arranque limpio tipo clon;
- salud correcta de `postgres`, `backend` y `frontend`.

## Recomendación final

Para primer arranque usar:

```bash
./scripts/first-up.sh
```
