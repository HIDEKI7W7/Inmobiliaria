const fs = require('fs');
const path = 'frontend/src/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// 1. Add import if missing
const importLine = `import { ContractAuditModal } from '@/components/modules/contracts/ContractAuditModal';`;
if (!content.includes(importLine)) {
  content = content.replace(
    `import { DropdownFilter } from '@/components/ui/DropdownFilter';`,
    `import { DropdownFilter } from '@/components/ui/DropdownFilter';\n${importLine}`
  );
}

// 2. Replace the docs modal block
const modalStart = `      {/* MODAL DE GESTIÓN DE DOCUMENTOS DE CONTRATO */}`;
const modalEnd = `      )}`;

const startIdx = content.indexOf(modalStart);
if (startIdx === -1) { console.error('Modal start not found'); process.exit(1); }

// Find the closing )} AFTER the modal start
let searchFrom = startIdx + modalStart.length;
const endIdx = content.indexOf(modalEnd, searchFrom) + modalEnd.length;

const replacement = `      {/* MODAL DE GESTIÓN DE DOCUMENTOS DE CONTRATO */}
      {isDocsModalOpen && selectedContractForDocs && (
        <ContractAuditModal
          isOpen={isDocsModalOpen}
          onClose={() => setIsDocsModalOpen(false)}
          contract={selectedContractForDocs}
          token={getToken() || ''}
          contractDocuments={contractDocuments}
          setContractDocuments={setContractDocuments}
        />
      )}`;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync(path, content, 'utf-8');
console.log('Done. Modal replaced successfully.');
