import re

with open('web/YOSSICO_Panel_Admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the end of renderPautaLista to include chartPautaHist
pattern = r'      options: \{ responsive: true, maintainAspectRatio: false, plugins: \{ legend: \{ position: \'right\', labels: \{ boxWidth: 12 \} \} \} \}\n    \}\);\n  \}\n\}'

new_code = '''      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } } }
    });
  }
  
  const ctxHist = document.getElementById('chart-pauta-hist')?.getContext('2d');
  if(ctxHist) {
    if(chartPautaHist) chartPautaHist.destroy();
    
    // Group by month
    const histData = {};
    window.todaPauta.forEach(p => {
      const mes = new Date(p.fecha).toLocaleDateString('es-CO', {month:'short', year:'numeric'});
      histData[mes] = (histData[mes] || 0) + parseFloat(p.monto||0);
    });
    
    chartPautaHist = new Chart(ctxHist, {
      type: 'bar',
      data: {
        labels: Object.keys(histData).reverse(),
        datasets: [{ label: 'Inversión Total', data: Object.values(histData).reverse(), backgroundColor: '#ff9800', borderRadius: 4 }]
      },
      options: { 
        responsive: true, maintainAspectRatio: false, 
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + (value/1000).toFixed(0) + 'k'; } } } }
      }
    });
  }
}'''

content = re.sub(pattern, new_code, content)

with open('web/YOSSICO_Panel_Admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added chartPautaHist.")
