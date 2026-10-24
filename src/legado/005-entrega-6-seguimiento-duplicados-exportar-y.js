/* ============================================================
   DLC OS 2.0 · Entrega 6: seguimiento, duplicados, exportar y contraseñas
   ============================================================ */

let SEG = { estado: '', prov: '', muni: '', modo: 'todos', pagina: 0 };
let DUPS = null, PARES = null;

/* ---------------- seguimiento ---------------- */

/* cargarSeguimiento: la parte base y, en orden, cada paso que se le añade (antes eran 2 capas separadas). */
async function cargarSeguimiento() {
  await cargarSeguimientoBase();
  await cargarSeguimientoPaso1();
  await cargarSeguimientoPaso2();
}

async function cargarSeguimientoPaso1() {
  const v = $('v-seguimiento');
  v.querySelector('.saludo h1').firstChild.textContent = 'Calidad del dato';
  v.querySelector('.saludo .fecha').textContent = `Fichas completas, datos que faltan y avance de cada ${TT('medico', 's', '', 'l', 'l')}`;
  const { data: q } = await RPC_ORIG('calidad_datos', {});
  if (!q || $('calidad')) return;
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const item = (n, t, h) => `<div class="kpi ${n ? 'warn' : 'ok'}"><button class="ai" data-ayuda-txt="${esc(h)}" data-ayuda-tit="${esc(t)}" aria-label="Qué es">i</button><b>${num(n)}</b><span>${esc(t)}</span></div>`;
  v.querySelector('.saludo').insertAdjacentHTML('afterend', `<div class="card" id="calidad" style="padding-bottom:6px">
    <div class="manh" style="padding:14px 16px 0"><h2 style="padding:0">Fichas completas: ${pct(q.completas, q.total)}%</h2><span class="sm">${num(q.completas)} de ${num(q.total)} ${TT('medico', 'p', '', 'l', 'l')}</span></div>
    <div class="barra" style="margin:8px 16px 10px"><i style="width:${pct(q.completas, q.total)}%"></i></div>
    <div class="kpis" style="padding:0 16px 10px">
      ${item(q.sin_ubicacion, 'sin ubicación', `Sin coordenadas en ${TT('consulta', 's', 'ningun', 'l', 'l')}: no entran en rutas ni en el mapa.`)}
      ${item(q.sin_horario, 'sin horario de atención', 'Sin días ni horas de atención: las rutas no pueden ajustarse a su horario.')}
      ${item(q.sin_especialidad, 'sin ' + TT('especialidad', 's', '', 'l', 'l'), `Sin ${TT('especialidad', 's', '', 'l', 'l')} en la ficha: no se pueden filtrar ni analizar por ${TT('especialidad', 's', '', 'l', 'l')}.`)}
      ${item(q.sin_contacto, 'sin teléfono ni email', `No hay forma de contactar con ellos fuera ${TT('visita', 's', 'del', 'l', 'l')}.`)}
      ${item(q.sin_provincia, 'sin provincia', 'Sin provincia no se pueden asignar por zona a un comercial.')}
      ${item(q.sin_comercial, 'sin comercial', `${TT('medico', 'p', '', 'l', 'C')} que no están en ninguna cartera.`)}
      ${item(q.duplicados, 'pendientes de unificar', 'Fichas marcadas como posibles duplicados.')}
    </div>
    <p class="sm" style="padding:0 16px 10px">Una ficha completa tiene ubicación, horario, ${TT('especialidad', 's', '', 'l', 'l')} y teléfono o email. Debajo, el avance de cada ${TT('medico', 's', '', 'l', 'l')}.</p></div>`);
}

