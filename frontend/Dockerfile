# ═══════════════════════════════════════════════════════════
# Frontend Dockerfile - Arma Multiclan Platform
# ═══════════════════════════════════════════════════════════

# Etapa 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Argumento para la URL del API (se pasa en build time)
ARG VITE_API_URL=http://localhost:3000/api

# Establecer variable de entorno para el build
ENV VITE_API_URL=$VITE_API_URL

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Etapa 2: Servidor Nginx
FROM nginx:alpine AS production

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear usuario no-root (nginx ya usa www-data)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
