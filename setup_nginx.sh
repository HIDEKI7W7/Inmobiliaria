#!/bin/bash
# ===========================================================================
# PROPIO INMUEBLES — Configuración de Nginx como Reverse Proxy con SSL (Certbot)
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

# 2. Configuración base HTTP para el Frontend (propioinmuebles.com -> puerto 3000)
# REMOCIÓN DE CABECERAS DE UPGRADE: Se eliminan 'Upgrade' y 'Connection: upgrade' para evitar
# que Next.js interprete las peticiones HTTP normales como WebSockets y lance TypeError en base-server.js.
echo "📝 Creando configuración de Nginx para el Frontend..."
cat > /etc/nginx/sites-available/propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name propioinmuebles.com www.propioinmuebles.com;

    # Headers de seguridad básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

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

# 3. Configuración base HTTP para la API (api.propioinmuebles.com -> puerto 4000)
echo "📝 Creando configuración de Nginx para la API..."
cat > /etc/nginx/sites-available/api.propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name api.propioinmuebles.com;

    # Headers de seguridad básicos
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Límite de tamaño para uploads de imágenes de inmuebles (15MB)
    client_max_body_size 15M;

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

# 4. Habilitar sitios y remover default/confictivos
echo "🔗 Activando configuraciones y limpiando archivos por defecto..."
ln -sf /etc/nginx/sites-available/propioinmuebles /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.propioinmuebles /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/propio.conf

# Verificar configuración inicial
nginx -t

# Reiniciar Nginx para aplicar cambios de puerto 80
systemctl restart nginx
echo "  ✅ Configuración HTTP básica de Nginx cargada con éxito."

# 5. Generar certificados SSL con Certbot de manera automatizada y redirigir tráfico HTTP -> HTTPS
echo "🔒 Solicitando certificados SSL de Let's Encrypt vía Certbot..."
echo "⚠️  Nota: Asegúrate de que los DNS A Records de propioinmuebles.com, www.propioinmuebles.com y api.propioinmuebles.com ya apunten a la IP pública de este VPS."

# Ejecutar obtención de certificados
certbot --nginx -d propioinmuebles.com -d www.propioinmuebles.com -d api.propioinmuebles.com --non-interactive --agree-tos -m soporte@propioinmuebles.com --redirect

# Recargar Nginx con los certificados inyectados por Certbot
systemctl reload nginx

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ NGINX + SSL CONFIGURADO                  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  HTTPS -> https://propioinmuebles.com    -> port 3000   ║"
echo "║  HTTPS -> https://www.propioinmuebles.com -> port 3000   ║"
echo "║  HTTPS -> https://api.propioinmuebles.com -> port 4000   ║"
echo "║                                                          ║"
echo "║  🔒 SSL Auto-Renovación habilitada por systemd timer.    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
