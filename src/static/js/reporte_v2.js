let todosRendim = [], todosVehs = [], chartEnvios = null, chartDemanda = null, sortDir = {};

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('/main/reporte/obtener_rendimiento_vehiculos').then(r=>r.json()),
        fetch('/main/reporte/obtener_vehiculos').then(r=>r.json()),
        fetch('/main/reporte/obtener_anios_distribucion').then(r=>r.json())
    ]).then(([rv, rv2, ra]) => {
        if (rv.success) todosRendim = rv.rendimiento || [];
        if (rv2.success) todosVehs = rv2.vehiculos || [];
        if (ra.success) {
            const sel = document.getElementById('filtro-anio');
            ra.anios.forEach(a=>{ const o=document.createElement('option'); o.value=a; o.textContent=a; sel.appendChild(o); });
        }
        const tipos = [...new Set(todosVehs.map(v=>v.tipo_vehiculo).filter(Boolean))].sort();
        const sel = document.getElementById('filtro-tipo');
        tipos.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; sel.appendChild(o); });
        renderTodo(todosRendim);
    }).catch(e=>console.error(e));

    document.getElementById('btn-aplicar').addEventListener('click', aplicar);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function aplicar() {
    const tipo = document.getElementById('filtro-tipo').value;
    const anio = document.getElementById('filtro-anio').value;
    let f = todosRendim;
    if (tipo) f = f.filter(r => {
        const veh = todosVehs.find(v=>v.placa===r.placa);
        return veh && veh.tipo_vehiculo === tipo;
    });
    // anio filter sería a nivel de movimientos, mostramos todos igualmente si no hay granularidad
    renderTodo(f);
}

function reset() {
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-anio').value = '';
    renderTodo(todosRendim);
}

function renderTodo(data) {
    const n = data.length;
    const totalEnvios = data.reduce((s,r)=>s+(r.total_envios||0),0);
    const top = data.sort((a,b)=>(b.total_envios||0)-(a.total_envios||0))[0];
    const totalDem = data.reduce((s,r)=>s+(r.total_demanda||0),0);

    document.getElementById('kpi-vehs-activos').textContent = n;
    document.getElementById('kpi-total-envios').textContent = totalEnvios;
    document.getElementById('kpi-top-veh').textContent = top ? top.placa : '—';
    document.getElementById('kpi-dem-total').textContent = totalDem.toLocaleString('es-PE',{maximumFractionDigits:0});

    const COLORES = ['#40e0d0','#fdd54f','#f87171','#a78bfa','#60a5fa','#fb923c','#34d399','#e879f9'];
    const sorted = [...data].sort((a,b)=>(b.total_envios||0)-(a.total_envios||0));

    if (chartEnvios) chartEnvios.destroy();
    chartEnvios = new Chart(document.getElementById('chart-envios'), {
        type: 'bar',
        data: { labels:sorted.map(r=>r.placa), datasets:[{ label:'N° Envíos', data:sorted.map(r=>r.total_envios||0), backgroundColor:COLORES.map(c=>c+'bb'), borderColor:COLORES, borderWidth:2, borderRadius:6 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    if (chartDemanda) chartDemanda.destroy();
    chartDemanda = new Chart(document.getElementById('chart-demanda'), {
        type: 'bar',
        data: { labels:sorted.map(r=>r.placa), datasets:[{ label:'Demanda', data:sorted.map(r=>r.total_demanda||0), backgroundColor:'rgba(253,213,79,0.6)', borderColor:'#fdd54f', borderWidth:2, borderRadius:6 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    renderTabla(sorted);
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-body');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:#7fc8e8;padding:20px;">Sin datos</td></tr>'; return; }
    tbody.innerHTML = data.map((r,i)=>`
        <tr>
            <td><strong style="color:#40e0d0;">${r.placa}</strong>${i===0?'<span class="badge-activo" style="margin-left:6px;">★ Top</span>':''}</td>
            <td>${r.tipo_vehiculo||'—'}</td>
            <td><strong style="color:#fdd54f;">${r.total_envios||0}</strong></td>
            <td>${(r.total_demanda||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</td>
            <td>S/ ${(r.total_gasto||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>`).join('');
}

function sortTable(col) {
    sortDir[col]=!sortDir[col];
    const keys=['placa','tipo_vehiculo','total_envios','total_demanda','total_gasto'];
    const sorted=[...todosRendim].sort((a,b)=>sortDir[col]?(a[keys[col]]>b[keys[col]]?1:-1):(a[keys[col]]<b[keys[col]]?1:-1));
    renderTabla(sorted);
}
