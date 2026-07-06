#!/bin/bash
# ===========================================================================
# PROPIO INMUEBLES — Configuración de Nginx como Reverse Proxy + SSL Certbot
# Ejecutar como: sudo bash setup_nginx.sh (después de deploy_vps.sh)
# ===========================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║      PROPIO INMUEBLES — NGINX & SSL HARDENING SETUP      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 1. Instalar Nginx si no existe
if ! command -v nginx &> /dev/null; then
    echo "🌐 Instalar Nginx..."
    apt-get update -qq && apt-get install -y nginx -qq
    echo "  ✅ Nginx instalado."
else
    echo "  ✅ Nginx ya está instalado."
fi

# 2. Instalar Certbot y plugin de Nginx
if ! command -v certbot &> /dev/null; then
    echo "🔒 Instalando Certbot y extensiones..."
    apt-get install -y certbot python3-certbot-nginx -qq
    echo "  ✅ Certbot instalado."
else
    echo "  ✅ Certbot ya está instalado."
fi

# Crear directorio temporal para validaciones ACME si no existe
mkdir -p /var/www/html

# 3. Configuración inicial para el Frontend (HTTP puerto 80 con desafío ACME)
echo "📄 Creando configuración HTTP del Frontend..."
cat > /etc/nginx/sites-available/propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name propioinmuebles.com www.propioinmuebles.com;

    # Directorio para validación de Let's Encrypt (ACME Challenge)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Headers de seguridad básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

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
    }
}
NGINXEOF

# 4. Configuración inicial para el API (HTTP puerto 80 con desafío ACME)
echo "📄 Creando configuración HTTP del API..."
cat > /etc/nginx/sites-available/api.propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name api.propioinmuebles.com;

    # Directorio para validación de Let's Encrypt (ACME Challenge)
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Headers de seguridad básicos
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# 5. Habilitar sitios y eliminar default
echo "🔗 Activando configuraciones y limpiando enlaces default..."
ln -sf /etc/nginx/sites-available/propioinmuebles /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.propioinmuebles /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar sintaxis y reiniciar Nginx para levantar puerto 80
echo "🧪 Verificando sintaxis de Nginx..."
nginx -t

echo "🔄 Reiniciando Nginx..."
systemctl enable nginx --now
systemctl restart nginx

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║            HTTP (PORT 80) HABILITADO                     ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  El servidor ahora responde por el puerto 80 para:       ║"
echo "║  - propioinmuebles.com                                   ║"
echo "║  - www.propioinmuebles.com                               ║"
echo "║  - api.propioinmuebles.com                               ║"
echo "║                                                          ║"
echo "║  👉 INSTRUCCIÓN DE EJECUCIÓN DEL CERTIFICADO:            ║"
echo "║  Ejecuta el siguiente comando para generar los SSL:      ║"
echo "║  sudo certbot --nginx -d propioinmuebles.com \           ║"
echo "║    -d www.propioinmuebles.com -d api.propioinmuebles.com ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
