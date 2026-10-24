/* ============================================================
   DLC OS 2.0 · Entrega 10: pedidos, unidades y analítica
   ============================================================ */

let PRODUCTOS = [], PEDIDOS = [], SIN_ATRIB = [];
const AN = { dim: 'medico', desde: '', hasta: '', canal: '', producto: '' };
// Crear o cambiar pedidos y pacientes: administración y televenta (el comercial solo consulta lo suyo)
const puedeVentas = () => PERFIL && (puede('administrar') || (((PERFIL.areas || {}).V || 0) >= 2 && puede('televenta')));
const veVentas = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 1 || puede('cartera'));


/* ---------------- pedidos ---------------- */



async function pintarSinAtribuir() {
  if (!$('cardsinatr')) return;
  const { data } = await db.rpc('lineas_sin_atribuir');
  if (!$('cardsinatr')) return;
  SIN_ATRIB = data || [];
  if (!SIN_ATRIB.length) { $('cardsinatr').innerHTML = ''; return; }
  $('cardsinatr').innerHTML = `<h2><span style="color:var(--warn)">Pedidos sin atribuir</span><span class="n">${SIN_ATRIB.length}</span></h2>
    <p class="sm">No hemos podido identificar ${TT('medico', 's', 'al', 'l', 'l')}. Asígnalo y las métricas se corrigen solas.</p>
    <div class="lista">${SIN_ATRIB.map(l => `<div class="item" style="cursor:default">
      <span class="ic w">?</span>
      <span class="tx"><b>${esc(l.cuenta_texto || 'Sin indicar')}</b>
        <span class="sm">${fechaCorta(l.fecha)} · ${num(l.unidades)} uds. · ${esc(l.producto || '')} · ${esc(l.contacto || '')}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" data-atr="${l.id}|${esc(l.cuenta_texto || '')}">Atribuir</button></span>
    </div>`).join('')}</div>`;
  $('cardsinatr').querySelectorAll('[data-atr]').forEach(b => b.onclick = () => {
    const [id, texto] = b.dataset.atr.split('|'); atribuir(id, texto);
  });
}

async function atribuir(lineaId, texto) {
  const { data } = await db.rpc('resolver_cuenta', { p_texto: texto || '' });
  const cand = data || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Atribuir a ${TT('medico', 's', 'un', 'l', 'l')}</h2><div class="sm">Texto del pedido: ${esc(texto || '(vacío)')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="abusca">Buscar ${TT('medico', 's', '', 'l', 'l')}</label><input id="abusca" value="${esc(texto || '')}" placeholder="Código o nombre">
    <div id="acand" class="lista">${cand.map(c => `<button class="item" data-am="${c.id}">
      <span class="ic">${c.pct}%</span><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">Código ${esc(c.codigo)}</span></span></button>`).join('')
      || '<div class="vacio">Sin coincidencias. Escribe otro nombre o código.</div>'}</div>`;

  const pintar = lista => {
    $('acand').innerHTML = lista.length ? lista.map(c => `<button class="item" data-am="${c.id}">
      <span class="ic">${c.pct}%</span><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">Código ${esc(c.codigo)}</span></span></button>`).join('')
      : '<div class="vacio">Sin coincidencias.</div>';
    $('acand').querySelectorAll('[data-am]').forEach(b => b.onclick = async () => {
      const { data: r, error } = await db.rpc('atribuir_linea', { p_linea: lineaId, p_medico: b.dataset.am });
      if (error || (r && r.ok === false)) { toast('No se ha podido atribuir', true); return; }
      $('dlg').close(); toast('Atribuido'); pintarSinAtribuir(); listaPedidos();
    });
  };
  pintar(cand);
  let t;
  $('abusca').oninput = e => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const { data: d2 } = await db.rpc('resolver_cuenta', { p_texto: e.target.value });
      pintar(d2 || []);
    }, 300);
  };
  $('dlg').showModal();
}

/* ---------------- alta de pedido ---------------- */


/* ---------------- productos ---------------- */


/* ---------------- analítica ---------------- */