async function cargarSeguimientoPaso2() {
  const s = document.querySelector('#v-seguimiento .saludo');
  if (s && !$('calvolver')) s.insertAdjacentHTML('beforebegin', `<button class="cfgvolver visible" id="calvolver" type="button">‹ ${TT('medico', 'p', '', 'l', 'C')}</button>`);
  if ($('calvolver')) $('calvolver').onclick = () => ir('directorio');
  document.querySelectorAll('nav.main [data-t]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === 'directorio')));
}

async function cargarSeguimientoBase() {
  $('v-seguimiento').innerHTML = `
    <div class="saludo"><div><h1>Seguimiento</h1><div class="fecha">Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}</div></div>
      <div class="acts" style="margin:0">
</div></div>
    <div class="kpis" id="segkpis"><div class="skel"></div></div>
    <div class="panel">
      <div class="filtros">
        <div><label for="sest">Estado comercial</label><select id="sest"></select></div>
        <div><label for="sprov">Provincia</label><select id="sprov"></select></div>
        <div><label for="smuni">Municipio</label><select id="smuni"></select></div>
        <div><label for="smodo">Mostrar</label><select id="smodo">
          <option value="todos">Todos</option>
          <option value="visitados">Solo visitados</option>
          <option value="sin_visitar">Sin visitar</option>
          <option value="con_accion">Con próxima acción</option>
          <option value="atrasados">Acciones atrasadas</option>
        </select></div>
      </div>
      <div class="cuenta" id="scuenta">Cargando…</div>
      <div id="slista"><div class="cargador"><span class="spin"></span><span class="sm">Cargando el seguimiento…</span></div></div>
      <div id="spag"></div>
    </div>`;

  const { data: op } = await db.rpc('opciones_filtros', {});
  const pon = (id, lista, todo) => $(id).innerHTML = `<option value="">${todo}</option>` +
    (lista || []).map(o => `<option>${esc(o.v)}</option>`).join('');
  pon('sest', op.estados, 'Todos los estados');
  pon('sprov', op.provincias, 'Todas las provincias');
  pon('smuni', op.municipios, 'Todos los municipios');
  ['sest', 'sprov', 'smuni', 'smodo'].forEach(id => $(id).onchange = () => {
    SEG = { estado: $('sest').value, prov: $('sprov').value, muni: $('smuni').value, modo: $('smodo').value, pagina: 0 };
    listaSeguimiento(true);
  });
  window.__dlSeg = async fmt => {
    const { data } = await db.rpc('exportar_seguimiento', {
      f_estado: SEG.estado || null, f_provincia: SEG.prov || null, f_municipio: SEG.muni || null, f_modo: SEG.modo });
    descargar(data || [], 'Exportacion_seguimiento', fmt);
  };
  if ($('segdup')) $('segdup').onclick = () => ir('duplicados');


  const { data: r } = await db.rpc('resumen_seguimiento');
  if (r) {
    const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '0%';
    const emb = (r.embudo || []).map(e => `<div class="kpi"><b>${num(e.n)}</b><span>${esc(e.estado)}</span></div>`).join('');
    $('segkpis').innerHTML = emb +
      `<div class="kpi ok"><b>${num(r.visitados)}</b><span>${TT('medico', 'p', '', 'l', 'l', 'visitado')}</span></div>
       <div class="kpi"><b>${num(r.visitas_total)}</b><span>${TT('visita', 'p', '', 'l', 'l', 'registrado')}</span></div>
       <div class="kpi"><b>${num(r.muestras_total)}</b><span>muestras entregadas</span></div>
       <div class="kpi"><b>${pct(r.con_direccion, r.total)}</b><span>fichas con dirección</span></div>
       <div class="kpi"><b>${pct(r.con_dias, r.total)}</b><span>con días de atención</span></div>`;
  }
  listaSeguimiento(true);
}

async function listaSeguimiento(reinicia) {
  if (reinicia) SEG.pagina = 0;
  cargando($('slista'), 'Cargando el seguimiento…');
  $('scuenta').textContent = 'Buscando…';
  const { data, error } = await db.rpc('seguimiento_lista', {
    f_estado: SEG.estado || null, f_provincia: SEG.prov || null, f_municipio: SEG.muni || null,
    f_modo: SEG.modo, lim: tamPagina(), desplaz: SEG.pagina * tamPagina()
  });
  if (error) { $('scuenta').textContent = 'No se ha podido cargar: ' + error.message; return; }
  $('scuenta').innerHTML = `<b>${num(data.total)}</b> ${TT('medico', 'p', '', 'l', 'l')}`;
  const filas = data.filas || [];
  if (!filas.length) { $('slista').innerHTML = '<div class="vacio">Nada que mostrar con estos filtros.</div>'; }
  else {
    $('slista').innerHTML = '';
    $('slista').insertAdjacentHTML('beforeend', filas.map(m => `
    <button class="fila" data-id="${m.id}">
      <span><span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>
        <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || '')} ${esc(m.municipio || '')}</span></span>
      <span class="c2"><span class="sm">${m.ultima_visita ? 'Última: <b>' + fechaCorta(m.ultima_visita) + '</b> · ' + esc(m.ultimo_resultado || '') : 'Sin visitar'}</span>
        <span class="sm">${m.n_visitas} ${TT('visita', 'p', '', 'l', 'l')}${m.muestras ? ' · ' + m.muestras + ' muestras' : ''}</span></span>
      <span class="c3"><span class="sm">${m.proxima_fecha
        ? `<b style="color:${m.proxima_fecha < hoyISO() ? 'var(--warn)' : 'var(--navy)'}">${fechaCorta(m.proxima_fecha)}</b><br>${esc(m.proxima_accion || '')}
           <br><span class="acts" style="margin:4px 0 0"><button class="btn sec chico" data-acc="hecha|${m.id}">Hecha</button>
           <button class="btn sec chico" data-acc="aplazar|${m.id}">Aplazar</button></span>`
        : ''}</span></span>
      <span class="pill p-est">${esc(m.estado_comercial)}</span>
    </button>`).join(''));
  }
  paginador($('spag'), data.total, SEG.pagina, p => { SEG.pagina = p; listaSeguimiento(false); $('slista').scrollIntoView({ block: 'start', behavior: 'smooth' }); },
    () => listaSeguimiento(true));
  $('slista').onclick = async e => {
    const acc = e.target.closest('[data-acc]');
    if (acc) {
      e.stopPropagation();
      const [modo, mid] = acc.dataset.acc.split('|');
      let f = null;
      if (modo === 'aplazar') { f = await pedirFecha('¿Para cuándo la aplazas?', isoMas(hoyISO(), 7), { titulo: 'Aplazar acción', ok: 'Aplazar' }); if (!f) return; }
      const { data: r } = await db.rpc('resolver_accion', { p_medico: mid, p_modo: modo, p_fecha: f });
      if (r && r.ok === false) { toast('No se ha podido', true); return; }
      toast(modo === 'hecha' ? 'Acción marcada como hecha' : 'Acción aplazada');
      listaSeguimiento(true); cargarInicio();
      return;
    }
    const b = e.target.closest('[data-id]'); if (b) abrirFicha(b.dataset.id);
  };
}

/* ---------------- exportar ---------------- */



/* ---------------- duplicados ---------------- */

async function abrirDuplicados() {
  $('dbody').innerHTML = `<div class="fh"><div><h2>Duplicados</h2>
      <div class="sm">Fichas marcadas y búsqueda de parecidos en toda la base</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="acts"><button class="btn sec" id="dscan">Buscar parecidos (≥80%)</button>
      <button class="btn sec" id="dpend">Revisar pendientes</button></div>
    <div id="dcuerpo"><div class="skel"></div><div class="skel" style="width:60%"></div></div>`;
  $('dlg').showModal();

  $('dscan').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Buscando…';
    const { data } = await db.rpc('escanear_duplicados', { p_umbral: 80, p_tope: 100 });
    ev.target.disabled = false; ev.target.textContent = 'Buscar parecidos (≥80%)';
    PARES = data || [];
    pintarDuplicados();
  };

  $('dpend').onclick = () => revisarPendientes();
  const { data } = await db.rpc('duplicados_pendientes');
  DUPS = data || [];
  pintarDuplicados();
}

