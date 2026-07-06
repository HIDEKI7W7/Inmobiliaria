#!/bin/bash
# ===========================================================================
# PROPIO INMUEBLES — Configuración de Nginx como Reverse Proxy con SSL Dual (80/443)
# Ejecutar como: sudo bash setup_nginx.sh
# ===========================================================================
set -e

echo ""
echo "🌐 Iniciando auditoría e instalación de Nginx y Certbot para Producción..."

# 1. Instalar Nginx y Certbot
if ! command -v nginx &> /dev/null; then
    echo "📥 Instalando Nginx..."
    apt-get update -qq && apt-get install -y nginx -qq
    echo "  ✅ Nginx instalado."
fi

if ! command -v certbot &> /dev/null; then
    echo "📥 Instalando Certbot y plugin de Nginx..."
    apt-get install -y certbot python3-certbot-nginx -qq
    echo "  ✅ Certbot instalado."
fi

# 2. Configurar temporalmente en puerto 80 para la validación HTTP inicial de Certbot (si no existen certificados)
if [ ! -f /etc/letsencrypt/live/propioinmuebles.com/fullchain.pem ]; then
    echo "🔑 Certificados SSL no detectados. Creando configuración temporal en puerto 80..."
    
    cat > /etc/nginx/sites-available/propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name propioinmuebles.com www.propioinmuebles.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

    cat > /etc/nginx/sites-available/api.propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name api.propioinmuebles.com;
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

    ln -sf /etc/nginx/sites-available/propioinmuebles /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/api.propioinmuebles /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-enabled/propio.conf
    systemctl restart nginx
    
    echo "🔒 Solicitando certificados SSL de Let's Encrypt..."
    certbot certonly --nginx -d propioinmuebles.com -d www.propioinmuebles.com -d api.propioinmuebles.com --non-interactive --agree-tos -m soporte@propioinmuebles.com
fi

# 3. Escribir configuración definitiva unificada de producción 80 & 443 SSL.
# Esto previene de forma absoluta los bucles de redirección infinita de Cloudflare
# al permitir servir tráfico HTTPS directamente y también HTTP en el puerto 80 (Flexible SSL).
echo "📝 Escribiendo configuración unificada de producción..."

cat > /etc/nginx/sites-available/propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    listen 443 ssl;
    server_name propioinmuebles.com www.propioinmuebles.com;

    # Headers de seguridad básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Certificados Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/propioinmuebles.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/propioinmuebles.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

cat > /etc/nginx/sites-available/api.propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    listen 443 ssl;
    server_name api.propioinmuebles.com;

    # Headers de seguridad básicos
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Límite de tamaño para uploads de imágenes de inmuebles (15MB)
    client_max_body_size 15M;

    # Certificados Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/propioinmuebles.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/propioinmuebles.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

# 4. Habilitar sitios y remover default/conflictivos
echo "🔗 Activando configuraciones unificadas..."
ln -sf /etc/nginx/sites-available/propioinmuebles /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.propioinmuebles /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/propio.conf

# Verificar sintaxis final
nginx -t

# Recargar Nginx
systemctl restart nginx
echo "  ✅ Configuración unificada HTTP/HTTPS de Nginx aplicada con éxito."

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║             ✅ CONFIGURACIÓN DUAL APLICADA               ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  HTTPS -> https://propioinmuebles.com   (Port 443)       ║"
echo "║  HTTP  -> http://propioinmuebles.com    (Port 80)        ║"
echo "║                                                          ║"
echo "║  🛡️  Compatible con Cloudflare Flexible, Full y Strict    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
