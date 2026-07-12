let todosRendim = [], todosMovs = [], chartGasto = null, chartEvo = null, sortDir = {};
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('/main/reporte/obtener_rendimiento_vehiculos').then(r=>r.json()),
        fetch('/main/reporte/obtener_movimiento_productos').then(r=>r.json())
    ]).then(([rv, rm]) => {
        if (rv.success) todosRendim = (rv.rendimiento||[]).filter(r=>(r.total_gasto||0)>0);
        if (rm.success) todosMovs = rm.movimientos||[];
        poblarVehiculos();
        renderTodo(todosRendim);
    }).catch(e=>console.error(e));

    document.getElementById('btn-ver-evolucion').addEventListener('click', verEvolucion);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function poblarVehiculos() {
    const sel = document.getElementById('filtro-vehiculo');
    todosRendim.forEach(r=>{ const o=document.createElement('option'); o.value=r.placa; o.textContent=r.placa+' | '+r.tipo_vehiculo; sel.appendChild(o); });
}

function renderTodo(data) {
    const total = data.reduce((s,r)=>s+(r.total_gasto||0),0);
    const envTotal = data.reduce((s,r)=>s+(r.total_envios||0),0);
    document.getElementById('kpi-gasto-total').textContent  = 'S/ '+total.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
    document.getElementById('kpi-gasto-prom').textContent   = envTotal>0?'S/ '+(total/envTotal).toFixed(2):'—';
    const top = data.reduce((m,r)=>(!m||(r.total_gasto||0)>(m.total_gasto||0))?r:m, null);
    const bot = data.reduce((m,r)=>(!m||(r.total_gasto||0)<(m.total_gasto||0))?r:m, null);
    document.getElementById('kpi-mayor-gasto').textContent  = top?top.placa:'—';
    document.getElementById('kpi-menor-gasto').textContent  = bot?bot.placa:'—';

    const sorted = [...data].sort((a,b)=>(b.total_gasto||0)-(a.total_gasto||0));
    const COLORES = ['#fb923c','#fdd54f','#f87171','#a78bfa','#60a5fa','#40e0d0','#34d399','#e879f9'];
    if (chartGasto) chartGasto.destroy();
    chartGasto = new Chart(document.getElementById('chart-gasto-total'), {
        type: 'bar',
        data: { labels:sorted.map(r=>r.placa), datasets:[{ label:'Gasto S/', data:sorted.map(r=>r.total_gasto||0), backgroundColor:COLORES.map(c=>c+'bb'), borderColor:COLORES, borderWidth:2, borderRadius:6 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:{callbacks:{label:ctx=>'S/ '+ctx.raw.toFixed(2)}}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8',callback:v=>'S/'+v},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    renderTabla(sorted);
}

function verEvolucion() {
    const placa = document.getElementById('filtro-vehiculo').value;
    if (!placa) { alert('Selecciona un vehículo'); return; }

    // Filtrar movimientos del vehículo por mes (por placa en vehiculo_asignado)
    const movVeh = todosMovs.filter(m => m.placa === placa || m.vehiculo_placa === placa);
    const byMes = Array(12).fill(0);
    movVeh.forEach(m => { if(m.mes) byMes[m.mes-1]+=(m.gasto||0); });

    document.getElementById('card-evolucion').style.display = 'block';
    document.getElementById('evolucion-title').innerHTML = `<i class="fas fa-chart-line"></i> Evolución de Gasto — ${placa}`;

    if (chartEvo) chartEvo.destroy();
    chartEvo = new Chart(document.getElementById('chart-evolucion'), {
        type: 'line',
        data: { labels:MESES, datasets:[{ label:'Gasto S/', data:byMes, fill:true, backgroundColor:'rgba(251,146,60,0.15)', borderColor:'#fb923c', borderWidth:2, pointBackgroundColor:'#fdd54f', tension:0.4 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#e0f2fe'}}, tooltip:{callbacks:{label:ctx=>'S/ '+ctx.raw.toFixed(2)}}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8',callback:v=>'S/'+v},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });
}

function reset() {
    document.getElementById('filtro-vehiculo').value = '';
    document.getElementById('card-evolucion').style.display = 'none';
    if (chartEvo) { chartEvo.destroy(); chartEvo=null; }
    renderTodo(todosRendim);
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-body');
    if (!data.length) { tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:#7fc8e8;padding:20px;">Sin datos</td></tr>'; return; }
    tbody.innerHTML = data.map((r,i)=>`<tr>
        <td style="color:#7fc8e8;font-weight:700;">${i+1}</td>
        <td><strong style="color:#40e0d0;">${r.placa}</strong></td>
        <td>${r.tipo_vehiculo||'—'}</td>
        <td>${r.total_envios||0}</td>
        <td><strong style="color:#fb923c;">S/ ${(r.total_gasto||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></td>
        <td>S/ ${r.total_envios>0?((r.total_gasto||0)/r.total_envios).toFixed(2):'—'}</td>
    </tr>`).join('');
}

function sortTable(col) {
    sortDir[col]=!sortDir[col];
    const keys=['placa','tipo_vehiculo','total_envios','total_gasto'];
    const sorted=[...todosRendim].sort((a,b)=>sortDir[col]?(a[keys[col]]>b[keys[col]]?1:-1):(a[keys[col]]<b[keys[col]]?1:-1));
    renderTabla(sorted);
}