function pintarDuplicados() {
  const pend = (DUPS || []).map(d => `<div class="item" style="cursor:default">
      <span class="ic w">!</span>
      <span class="tx"><b>${esc(d.nombre)}</b><span class="sm">Código ${esc(d.codigo)} · ${esc(d.centro || '')} ${esc(d.municipio || '')}${d.duplicado_de ? ' · parecido a ' + esc(d.duplicado_de) : ''}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" data-dficha="${d.id}">Ver ficha</button></span></div>`).join('');

  const pares = (PARES || []).map(p => `<div class="item" style="cursor:default">
      <span class="ic">${p.pct}%</span>
      <span class="tx"><b>${esc(p.a_nombre)}</b><span class="sm">códigos ${esc(p.a_codigo)} y ${esc(p.b_codigo)} · ${esc(p.b_nombre)}</span></span>
      <span class="acts" style="margin:0"><button class="btn" data-unif="${p.a_id}|${p.b_id}">Comparar</button></span></div>`).join('');

  $('dcuerpo').innerHTML =
    `<h2 style="padding:8px 0 0">Pendientes de unificar<span class="n">${(DUPS || []).length}</span></h2>
     ${pend ? `<div class="lista">${pend}</div>` : '<div class="vacio">Ninguna ficha marcada.</div>'}
     ${PARES ? `<h2 style="padding:12px 0 0">Parecidos encontrados<span class="n">${PARES.length}</span></h2>
       ${pares ? `<div class="lista">${pares}</div>` : '<div class="vacio">Sin parejas por encima del 80%.</div>'}` : ''}`;

  $('dcuerpo').querySelectorAll('[data-dficha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.dficha); });
  $('dcuerpo').querySelectorAll('[data-unif]').forEach(b => b.onclick = () => {
    const [a, c] = b.dataset.unif.split('|'); compararFichas(a, c);
  });
}

const CAMPOS_UNI = [['nombre', 'Nombre'], ['especialidad', TT('especialidad', 's', '', 'l', 'C')], ['area', 'Área'],
  ['telefono', 'Teléfono'], ['email', 'Email'], ['contacto', 'Contacto'], ['nota', 'Nota'],
  ['estado_comercial', 'Estado comercial']];

async function compararFichas(idA, idB) {
  const [{ data: A }, { data: B }] = await Promise.all([
    db.rpc('ficha_cuenta', { p_id: idA }), db.rpc('ficha_cuenta', { p_id: idB })
  ]);
  const a = A.medico, b = B.medico;
  if (a.id === b.id) { toast('Es la misma ficha', true); return; }
  let queda = b.id;
  const eleccion = {};
  CAMPOS_UNI.forEach(([k]) => eleccion[k] = b[k] ? 'queda' : (a[k] ? 'va' : 'queda'));

  const pinta = () => {
    const va = queda === a.id ? b : a, qu = queda === a.id ? a : b;
    const dif = CAMPOS_UNI.filter(([k]) => (a[k] || '') !== (b[k] || ''));
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Unificar fichas</h2>
        <div class="sm">Elige cuál se conserva y con qué datos. ${TT('consulta', 'p', '', 'l', 'C')}, ${TT('visita', 'p', '', 'l', 'l')}, citas y cartera se juntan en la que quede.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="opciones">
        ${[a, b].map(m => `<button class="opt" data-queda="${m.id}" aria-pressed="${queda === m.id}">
          <span class="mk"></span><span><b>${esc(m.nombre)}</b><br><span class="sm">Código ${esc(m.codigo)} · se conserva esta</span></span></button>`).join('')}
      </div>
      ${dif.length ? `<div style="margin-top:12px">${dif.map(([k, t]) => `
        <label>${t}</label>
        <div class="opciones">
          <button class="opt" data-campo="${k}|queda" aria-pressed="${eleccion[k] === 'queda'}"><span class="mk"></span>${esc(qu[k] || '(vacío)')}</button>
          <button class="opt" data-campo="${k}|va" aria-pressed="${eleccion[k] === 'va'}"><span class="mk"></span>${esc(va[k] || '(vacío)')}</button>
        </div>`).join('')}</div>` : '<p class="sm" style="margin-top:12px">Los datos principales coinciden.</p>'}
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn dang" id="uniok">Unificar</button></div>`;

    $('dbody').querySelectorAll('[data-queda]').forEach(x => x.onclick = () => { queda = x.dataset.queda; pinta(); });
    $('dbody').querySelectorAll('[data-campo]').forEach(x => x.onclick = () => {
      const [k, v] = x.dataset.campo.split('|'); eleccion[k] = v; pinta();
    });
    $('uniok').onclick = async ev => {
      const desaparece = queda === a.id ? b.id : a.id;
      if (!await preguntar(`Desaparece la ficha de ${queda === a.id ? b.nombre : a.nombre}.\nNo se puede deshacer desde la app.`, { titulo: '¿Unificar fichas?', ok: 'Unificar', peligro: true })) return;
      ev.target.disabled = true; ev.target.textContent = 'Unificando…';
      const { data: r, error } = await db.rpc('unificar_cuentas', { p: { queda, va: desaparece, campos: eleccion } });
      ev.target.disabled = false; ev.target.textContent = 'Unificar';
      if (error || (r && r.ok === false)) { toast('No se ha podido unificar', true); return; }
      toast('Fichas unificadas');
      DUPS = null; PARES = (PARES || []).filter(p => p.a_id !== desaparece && p.b_id !== desaparece);
      abrirDuplicados();
      buscar(true); cargarInicio();
    };
  };
  pinta();
}

/* ---------------- contraseñas ---------------- */

$('lform').insertAdjacentHTML('beforeend',
  '<button type="button" id="lolv" style="border:0;background:none;color:var(--navy);font-weight:600;cursor:pointer;margin-top:10px;font-size:13.5px">He olvidado la contraseña</button>');

$('lolv').onclick = async () => {
  const email = $('lu').value.trim();
  if (!email) { $('lmsg').textContent = 'Escribe primero tu correo.'; return; }
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  $('lmsg').style.color = error ? 'var(--dang)' : 'var(--ok)';
  $('lmsg').textContent = error ? 'No se ha podido enviar: ' + error.message
    : 'Te hemos enviado un correo para crear una contraseña nueva.';
};

/* Si el usuario llega desde el correo de recuperación, pedimos la contraseña nueva. */
db.auth.onAuthStateChange(async (evento) => {
  if (evento !== 'PASSWORD_RECOVERY') return;
  // Nunca con la plataforma de fondo: pantalla limpia solo con la contraseña nueva
  if (typeof pantallaRecuperacion === 'function') { pantallaRecuperacion(); return; }
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Nueva contraseña</h2><div class="sm">Elige una de al menos 8 caracteres</div></div></div>
    <label for="np1">Contraseña</label><input id="np1" type="password">
    <label for="np2">Repítela</label><input id="np2" type="password">
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="npok">Guardar</button></div>`;
  $('dlg').showModal();
  $('npok').onclick = async ev => {
    if ($('np1').value.length < 8 || $('np1').value !== $('np2').value) { toast('Revisa las contraseñas', true); return; }
    ev.target.disabled = true;
    const { error } = await db.auth.updateUser({ password: $('np1').value });
    ev.target.disabled = false;
    if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
    $('dlg').close(); toast('Contraseña actualizada'); arrancar();
  };
});

/* Cambiar la contraseña desde el menú de usuario */
document.addEventListener('click', async e => {
  if (!e.target.closest('[data-u="pass"]')) return;
  const p1 = await pedirTexto('Escribe la contraseña nueva (mínimo 8 caracteres)', '', { titulo: 'Cambiar contraseña', tipo: 'password', ok: 'Guardar' });
  if (!p1) return;
  if (p1.length < 8) { toast('Demasiado corta', true); return; }
  const { error } = await db.auth.updateUser({ password: p1 });
  toast(error ? 'No se ha podido: ' + error.message : 'Contraseña actualizada', !!error);
});



