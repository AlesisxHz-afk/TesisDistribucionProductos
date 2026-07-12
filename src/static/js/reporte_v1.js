let todosVehiculos = [], chartEstado = null, chartTipo = null, sortDir = {};

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    document.getElementById('btn-aplicar').addEventListener('click', aplicar);
    document.getElementById('btn-reset').addEventListener('click', reset);
    document.getElementById('tabla-search').addEventListener('input', buscarTabla);
});

function cargarDatos() {
    fetch('/main/reporte/obtener_vehiculos').then(r=>r.json()).then(d=>{
        if (!d.success) throw new Error(d.message);
        todosVehiculos = d.vehiculos || [];
        poblarTipos(todosVehiculos);
        renderTodo(todosVehiculos);
    }).catch(e => {
        document.getElementById('tabla-body').innerHTML = `<tr><td colspan="7" style="color:#f87171;text-align:center;padding:20px;">${e.message}</td></tr>`;
    });
}

function poblarTipos(vehs) {
    const tipos = [...new Set(vehs.map(v=>v.tipo_vehiculo).filter(Boolean))].sort();
    const sel = document.getElementById('filtro-tipo');
    tipos.forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; sel.appendChild(o); });
}

function aplicar() {
    const tipo   = document.getElementById('filtro-tipo').value;
    const estado = document.getElementById('filtro-estado').value;
    const marca  = document.getElementById('filtro-marca').value.toLowerCase();
    let f = todosVehiculos;
    if (tipo)   f = f.filter(v=>v.tipo_vehiculo===tipo);
    if (estado) f = f.filter(v=>v.estado===estado);
    if (marca)  f = f.filter(v=>(v.marca||'').toLowerCase().includes(marca));
    renderTodo(f);
}

function reset() {
    document.getElementById('filtro-tipo').value  = '';
    document.getElementById('filtro-estado').value = '';
    document.getElementById('filtro-marca').value  = '';
    document.getElementById('tabla-search').value  = '';
    renderTodo(todosVehiculos);
}

function renderTodo(vehs) {
    document.getElementById('kpi-total').textContent    = vehs.length;
    document.getElementById('kpi-activos').textContent  = vehs.filter(v=>v.estado==='ACTIVO').length;
    document.getElementById('kpi-en-uso').textContent   = vehs.filter(v=>v.estado==='EN_USO').length;
    document.getElementById('kpi-inactivos').textContent= vehs.filter(v=>v.estado==='INACTIVO').length;

    const estados = {ACTIVO:0,EN_USO:0,INACTIVO:0};
    vehs.forEach(v=>{ estados[v.estado]=(estados[v.estado]||0)+1; });
    if (chartEstado) chartEstado.destroy();
    chartEstado = new Chart(document.getElementById('chart-estado'), {
        type: 'doughnut',
        data: { labels:['Activo','En Uso','Inactivo'], datasets:[{ data:[estados.ACTIVO,estados.EN_USO,estados.INACTIVO], backgroundColor:['#4ade80bb','#fdd54fbb','#f87171bb'], borderColor:['#4ade80','#fdd54f','#f87171'], borderWidth:2 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{color:'#e0f2fe'}}} }
    });

    const byTipo = {};
    vehs.forEach(v=>{ byTipo[v.tipo_vehiculo]=(byTipo[v.tipo_vehiculo]||0)+1; });
    const COLORES = ['#40e0d0','#fdd54f','#f87171','#a78bfa','#60a5fa','#fb923c','#34d399'];
    if (chartTipo) chartTipo.destroy();
    chartTipo = new Chart(document.getElementById('chart-tipo'), {
        type: 'bar',
        data: { labels:Object.keys(byTipo), datasets:[{ label:'Cantidad', data:Object.values(byTipo), backgroundColor:COLORES.map(c=>c+'bb'), borderColor:COLORES, borderWidth:2, borderRadius:6 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
            scales:{ x:{ticks:{color:'#7fc8e8'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#7fc8e8',stepSize:1},grid:{color:'rgba(255,255,255,0.05)'}} } }
    });

    renderTabla(vehs);
}

function renderTabla(vehs) {
    const tbody = document.getElementById('tabla-body');
    if (!vehs.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:#7fc8e8;padding:20px;">Sin resultados</td></tr>'; return; }
    tbody.innerHTML = vehs.map(v=>`
        <tr>
            <td><strong style="color:#40e0d0;">${v.placa}</strong></td>
            <td>${v.marca}</td>
            <td>${v.modelo}</td>
            <td>${v.tipo_vehiculo}</td>
            <td>${(v.cantidad_carga||0).toLocaleString('es-PE',{maximumFractionDigits:0})} u.</td>
            <td>${v.anio_fabricacion}</td>
            <td><span class="${v.estado==='ACTIVO'?'badge-activo':v.estado==='EN_USO'?'badge-en-uso':'badge-inactivo'}">${v.estado}</span></td>
        </tr>`).join('');
}

function buscarTabla() {
    const q = document.getElementById('tabla-search').value.toLowerCase();
    renderTabla(todosVehiculos.filter(v=>(v.placa+v.marca+v.modelo+v.tipo_vehiculo).toLowerCase().includes(q)));
}

function sortTable(col) {
    sortDir[col]=!sortDir[col];
    const keys=['placa','marca','modelo','tipo_vehiculo','cantidad_carga','anio_fabricacion'];
    const sorted=[...todosVehiculos].sort((a,b)=>sortDir[col]?(a[keys[col]]>b[keys[col]]?1:-1):(a[keys[col]]<b[keys[col]]?1:-1));
    renderTabla(sorted);
}
