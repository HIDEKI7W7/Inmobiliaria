# ==========================================
# STAGE 1: Compilación de la Aplicación
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de dependencias del backend
COPY backend/package*.json ./

# Instalar dependencias completas (incluidas las de desarrollo para compilar)
RUN npm ci

# Copiar el esquema de base de datos de Prisma y archivos clave del backend
COPY prisma/ ./prisma/
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/src/ ./src/

# Generar el cliente de Prisma usando el esquema centralizado
RUN npx prisma generate --schema=prisma/schema.prisma

# Compilar la aplicación de NestJS a código de producción (dist/)
RUN npm run build

# ==========================================
# STAGE 2: Imagen de Ejecución de Producción
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Declarar variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Copiar manifiesto de dependencias del backend
COPY backend/package*.json ./

# Instalar únicamente dependencias de producción para minimizar el tamaño de la imagen
RUN npm ci --only=production

# Copiar los compilados y los clientes de Prisma generados en el Stage 1
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /usr/src/app/prisma ./prisma

# Exponer el puerto asignado para producción
EXPOSE 4000

# Comando definitivo de arranque combinando migraciones de base de datos antes de arrancar NestJS
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/main"]
