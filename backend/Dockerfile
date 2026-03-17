# ═══════════════════════════════════════════════════════════
# Backend Dockerfile - Arma Multiclan Platform
# ═══════════════════════════════════════════════════════════

# Etapa 1: Construcción
FROM node:20-bookworm AS builder

WORKDIR /app
ENV npm_config_cache=/tmp/.npm

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de forma reproducible
RUN npm ci --no-audit --no-fund

# Copiar código fuente
COPY . .

# Generar Prisma y compilar
RUN node ./node_modules/prisma/build/index.js generate && \
    npm run build

# ═══════════════════════════════════════════════════════════
# Etapa 2: Producción
FROM node:20-bookworm AS production

WORKDIR /app
ENV NODE_ENV=production
ENV npm_config_cache=/tmp/.npm

# Reutilizar dependencias resueltas en build y podar las de desarrollo
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
RUN npm prune --omit=dev --no-audit --no-fund

# Copiar artefactos necesarios desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Crear directorio para uploads y dar permisos al entrypoint
RUN mkdir -p /app/public/uploads/clans /app/public/uploads/events && \
    chmod +x /app/entrypoint.sh && \
    chown -R node:node /app

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Entrypoint: espera DB, migra, arranca
ENTRYPOINT ["sh", "/app/entrypoint.sh"]
