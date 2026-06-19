#!/bin/bash
# ===========================================================================
# PROPIO INMUEBLES — Configuración de Nginx como Reverse Proxy
# Ejecutar como: bash setup_nginx.sh (después de deploy_vps.sh)
# ===========================================================================
set -e

echo ""
echo "🌐 Configurando Nginx como Reverse Proxy..."

# Instalar Nginx si no existe
if ! command -v nginx &> /dev/null; then
    apt-get update -qq && apt-get install -y nginx -qq
    echo "  ✅ Nginx instalado."
fi

# Configuración para el Frontend (propioinmuebles.com → puerto 3000)
cat > /etc/nginx/sites-available/propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name propioinmuebles.com www.propioinmuebles.com;

    # Headers de seguridad básicos
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Configuración para Cloudflare (confiar en IPs reales)
    real_ip_header CF-Connecting-IP;

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
        proxy_read_timeout 60s;
    }
}
NGINXEOF

# Configuración para el API (api.propioinmuebles.com → puerto 4000)
cat > /etc/nginx/sites-available/api.propioinmuebles << 'NGINXEOF'
server {
    listen 80;
    server_name api.propioinmuebles.com;

    # Headers de seguridad básicos
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Límite de tamaño para uploads
    client_max_body_size 10M;

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
        proxy_read_timeout 60s;
    }
}
NGINXEOF

# Habilitar sitios
ln -sf /etc/nginx/sites-available/propioinmuebles /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.propioinmuebles /etc/nginx/sites-enabled/

# Eliminar config default
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
nginx -t && echo "  ✅ Configuración Nginx válida."

# Reiniciar Nginx
systemctl enable nginx
systemctl restart nginx
echo "  ✅ Nginx reiniciado y habilitado en arranque."

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ NGINX CONFIGURADO                       ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  HTTP → propioinmuebles.com:80  → localhost:3000        ║"
echo "║  HTTP → api.propioinmuebles.com:80 → localhost:4000     ║"
echo "║                                                          ║"
echo "║  ℹ️  Cloudflare gestiona el HTTPS/SSL automáticamente   ║"
echo "║     (modo Flexible o Full en el dashboard CF)           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
