const fs = require('fs');
const html = fs.readFileSync('web/YOSSICO_Panel_Admin.html', 'utf-8');

// Extract all <script> blocks to check for syntax errors
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let scriptContent = '';
while ((match = scriptRegex.exec(html)) !== null) {
  scriptContent += match[1] + '\n';
}

fs.writeFileSync('test_extracted.js', scriptContent);
