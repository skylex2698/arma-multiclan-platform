# ═══════════════════════════════════════════════════════════
# Frontend Dockerfile - Arma Multiclan Platform
# ═══════════════════════════════════════════════════════════

# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app
ENV npm_config_cache=/tmp/.npm

# Argumento para la URL del API (se pasa en build time)
ARG VITE_API_URL=http://localhost:3000/api

# Establecer variable de entorno para el build
ENV VITE_API_URL=$VITE_API_URL

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de forma reproducible
RUN npm ci --no-audit --no-fund

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Etapa 2: Servidor Nginx
FROM nginx:alpine AS production

# Copiar plantilla de configuración de nginx para interpolar variables
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiar archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear usuario no-root (nginx ya usa www-data)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Exponer puertos HTTP y HTTPS
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-check-certificate --no-verbose --tries=1 --spider https://127.0.0.1:443 || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
