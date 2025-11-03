// script.js (Versão final integrada com backend e Insights Aprimorados)
const API_BASE = 'http://localhost:8000/api'; // Se servir o frontend com server local, '/api' mapeará para backend local
let currentData = [];
let dynamicChart = null;
let currentMetric = 'TOTAL_REVENUE';
let currentGroupBy = 'CHANNEL';

// --- Labels amigáveis ---
const METRICS = {
  TOTAL_REVENUE: 'Faturamento Total (R$)',
  AVG_TICKET: 'Ticket Médio (R$)',
  SIMULATED_PROFIT: 'Lucro Simulado (R$)', // NOVO: Lucro
  TIME_DELIVERY: 'Tempo Médio de Entrega (min)',
  PRODUCT_SALES: 'Total de Produtos Vendidos'
};

const DIMENSIONS = {
  CHANNEL: 'Canal de Venda',
  STORE: 'Loja',
  PRODUCT: 'Produto', // NOVO: Agrupamento por Produto
  DAY_OF_WEEK: 'Dia da Semana',
  MONTH_YEAR: 'Mês/Ano'
};

// --- Utilitários ---
function formatCurrency(v) {
  if (v === null || v === undefined) return 'R$ 0,00';
  const n = Number(v);
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatValue(v, metric) {
  if (metric.includes('REVENUE') || metric.includes('TICKET') || metric.includes('PROFIT')) {
    return formatCurrency(v);
  }
  if (metric.includes('TIME_DELIVERY')) {
    return `${Math.round(v)} min`;
  }
  return v; // Número simples
}

function showLoading(show = true) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// --- Update filters (popula selects) ---
async function updateFilters() {
  // Simulação de filtros (idealmente viriam da API: /sales/aggregates/channels, /sales/aggregates/stores)
  let channels = ['iFood', 'Rappi', 'Balcão', 'WhatsApp', 'App Próprio'];
  let stores = ['Unidade Centro', 'Unidade Paulista', 'Unidade Jardins']; // Fallback amigável para Maria

  const channelSelect = document.getElementById('channelFilter');
  const storeSelect = document.getElementById('storeFilter');

  channels.forEach(c => {
    let opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    channelSelect.appendChild(opt);
  });

  stores.forEach(s => {
    let opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    storeSelect.appendChild(opt);
  });
}

// --- Dashboard Initial KPIs & Recent Sales ---
async function refreshDashboard() {
  showLoading();
  try {
    // 1. Fetch KPIs
    const kpis = await fetch(`${API_BASE}/metrics`).then(res => res.json()).catch(() => ({}));

    document.getElementById('kpiTotalRevenue').textContent = formatCurrency(kpis.total_revenue || 580000);
    document.getElementById('kpiAvgTicket').textContent = formatCurrency(kpis.avg_ticket || 65.50);
    document.getElementById('kpiTotalSales').textContent = (kpis.total_sales || 8850).toLocaleString('pt-BR');
    document.getElementById('kpiActiveStores').textContent = kpis.active_stores || 3;

    // 2. Fetch Recent Sales
    const recentSales = await fetch(`${API_BASE}/sales/recent`).then(res => res.json()).catch(() => ([
      { sale_id: 12345, store_name: "Unidade Centro", channel_name: "iFood", total_amount: 85.90, created_at: "2025-10-31T19:30:00Z" },
      { sale_id: 12344, store_name: "Unidade Paulista", channel_name: "Balcão", total_amount: 55.00, created_at: "2025-10-31T19:25:00Z" },
      { sale_id: 12343, store_name: "Unidade Jardins", channel_name: "App Próprio", total_amount: 112.50, created_at: "2025-10-31T19:15:00Z" },
    ]));

    const salesTableBody = document.getElementById('salesTable');
    salesTableBody.innerHTML = '';
    recentSales.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      salesTableBody.innerHTML += `
        <tr>
          <td>${sale.sale_id}</td>
          <td>${sale.store_name}</td>
          <td>${sale.channel_name}</td>
          <td class="text-success">${formatCurrency(sale.total_amount)}</td>
          <td>${date}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Erro ao carregar o dashboard inicial:", error);
    // Fallback data is already set in the catch blocks above
  } finally {
    showLoading(false);
  }
}

// --- Main Query Function ---
async function runCustomQuery() {
  showLoading();
  const metric = document.getElementById('metricSelect').value;
  const groupBy = document.getElementById('groupBySelect').value;
  const channel = document.getElementById('channelFilter').value;
  const store = document.getElementById('storeFilter').value;
  const period = document.getElementById('periodFilter').value; // NOVO

  currentMetric = metric;
  currentGroupBy = groupBy;

  // Montar o payload
  const payload = {
    metric: metric,
    group_by: groupBy,
    filters: {
      channel: channel,
      store: store,
      period_of_day: period // NOVO: incluir o período
    }
    // Adicionar outros filtros se necessário (e.g., data_range)
  };

  try {
    // 1. Fetch data from API
    // Assumimos que o endpoint /analytics é capaz de processar todas as combinações
    const response = await fetch(`${API_BASE}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    // Simulação da margem de lucro se a métrica for SIMULATED_PROFIT
    if (metric === 'SIMULATED_PROFIT') {
      // Simular que o lucro é 35% do faturamento para fins de demonstração no frontend
      currentData = data.map(item => ({
        ...item,
        total: item.total * 0.35
      }));
    } else {
      currentData = data;
    }


    // 2. Renderizar resultados
    renderCustomResults(currentData, metric, groupBy);
    checkAndDisplayInsights(currentData, metric, groupBy);

  } catch (error) {
    console.error("Erro ao executar a query customizada:", error);
    document.getElementById('customTableContainer').innerHTML = `<p class="alert alert-danger">❌ Erro ao buscar dados. Verifique o servidor.</p>`;
    currentData = [];
    document.getElementById('exportBtn').style.display = 'none';
  } finally {
    showLoading(false);
  }
}

// --- Render Chart & Table ---
function renderCustomResults(data, metric, groupBy) {
  if (dynamicChart) {
    dynamicChart.destroy();
  }

  const metricLabel = METRICS[metric];
  const groupByLabel = DIMENSIONS[groupBy];
  const chartCanvas = document.getElementById('customChart');

  document.getElementById('customChartTitle').textContent = `📊 ${metricLabel} por ${groupByLabel}`;
  document.getElementById('exportBtn').style.display = data.length > 0 ? 'inline-block' : 'none';

  if (data.length === 0) {
    document.getElementById('customTableContainer').innerHTML = `<p class="text-secondary text-center">Nenhum dado encontrado para esta combinação de filtros.</p>`;
    return;
  }

  // Ordenar para Produto mais vendido/Lucrativo (Top 10)
  if (groupBy === 'PRODUCT' && data.length > 10) {
    data.sort((a, b) => b.total - a.total);
    data = data.slice(0, 10);
    document.getElementById('customChartTitle').textContent = `🏆 Top 10 ${metricLabel} por ${groupByLabel}`;
  }


  // Configuração do Chart.js
  const labels = data.map(item => item.dimension_key);
  const values = data.map(item => item.total);

  let chartType;
  if (groupBy === 'PRODUCT' || data.length < 8) {
    chartType = 'bar';
  } else if (data.length > 15) {
    chartType = 'line'; // Usar linha para séries temporais longas
  } else {
    chartType = 'bar';
  }

  const chartConfig = {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: metricLabel,
        data: values,
        backgroundColor: chartType === 'line' ? 'rgba(75, 192, 192, 0.5)' : 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: chartType === 'line' ? 3 : 1,
        fill: chartType === 'line' ? true : false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return formatValue(value, metric).replace('R$', '').trim();
            }
          }
        }
      },
      plugins: {
        legend: {
          display: data.length > 1
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += formatValue(context.parsed.y, metric);
              return label;
            }
          }
        }
      }
    }
  };

  dynamicChart = new Chart(chartCanvas, chartConfig);


  // Renderizar a Tabela
  let tableHTML = `
    <table class="table table-striped table-hover">
        <thead>
            <tr>
                <th>${groupByLabel}</th>
                <th class="text-end">${metricLabel}</th>
            </tr>
        </thead>
        <tbody>
  `;

  data.forEach(item => {
    tableHTML += `
      <tr>
        <td>${item.dimension_key}</td>
        <td class="text-end">${formatValue(item.total, metric)}</td>
      </tr>
    `;
  });

  tableHTML += `
        </tbody>
    </table>
  `;

  document.getElementById('customTableContainer').innerHTML = tableHTML;
}

