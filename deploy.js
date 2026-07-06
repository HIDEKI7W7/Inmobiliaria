#!/usr/bin/env node
/**
 * ============================================================
 * PROPIO INMUEBLES — Script de Deploy Automatizado para VPS
 * Uso: node deploy.js
 * ============================================================
 */

const { execSync }  = require('child_process');
const path          = require('path');
const fs            = require('fs');
const os            = require('os');

// ── Configuración del servidor ──────────────────────────────
const VPS = {
  host:      '172.233.14.148',
  username:  'root',
  password:  '@Yuzuki35741xd',
  remoteDir: '/var/www/Inmobiliaria',
};

const DOMAIN       = 'https://propioinmuebles.com';
const LOCAL_DIR    = path.resolve(__dirname);
const ARCHIVE_NAME = 'propio_deploy.tar.gz';
const ARCHIVE_PATH = path.join(os.tmpdir(), ARCHIVE_NAME);

// ── Variables de entorno de producción ──────────────────────
const PROD_ENV = [
  `DATABASE_URL=postgresql://neondb_owner:npg_fTKUaxjRGD73@ep-dawn-truth-ad1jjz75-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=30`,
  `DIRECT_URL=postgresql://neondb_owner:npg_fTKUaxjRGD73@ep-dawn-truth-ad1jjz75.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=30`,
  `PORT=4000`,
  `JWT_SECRET=ea82a472bb58ffcdcf9e54a558b9f3d61b369c0d54020c68abef68dae178120d`,
  `CORS_ORIGIN=${DOMAIN}`,
  `FRONTEND_URL=${DOMAIN}`,
  `CORS_ALLOWED_ORIGINS=${DOMAIN},https://www.propioinmuebles.com`,
  `NEXT_PUBLIC_API_URL=https://api.propioinmuebles.com/api`,
  `GOOGLE_CLIENT_ID=1047060533529-voghc370q9c4u041pric7f2lqvb606kg.apps.googleusercontent.com`,
  `GOOGLE_CLIENT_SECRET=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`,
  `GOOGLE_CALLBACK_URL=https://api.propioinmuebles.com/api/auth/google/callback`,
  `NODE_ENV=production`,
  `IS_DOCKER=true`,
  `PHOTON_URL=https://photon.komoot.io`,
].join('\n');

// ── Nginx config ────────────────────────────────────────────
const NGINX_CONF = `server {
    listen 80;
    server_name propioinmuebles.com www.propioinmuebles.com;
    client_max_body_size 50M;

    location /api {
        proxy_pass         http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \\$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \\$host;
        proxy_set_header   X-Real-IP \\$remote_addr;
        proxy_set_header   X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\$scheme;
        proxy_read_timeout 300;
    }

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \\$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \\$host;
        proxy_set_header   X-Real-IP \\$remote_addr;
        proxy_set_header   X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \\$scheme;
    }
}`;

// ── Helpers ──────────────────────────────────────────────────
function log(msg) { console.log(`\n▶  ${msg}`); }
function ok(msg)  { console.log(`   ✅ ${msg}`); }
function die(msg) { console.error(`   ❌ ${msg}`); process.exit(1); }

// ── FASE 1: Empaquetar con tar nativo (Windows 10+ lo trae) ─
function packProject() {
  log('FASE 1 — Empaquetando código fuente limpio...');

  if (fs.existsSync(ARCHIVE_PATH)) fs.unlinkSync(ARCHIVE_PATH);

  // Exclusiones compatibles con tar de Windows
  const excludes = [
    '--exclude=./.git',
    '--exclude=./node_modules',
    '--exclude=./frontend/node_modules',
    '--exclude=./backend/node_modules',
    '--exclude=./frontend/.next',
    '--exclude=./backend/dist',
    '--exclude=./.venv',
    '--exclude=./sistema-propio.tar.gz',
    '--exclude=./propio_deploy.tar.gz',
    '--exclude=./.env',
    '--exclude=./frontend/.env',
    '--exclude=./frontend/.env.local',
    '--exclude=./backend/.env',
  ].join(' ');

  try {
    execSync(
      `tar ${excludes} -czf "${ARCHIVE_PATH}" .`,
      { cwd: LOCAL_DIR, stdio: 'pipe' }
    );
    const sizeMB = (fs.statSync(ARCHIVE_PATH).size / 1024 / 1024).toFixed(2);
    ok(`Paquete listo: ${ARCHIVE_PATH} (${sizeMB} MB)`);
  } catch (e) {
    die(`Error al empaquetar: ${e.message}`);
  }
}

