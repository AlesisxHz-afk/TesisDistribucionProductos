let todosAlmacenes = [], chartBarras = null, chartTipo = null, sortDir = {};

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicarFiltros);
    document.getElementById('btn-reset').addEventListener('click', resetFiltros);
    document.getElementById('tabla-search').addEventListener('input', buscarTabla);
});

function cargarDatos() {
    fetch('/main/reporte/obtener_inventario_almacenes')
        .then(r => r.json())
        .then(data => {
            if (!data.success) throw new Error(data.message);
            todosAlmacenes = data.inventario || [];
            poblarFiltros(todosAlmacenes);
            actualizarTodo(todosAlmacenes);
        })
        .catch(e => {
            document.getElementById('tabla-body').innerHTML = `<tr><td colspan="6" style="color:#f87171;text-align:center;padding:20px;">${e.message}</td></tr>`;
        });
}

function poblarFiltros(alms) {
    const tipos = [...new Set(alms.map(a => a.tipo_almacen).filter(Boolean))].sort();
    const sel = document.getElementById('filtro-tipo');
    tipos.forEach(t => {
        const o = document.createElement('option'); o.value = t; o.textContent = t;
        sel.appendChild(o);
    });
}

function aplicarFiltros() {
    const tipo   = document.getElementById('filtro-tipo').value;
    const estado = document.getElementById('filtro-estado').value;
    let f = todosAlmacenes;
    if (tipo)   f = f.filter(a => a.tipo_almacen === tipo);
    if (estado) f = f.filter(a => a.estado === estado);
    actualizarTodo(f);
}

function resetFiltros() {
    document.getElementById('filtro-tipo').value  = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('tabla-search').value  = '';
    actualizarTodo(todosAlmacenes);
}

function calcUsoPct(a) {
    if (!a.capacidad || a.capacidad === 0) return 0;
    return Math.min(100, Math.round((a.stock_actual / a.capacidad) * 100));
}

function actualizarTodo(alms) {
    document.getElementById('kpi-almacenes').textContent = alms.length;
    document.getElementById('kpi-activos').textContent   = alms.filter(a => a.estado === 'ACTIVO').length;
    const usos = alms.map(a => calcUsoPct(a));
    const promUso = usos.length ? (usos.reduce((s,v)=>s+v,0)/usos.length).toFixed(1) : 0;
    document.getElementById('kpi-uso-prom').textContent = promUso + '%';
    document.getElementById('kpi-criticos').textContent  = alms.filter(a => calcUsoPct(a) >= 80).length;

    // Barras: capacidad vs stock
    const COLORES = ['#40e0d0','#60a5fa','#a78bfa','#fb923c','#34d399','#fdd54f'];
    if (chartBarras) chartBarras.destroy();
    chartBarras = new Chart(document.getElementById('chart-barras'), {
        type: 'bar',
        data: {
            labels: alms.map(a => a.nombre),
            datasets: [
                { label: 'Capacidad', data: alms.map(a => a.capacidad), backgroundColor: 'rgba(96,165,250,0.3)', borderColor: '#60a5fa', borderWidth: 2, borderRadius: 5 },
                { label: 'Stock Actual', data: alms.map(a => a.stock_actual || 0), backgroundColor: 'rgba(64,224,208,0.6)', borderColor: '#40e0d0', borderWidth: 2, borderRadius: 5 }
            ]
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

    // Gauges
    const gWrap = document.getElementById('gauges-wrap');
    gWrap.innerHTML = '';
    alms.forEach(a => {
        const pct = calcUsoPct(a);
        const color = pct >= 80 ? '#f87171' : pct >= 50 ? '#fdd54f' : '#4ade80';
        gWrap.innerHTML += `
            <div class="gauge-item" style="margin-bottom:12px;">
                <div class="gauge-label">
                    <span>${a.nombre}</span>
                    <strong style="color:${color}">${pct}%</strong>
                </div>
                <div class="gauge-bar">
                    <div class="gauge-fill" style="width:${pct}%;background:${color};"></div>
                </div>
            </div>`;
    });

    // Tipo pie
    const byTipo = {};
    alms.forEach(a => { byTipo[a.tipo_almacen] = (byTipo[a.tipo_almacen]||0)+1; });
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-tipo'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(byTipo),
            datasets: [{ data: Object.values(byTipo), backgroundColor: COLORES.map(c=>c+'bb'), borderColor: COLORES, borderWidth: 2 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e0f2fe' } } } }
    });

    renderTabla(alms);
}

function renderTabla(alms) {
    const tbody = document.getElementById('tabla-body');
    if (!alms.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#7fc8e8;padding:20px;">Sin resultados</td></tr>'; return; }
    tbody.innerHTML = alms.map(a => {
        const pct = calcUsoPct(a);
        const pColor = pct >= 80 ? '#f87171' : pct >= 50 ? '#fdd54f' : '#4ade80';
        return `<tr>
            <td><strong>${a.nombre}</strong></td>
            <td>${a.tipo_almacen || '—'}</td>
            <td>${(a.capacidad||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</td>
            <td>${(a.stock_actual||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</td>
            <td><span style="color:${pColor};font-weight:700;">${pct}%</span></td>
            <td><span class="badge-${a.estado === 'ACTIVO' ? 'activo' : 'inactivo'}">${a.estado || '—'}</span></td>
        </tr>`;
    }).join('');
}

function buscarTabla() {
    const q = document.getElementById('tabla-search').value.toLowerCase();
    renderTabla(todosAlmacenes.filter(a => (a.nombre||'').toLowerCase().includes(q)));
}

function sortTable(col) {
    sortDir[col] = !sortDir[col];
    const keys = ['nombre','tipo_almacen','capacidad','stock_actual'];
    if (col === 4) {
        const sorted = [...todosAlmacenes].sort((a,b) => sortDir[col] ? calcUsoPct(a)-calcUsoPct(b) : calcUsoPct(b)-calcUsoPct(a));
        renderTabla(sorted);
    } else {
        const sorted = [...todosAlmacenes].sort((a,b) => {
            const va = a[keys[col]]||'', vb = b[keys[col]]||'';
            return sortDir[col] ? (va>vb?1:-1) : (va<vb?1:-1);
        });
        renderTabla(sorted);
    }
}
