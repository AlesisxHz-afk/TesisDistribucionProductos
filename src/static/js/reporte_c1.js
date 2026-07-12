let todosConductores = [], chartRanking = null;
const MEDALLAS = ['🥇','🥈','🥉'];
const COLORES = ['#fdd54f','#a5d8ff','#fb923c','#40e0d0','#a78bfa','#f87171','#4ade80','#e879f9'];

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicar);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function cargarDatos() {
    fetch('/main/reporte/obtener_rendimiento_conductores').then(r=>r.json()).then(d=>{
        if (!d.success) throw new Error(d.message);
        todosConductores = d.conductores || [];
        renderTodo(todosConductores);
    }).catch(e=>console.error(e));
}

function aplicar() {
    const estado = document.getElementById('filtro-estado').value;
    const orden  = document.getElementById('filtro-orden').value;
    let f = todosConductores;
    if (estado) f = f.filter(c=>c.estado===estado);
    if (orden==='envios')  f = [...f].sort((a,b)=>(b.total_envios||0)-(a.total_envios||0));
    if (orden==='demanda') f = [...f].sort((a,b)=>(b.total_demanda||0)-(a.total_demanda||0));
    if (orden==='nombre')  f = [...f].sort((a,b)=>(a.conductor_nombre||'').localeCompare(b.conductor_nombre||''));
    renderTodo(f);
}

function reset() {
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-orden').value  = 'envios';
    renderTodo(todosConductores);
}

function renderTodo(data) {
    const sorted = [...data].sort((a,b)=>(b.total_envios||0)-(a.total_envios||0));
    const total  = sorted.reduce((s,c)=>s+(c.total_envios||0),0);
    const demTotal = sorted.reduce((s,c)=>s+(c.total_demanda||0),0);

    document.getElementById('kpi-total-cond').textContent   = sorted.length;
    document.getElementById('kpi-total-envios').textContent = total;
    document.getElementById('kpi-conductor-top').textContent= sorted[0] ? (sorted[0].conductor_nombre||'').split(' ')[0] : '—';
    document.getElementById('kpi-dem-prom').textContent     = sorted.length>0?(demTotal/sorted.length).toFixed(0):'—';

    // Ranking cards
    const grid = document.getElementById('ranking-grid');
    grid.innerHTML = sorted.map((c,i)=>{
        const medalla = MEDALLAS[i] || (i+1+'°');
        const col = COLORES[i%COLORES.length];
        const maxEnvios = sorted[0] ? (sorted[0].total_envios||1) : 1;
        const pct = Math.round(((c.total_envios||0)/maxEnvios)*100);
        const displayNombre = c.conductor_nombre || c.nombre || '—';
        const displayEstado = c.estado || '—';
        const estadoBadge = displayEstado==='ACTIVO'?'activo':displayEstado==='EN_USO'?'en-uso':'inactivo';
        return `<div style="background:rgba(255,255,255,0.04);border:1px solid ${col}44;border-radius:12px;padding:16px;position:relative;overflow:hidden;transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${col};"></div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                <span style="font-size:1.8rem;">${medalla}</span>
                <div>
                    <div style="font-size:13px;font-weight:700;color:#e0f2fe;">${displayNombre}</div>
                    <div style="font-size:11px;color:#7fc8e8;"><span class="badge-${estadoBadge}">${displayEstado}</span></div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <div style="text-align:center;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;">
                    <div style="font-size:1.4rem;font-weight:800;color:${col};">${c.total_envios||0}</div>
                    <div style="font-size:10px;color:#7fc8e8;text-transform:uppercase;">Envíos</div>
                </div>
                <div style="text-align:center;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;">
                    <div style="font-size:1.4rem;font-weight:800;color:#4ade80;">${(c.total_demanda||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</div>
                    <div style="font-size:10px;color:#7fc8e8;text-transform:uppercase;">Demanda</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#a5d8ff;margin-bottom:4px;">
                <span>Desempeño relativo</span><strong style="color:${col};">${pct}%</strong>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${col};border-radius:99px;transition:width 0.8s;"></div>
            </div>
        </div>`;
    }).join('');

    // Chart
    if (chartRanking) chartRanking.destroy();
    chartRanking = new Chart(document.getElementById('chart-ranking'), {
        type: 'bar',
        data: {
            labels: sorted.map(c=>c.nombre.split(' ').slice(0,2).join(' ')),
            datasets: [
                { label:'Envíos', data:sorted.map(c=>c.total_envios||0), backgroundColor:COLORES.map(c=>c+'bb'), borderColor:COLORES, borderWidth:2, borderRadius:5 }
            ]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8',maxRotation:30},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8',stepSize:1},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });
}
