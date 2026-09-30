const html = `
<div id="modal-rma" class="hidden"></div>
<input type="hidden" id="rma-pedido-id">
<div id="rma-items-container"></div>
`;
const { JSDOM } = require("jsdom");
const dom = new JSDOM(html);
const document = dom.window.document;

const todosPedidos = [{
  id: "test-id",
  items: [{nombre: "KYOTO", talla: "S", qty: 1}]
}];

function abrirModalRMA(pedidoId) {
  const p = todosPedidos.find(x => x.id === pedidoId);
  if (!p) {
    console.log("Pedido not found");
    return;
  }
  document.getElementById('rma-pedido-id').value = pedidoId;
  
  const container = document.getElementById('rma-items-container');
  container.innerHTML = '';
  
  (p.items || []).forEach((item, index) => {
    const div = document.createElement('div');
    div.style = "display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border:1px solid var(--grisCl); border-radius:4px; background:var(--blanco);";
    // Encode the JSON string to avoid quote issues in HTML
    const val = encodeURIComponent(JSON.stringify(item));
    div.innerHTML = `
      <input type="checkbox" id="rma-item-${index}" value="${val}">
      <label for="rma-item-${index}" style="font-size:0.8rem; cursor:pointer; flex:1">
        <strong>${item.nombre}</strong> ${item.color ? '- ' + item.color : ''} ${item.talla ? ' (Talla ' + item.talla + ')' : ''} x${item.qty || 1}
      </label>
    `;
    container.appendChild(div);
  });
  
  document.getElementById('modal-rma').classList.remove('hidden');
  console.log("Success, container innerHTML:");
  console.log(container.innerHTML);
}

abrirModalRMA("test-id");