// ── FASE 2+3: SSH — subir + desplegar ───────────────────────
async function deployToVPS() {
  log('FASE 2 — Conectando al VPS via SSH...');

  const { NodeSSH } = require('node-ssh');
  const ssh = new NodeSSH();

  await ssh.connect({
    host:         VPS.host,
    username:     VPS.username,
    password:     VPS.password,
    readyTimeout: 30000,
  });
  ok(`Conectado a ${VPS.host}`);

  // Preparar directorio remoto
  await ssh.execCommand(`mkdir -p ${VPS.remoteDir}`);

  // Subir archivo
  log('FASE 2 — Transfiriendo paquete al servidor (puede tardar 1-3 min)...');
  await ssh.putFile(ARCHIVE_PATH, `/tmp/${ARCHIVE_NAME}`);
  ok('Transferencia completada.');

  // Descomprimir (limpiar primero para evitar conflictos)
  log('FASE 3 — Descomprimiendo en el servidor...');
  await ssh.execCommand(
    `rm -rf ${VPS.remoteDir}/frontend ${VPS.remoteDir}/backend ${VPS.remoteDir}/prisma && ` +
    `tar -xzf /tmp/${ARCHIVE_NAME} -C ${VPS.remoteDir} && ` +
    `rm -f /tmp/${ARCHIVE_NAME}`
  );
  ok('Descompresión completada.');

  // Inyectar .env de producción
  log('FASE 3 — Inyectando variables de entorno de producción...');
  // Escribimos el .env línea a línea de forma segura
  const envLines = PROD_ENV.split('\n').map(l => l.replace(/"/g, '\\"')).join('\\n');
  await ssh.execCommand(`printf '${PROD_ENV.replace(/'/g, "'\\''")}' > ${VPS.remoteDir}/.env`);
  ok('.env de producción escrito.');

  // Instalar y configurar nginx usando el script setup_nginx.sh
  log('FASE 3 — Configurando nginx y Certbot SSL...');
  const { stdout: nginxOut, stderr: nginxErr } = await ssh.execCommand(`
    chmod +x ${VPS.remoteDir}/setup_nginx.sh &&
    bash ${VPS.remoteDir}/setup_nginx.sh
  `);
  console.log(nginxOut + nginxErr);
  ok('Nginx + Certbot configurados con éxito.');

  // Verificar / instalar Docker
  log('FASE 3 — Verificando Docker...');
  const { stdout: dockerVer } = await ssh.execCommand('docker --version 2>&1 || echo MISSING');
  if (dockerVer.includes('MISSING')) {
    log('Instalando Docker (primera vez)...');
    await ssh.execCommand(`
      apt-get update -qq &&
      apt-get install -y ca-certificates curl gnupg lsb-release -qq &&
      mkdir -p /etc/apt/keyrings &&
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg &&
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list &&
      apt-get update -qq &&
      apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin -qq &&
      systemctl enable docker --now
    `);
    ok('Docker instalado.');
  } else {
    ok(dockerVer.trim());
  }

  // Reconstruir contenedores
  log('FASE 3 — Reconstruyendo contenedores Docker (esto tarda ~5 min)...');
  const { stdout: buildOut, stderr: buildErr } = await ssh.execCommand(
    `cd ${VPS.remoteDir} && ` +
    `DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 ` +
    `docker compose down --remove-orphans 2>&1 && ` +
    `DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 ` +
    `docker compose up -d --build --force-recreate 2>&1`,
    { timeout: 900000 }
  );
  // Mostrar últimas líneas del build
  const buildLog = (buildOut + buildErr).split('\n').slice(-20).join('\n');
  console.log(buildLog);

  // Correr migraciones Prisma en producción
  log('FASE 3 — Corriendo migraciones Prisma...');
  const { stdout: migrationOut, stderr: migrationErr } = await ssh.execCommand(
    `docker exec propio-backend npx prisma migrate deploy`
  );
  console.log(migrationOut + migrationErr);
  ok('Migraciones de base de datos finalizadas.');

  // Estado final
  log('RESULTADO FINAL:');
  const { stdout: psOut } = await ssh.execCommand(`cd ${VPS.remoteDir} && docker compose ps`);
  console.log(psOut);

  ssh.dispose();

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  ✅ DEPLOY COMPLETADO                                     ║');
  console.log('║  🌐 https://propioinmuebles.com                          ║');
  console.log('║  🔧 API: https://propioinmuebles.com/api                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

// ── MAIN ────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     PROPIO INMUEBLES — DEPLOY AUTOMATIZADO VPS           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  try {
    packProject();
    await deployToVPS();
  } catch (e) {
    die(`Deploy fallido: ${e.message}\n${e.stack}`);
  }
})();
