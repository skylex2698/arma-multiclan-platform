# 🚀 Guía de Despliegue - Arma Multiclan Platform

Esta guía explica cómo desplegar la plataforma en un servidor usando Docker.

---

## 📋 Índice

1. [Requisitos del Servidor](#requisitos-del-servidor)
2. [Despliegue Rápido](#despliegue-rápido)
3. [Configuración Detallada](#configuración-detallada)
4. [Despliegue en Producción](#despliegue-en-producción)
5. [Comandos Útiles](#comandos-útiles)
6. [Actualizar la Aplicación](#actualizar-la-aplicación)
7. [Backups](#backups)
8. [Monitoreo y Logs](#monitoreo-y-logs)
9. [Configurar HTTPS con Nginx](#configurar-https-con-nginx)
10. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Requisitos del Servidor

### Mínimos
- **CPU**: 1 vCPU
- **RAM**: 2 GB
- **Disco**: 20 GB SSD
- **SO**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+

### Recomendados (para 50+ usuarios)
- **CPU**: 2 vCPU
- **RAM**: 4 GB
- **Disco**: 40 GB SSD

### Software Necesario
- Docker 20.10+
- Docker Compose 2.0+
- Git

### Instalar Docker y Docker Compose

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Añadir usuario al grupo docker (para ejecutar sin sudo)
sudo usermod -aG docker $USER

# Cerrar sesión y volver a entrar para aplicar cambios
exit

# Verificar instalación
docker --version
docker compose version
```

---

## ⚡ Despliegue Rápido

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/arma-multiclan-platform.git
cd arma-multiclan-platform
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Variables obligatorias a cambiar:**

```env
# Contraseña segura para PostgreSQL
POSTGRES_PASSWORD=tu_contraseña_muy_segura_123

# Secreto JWT (genera uno con: openssl rand -base64 32)
JWT_SECRET=tu_secreto_jwt_super_seguro_generado

# URL de tu servidor (cambia localhost por tu IP/dominio)
VITE_API_URL=http://TU_IP_O_DOMINIO:3000/api
FRONTEND_URL=http://TU_IP_O_DOMINIO
```

### Paso 3: Iniciar los Contenedores

```bash
# Construir e iniciar (primera vez)
docker compose up -d --build

# Ver logs en tiempo real
docker compose logs -f
```

### Paso 4: Cargar Datos Iniciales (Opcional)

```bash
# Ejecutar seed para crear usuarios de prueba
docker compose exec backend npx prisma db seed
```

### Paso 5: Acceder a la Aplicación

- **Frontend**: `http://TU_IP_O_DOMINIO`
- **API**: `http://TU_IP_O_DOMINIO:3000/api`

**Usuarios de prueba** (si ejecutaste el seed):
| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@arma.com | Admin123! | Admin |
| leader@arma.com | Leader123! | Líder |
| user@arma.com | User123! | Usuario |

---

## ⚙️ Configuración Detallada

### Estructura de Archivos Docker

```
arma-multiclan-platform/
├── docker-compose.yml        # Orquestación principal
├── docker-compose.prod.yml   # Configuración de producción
├── .env.example              # Variables de entorno (ejemplo)
├── .env                      # Variables de entorno (tu config)
├── backend/
│   ├── Dockerfile            # Imagen del backend
│   └── .dockerignore
└── frontend/
    ├── Dockerfile            # Imagen del frontend
    ├── nginx.conf            # Configuración de Nginx
    └── .dockerignore
```

### Variables de Entorno Completas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_USER` | Usuario de PostgreSQL | `arma_user` |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `contraseña_segura` |
| `POSTGRES_DB` | Nombre de la base de datos | `arma_platform` |
| `JWT_SECRET` | Secreto para firmar tokens | `abc123...` (32+ chars) |
| `JWT_EXPIRES_IN` | Duración del token | `7d` |
| `VITE_API_URL` | URL del API (desde navegador) | `http://ip:3000/api` |
| `FRONTEND_URL` | URL del frontend (para CORS) | `http://ip` |
| `DISCORD_CLIENT_ID` | ID de app Discord (opcional) | `123456789` |
| `DISCORD_CLIENT_SECRET` | Secret de app Discord | `abcdef...` |

---

## 🏭 Despliegue en Producción

Para producción, usa el archivo adicional `docker-compose.prod.yml`:

```bash
# Iniciar con configuración de producción
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Cambios en Producción

El archivo `docker-compose.prod.yml` aplica:
- ✅ PostgreSQL no expuesto al exterior
- ✅ Límites de CPU y memoria
- ✅ Configuración optimizada de PostgreSQL
- ✅ Rotación de logs automática

### Configuración Recomendada para Producción

```env
# .env para producción
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAMESITE=strict

# Usa tu dominio real
VITE_API_URL=https://api.tudominio.com/api
FRONTEND_URL=https://tudominio.com
DISCORD_REDIRECT_URI=https://api.tudominio.com/api/auth/discord/callback
```

---

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Ver estado de los contenedores
docker compose ps

# Iniciar contenedores
docker compose up -d

# Parar contenedores
docker compose down

# Reiniciar un servicio específico
docker compose restart backend

# Ver logs de un servicio
docker compose logs -f backend

# Ver logs de todos los servicios
docker compose logs -f
```

### Base de Datos

```bash
# Acceder a PostgreSQL
docker compose exec postgres psql -U arma_user -d arma_platform

# Ejecutar migraciones manualmente
docker compose exec backend npx prisma migrate deploy

# Abrir Prisma Studio (interfaz visual)
docker compose exec backend npx prisma studio

# Reset de base de datos (⚠️ BORRA TODO)
docker compose exec backend npx prisma migrate reset --force
```

### Gestión de Volúmenes

```bash
# Ver volúmenes
docker volume ls

# Inspeccionar volumen de datos
docker volume inspect arma-postgres-data

# Backup de PostgreSQL
docker compose exec postgres pg_dump -U arma_user arma_platform > backup.sql

# Restaurar backup
cat backup.sql | docker compose exec -T postgres psql -U arma_user arma_platform
```

---

## 🔄 Actualizar la Aplicación

### Actualización Estándar

```bash
# 1. Obtener últimos cambios
git pull origin main

# 2. Reconstruir y reiniciar
docker compose up -d --build

# 3. Ejecutar migraciones si hay cambios en la BD
docker compose exec backend npx prisma migrate deploy
```

### Actualización con Zero Downtime

```bash
# 1. Obtener cambios
git pull origin main

# 2. Reconstruir imágenes sin parar servicios
docker compose build

# 3. Reiniciar un servicio a la vez
docker compose up -d --no-deps backend
docker compose up -d --no-deps frontend
```

---

## 💾 Backups

### Backup Manual

```bash
# Crear directorio de backups
mkdir -p backups

# Backup de base de datos
docker compose exec -T postgres pg_dump -U arma_user arma_platform > backups/db_$(date +%Y%m%d_%H%M%S).sql

# Backup de archivos subidos
docker cp arma-backend:/app/public/uploads backups/uploads_$(date +%Y%m%d_%H%M%S)
```

### Backup Automático (Cron)

Crea el script `/opt/arma-backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/arma"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup BD
docker compose -f /path/to/arma-multiclan-platform/docker-compose.yml \
  exec -T postgres pg_dump -U arma_user arma_platform | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
docker cp arma-backend:/app/public/uploads $BACKUP_DIR/uploads_$DATE

# Eliminar backups antiguos (mantener 7 días)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completado: $DATE"
```

Añade al crontab (`crontab -e`):

```cron
# Backup diario a las 3:00 AM
0 3 * * * /opt/arma-backup.sh >> /var/log/arma-backup.log 2>&1
```

---

## 📊 Monitoreo y Logs

### Ver Logs

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Últimas 100 líneas
docker compose logs --tail=100 backend
```

### Monitorear Recursos

```bash
# Uso de recursos en tiempo real
docker stats

# Solo servicios de la plataforma
docker stats arma-backend arma-frontend arma-postgres
```

### Health Checks

```bash
# Verificar estado de salud
docker inspect --format='{{.State.Health.Status}}' arma-backend
docker inspect --format='{{.State.Health.Status}}' arma-frontend
docker inspect --format='{{.State.Health.Status}}' arma-postgres
```

---

## 🔒 Configurar HTTPS con Nginx

Para producción, se recomienda usar un proxy inverso con HTTPS.

### Opción 1: Nginx + Certbot (Let's Encrypt)

```bash
# Instalar Nginx y Certbot
sudo apt install nginx certbot python3-certbot-nginx

# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/arma-platform
```

Contenido del archivo:

```nginx
server {
    server_name tudominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name api.tudominio.com;

    # Backend API
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Para uploads grandes
        client_max_body_size 20M;
    }
}
```

```bash
# Activar sitio
sudo ln -s /etc/nginx/sites-available/arma-platform /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d api.tudominio.com
```

### Opción 2: Traefik (Alternativa con Docker)

Añade Traefik al `docker-compose.yml` para gestión automática de certificados.

---

## ❓ Solución de Problemas

### El backend no conecta con PostgreSQL

```bash
# Verificar que postgres esté corriendo
docker compose ps postgres

# Ver logs de postgres
docker compose logs postgres

# Verificar red interna
docker network inspect arma-network
```

### Error "port already in use"

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000
sudo lsof -i :80

# Matar proceso o cambiar puerto en .env
BACKEND_PORT=3001
FRONTEND_PORT=8080
```

### La base de datos no tiene datos

```bash
# Ejecutar migraciones
docker compose exec backend npx prisma migrate deploy

# Cargar datos de prueba
docker compose exec backend npx prisma db seed
```

### Los archivos subidos se pierden al reiniciar

Verifica que el volumen esté montado:

```bash
docker volume ls | grep uploads
docker volume inspect arma-uploads-data
```

### Errores de CORS

1. Verifica `FRONTEND_URL` en `.env`
2. Asegúrate de que coincide exactamente con la URL desde donde accedes
3. Si usas HTTPS, la URL debe incluir `https://`

### Reconstruir desde cero

```bash
# ⚠️ ESTO BORRA TODOS LOS DATOS
docker compose down -v
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker compose logs -f`
2. Consulta la [documentación del proyecto](README.md)
3. Abre un issue en GitHub con:
   - Descripción del problema
   - Logs relevantes
   - Sistema operativo y versión de Docker

---

**Hecho con ❤️ para la comunidad de Arma**
