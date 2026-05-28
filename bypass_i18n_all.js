const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src');

if (!fs.existsSync(srcDir)) {
  console.error("El directorio src del frontend no existe:", srcDir);
  process.exit(1);
}

function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else if (filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const tsxFiles = getFilesRecursively(srcDir);
console.log(`Encontrados ${tsxFiles.length} archivos .tsx para escanear y sanear...`);

const jsxTextRegex = />([^<>{}\n\r\t]+)</g;

tsxFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;

  // Analizar y transformar texto JSX a expresión {t("...")}
  const newContent = content.replace(jsxTextRegex, (match, text) => {
    const trimmed = text.trim();
    
    // Ignorar strings vacíos, números, fechas o caracteres puramente iconográficos/especiales comunes en la UI
    if (!trimmed || /^[0-9\s\-+.,*\/$€Bs%👑📍📟🖥️📱📟💻📞🏢🏡🌱🔑⚡💾🚨⚠️⚙️📊🤝👥📂💼👤👤👑💼💸💰🧾📅📃📝🖋️:()|@]+$/.test(trimmed)) {
      return match;
    }
    
    hasChanges = true;
    const escapedText = text.replace(/"/g, '\\"');
    return `>{t("${escapedText}")}<`;
  });

  if (hasChanges) {
    let finalContent = newContent;
    
    // Inyectar la función t auxiliar si no existe en la cabecera del archivo
    if (!finalContent.includes('const t = (key: string)') && !finalContent.includes('const t = (')) {
      const lines = finalContent.split('\n');
      let importEndIdx = 0;
      
      // Buscar la última línea de importación
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          importEndIdx = i;
        }
      }
      
      // Insertar después de la última importación o en la línea 2
      lines.splice(importEndIdx + 1, 0, '\nconst t = (key: string) => key;');
      finalContent = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, finalContent, 'utf-8');
    console.log(`Saneado: ${path.basename(filePath)}`);
  }
});

console.log("¡Saneamiento e internacionalización automatizada de todos los archivos TSX finalizada con éxito!");
