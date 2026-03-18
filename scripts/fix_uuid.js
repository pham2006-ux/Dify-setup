const fs = require('fs');

// Fix link-manager.html
const linkManagerPath = 'c:/Users/phamm/Desktop/Dify構築/ポートフォリオサイト/admin/link-manager.html';
let lm = fs.readFileSync(linkManagerPath, 'utf8');

// The error was sending an explicit ID which wasn't always a valid UUID, 
// so we simply remove 'id' and let DB's gen_random_uuid() handle it.
lm = lm.replace(/id: newEntry\.id,/g, '');
lm = lm.replace(/id: entry\.id,/g, '');

// Save link-manager.html
fs.writeFileSync(linkManagerPath, lm, 'utf8');

// Fix mcp-url-generator/index.js
const mcpIndex = 'c:/Users/phamm/Desktop/Dify構築/mcp-url-generator/index.js';
let mcp = fs.readFileSync(mcpIndex, 'utf8');

mcp = mcp.replace(/id: entryId,/g, '');

fs.writeFileSync(mcpIndex, mcp, 'utf8');

console.log('Fixed DB insertion');