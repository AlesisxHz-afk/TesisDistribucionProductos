let todosProductos = [];
let chartBarras = null, chartDonut = null, chartArea = null;
let sortDir = {};

const COLORES = ['#40e0d0','#fdd54f','#f87171','#a78bfa','#60a5fa','#fb923c','#34d399','#e879f9','#f472b6','#2dd4bf'];

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicarFiltros);
    document.getElementById('btn-reset').addEventListener('click', resetFiltros);
    document.getElementById('tabla-search').addEventListener('input', buscarEnTabla);
});

function cargarDatos() {
    fetch('/main/reporte/obtener_productos')
        .then(r => r.json())
        .then(data => {
            if (!data.success) throw new Error(data.message || 'Error');
            todosProductos = data.productos;
            poblarFiltroTipo(todosProductos);
            actualizarTodo(todosProductos);
        })
        .catch(e => {
            document.getElementById('tabla-body').innerHTML = `<tr><td colspan="7" style="color:#f87171;text-align:center;padding:20px;">Error: ${e.message}</td></tr>`;
        });
}

function poblarFiltroTipo(prods) {
    const tipos = [...new Set(prods.map(p => p.tipo))].filter(Boolean).sort();
    const sel = document.getElementById('filtro-tipo');
    tipos.forEach(t => {
        const o = document.createElement('option');
        o.value = t; o.textContent = t;
        sel.appendChild(o);
    });
}

function aplicarFiltros() {
    const tipo = document.getElementById('filtro-tipo').value;
    const estado = document.getElementById('filtro-estado').value;
    let filtrados = todosProductos;
    if (tipo) filtrados = filtrados.filter(p => p.tipo === tipo);
    if (estado) filtrados = filtrados.filter(p => p.estado_producto === estado);
    actualizarTodo(filtrados);
}

function resetFiltros() {
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('tabla-search').value = '';
    actualizarTodo(todosProductos);
}

function actualizarTodo(prods) {
    actualizarKPIs(prods);
    actualizarCharts(prods);
    renderTabla(prods);
}

function actualizarKPIs(prods) {
    document.getElementById('kpi-total').textContent = prods.length;
    document.getElementById('kpi-activos').textContent = prods.filter(p => p.estado_producto === 'ACTIVO').length;
    document.getElementById('kpi-inactivos').textContent = prods.filter(p => p.estado_producto === 'INACTIVO').length;
    const stockTotal = prods.reduce((s, p) => s + (p.cant_productos_act || 0), 0);
    document.getElementById('kpi-stock-total').textContent = stockTotal.toLocaleString('es-PE', {maximumFractionDigits: 0});
}

function actualizarCharts(prods) {
    // Agrupar por tipo
    const byTipo = {};
    prods.forEach(p => {
        byTipo[p.tipo] = (byTipo[p.tipo] || 0) + (p.cant_productos_act || 0);
    });
    const tipos = Object.keys(byTipo);
    const stocks = tipos.map(t => byTipo[t]);
    const colores = tipos.map((_, i) => COLORES[i % COLORES.length]);

    // Barras
    if (chartBarras) chartBarras.destroy();
    chartBarras = new Chart(document.getElementById('chart-barras'), {
        type: 'bar',
        data: {
            labels: tipos,
            datasets: [{
                label: 'Stock actual',
                data: stocks,
                backgroundColor: colores.map(c => c + 'bb'),
                borderColor: colores,
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw.toLocaleString('es-PE')} unidades` } } },
            scales: {
                x: { ticks: { color: '#7fc8e8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#7fc8e8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // Donut: activos vs inactivos
    const activos = prods.filter(p => p.estado_producto === 'ACTIVO').length;
    const inactivos = prods.filter(p => p.estado_producto === 'INACTIVO').length;
    if (chartDonut) chartDonut.destroy();
    chartDonut = new Chart(document.getElementById('chart-donut'), {
        type: 'doughnut',
        data: {
            labels: ['Activos', 'Inactivos'],
            datasets: [{ data: [activos, inactivos], backgroundColor: ['#4ade80cc','#f87171cc'], borderColor: ['#4ade80','#f87171'], borderWidth: 2 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#e0f2fe' } } }
        }
    });

    // Área: stock por producto (top 10)
    const top10 = [...prods].sort((a,b) => b.cant_productos_act - a.cant_productos_act).slice(0, 10);
    if (chartArea) chartArea.destroy();
    chartArea = new Chart(document.getElementById('chart-area'), {
        type: 'line',
        data: {
            labels: top10.map(p => p.nombre),
            datasets: [{
                label: 'Stock actual',
                data: top10.map(p => p.cant_productos_act),
                fill: true,
                backgroundColor: 'rgba(64,224,208,0.12)',
                borderColor: '#40e0d0',
                borderWidth: 2,
                pointBackgroundColor: '#40e0d0',
                tension: 0.4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#e0f2fe' } } },
            scales: {
                x: { ticks: { color: '#7fc8e8', maxRotation: 30 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#7fc8e8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

function renderTabla(prods) {
    const tbody = document.getElementById('tabla-body');
    if (!prods.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#7fc8e8;padding:20px;">Sin resultados</td></tr>';
        return;
    }
    tbody.innerHTML = prods.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td>${p.tipo}</td>
            <td>${p.variedad}</td>
            <td><strong style="color:#fdd54f;">${(p.cant_productos_act||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</strong></td>
            <td><i class="fas fa-thermometer-half" style="color:#fb923c;margin-right:4px;"></i>${p.temperatura_optima}°C</td>
            <td><i class="fas fa-tint" style="color:#60a5fa;margin-right:4px;"></i>${p.humedad_optima}%</td>
            <td><span class="badge-${p.estado_producto === 'ACTIVO' ? 'activo' : 'inactivo'}">${p.estado_producto}</span></td>
        </tr>
    `).join('');
}

function buscarEnTabla() {
    const q = document.getElementById('tabla-search').value.toLowerCase();
    const tipo = document.getElementById('filtro-tipo').value;
    const estado = document.getElementById('filtro-estado').value;
    let filtrados = todosProductos;
    if (tipo) filtrados = filtrados.filter(p => p.tipo === tipo);
    if (estado) filtrados = filtrados.filter(p => p.estado_producto === estado);
    if (q) filtrados = filtrados.filter(p => p.nombre.toLowerCase().includes(q) || p.tipo.toLowerCase().includes(q) || p.variedad.toLowerCase().includes(q));
    renderTabla(filtrados);
}

function sortTable(col) {
    sortDir[col] = !sortDir[col];
    const tipo = document.getElementById('filtro-tipo').value;
    const estado = document.getElementById('filtro-estado').value;
    let prods = todosProductos.filter(p => (!tipo || p.tipo === tipo) && (!estado || p.estado_producto === estado));
    const keys = ['nombre','tipo','variedad','cant_productos_act','temperatura_optima','humedad_optima','estado_producto'];
    prods.sort((a,b) => {
        const va = a[keys[col]], vb = b[keys[col]];
        return sortDir[col] ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    renderTabla(prods);
}
