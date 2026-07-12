let todosDisp = [], todosCond = [], chartDia = null, chartEstado = null;
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DIAS_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        fetch('/main/reporte/obtener_disponibilidad_completa').then(r=>r.json()),
        fetch('/main/reporte/obtener_conductores').then(r=>r.json())
    ]).then(([dd, dc]) => {
        if (dd.success) todosDisp = dd.disponibilidad || [];
        if (dc.success) {
            todosCond = dc.conductores || [];
            const sel = document.getElementById('filtro-conductor');
            todosCond.forEach(c=>{ const o=document.createElement('option'); o.value=c.conductor_id; o.textContent=c.nombre_completo||c.nombre; sel.appendChild(o); });
        }
        renderTodo(todosCond, todosDisp);
    }).catch(e=>console.error(e));

    document.getElementById('btn-aplicar').addEventListener('click', aplicar);
    document.getElementById('btn-reset').addEventListener('click', reset);
});

function aplicar() {
    const cid   = document.getElementById('filtro-conductor').value;
    const est   = document.getElementById('filtro-estado').value;
    let conds = todosCond;
    if (est) conds = conds.filter(c=>c.estado===est);
    let disps = todosDisp;
    if (cid) disps = disps.filter(d=>String(d.conductor_id)===cid);
    if (est) disps = disps.filter(d=> conds.some(c=>c.conductor_id===d.conductor_id));
    renderTodo(conds, disps);
}

function reset() {
    document.getElementById('filtro-conductor').value = '';
    document.getElementById('filtro-estado').value   = '';
    document.getElementById('disponibilidad-info').textContent = '';
    renderTodo(todosCond, todosDisp);
}

// Mapear dia a índice (Lunes=0, ...Domingo=6)
function diaIdx(dia) {
    const map = {LUNES:0,MARTES:1,MIERCOLES:2,'MIÉRCOLES':2,JUEVES:3,VIERNES:4,SABADO:5,'SÁBADO':5,DOMINGO:6};
    return map[(dia||'').toUpperCase().replace('É','E').replace('Á','A')] ?? -1;
}

function renderTodo(conds, disps) {
    document.getElementById('kpi-conductores').textContent = conds.length;
    document.getElementById('kpi-disponibles').textContent  = disps.length;

    // Día con más conductores disponibles
    const porDia = Array(7).fill(0);
    disps.forEach(d=>{ const i=diaIdx(d.dia); if(i>=0) porDia[i]++; });
    const maxDiaIdx = porDia.indexOf(Math.max(...porDia));
    document.getElementById('kpi-dia-pico').textContent = DIAS_SHORT[maxDiaIdx]||'—';
    document.getElementById('kpi-sin-disp').textContent = conds.filter(c=>!disps.some(d=>d.conductor_id===c.conductor_id)).length;

    // Grilla
    const grid = document.getElementById('grid-sem');
    let html = '<div class="sem-cell header">Conductor</div>';
    DIAS_SHORT.forEach(d=>{ html+=`<div class="sem-cell header">${d}</div>`; });

    conds.forEach(c=>{
        const displayNombre = (c.nombre_completo||c.nombre||'—');
        html+=`<div class="sem-cell name">${displayNombre.split(' ').slice(0,2).join(' ')}</div>`;
        for(let di=0;di<7;di++){
            const diaNombre = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'][di];
            const turno = disps.find(d=>d.conductor_id===c.conductor_id && (d.dia||'').toUpperCase().replace('É','E').replace('Á','A')===diaNombre);
            if (turno) {
                html+=`<div class="sem-cell available" title="${DIAS[di]}: ${turno.hora_inicio||'?'}–${turno.hora_fin||'?'}" onclick="mostrarInfo('${displayNombre}','${DIAS[di]}','${turno.hora_inicio||'?'}','${turno.hora_fin||'?'}')"></div>`;
            } else {
                html+=`<div class="sem-cell unavailable"></div>`;
            }
        }
    });

    grid.innerHTML = html;

    // Charts
    if (chartDia) chartDia.destroy();
    chartDia = new Chart(document.getElementById('chart-dia'), {
        type: 'bar',
        data: { labels:DIAS_SHORT, datasets:[{ label:'Conductores', data:porDia, backgroundColor:'#40e0d0bb', borderColor:'#40e0d0', borderWidth:2, borderRadius:5 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8',stepSize:1},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    const estados = {ACTIVO:0,EN_USO:0,INACTIVO:0};
    conds.forEach(c=>{ estados[c.estado]=(estados[c.estado]||0)+1; });
    if (chartEstado) chartEstado.destroy();
    chartEstado = new Chart(document.getElementById('chart-estado'), {
        type: 'doughnut',
        data: { labels:['Activo','En Uso','Inactivo'], datasets:[{ data:[estados.ACTIVO,estados.EN_USO,estados.INACTIVO], backgroundColor:['#4ade80bb','#fdd54fbb','#f87171bb'], borderColor:['#4ade80','#fdd54f','#f87171'], borderWidth:2 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#e0f2fe'}}} }
    });
}

function mostrarInfo(nombre, dia, inicio, fin) {
    document.getElementById('disponibilidad-info').textContent = `📋 ${nombre} — ${dia}: ${inicio} a ${fin}`;
}
