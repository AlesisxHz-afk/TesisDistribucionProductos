let todosMovs = [], chartMes = null, chartAlm = null;
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

document.addEventListener('DOMContentLoaded', () => {
    cargarAnios();
    cargarMovimientos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicar);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function cargarAnios() {
    fetch('/main/reporte/obtener_anios_distribucion').then(r=>r.json()).then(d=>{
        if (!d.success) return;
        const sel = document.getElementById('filtro-anio');
        d.anios.forEach(a => { const o = document.createElement('option'); o.value=a; o.textContent=a; sel.appendChild(o); });
    });
}

function cargarMovimientos() {
    fetch('/main/reporte/obtener_movimiento_productos').then(r=>r.json()).then(d=>{
        if (!d.success) throw new Error(d.message);
        todosMovs = d.movimientos || [];
        renderTodo(todosMovs);
    }).catch(e => console.error(e));
}

function aplicar() {
    const anio = document.getElementById('filtro-anio').value;
    renderTodo(anio ? todosMovs.filter(m=>String(m.anio)===anio) : todosMovs);
}

function reset() {
    document.getElementById('filtro-anio').value = '';
    document.getElementById('celda-info').textContent = '';
    renderTodo(todosMovs);
}

function renderTodo(movs) {
    // KPIs
    document.getElementById('kpi-total').textContent = movs.length;
    const almsSet = [...new Set(movs.map(m=>m.almacen_nombre))];
    document.getElementById('kpi-almacenes').textContent = almsSet.length;

    const byMes = Array(12).fill(0);
    movs.forEach(m => { if (m.mes) byMes[m.mes-1]++; });
    const maxMesIdx = byMes.indexOf(Math.max(...byMes));
    document.getElementById('kpi-mes-pico').textContent = MESES[maxMesIdx] || '—';

    const byAlm = {};
    movs.forEach(m => { byAlm[m.almacen_nombre] = (byAlm[m.almacen_nombre]||0)+1; });
    const topAlm = Object.entries(byAlm).sort((a,b)=>b[1]-a[1])[0];
    document.getElementById('kpi-almacen-top').textContent = topAlm ? topAlm[0].substring(0,10)+'…' : '—';

    // Heatmap
    const matrix = {};
    const almacenes = [...new Set(movs.map(m=>m.almacen_nombre))].sort();
    almacenes.forEach(a => {
        matrix[a] = Array(12).fill(0);
        movs.filter(m=>m.almacen_nombre===a).forEach(m=>{ if(m.mes) matrix[a][m.mes-1]++; });
    });

    const allVals = Object.values(matrix).flat();
    const maxVal = Math.max(...allVals, 1);

    // Header
    const header = document.getElementById('heatmap-header');
    header.innerHTML = '<th class="heatmap-table th">Almacén</th>' + MESES.map(m=>`<th class="heatmap-table th">${m}</th>`).join('');

    // Body
    const body = document.getElementById('heatmap-body');
    body.innerHTML = almacenes.map(a => {
        const cells = matrix[a].map((v, mi) => {
            const intensity = maxVal > 0 ? v / maxVal : 0;
            const bg = `rgba(64,224,208,${(intensity * 0.8).toFixed(2)})`;
            const color = intensity > 0.5 ? '#0a1e2f' : '#e0f2fe';
            return `<td style="background:${bg};color:${color};" 
                title="${a} — ${MESES[mi]}: ${v} envíos"
                onclick="celdaClick('${a}','${MESES[mi]}',${v})">${v||''}</td>`;
        }).join('');
        return `<tr><td class="row-label" style="padding:10px;font-size:12px;color:#a5d8ff;white-space:nowrap;">${a}</td>${cells}</tr>`;
    }).join('');

    // Charts
    const COLORS = ['#40e0d0','#fdd54f','#f87171','#a78bfa','#60a5fa','#fb923c','#34d399','#e879f9'];
    if (chartMes) chartMes.destroy();
    chartMes = new Chart(document.getElementById('chart-mes'), {
        type: 'bar',
        data: { labels: MESES, datasets: [{ label:'Envíos', data:byMes, backgroundColor:'#40e0d0bb', borderColor:'#40e0d0', borderWidth:2, borderRadius:5 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    const almSorted = Object.entries(byAlm).sort((a,b)=>b[1]-a[1]).slice(0,8);
    if (chartAlm) chartAlm.destroy();
    chartAlm = new Chart(document.getElementById('chart-almacen'), {
        type: 'bar',
        data: { labels: almSorted.map(a=>a[0]), datasets: [{ label:'Envíos', data:almSorted.map(a=>a[1]), backgroundColor:COLORS.map(c=>c+'bb'), borderColor:COLORS, borderWidth:2, borderRadius:5 }] },
        options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });
}

function celdaClick(almacen, mes, valor) {
    document.getElementById('celda-info').textContent = `📍 ${almacen} — ${mes}: ${valor} envío(s)`;
}
