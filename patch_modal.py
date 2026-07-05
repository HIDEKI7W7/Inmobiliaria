import sys

path = 'frontend/src/app/admin/page.tsx'
content = open(path, 'r', encoding='utf-8').read()

marker = '      {/* MODAL DE GESTIÓN DE DOCUMENTOS DE CONTRATO */}'
start = content.index(marker)
end = content.index('      )}', start) + len('      )}')

replacement = (
    '      {/* MODAL DE GESTIÓN DE DOCUMENTOS DE CONTRATO */}\n'
    '      {isDocsModalOpen && selectedContractForDocs && (\n'
    '        <ContractAuditModal\n'
    "          isOpen={isDocsModalOpen}\n"
    "          onClose={() => setIsDocsModalOpen(false)}\n"
    "          contract={selectedContractForDocs}\n"
    "          token={getToken() || ''}\n"
    "          contractDocuments={contractDocuments}\n"
    "          setContractDocuments={setContractDocuments}\n"
    '        />\n'
    '      )}'
)

# Also add import at top if missing
import_line = "import { ContractAuditModal } from '@/components/modules/contracts/ContractAuditModal';\n"
if import_line.strip() not in content:
    drop_filter_import = "import { DropdownFilter } from '@/components/ui/DropdownFilter';"
    content = content.replace(drop_filter_import, drop_filter_import + '\n' + import_line.rstrip())

new_content = content[:start] + replacement + content[end:]
open(path, 'w', encoding='utf-8').write(new_content)
print('Done. Replaced', end - start, 'chars starting at', start)
