const fs = require('fs');
const path = 'frontend/src/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Fix the missing closing )} for the isDocsModalOpen block
// Currently it ends with /> then \n\n    </div>
// Should be /> \n      )}\n\n    </div>
const bad = "        />\n\n\r\n\r\n    </div>";
const good = "        />\n      )}\n\n    </div>";

if (content.includes(bad)) {
  content = content.replace(bad, good);
  fs.writeFileSync(path, content, 'utf-8');
  console.log('Fixed closing tag.');
} else {
  // Try CRLF variant
  const bad2 = "        />\r\n\r\n\r\n\r\n    </div>";
  const good2 = "        />\r\n      )}\r\n\r\n    </div>";
  if (content.includes(bad2)) {
    content = content.replace(bad2, good2);
    fs.writeFileSync(path, content, 'utf-8');
    console.log('Fixed closing tag (CRLF variant).');
  } else {
    // Find index of the /> and check surroundings
    const idx = content.indexOf("        />\n      )}\n\n    </div>");
    if (idx !== -1) {
      console.log('Already correct!');
    } else {
      const idx2 = content.indexOf("        />");
      console.log('Found /> at', idx2, 'Context:', JSON.stringify(content.slice(idx2, idx2+50)));
    }
  }
}
