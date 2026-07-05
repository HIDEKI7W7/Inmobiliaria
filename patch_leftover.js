const fs = require('fs');
const path = 'frontend/src/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Remove the leftover orphaned modal HTML after the new ContractAuditModal component tag
// The leftover starts right after      )} on line 14224 and ends with the old closing      )}
const leftoverStart = '      )}\r\n              </div>\r\n\r\n              {/* 2. DOCUMENTOS Y ANEXOS DEL CONTRATO';
const leftoverEnd = '      )}\r\n\r\n    </div>';

const s = content.indexOf(leftoverStart);
const e = content.indexOf(leftoverEnd, s) + leftoverEnd.length;

if (s === -1) {
  console.log('Leftover start not found, checking with \\n endings...');
  const s2 = content.indexOf('      )}\n              </div>');
  console.log('s2:', s2);
  process.exit(0);
}

content = content.slice(0, s) + '\r\n\r\n    </div>' + content.slice(e);
fs.writeFileSync(path, content, 'utf-8');
console.log('Done. Leftover removed. s=', s, 'e=', e);
