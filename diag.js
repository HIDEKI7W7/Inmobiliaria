const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({ host: '172.233.14.148', username: 'root', password: '@Yuzuki35741xd', readyTimeout: 15000 })
.then(async () => {
  console.log('Conectado. Aplicando fix de produccion...\n');

  // Agregar CORS_ALLOWED_ORIGINS al docker-compose para el backend
  // y forzar rebuild en el servidor (sin cache) para que Next.js tome NEXT_PUBLIC_API_URL correcto en build-time
  const fix = await ssh.execCommand(`
    cd /var/www/Inmobiliaria &&
    docker compose down --remove-orphans 2>&1 &&
    DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose build --no-cache --build-arg NEXT_PUBLIC_API_URL=https://propioinmuebles.com/api 2>&1 | tail -40 &&
    docker compose up -d 2>&1 &&
    sleep 8 &&
    docker compose ps 2>&1 &&
    curl -s -o /dev/null -w "Frontend HTTP: %{http_code}" http://localhost:3000 2>&1 &&
    curl -s -o /dev/null -w " | Backend HTTP: %{http_code}" http://localhost:4000/api 2>&1
  `, { timeout: 900000 });

  console.log(fix.stdout);
  if (fix.stderr) console.log('STDERR:', fix.stderr.slice(0, 300));

  ssh.dispose();
  console.log('\nFix completado.');
})
.catch(e => console.error('SSH Error:', e.message));
