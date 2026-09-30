const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('web/YOSSICO_Panel_Admin.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;

window.esPagado = (e) => e === 'Pagado' || e === 'pagado';
window.fCOP = (n) => "$" + n;
window.todosPedidos = [
  { estado: 'pendiente', total: 1000, items: [{nombre: 'KYOTO', talla: 'M', color: 'Azul', price: 275900, qty: 1}] },
  { estado: 'Pagado', total: 275900, items: [{nombre: 'KYOTO', talla: 'M', color: 'Azul', price: 275900, qty: 1}] }
];
window.stockData = [
  { nombre: 'KYOTO', color: 'Azul', talla: 'M', costo_produccion: 78240 }
];
window.todosGastos = [
  { monto: 40000000 }
];

try {
  window.eval("renderFinanzas(todosPedidos)");
  console.log("Ingresos HTML:", window.document.getElementById('fin-ingresos').textContent);
  console.log("Breakeven Display:", window.document.getElementById('fin-breakeven-container').style.display);
  console.log("Breakeven Monto HTML:", window.document.getElementById('fin-breakeven-monto').textContent);
  console.log("Tabla Catalogo HTML:", window.document.getElementById('tabla-finanzas-catalogo').innerHTML);
} catch (e) {
  console.log("Error running renderFinanzas:", e.message);
  console.log(e.stack);
}
