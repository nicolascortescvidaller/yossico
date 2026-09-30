const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('web/YOSSICO_Panel_Admin.html', 'utf8');
const dom = new JSDOM(html);
const window = dom.window;
const document = window.document;

// We need to extract the JS from the HTML. The easiest way is to run it in the context of the JSDOM window.
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/g);
const allScripts = scriptMatch.map(s => s.replace(/<\/?script>/g, '')).join('\n');

const scriptEl = document.createElement("script");
scriptEl.textContent = allScripts;
document.body.appendChild(scriptEl);

// Now we need to mock the data
window.esPagado = (e) => e === 'Pagado';
window.fCOP = (n) => "$" + n;
window.todosPedidos = [
  { estado: 'pendiente', total: 1000, items: [{nombre: 'KYOTO', talla: 'M', color: 'Azul', price: 275900, qty: 1}] }
];
window.stockData = [
  { nombre: 'KYOTO', color: 'Azul', talla: 'M', costo_produccion: 78240 }
];
window.todosGastos = [
  { monto: 40000000 }
];

try {
  window.renderFinanzas(window.todosPedidos);
  console.log("Render Finanzas executed.");
  console.log("Ingresos HTML:", document.getElementById('fin-ingresos').textContent);
  console.log("Breakeven Display:", document.getElementById('fin-breakeven-container').style.display);
  console.log("Breakeven Monto HTML:", document.getElementById('fin-breakeven-monto').textContent);
  console.log("Tabla Histórico HTML:", document.getElementById('tabla-finanzas-prendas').innerHTML);
  console.log("Tabla Catalogo HTML:", document.getElementById('tabla-finanzas-catalogo').innerHTML);
} catch (e) {
  console.log("Error running renderFinanzas:", e.message);
  console.log(e.stack);
}
