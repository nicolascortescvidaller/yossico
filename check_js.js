const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('/Users/nicolascortesvidaller/yossico/web/YOSSICO_Panel_Admin.html', 'utf-8');

// Match all <script>...</script> blocks
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let allJs = '';

while ((match = scriptRegex.exec(html)) !== null) {
  // skip if it has src attribute (basic check)
  if (!match[0].includes('src=')) {
    allJs += match[1] + '\n';
  }
}

try {
  // Attempt to parse the concatenated scripts
  new vm.Script(allJs);
  console.log('Syntax OK');
} catch (e) {
  console.error('Syntax Error:', e);
  process.exit(1);
}
