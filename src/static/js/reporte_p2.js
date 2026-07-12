let todosProductos = [];
let chartScatter = null, chartTempHist = null, chartHumHist = null;
let sortDir = {};

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicarFiltros);
    document.getElementById('btn-reset').addEventListener('click', resetFiltros);
    document.getElementById('tabla-search').addEventListener('input', buscarTabla);
});

function cargarDatos() {
    fetch('/main/reporte/obtener_productos')
        .then(r => r.json())
        .then(data => {
            if (!data.success) throw new Error(data.message);
            todosProductos = data.productos;
            poblarTipos(todosProductos);
            actualizarTodo(todosProductos);
        })
        .catch(e => {
            document.getElementById('tabla-body').innerHTML = `<tr><td colspan="6" style="color:#f87171;text-align:center;padding:20px;">${e.message}</td></tr>`;
        });
}

function poblarTipos(prods) {
    const tipos = [...new Set(prods.map(p => p.tipo))].sort();
    const sel = document.getElementById('filtro-tipo');
    tipos.forEach(t => {
        const o = document.createElement('option'); o.value = t; o.textContent = t;
        sel.appendChild(o);
    });
}

function aplicarFiltros() {
    const tipo = document.getElementById('filtro-tipo').value;
    const tMin = parseFloat(document.getElementById('filtro-temp-min').value) || -Infinity;
    const tMax = parseFloat(document.getElementById('filtro-temp-max').value) || Infinity;
    let filtrados = todosProductos;
    if (tipo) filtrados = filtrados.filter(p => p.tipo === tipo);
    filtrados = filtrados.filter(p => p.temperatura_optima >= tMin && p.temperatura_optima <= tMax);
    actualizarTodo(filtrados);
}

function resetFiltros() {
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-temp-min').value = '';
    document.getElementById('filtro-temp-max').value = '';
    document.getElementById('tabla-search').value = '';
    actualizarTodo(todosProductos);
}

function calcularSensibilidad(p) {
    let s = 0;
    if (p.temperatura_optima < 10) s += 2;
    else if (p.temperatura_optima < 18) s += 1;
    if (p.humedad_optima > 85 || p.humedad_optima < 50) s += 2;
    else if (p.humedad_optima > 70) s += 1;
    if (s >= 3) return 'ALTA';
    if (s >= 1) return 'MEDIA';
    return 'BAJA';
}

