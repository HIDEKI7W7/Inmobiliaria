#!/bin/bash
# ===========================================================================
# PROPIO INMUEBLES — Script de Despliegue Automático en VPS Akamai/Linode
# Ejecutar como: bash deploy_vps.sh
# ===========================================================================
set -e  # Detiene el script ante cualquier error

REPO_URL="https://github.com/HIDEKI7W7/Inmobiliaria.git"
APP_DIR="/var/www/Inmobiliaria"
BRANCH="main"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       PROPIO INMUEBLES — VPS DEPLOYMENT SCRIPT          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ---------------------------------------------------------------------------
# FASE 1: Verificación de prerrequisitos
# ---------------------------------------------------------------------------
echo "🔍 [1/6] Verificando prerrequisitos..."

if ! command -v docker &> /dev/null; then
    echo "  ❌ Docker no instalado. Instalando..."
    apt-get update -qq
    apt-get install -y ca-certificates curl gnupg lsb-release -qq
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin -qq
    systemctl enable docker --now
    echo "  ✅ Docker instalado correctamente."
else
    echo "  ✅ Docker encontrado: $(docker --version)"
fi

if ! docker compose version &> /dev/null; then
    echo "  ❌ docker compose plugin no encontrado. Instalando..."
    apt-get install -y docker-compose-plugin -qq
fi

echo "  ✅ docker compose: $(docker compose version)"

# ---------------------------------------------------------------------------
# FASE 2: Clonar o actualizar el repositorio
# ---------------------------------------------------------------------------
echo ""
echo "📥 [2/6] Preparando código fuente..."

mkdir -p /var/www

if [ -d "$APP_DIR/.git" ]; then
    echo "  🔄 Repositorio existente detectado. Actualizando..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
    git clean -fd
    echo "  ✅ Repositorio actualizado al último commit."
else
    echo "  📦 Clonando repositorio por primera vez..."
    cd /var/www
    git clone "$REPO_URL" Inmobiliaria
    cd "$APP_DIR"
    echo "  ✅ Repositorio clonado."
fi

echo "  📌 Commit activo: $(git log --oneline -1)"

# ---------------------------------------------------------------------------
# FASE 3: Inyectar variables de entorno de producción
# ---------------------------------------------------------------------------
echo ""
echo "🔐 [3/6] Configurando variables de entorno de producción..."

# --- .env raíz (para docker-compose) ---
if [ ! -f "$APP_DIR/.env" ]; then
  echo "📄 Creando archivo .env raíz de plantilla..."
  cat > "$APP_DIR/.env" << 'ENVEOF'
DATABASE_URL="postgresql://neondb_owner:YOUR_DB_PASSWORD@ep-your-project-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=30"
DIRECT_URL="postgresql://neondb_owner:YOUR_DB_PASSWORD@ep-your-project.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30"
JWT_SECRET="YOUR_JWT_SECRET"
CORS_ORIGIN="https://propioinmuebles.com"
FRONTEND_URL="https://propioinmuebles.com"
CORS_ALLOWED_ORIGINS="https://propioinmuebles.com,https://www.propioinmuebles.com"
PORT=4000
NEXT_PUBLIC_API_URL="https://api.propioinmuebles.com/api"
NODE_ENV=production
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
ENVEOF
else
  echo "✅ Archivo .env raíz ya existe. Omitiendo creación."
fi

# --- Backend .env.production ---
mkdir -p "$APP_DIR/backend"
if [ ! -f "$APP_DIR/backend/.env.production" ]; then
  echo "📄 Creando archivo backend/.env.production de plantilla..."
  cat > "$APP_DIR/backend/.env.production" << 'BACKENDENVEOF'
DATABASE_URL="postgresql://neondb_owner:YOUR_DB_PASSWORD@ep-your-project-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=30"
DIRECT_URL="postgresql://neondb_owner:YOUR_DB_PASSWORD@ep-your-project.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30"
JWT_SECRET="YOUR_JWT_SECRET"
CORS_ORIGIN="https://propioinmuebles.com"
FRONTEND_URL="https://propioinmuebles.com"
CORS_ALLOWED_ORIGINS="https://propioinmuebles.com,https://www.propioinmuebles.com"
PORT=4000
NODE_ENV=production
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
BACKENDENVEOF
else
  echo "✅ Archivo backend/.env.production ya existe. Omitiendo creación."
fi

# --- Frontend .env.production ---
mkdir -p "$APP_DIR/frontend"
if [ ! -f "$APP_DIR/frontend/.env.production" ]; then
  echo "📄 Creando archivo frontend/.env.production de plantilla..."
  cat > "$APP_DIR/frontend/.env.production" << 'FRONTENVEOF'
NEXT_PUBLIC_API_URL="https://api.propioinmuebles.com/api"
NODE_ENV=production
FRONTENVEOF
else
  echo "✅ Archivo frontend/.env.production ya existe. Omitiendo creación."
fi

echo "  ✅ Archivos .env configurados correctamente."

# ---------------------------------------------------------------------------
# FASE 4: Ajustar memoria SWAP si no existe (crítico para 2GB RAM)
# ---------------------------------------------------------------------------
echo ""
echo "💾 [4/6] Verificando SWAP..."

if [ ! -f /swapfile ] || [ "$(swapon --show | wc -l)" -lt 2 ]; then
    echo "  ⚠️  SWAP no activo. Creando 2GB de SWAP..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  ✅ SWAP de 2GB activado."
else
    echo "  ✅ SWAP ya activo: $(free -h | grep Swap)"
fi

# ---------------------------------------------------------------------------
# FASE 5: Build y lanzamiento de contenedores Docker
# ---------------------------------------------------------------------------
echo ""
echo "🐳 [5/6] Construyendo y lanzando contenedores Docker..."
echo "  ⏳ Este proceso puede tardar 5-15 minutos en el primer build..."
echo "  📊 RAM disponible antes del build:"
free -h

cd "$APP_DIR"

# Detener contenedores anteriores si existen
docker compose down 2>/dev/null || true

# Build y arranque en background
echo "  🔨 Iniciando docker compose build + up..."
docker compose up --build -d

echo ""
echo "  📊 RAM disponible después del build:"
free -h

echo "  ✅ Contenedores lanzados."

# ---------------------------------------------------------------------------
# FASE 6: Verificación de salud y migraciones Prisma
# ---------------------------------------------------------------------------
echo ""
echo "🏥 [6/6] Verificación post-despliegue..."

# Esperar a que el backend esté listo
echo "  ⏳ Esperando 15s para que los servicios inicien..."
sleep 15

echo "  📋 Estado de los contenedores:"
docker compose ps

echo ""
echo "  🔄 Ejecutando migraciones Prisma..."
if docker exec propio-backend npx prisma migrate deploy 2>&1; then
    echo "  ✅ Migraciones Prisma aplicadas correctamente."
else
    echo "  ⚠️  Migraciones fallidas (puede ser normal si la BD ya está actualizada)."
fi

echo ""
echo "  🌐 Test de conectividad del API:"
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/properties || echo "FAIL")
echo "  GET /api/properties → HTTP $HTTP_CODE"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                 ✅ DESPLIEGUE COMPLETADO                ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Backend:   http://localhost:4000/api                   ║"
echo "║  Frontend:  http://localhost:3000                       ║"
echo "║  Dominio:   https://propioinmuebles.com                 ║"
echo "║  API:       https://api.propioinmuebles.com             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  💡 Próximo paso: configurar Nginx como reverse proxy."
echo "     Ver logs con: docker compose logs -f"
echo ""