// --- Insights Acionáveis Aprimorados (EDIÇÃO 4 + NOVO: Lucro e Horário) ---
function checkAndDisplayInsights(data, metric, groupBy) {
  const element = document.getElementById('insightMessage');
  element.style.display = 'none';
  element.className = 'alert'; // Reset class

  if (data.length === 0) return;

  const average = data.reduce((sum, item) => sum + item.total, 0) / data.length;

  // 1. Insights para Ticket Médio (AVG_TICKET)
  if (metric === 'AVG_TICKET' && groupBy !== 'MONTH_YEAR') {
    const opportunities = data.filter(item => item.total < average * 0.90); // 10% abaixo da média
    if (opportunities.length > 0) {
      element.className = 'alert alert-warning';
      const worst = opportunities[0];
      element.innerHTML = `⚠️ **Oportunidade de Vendas:** O agrupamento **${worst.dimension_key}** tem Ticket Médio de ${formatCurrency(worst.total)}, **10% abaixo da média (${formatCurrency(average)})**. **Ação:** Considere combos ou cross-sell para este grupo.`;
      element.style.display = 'block';
      return;
    }
  }

  // 2. Insights para Lucro Simulado (SIMULATED_PROFIT)
  if (metric === 'SIMULATED_PROFIT' && groupBy === 'PRODUCT') {
    const sorted = [...data].sort((a, b) => a.total - b.total);
    const worstProduct = sorted[0];
    const bestProduct = sorted[sorted.length - 1];

    if (worstProduct.total < 10) { // Lucro muito baixo
      element.className = 'alert alert-danger';
      element.innerHTML = `🔥 **Alerta Financeiro:** O produto **${worstProduct.dimension_key}** tem um Lucro Simulado de apenas ${formatCurrency(worstProduct.total)}. **Ação:** Avalie aumentar o preço ou reduzir custos imediatamente.`;
      element.style.display = 'block';
      return;
    }

    element.className = 'alert alert-success';
    element.innerHTML = `💰 **Foco de Lucro:** O produto **${bestProduct.dimension_key}** é o mais lucrativo. **Ação:** Priorize o marketing e a disponibilidade deste produto.`;
    element.style.display = 'block';
    return;
  }

  // 3. Insights para Tempo de Entrega (TIME_DELIVERY) - Pior Dia/Horário
  if (metric === 'TIME_DELIVERY') {
    const timeLimit = 45; // 45 minutos é o limite operacional (exemplo)
    const critical = data.filter(item => item.total > average * 1.20 && item.total > timeLimit);

    if (critical.length > 0) {
      element.className = 'alert alert-danger';
      const highestTime = critical[0]; // Pega o primeiro crítico
      element.innerHTML = `🚨 **Alerta Operacional:** O agrupamento **${highestTime.dimension_key}** (Pior Dia/Horário) tem Tempo Médio de Entrega de **${Math.round(highestTime.total)} minutos**, 20% acima da média. **Ação:** Revise a equipe de cozinha e logística neste dia/agrupamento para reduzir o atraso e evitar cancelamentos.`;
      element.style.display = 'block';
      return;
    }
  }

  // 4. Insights para Faturamento (TOTAL_REVENUE) - Sugestão de Estoque
  if (metric === 'TOTAL_REVENUE' && groupBy === 'DAY_OF_WEEK') {
    const highestRevenue = data.sort((a, b) => b.total - a.total)[0];
    element.className = 'alert alert-info';
    element.innerHTML = `📈 **Planejamento de Estoque:** O dia mais forte é **${highestRevenue.dimension_key}** com ${formatCurrency(highestRevenue.total)} em faturamento. **Ação:** Assegure estoque e equipe de pico para este dia.`;
    element.style.display = 'block';
    return;
  }
}


