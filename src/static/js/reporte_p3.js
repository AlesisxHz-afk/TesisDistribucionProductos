let todosMovimientos = [], chartLinea = null, chartEstados = null, chartTop = null;
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

document.addEventListener('DOMContentLoaded', () => {
    cargarAnios();
    cargarProductos();
    cargarMovimientos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicarFiltros);
    document.getElementById('btn-reset').addEventListener('click', resetFiltros);
});

function cargarAnios() {
    fetch('/main/reporte/obtener_anios_distribucion')
        .then(r => r.json()).then(data => {
            if (!data.success) return;
            const sel = document.getElementById('filtro-anio');
            data.anios.forEach(a => {
                const o = document.createElement('option'); o.value = a; o.textContent = a;
                sel.appendChild(o);
            });
        });
}

function cargarProductos() {
    fetch('/main/reporte/obtener_productos')
        .then(r => r.json()).then(data => {
            if (!data.success) return;
            const sel = document.getElementById('filtro-producto');
            data.productos.forEach(p => {
                const o = document.createElement('option'); o.value = p.producto_id; o.textContent = p.nombre;
                sel.appendChild(o);
            });
        });
}

function cargarMovimientos() {
    fetch('/main/reporte/obtener_movimiento_productos')
        .then(r => r.json())
        .then(data => {
            if (!data.success) throw new Error(data.message);
            todosMovimientos = data.movimientos || [];
            renderTodo(todosMovimientos);
        })
        .catch(e => console.error('Error:', e));
}

function aplicarFiltros() {
    const pidStr = document.getElementById('filtro-producto').value;
    const anio   = document.getElementById('filtro-anio').value;
    let f = todosMovimientos;
    if (pidStr) f = f.filter(m => String(m.producto_id) === pidStr);
    if (anio)   f = f.filter(m => String(m.anio) === anio);
    renderTodo(f);
}

function resetFiltros() {
    document.getElementById('filtro-producto').value = '';
    document.getElementById('filtro-anio').value = '';
    renderTodo(todosMovimientos);
}

function renderTodo(movs) {
    // KPIs
    document.getElementById('kpi-total-envios').textContent  = movs.length;
    document.getElementById('kpi-total-demanda').textContent  = movs.reduce((s,m)=>s+(m.demanda||0),0).toLocaleString('es-PE',{maximumFractionDigits:0});
    document.getElementById('kpi-completados').textContent   = movs.filter(m => m.estado_envio === 'COMPLETADO').length;
    document.getElementById('kpi-pendientes').textContent    = movs.filter(m => m.estado_envio === 'PENDIENTE').length;

    // Demanda por mes
    const byMes = Array(12).fill(0);
    movs.forEach(m => { if (m.mes) byMes[m.mes - 1] += (m.demanda || 0); });
    if (chartLinea) chartLinea.destroy();
    chartLinea = new Chart(document.getElementById('chart-linea'), {
        type: 'line',
        data: {
            labels: MESES,
            datasets: [{
                label: 'Demanda mensual',
                data: byMes,
                fill: true,
                backgroundColor: 'rgba(64,224,208,0.12)',
                borderColor: '#40e0d0', borderWidth: 2,
                pointBackgroundColor: '#fdd54f', pointRadius: 5,
                tension: 0.4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color:'#e0f2fe' } } },
            scales: {
                x: { ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
                y: { ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // Estados
    const estados = {};
    movs.forEach(m => { estados[m.estado_envio] = (estados[m.estado_envio]||0)+1; });
    const estLabels = Object.keys(estados);
    const estColors = estLabels.map(e => e==='COMPLETADO'?'#4ade80':e==='PENDIENTE'?'#fdd54f':'#f87171');
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(document.getElementById('chart-estados'), {
        type: 'pie',
        data: {
            labels: estLabels,
            datasets: [{ data: estLabels.map(e=>estados[e]), backgroundColor: estColors.map(c=>c+'bb'), borderColor: estColors, borderWidth:2 }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'#e0f2fe' } } } }
    });

    // Top productos
    const byProd = {};
    movs.forEach(m => { byProd[m.producto_nombre] = (byProd[m.producto_nombre]||0)+(m.demanda||0); });
    const sorted = Object.entries(byProd).sort((a,b)=>b[1]-a[1]).slice(0,8);
    const COLORES = ['#40e0d0','#fdd54f','#f87171','#a78bfa','#60a5fa','#fb923c','#34d399','#e879f9'];
    if (chartTop) chartTop.destroy();
    chartTop = new Chart(document.getElementById('chart-top'), {
        type: 'bar',
        data: {
            labels: sorted.map(s=>s[0]),
            datasets: [{ label:'Demanda', data: sorted.map(s=>s[1]), backgroundColor: COLORES.map(c=>c+'bb'), borderColor:COLORES, borderWidth:2, borderRadius:6 }]
        },
        options: {
            indexAxis: 'y',
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ display:false } },
            scales: {
                x:{ ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
                y:{ ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } }
            }
        }
    });
}
