const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({ host: '172.233.14.148', username: 'root', password: '@Yuzuki35741xd', readyTimeout: 15000 })
.then(async () => {
  console.log('Conectado.\n');

  const r1 = await ssh.execCommand('ps aux | grep -i compose');
  console.log('=== COMPOSE PROCESSES ===\n' + r1.stdout);

  const r2 = await ssh.execCommand('docker compose -f /var/www/Inmobiliaria/docker-compose.yml ps 2>&1 || true');
  console.log('=== CONTAINERS ===\n' + r2.stdout);

  ssh.dispose();
})
.catch(e => console.error('SSH Error:', e.message));