// --- CSV Export ---
function exportToCSV() {
  if (!currentData || currentData.length === 0) return alert("Nenhum dado para exportar.");

  const metricLabel = METRICS[document.getElementById('metricSelect').value];
  const groupByLabel = DIMENSIONS[document.getElementById('groupBySelect').value];

  const headers = [`"${groupByLabel}"`, `"${metricLabel}"`];
  let csv = headers.join(';') + '\n';
  currentData.forEach(row => {
    const val = (row.total === null || row.total === undefined) ? '' : String(row.total).replace('.', ',');
    csv += `"${row.dimension_key}";"${val}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'nola_relatorio_personalizado.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  updateFilters();
  refreshDashboard();

  document.getElementById('runQueryBtn').addEventListener('click', runCustomQuery);
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);

  // Event Listeners para facilitar a visualização do filtro
  document.getElementById('metricSelect').addEventListener('change', () => {
    currentMetric = document.getElementById('metricSelect').value;
    if (currentMetric === 'TIME_DELIVERY') {
      document.getElementById('periodFilter').value = 'NIGHT'; // Sugerir "Noite" para ver o pior tempo
      document.getElementById('groupBySelect').value = 'DAY_OF_WEEK';
    }
    if (currentMetric === 'SIMULATED_PROFIT' || currentMetric === 'PRODUCT_SALES') {
      document.getElementById('groupBySelect').value = 'PRODUCT';
    }
  });

  document.getElementById('groupBySelect').addEventListener('change', () => {
    currentGroupBy = document.getElementById('groupBySelect').value;
    if (currentGroupBy === 'PRODUCT') {
      document.getElementById('metricSelect').value = 'PRODUCT_SALES';
    }
  });
});