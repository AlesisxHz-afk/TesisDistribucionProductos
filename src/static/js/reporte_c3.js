let todosMovs = [], chartEvo = null, chartEstados = null, chartDemanda = null;
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

document.addEventListener('DOMContentLoaded', () => {
    cargarAnios();
    cargarConductores();
    cargarMovimientos();
    document.getElementById('btn-cargar').addEventListener('click', cargarConductor);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function cargarAnios() {
    fetch('/main/reporte/obtener_anios_distribucion').then(r=>r.json()).then(d=>{
        if (!d.success) return;
        const sel = document.getElementById('filtro-anio');
        d.anios.forEach(a=>{ const o=document.createElement('option'); o.value=a; o.textContent=a; sel.appendChild(o); });
    });
}

function cargarConductores() {
    fetch('/main/reporte/obtener_conductores').then(r=>r.json()).then(d=>{
        if (!d.success) return;
        const sel = document.getElementById('filtro-conductor');
        (d.conductores||[]).forEach(c=>{
            const o=document.createElement('option'); o.value=c.conductor_id; o.textContent=c.nombre_completo||c.nombre; sel.appendChild(o);
        });
    });
}

function cargarMovimientos() {
    fetch('/main/reporte/obtener_movimiento_productos').then(r=>r.json()).then(d=>{
        if (!d.success) return;
        todosMovs = d.movimientos||[];
    });
}

function cargarConductor() {
    const cid  = document.getElementById('filtro-conductor').value;
    const anio = document.getElementById('filtro-anio').value;
    const nombre = document.getElementById('filtro-conductor').selectedOptions[0]?.textContent || '—';

    if (!cid) { alert('Selecciona un conductor'); return; }

    let movs = todosMovs.filter(m=>String(m.conductor_id)===cid);
    if (anio) movs = movs.filter(m=>String(m.anio)===anio);

    // KPIs
    document.getElementById('kpi-nombre').textContent   = nombre.split(' ').slice(0,1).join('');
    document.getElementById('kpi-envios').textContent   = movs.length;
    document.getElementById('kpi-demanda').textContent  = movs.reduce((s,m)=>s+(m.demanda||0),0).toLocaleString('es-PE',{maximumFractionDigits:0});
    const byMes = Array(12).fill(0); movs.forEach(m=>{ if(m.mes) byMes[m.mes-1]++; });
    document.getElementById('kpi-mes-pico').textContent = MESES[byMes.indexOf(Math.max(...byMes))]||'—';

    document.getElementById('chart-hint').style.display = 'none';
    document.getElementById('chart-evolucion-title').innerHTML = `<i class="fas fa-chart-area"></i> Evolución de Envíos — ${nombre}`;

    // Evo
    if (chartEvo) chartEvo.destroy();
    chartEvo = new Chart(document.getElementById('chart-evolucion'), {
        type: 'line',
        data: { labels:MESES, datasets:[
            { label:'Envíos del conductor', data:byMes, fill:true, backgroundColor:'rgba(64,224,208,0.12)', borderColor:'#40e0d0', borderWidth:2, pointBackgroundColor:'#fdd54f', pointRadius:5, tension:0.4 }
        ]},
        options: { responsive:true, maintainAspectRatio:false,
            plugins:{legend:{labels:{color:'#e0f2fe'}}},
            scales:{
                x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}},
                y:{ticks:{color:'#7fc8e8',stepSize:1},grid:{color:'rgba(255,255,255,0.05)'}}
            }
        }
    });

    // Estados
    const estados={};
    movs.forEach(m=>{estados[m.estado_envio]=(estados[m.estado_envio]||0)+1;});
    if (chartEstados) chartEstados.destroy();
    chartEstados = new Chart(document.getElementById('chart-estados'),{
        type:'pie',
        data:{ labels:Object.keys(estados), datasets:[{ data:Object.values(estados), backgroundColor:['#4ade80bb','#fdd54fbb','#f87171bb'], borderColor:['#4ade80','#fdd54f','#f87171'], borderWidth:2 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#e0f2fe'}}} }
    });

    // Demanda por mes
    const demMes = Array(12).fill(0); movs.forEach(m=>{if(m.mes)demMes[m.mes-1]+=(m.demanda||0);});
    if (chartDemanda) chartDemanda.destroy();
    chartDemanda = new Chart(document.getElementById('chart-demanda'),{
        type:'bar',
        data:{ labels:MESES, datasets:[{ label:'Demanda', data:demMes, backgroundColor:'#a78bfabb', borderColor:'#a78bfa', borderWidth:2, borderRadius:5 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    // Tabla: agrupar por mes+año
    const tabla = {};
    movs.forEach(m=>{
        const key=`${m.anio||'?'}-${String(m.mes||0).padStart(2,'0')}`;
        if(!tabla[key]) tabla[key]={mes:m.mes,anio:m.anio,envios:0,demanda:0,estado:m.estado_envio};
        tabla[key].envios++;
        tabla[key].demanda+=(m.demanda||0);
    });
    const filas = Object.values(tabla).sort((a,b)=>(a.anio-b.anio)||((a.mes||0)-(b.mes||0)));
    const tbody = document.getElementById('tabla-body');
    if (!filas.length) { tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:#7fc8e8;padding:16px;">Sin datos</td></tr>'; return; }
    tbody.innerHTML = filas.map(f=>`<tr>
        <td>${MESES[(f.mes||1)-1]}</td>
        <td>${f.anio||'—'}</td>
        <td><strong style="color:#fdd54f;">${f.envios}</strong></td>
        <td>${(f.demanda||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</td>
        <td><span class="badge-${f.estado==='COMPLETADO'?'activo':f.estado==='PENDIENTE'?'en-uso':'inactivo'}">${f.estado}</span></td>
    </tr>`).join('');
}

function reset() {
    document.getElementById('filtro-conductor').value = '';
    document.getElementById('filtro-anio').value = '';
    ['kpi-nombre','kpi-envios','kpi-demanda','kpi-mes-pico'].forEach(id=>document.getElementById(id).textContent='—');
    document.getElementById('chart-hint').style.display='block';
    document.getElementById('tabla-body').innerHTML='<tr><td colspan="5" style="text-align:center;color:#7fc8e8;padding:20px;">Selecciona un conductor para ver datos</td></tr>';
    [chartEvo,chartEstados,chartDemanda].forEach(c=>{ if(c) c.destroy(); });
    chartEvo=chartEstados=chartDemanda=null;
}
