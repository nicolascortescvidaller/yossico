const fs = require('fs');
const html = fs.readFileSync('web/YOSSICO_Panel_Admin.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);

// Extract the JS to test if there are syntax errors or obvious issues
const allScripts = scriptMatch.map(s => s.replace(/<\/?script>/g, '')).join('\n');
console.log("Extracted JS length:", allScripts.length);

try {
  // Just parsing it
  new Function(allScripts);
  console.log("JS parses successfully.");
} catch(e) {
  console.log("Syntax error in JS:", e.message);
}