function actualizarTodo(prods) {
    // KPIs
    const temps = prods.map(p => p.temperatura_optima);
    const hums  = prods.map(p => p.humedad_optima);
    document.getElementById('kpi-temp-max').textContent = temps.length ? Math.max(...temps) + '°C' : '—';
    document.getElementById('kpi-temp-min').textContent = temps.length ? Math.min(...temps) + '°C' : '—';
    document.getElementById('kpi-hum-avg').textContent  = hums.length  ? (hums.reduce((a,b)=>a+b,0)/hums.length).toFixed(1) + '%' : '—';
    document.getElementById('kpi-criticos').textContent = prods.filter(p => calcularSensibilidad(p) === 'ALTA').length;

    // Scatter
    const scatterData = prods.map(p => ({
        x: p.temperatura_optima,
        y: p.humedad_optima,
        label: p.nombre,
        tipo: p.tipo,
        sens: calcularSensibilidad(p)
    }));
    const dataAlta  = scatterData.filter(p => p.sens === 'ALTA');
    const dataMedia = scatterData.filter(p => p.sens === 'MEDIA');
    const dataBaja  = scatterData.filter(p => p.sens === 'BAJA');

    if (chartScatter) chartScatter.destroy();
    chartScatter = new Chart(document.getElementById('chart-scatter'), {
        type: 'scatter',
        data: {
            datasets: [
                { label: 'Sensibilidad ALTA', data: dataAlta,  backgroundColor: '#f87171bb', borderColor: '#f87171', pointRadius: 7, pointHoverRadius: 10 },
                { label: 'Sensibilidad MEDIA', data: dataMedia, backgroundColor: '#fdd54fbb', borderColor: '#fdd54f', pointRadius: 6, pointHoverRadius: 9 },
                { label: 'Sensibilidad BAJA',  data: dataBaja,  backgroundColor: '#4ade80bb', borderColor: '#4ade80', pointRadius: 6, pointHoverRadius: 9 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e0f2fe' } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const p = ctx.raw;
                            return [`📦 ${p.label}`, `🌡️ Temp: ${p.x}°C`, `💧 Humedad: ${p.y}%`, `⚠️ Sensibilidad: ${p.sens}`];
                        }
                    }
                }
            },
            scales: {
                x: { title: { display:true, text:'Temperatura Óptima (°C)', color:'#7fc8e8' }, ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
                y: { title: { display:true, text:'Humedad Óptima (%)', color:'#7fc8e8' }, ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // Histograma temp
    const tempBuckets = buildHistogram(temps, 5);
    if (chartTempHist) chartTempHist.destroy();
    chartTempHist = new Chart(document.getElementById('chart-temp-hist'), {
        type: 'bar',
        data: {
            labels: tempBuckets.labels,
            datasets: [{ label: 'Cantidad', data: tempBuckets.counts, backgroundColor: '#fb923cbb', borderColor: '#fb923c', borderWidth: 2, borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
                y: { ticks:{ color:'#7fc8e8', stepSize:1 }, grid:{ color:'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // Histograma humedad
    const humBuckets = buildHistogram(hums, 10);
    if (chartHumHist) chartHumHist.destroy();
    chartHumHist = new Chart(document.getElementById('chart-hum-hist'), {
        type: 'bar',
        data: {
            labels: humBuckets.labels,
            datasets: [{ label: 'Cantidad', data: humBuckets.counts, backgroundColor: '#60a5fabb', borderColor: '#60a5fa', borderWidth: 2, borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks:{ color:'#7fc8e8' }, grid:{ color:'rgba(255,255,255,0.05)' } },
                y: { ticks:{ color:'#7fc8e8', stepSize:1 }, grid:{ color:'rgba(255,255,255,0.05)' } }
            }
        }
    });

    renderTabla(prods);
}

function buildHistogram(vals, step) {
    if (!vals.length) return { labels: [], counts: [] };
    const mn = Math.floor(Math.min(...vals) / step) * step;
    const mx = Math.ceil(Math.max(...vals) / step) * step;
    const labels = [], counts = [];
    for (let b = mn; b < mx; b += step) {
        labels.push(`${b}–${b+step}`);
        counts.push(vals.filter(v => v >= b && v < b + step).length);
    }
    return { labels, counts };
}

function renderTabla(prods) {
    const tbody = document.getElementById('tabla-body');
    if (!prods.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#7fc8e8;padding:20px;">Sin resultados</td></tr>';
        return;
    }
    tbody.innerHTML = prods.map(p => {
        const s = calcularSensibilidad(p);
        const sc = s === 'ALTA' ? 'badge-riesgo-alto' : s === 'MEDIA' ? 'badge-riesgo-medio' : 'badge-riesgo-bajo';
        return `<tr>
            <td><strong>${p.nombre}</strong></td>
            <td>${p.tipo}</td>
            <td><i class="fas fa-thermometer-half" style="color:#fb923c;"></i> ${p.temperatura_optima}°C</td>
            <td><i class="fas fa-tint" style="color:#60a5fa;"></i> ${p.humedad_optima}%</td>
            <td><span class="${sc}">${s}</span></td>
            <td><span class="badge-${p.estado_producto === 'ACTIVO' ? 'activo' : 'inactivo'}">${p.estado_producto}</span></td>
        </tr>`;
    }).join('');
}

function buscarTabla() {
    const q = document.getElementById('tabla-search').value.toLowerCase();
    renderTabla(todosProductos.filter(p => p.nombre.toLowerCase().includes(q) || p.tipo.toLowerCase().includes(q)));
}

function sortTable(col) {
    sortDir[col] = !sortDir[col];
    const keys = ['nombre','tipo','temperatura_optima','humedad_optima'];
    const sorted = [...todosProductos].sort((a,b) => sortDir[col] ? (a[keys[col]] > b[keys[col]] ? 1 : -1) : (a[keys[col]] < b[keys[col]] ? 1 : -1));
    renderTabla(sorted);
}
