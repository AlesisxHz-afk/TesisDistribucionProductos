let todosAlmacenes = [], chartStacked = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicar);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function cargarDatos() {
    fetch('/main/reporte/obtener_inventario_almacenes').then(r=>r.json()).then(d=>{
        if (!d.success) throw new Error(d.message);
        todosAlmacenes = d.inventario || [];
        poblarTipos(todosAlmacenes);
        renderTodo(todosAlmacenes);
    }).catch(e => console.error(e));
}

function poblarTipos(alms) {
    const tipos = [...new Set(alms.map(a=>a.tipo_almacen).filter(Boolean))].sort();
    const sel = document.getElementById('filtro-tipo');
    tipos.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; sel.appendChild(o); });
}

function getNivel(a) {
    const pct = a.capacidad ? (a.stock_actual||0)/a.capacidad*100 : 0;
    if (pct >= 80) return 'lleno';
    if (pct >= 50) return 'medio';
    return 'libre';
}

function aplicar() {
    const tipo  = document.getElementById('filtro-tipo').value;
    const nivel = document.getElementById('filtro-nivel').value;
    let f = todosAlmacenes;
    if (tipo)  f = f.filter(a=>a.tipo_almacen===tipo);
    if (nivel) f = f.filter(a=>getNivel(a)===nivel);
    renderTodo(f);
}

function reset() {
    document.getElementById('filtro-tipo').value  = '';
    document.getElementById('filtro-nivel').value = '';
    renderTodo(todosAlmacenes);
}

function renderTodo(alms) {
    document.getElementById('kpi-disponibles').textContent = alms.filter(a=>getNivel(a)==='libre').length;
    document.getElementById('kpi-medio').textContent       = alms.filter(a=>getNivel(a)==='medio').length;
    document.getElementById('kpi-llenos').textContent      = alms.filter(a=>getNivel(a)==='lleno').length;
    const capLibre = alms.reduce((s,a)=>s+Math.max(0,(a.capacidad||0)-(a.stock_actual||0)),0);
    document.getElementById('kpi-cap-libre').textContent   = capLibre.toLocaleString('es-PE',{maximumFractionDigits:0});

    // Cards
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = alms.map(a => {
        const pct  = a.capacidad ? Math.round((a.stock_actual||0)/a.capacidad*100) : 0;
        const libre = Math.max(0,(a.capacidad||0)-(a.stock_actual||0));
        const nivel = getNivel(a);
        const col  = nivel==='lleno'?'#f87171':nivel==='medio'?'#fdd54f':'#4ade80';
        const icon = nivel==='lleno'?'fa-times-circle':nivel==='medio'?'fa-exclamation-triangle':'fa-check-circle';
        return `<div style="background:rgba(255,255,255,0.04);border:1px solid ${col}55;border-radius:12px;padding:16px;position:relative;overflow:hidden;cursor:pointer;transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${col};"></div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div>
                    <div style="font-size:13px;font-weight:700;color:#e0f2fe;">${a.nombre}</div>
                    <div style="font-size:11px;color:#7fc8e8;">${a.tipo_almacen||'—'}</div>
                </div>
                <i class="fas ${icon}" style="color:${col};font-size:1.3rem;"></i>
            </div>
            <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                    <span style="color:#a5d8ff;">Uso: <strong style="color:${col};">${pct}%</strong></span>
                    <span style="color:#a5d8ff;">Libre: <strong style="color:#4ade80;">${libre.toLocaleString('es-PE',{maximumFractionDigits:0})}</strong></span>
                </div>
                <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:99px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:${col};border-radius:99px;transition:width 0.8s;"></div>
                </div>
            </div>
            <div style="font-size:11px;color:#7fc8e8;">Cap. total: ${(a.capacidad||0).toLocaleString('es-PE',{maximumFractionDigits:0})} | Stock: ${(a.stock_actual||0).toLocaleString('es-PE',{maximumFractionDigits:0})}</div>
        </div>`;
    }).join('');

    // Stacked bar
    if (chartStacked) chartStacked.destroy();
    chartStacked = new Chart(document.getElementById('chart-stacked'), {
        type: 'bar',
        data: {
            labels: alms.map(a=>a.nombre),
            datasets: [
                { label:'Stock Actual', data:alms.map(a=>a.stock_actual||0), backgroundColor:'rgba(64,224,208,0.7)', borderColor:'#40e0d0', borderWidth:1, stack:'cap' },
                { label:'Capacidad Libre', data:alms.map(a=>Math.max(0,(a.capacidad||0)-(a.stock_actual||0))), backgroundColor:'rgba(255,255,255,0.08)', borderColor:'rgba(255,255,255,0.2)', borderWidth:1, stack:'cap' }
            ]
        },
        options: {
            responsive:true, maintainAspectRatio:false,
            plugins:{ legend:{ labels:{ color:'#e0f2fe' } } },
            scales:{
                x:{ stacked:true, ticks:{color:'#7fc8e8',maxRotation:30}, grid:{color:'rgba(255,255,255,0.05)'} },
                y:{ stacked:true, ticks:{color:'#7fc8e8'}, grid:{color:'rgba(255,255,255,0.05)'} }
            }
        }
    });
}
