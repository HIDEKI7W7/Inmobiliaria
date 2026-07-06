const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

const NGINX_CONF_FIXED = `server {
    listen 80;
    server_name propioinmuebles.com www.propioinmuebles.com;
    client_max_body_size 50M;

    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;

ssh.connect({ host: '172.233.14.148', username: 'root', password: '@Yuzuki35741xd', readyTimeout: 15000 })
.then(async () => {
  console.log('Conectado. Aplicando corrección de Nginx (removiendo Connection Upgrade de peticiones HTTP estándar)...');

  // Escribir el nuevo config de nginx
  await ssh.execCommand(`cat > /etc/nginx/sites-available/propio.conf << 'NGINXEOF'\n${NGINX_CONF_FIXED}\nNGINXEOF`);

  // Validar y recargar nginx
  const r1 = await ssh.execCommand('nginx -t && systemctl reload nginx');
  console.log('=== NGINX RELOAD ===\n' + r1.stdout + r1.stderr);

  // Probar curl en puerto 80 con Host Header de propioinmuebles.com
  const r2 = await ssh.execCommand('curl -i -H "Host: propioinmuebles.com" http://127.0.0.1/ | head -25');
  console.log('=== CURL NGINX PORT 80 AFTER FIX ===\n' + r2.stdout);

  ssh.dispose();
})
.catch(e => console.error('SSH Error:', e.message));
