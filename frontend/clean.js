const fs = require('fs');
const path = require('path');

const targets = ['.next', 'node_modules/.cache'];

console.log('🧹 Iniciando limpieza de caché y entorno de desarrollo en Propio...');

targets.forEach(target => {
  const fullPath = path.join(__dirname, target);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Eliminado con éxito: ${target}`);
    } catch (err) {
      console.error(`❌ Error al eliminar ${target}: ${err.message}`);
    }
  } else {
    console.log(`ℹ️ El directorio no existe, omitiendo: ${target}`);
  }
});

console.log('✨ Entorno limpio y listo para reinicio seguro.');
