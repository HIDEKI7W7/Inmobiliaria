# ==========================================
# Dockerfile Multietapa (Multi-Stage) para Monorrepo Inmobiliaria
# Optimizado para servidores de bajos recursos (2GB RAM)
# ==========================================

# --- Base ---
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat ca-certificates
ENV NODE_ENV=production

# --- Backend Builder ---
FROM base AS backend-builder
ENV NODE_ENV=development
# Copiar archivos de dependencias
COPY backend/package*.json ./backend/
COPY prisma ./prisma/
# Instalar dependencias (incluyendo las de desarrollo para compilar TypeScript)
RUN cd backend && npm ci --fetch-timeout=300000 --fetch-retries=5 --fetch-retry-mintimeout=20000
# Copiar código fuente del backend
COPY backend ./backend/
# Generar cliente de Prisma
RUN cd backend && npx prisma generate --schema=../prisma/schema.prisma --generator client
# Cambiar a entorno de producción para compilar NestJS sin dev runtime
ENV NODE_ENV=production
RUN cd backend && npm run build
# Eliminar dependencias de desarrollo para aligerar la imagen
RUN cd backend && npm prune --production

# --- Frontend Builder ---
FROM base AS frontend-builder
ENV NODE_ENV=development
# Copiar archivos de dependencias
COPY frontend/package*.json ./frontend/
# Instalar dependencias
RUN cd frontend && npm ci --fetch-timeout=300000 --fetch-retries=5 --fetch-retry-mintimeout=20000
# Copiar código fuente del frontend
COPY frontend ./frontend/
# Cambiar a entorno de producción para compilar Next.js
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
# Compilar frontend Next.js
RUN cd frontend && npm run build

# --- Backend Runtime ---
FROM node:20-alpine AS backend-runtime
WORKDIR /app
RUN apk add --no-cache openssl ca-certificates
ENV NODE_ENV=production

# Copiar artefactos compilados y dependencias de producción
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/prisma ./prisma

EXPOSE 4000
ENV PORT=4000
CMD ["node", "dist/main"]

# --- Frontend Runtime ---
FROM node:20-alpine AS frontend-runtime
WORKDIR /app
ENV NODE_ENV=production

# Copiar archivos necesarios para Next.js
COPY --from=frontend-builder /app/frontend/package*.json ./
COPY --from=frontend-builder /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
