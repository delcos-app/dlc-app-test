// pantallas/comisiones.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Editar usuario · Comisión: desde cuándo se aplica el esquema, y zona de los comerciales
async function usuarioComisionYZona(id) {
  const u = (USUARIOS || []).find(x => x.id === id);
  if (!u || !$('dlg').open) return;
  // Comisión: desde cuándo se aplica el esquema (el selector se pinta un momento después)
  for (let i = 0; i < 30 && !$('ucom') && $('dlg').open; i++) await new Promise(r => setTimeout(r, 100));
  const ucom = $('ucom');
  if (ucom && !$('ucdesde')) {
    ucom.dataset.orig = ucom.value;
    ucom.closest('.g2').insertAdjacentHTML('afterend', `<div class="g2" id="ucdesde">
      <div><label class="sm" for="ucdm">Se aplica</label><select id="ucdm">
        <option value="hoy">A partir de hoy</option><option value="todo">A todo su histórico (hacia atrás)</option><option value="fecha">A partir de una fecha concreta</option></select></div>
      <div><label class="sm" for="ucdf">Fecha</label><input id="ucdf" type="date" value="${hoyISO()}" disabled></div></div>
      <div class="sm" id="uchist"></div>`);
    $('ucdm').onchange = () => { $('ucdf').disabled = $('ucdm').value !== 'fecha'; };
    const { data: h } = await RPC_ORIG('historial_esquemas', { p_usuario: id });
    if ((h || []).length && $('uchist')) $('uchist').innerHTML = 'Historial: ' + h.map(x => `${esc(x.esquema)} desde ${fechaCorta(x.desde)}${x.hasta ? ' hasta ' + fechaCorta(x.hasta) : ''}`).join(' · ');
  }
  // Zona, solo para comerciales. v2.109.0: según el rol elegido en la ventana (si se cambia a uno con cartera, aparece; si no, se oculta)
  if ($('ur') && !$('ur').dataset.zona) {
    $('ur').dataset.zona = '1';
    $('ur').addEventListener('change', () => { const z = $('uzonas'); if (z) z.classList.toggle('hide', !rolPuede($('ur').value, 'cartera')); else usuarioComisionYZona(id); });
  }
  if (rolPuede($('ur') ? $('ur').value : u.rol, 'cartera') && !$('uzonas')) {
    const html = await bloqueZonas(u);
    const ref = $('ucomzona') || $('dbody').querySelector('.acts:last-of-type');
    if (ref && $('dlg').open && !$('uzonas')) ref.insertAdjacentHTML('beforebegin', html);
    if ($('uzonas')) $('uzonas').dataset.orig = zonasMarcadas().join('|');
    $('dbody').querySelectorAll('[data-zcc]').forEach(c => c.onchange = () =>
      $('dbody').querySelectorAll(`[data-zpc="${CSS.escape(c.dataset.zcc)}"]`).forEach(x => x.checked = c.checked));
    if ($('uzok')) $('uzok').onclick = async ev => {
      const zonas = zonasMarcadas();
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('asignar_zona', { p_usuario: id, p_zonas: zonas });
      ev.target.disabled = false;
      if (error || (r && r.ok === false)) { toast('No se ha podido guardar la zona', true); return; }
      $('uzonas').dataset.orig = zonas.join('|');
      toast(`Zona guardada · ${num(r.asignados)} ${TT('medico', 'p', '', 'l', 'l', 'nuevo')} en su cartera${r.en_otra_cartera ? ` · ${num(r.en_otra_cartera)} de su zona están en otra cartera` : ''}`);
    };
  }
}

async function tarjetaComision() {
  const caja = $('c-comision');
  if (!caja) return;
  if (PERFIL.comision_ver === 'nada' || !PERFIL.comision_ver) { caja.innerHTML = ''; return; }

  const { data, error } = await db.rpc('comision_periodo', {});
  if (error || !data || data.ok === false) { caja.innerHTML = ''; return; }
  if (data.sin_esquema && !data.unidades) { caja.innerHTML = ''; return; }

  const verImporte = PERFIL.comision_ver === 'importe' && !data.sin_esquema;
  const sig = data.siguiente;
  caja.innerHTML = `<h2>Tu ${verImporte ? 'comisión' : 'actividad'} de ${periodoTxt(data.periodo)}</h2>
    <div class="kpis" style="padding:10px 16px 4px;margin:0">
      <div class="kpi"><b>${num(data.unidades)}</b><span>unidades atribuidas</span></div>
      ${verImporte ? `<div class="kpi ok"><b>${eur(data.importe)}</b><span>comisión acumulada</span></div>` : ''}
      ${verImporte && data.valor_unidad ? `<div class="kpi"><b>${eur(data.valor_unidad)}</b><span>por unidad en tu tramo</span></div>` : ''}
    </div>
    ${sig ? `<p class="sm" style="padding:0 16px 14px">
      Te faltan <b>${num(sig.faltan)}</b> unidades para el siguiente tramo${verImporte ? `, que pasaría a <b>${eur(sig.valor)}</b> por unidad, aplicado a todo el periodo` : ''}.</p>`
      : `<p class="sm" style="padding:0 16px 14px">${data.sin_esquema ? 'No tienes comisión asignada: estas unidades solo cuentan para las métricas.' : 'Estás en el tramo más alto.'}</p>`}`;
}

/* pintarComisiones: la parte base y, en orden, cada paso que se le añade (antes eran 2 capas separadas). */
async function pintarComisiones() {
  await pintarComisionesBase();
  await pintarComisionesPaso1();
  await pintarComisionesPaso2();
}

async function pintarComisionesPaso1() {
  const c = $('admcuerpo'); if (!c || $('asigesq')) return;
  const { data } = await RPC_ORIG('asignaciones_esquema_lista', {});
  const l = data || [];
  c.insertAdjacentHTML('afterbegin', `<div class="card" id="asigesq" style="padding:16px 18px">
    <div class="manh"><h2 style="padding:0">Quién cobra con cada esquema</h2><button class="btn" id="asignueva">+ Asignar esquema</button></div>
    <p class="sm">Al asignar eliges desde cuándo se aplica: a partir de hoy, a todo el histórico de esa persona o desde una fecha concreta, pasada o futura. Cada liquidación usa el esquema vigente en ese mes.</p>
    ${l.length ? `<div class="dgrid-wrap"><div class="dgrid asigs"><div class="dh"><span>Persona</span><span>Esquema</span><span>Desde</span><span>Hasta</span><span>Estado</span></div>
      ${l.map(x => `<div class="dr" style="cursor:default"><span><b>${esc(x.persona)}</b><span class="sm">${esc(x.rol)}</span></span><span>${esc(x.esquema)}</span>
        <span>${x.desde <= '2000-01-01' ? 'Todo el histórico' : fechaCorta(x.desde)}</span><span>${x.hasta ? fechaCorta(x.hasta) : '—'}</span>
        <span><span class="pill ${x.vigente ? 'p-est' : x.desde > hoyISO() ? 'p-per' : 'p-anu'}">${x.vigente ? 'Vigente' : x.desde > hoyISO() ? 'Programado' : 'Terminado'}</span></span></div>`).join('')}</div></div>`
      : '<div class="vacio">Nadie tiene todavía un esquema asignado.</div>'}</div>`);
  $('asignueva').onclick = async () => {
    if (!COMS.length) await cargarComerciales();
    if (!ESQUEMAS.length) { const { data: e } = await db.rpc('esquemas_lista'); ESQUEMAS = e || []; }
    $('dbody').innerHTML = `<div class="fh"><div><h2>Asignar esquema de comisión</h2><div class="sm">Sustituye al que tuviera esa persona desde la fecha elegida</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2"><div><label for="aep">Persona</label><select id="aep">${COMS.map(u => `<option value="${u.id}">${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('')}</select></div>
        <div><label for="aee">Esquema</label><select id="aee"><option value="">Sin comisión</option>${ESQUEMAS.map(e => `<option value="${e.id}">${esc(e.nombre)}</option>`).join('')}</select></div></div>
      <label>Se aplica</label>
      <div class="opciones" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <label class="opt"><input type="radio" name="aem" value="hoy" checked> A partir de hoy</label>
        <label class="opt"><input type="radio" name="aem" value="todo"> A todo el histórico</label>
        <label class="opt"><input type="radio" name="aem" value="fecha"> Desde una fecha</label></div>
      <div id="aefw" class="hide"><label for="aef">Fecha (puede ser pasada o futura)</label><input id="aef" type="date" value="${hoyISO()}"></div>
      <div class="avisoh" id="aeinfo"><span>Las ventas desde hoy se liquidarán con este esquema.</span></div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="aeok">Asignar</button></div>`;
    $('dlg').showModal();
    const info = () => {
      const m = $('dbody').querySelector('[name=aem]:checked').value;
      $('aefw').classList.toggle('hide', m !== 'fecha');
      $('aeinfo').querySelector('span').textContent = m === 'todo' ? 'Todas sus ventas, también las pasadas, se liquidarán con este esquema. Las liquidaciones ya cerradas no cambian.'
        : m === 'fecha' ? ($('aef').value < hoyISO() ? 'Las ventas desde esa fecha (pasada) se recalcularán con este esquema en las liquidaciones abiertas.' : 'Se aplicará automáticamente a partir de esa fecha; hasta entonces sigue el esquema actual.')
        : 'Las ventas desde hoy se liquidarán con este esquema.';
    };
    $('dbody').querySelectorAll('[name=aem]').forEach(r => r.onchange = info); $('aef').onchange = info;
    $('aeok').onclick = async () => {
      const m = $('dbody').querySelector('[name=aem]:checked').value;
      const desde = m === 'todo' ? '2000-01-01' : m === 'fecha' ? $('aef').value : hoyISO();
      const { data: r, error } = await db.rpc('asignar_esquema', { p_usuario: $('aep').value, p_esquema: $('aee').value || null, p_quitar: !$('aee').value, p_desde: desde });
      if (error || (r && r.ok === false)) { toast('No se ha podido asignar', true); return; }
      $('dlg').close(); toast('Esquema asignado'); ESQUEMAS = []; pintarComisiones();
    };
  };
}

async function pintarComisionesPaso2() {
  const a = $('asigesq'); if (a) a.remove();      // ya no va fuera: se gestiona dentro de cada esquema
}

async function calcularLiquidaciones() {
  const per = $('liqper') && $('liqper').value; if (!per) return;
  const ini = per + '-01', fin = liqMesFin(per), esq = new Set(ESQUEMAS.map(e => e.id));
  const [{ data: asg, error }, { data: ya }] = await Promise.all([
    db.from('asignaciones_comision').select('usuario_id,esquema_id,desde,hasta'),
    RPC_ORIG('liquidaciones_lista', { p_periodo: per })]);
  if (error) { toast('No se han podido leer las asignaciones: ' + error.message, true); return; }
  const cerradas = new Set((ya || []).filter(l => l.estado !== 'Borrador').map(l => l.usuario_id));
  const ids = [...new Set((asg || []).filter(a => esq.has(a.esquema_id) && (!a.desde || a.desde <= fin) && (!a.hasta || a.hasta >= ini)).map(a => a.usuario_id))];
  if (!ids.length) { toast('Nadie tuvo un esquema de comisión en ' + periodoTxt(per), true); return; }
  const calc = ids.filter(u => !cerradas.has(u));
  if (!calc.length) { toast(`Las liquidaciones de ${periodoTxt(per)} ya están aprobadas o pagadas: no se recalculan`); return; }
  const b = $('liqcalc'); if (b) b.disabled = true;
  let mal = 0;
  for (const u of calc) { const { data: r, error: e } = await db.rpc('liquidar', { p_usuario: u, p_periodo: per, p_estado: 'Borrador' }); if (e || (r && r.ok === false)) mal++; }
  if (b) b.disabled = false;
  const n = calc.length - mal;
  toast(`${n === 1 ? 'Calculada 1 liquidación' : 'Calculadas ' + n + ' liquidaciones'} de ${periodoTxt(per)}` +
    (cerradas.size ? ` · ${cerradas.size === 1 ? '1 ya aprobada o pagada se deja' : cerradas.size + ' ya aprobadas o pagadas se dejan'} como estaba${cerradas.size === 1 ? '' : 'n'}` : '') +
    (mal ? ` · ${mal} sin calcular` : ''), !!mal);
  LIQ_FIL.p = per;
  pintarComisiones();
}

async function panelComisionUsuario(u) {
  if (!ESQUEMAS.length) { const { data } = await db.rpc('esquemas_lista'); ESQUEMAS = data || []; }
  const actual = ESQUEMAS.find(e => (e.personas || []).includes(u.nombre));
  // v2.276.0: el valor guardado, de su perfil (la lista de usuarios no lo trae: siempre salía «Nada»)
  const { data: pv } = await db.from('perfiles').select('comision_ver').eq('id', u.id).maybeSingle();
  const ver = (pv && pv.comision_ver) || u.comision_ver || 'nada'; u.comision_ver = ver;
  return `<label>Comisión</label>
    <div class="g2">
      <div><label class="sm" for="ucom">Esquema</label><select id="ucom">
        <option value="">Sin comisión</option>
        ${ESQUEMAS.map(e => `<option value="${e.id}" ${actual && actual.id === e.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}
      </select></div>
      <div><label class="sm" for="uverc">Qué ve esa persona</label><select id="uverc">
        <option value="nada" ${ver === 'nada' ? 'selected' : ''}>Nada</option>
        <option value="unidades" ${ver === 'unidades' ? 'selected' : ''}>Solo sus unidades</option>
        <option value="importe" ${ver === 'importe' ? 'selected' : ''}>Unidades e importe</option>
      </select></div>
    </div>`;
}

async function personasEsquema(id) {
  const ref = $('eguardaresq') && $('eguardaresq').closest('.acts');
  if (!ref || $('esqpers')) return;
  if (!id) { ref.insertAdjacentHTML('beforebegin', '<div class="blk" id="esqpers"><h3>Quién cobra con este esquema</h3><p class="sm">Guarda el esquema y después podrás asignarlo a las personas.</p></div>'); return; }
  ref.insertAdjacentHTML('beforebegin', '<div class="blk" id="esqpers"><h3>Quién cobra con este esquema</h3><div id="esqlista" class="sm">Cargando…</div></div>');
  if (!COMS.length) await cargarComerciales();
  const pinta = async () => {
    const { data } = await db.rpc('asignaciones_esquema_lista');
    const l = (data || []).filter(x => x.esquema_id === id), hoy = hoyISO(), admin = puede('administrar');
    if (!$('esqlista')) return;
    $('esqlista').innerHTML = `${l.length ? `<div class="esqfilas">${l.map(x => {
      const est = x.vigente ? ['Vigente', 'p-est'] : x.desde > hoy ? ['Programado', 'p-per'] : ['Terminado', 'p-anu'];
      return `<div class="esqfila"><span class="candado" title="Guardado: no se puede modificar">🔒</span>
        <span class="ef1"><b>${esc(x.persona)}</b><span class="sm">${x.desde <= '2000-01-01' ? 'Todo el histórico' : 'Desde ' + fechaCorta(x.desde)}${x.hasta ? ' hasta ' + fechaCorta(x.hasta) : ''}</span></span>
        <span class="pill ${est[1]}">${est[0]}</span>
        ${admin && x.vigente ? `<button type="button" class="kcfg" data-efin="${x.usuario_id}">Terminar hoy</button>` : ''}
        ${admin && x.desde > hoy ? `<button type="button" class="kcfg" data-equi="${x.usuario_id}" data-edesde="${x.desde}">Anular</button>` : ''}</div>`;
    }).join('')}</div>` : '<p class="sm">Nadie cobra todavía con este esquema.</p>'}
    ${admin ? `<div class="esqadd"><select id="eap"><option value="">Añadir persona…</option>${COMS.filter(u => rolPuede(u.rol, 'cobrar_comision')).map(u => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select>
      <select id="eadm"><option value="hoy">desde hoy</option><option value="todo">todo su histórico</option><option value="fecha">desde una fecha…</option></select>
      <span id="eadfw" class="hide"><input id="eadf" type="date" value="${hoy}"></span>
      <button type="button" class="btn sec" id="eaok">Asignar</button></div>
      <p class="sm" style="margin-top:6px">Una vez guardada, la asignación queda bloqueada 🔒. Para cambiarla, asigna otro esquema: el anterior termina el día antes.</p>` : ''}`;
    if (!admin) return;
    $('eadm').onchange = () => $('eadfw').classList.toggle('hide', $('eadm').value !== 'fecha');
    $('eaok').onclick = async () => {
      if (!$('eap').value) { toast('Elige la persona', true); return; }
      const m = $('eadm').value, desde = m === 'todo' ? '2000-01-01' : m === 'fecha' ? $('eadf').value : hoy;
      const quien = COMS.find(u => u.id === $('eap').value).nombre;
      if (!await preguntar(`${quien} cobrará con este esquema ${m === 'todo' ? 'en todo su histórico' : 'desde el ' + fechaCorta(desde)}. Si tenía otro, termina el día antes. Una vez guardado no se puede modificar.`, { titulo: '¿Asignar el esquema?', ok: 'Asignar' })) return;
      const { data: r, error } = await db.rpc('asignar_esquema', { p_usuario: $('eap').value, p_esquema: id, p_quitar: false, p_desde: desde });
      if (error || (r && r.ok === false)) { toast('No se ha podido asignar', true); return; }
      toast('Asignado a ' + quien); ESQUEMAS = []; pinta();
    };
    $('esqlista').querySelectorAll('[data-efin]').forEach(b => b.onclick = async () => {
      if (!await preguntar('Dejará de cobrar con este esquema a partir de mañana.', { titulo: '¿Terminar hoy?', ok: 'Terminar', peligro: true })) return;
      const d = new Date(); d.setDate(d.getDate() + 1);
      await db.rpc('asignar_esquema', { p_usuario: b.dataset.efin, p_esquema: null, p_quitar: true, p_desde: fechaLocal(d) }); pinta();
    });
    $('esqlista').querySelectorAll('[data-equi]').forEach(b => b.onclick = async () => {
      if (!await preguntar('Se anula la asignación programada.', { titulo: '¿Anular?', ok: 'Anular', peligro: true })) return;
      await db.rpc('asignar_esquema', { p_usuario: b.dataset.equi, p_esquema: null, p_quitar: true, p_desde: b.dataset.edesde }); pinta();
    });
  };
  pinta();
}

function liqMesFin(per) { const [a, m] = per.split('-').map(Number); return `${per}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`; }

function editorEsquema(id) {
  const e = id ? ESQUEMAS.find(x => x.id === id) : null;
  let tramos = e && e.tramos && e.tramos.length ? e.tramos.slice() : [{ desde_u: 0, hasta_u: 100, valor: 1 }];
  let calc = e ? e.calculo : 'tramo_alcanzado';
  let fijoVal = e && e.valor_fijo ? e.valor_fijo : 1;

  const pinta = () => {
    const fijo = calc === 'fijo';
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${id ? 'Editar esquema' : 'Nuevo esquema'}</h2>
        <div class="sm">Define cómo se calcula la comisión y a quién se aplica</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label for="enom">Nombre</label><input id="enom" value="${esc(e ? e.nombre : '')}" placeholder="p. ej. Comercial zona norte">
      <div class="g2">
        <div><label for="eatr">Se cuenta por</label><select id="eatr">
          <option value="comercial" ${e && e.atribucion === 'comercial' ? 'selected' : ''}>Cartera del comercial</option>
          <option value="cierra" ${e && e.atribucion === 'cierra' ? 'selected' : ''}>Ventas que cierra (televenta)</option></select></div>
        <div><label for="ecalc">Cálculo</label><select id="ecalc">
          <option value="tramo_alcanzado" ${calc === 'tramo_alcanzado' ? 'selected' : ''}>Tramo alcanzado a todo el volumen</option>
          <option value="marginal" ${calc === 'marginal' ? 'selected' : ''}>Por tramos (cada unidad a su tramo)</option>
          <option value="fijo" ${calc === 'fijo' ? 'selected' : ''}>Importe fijo por unidad</option></select></div>
      </div>
      <div class="g2">
        <div><label for="ecan">Canal</label><select id="ecan">
          <option value="">Todos</option>
          <option value="paciente" ${e && e.canal === 'paciente' ? 'selected' : ''}>Solo venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro" ${e && e.canal === 'centro' ? 'selected' : ''}>Solo venta a centro</option></select></div>
        ${fijo ? `<div><label for="efijo">Euros por unidad</label><input id="efijo" type="number" step="0.01" min="0" value="${fijoVal}"></div>` : '<div></div>'}
      </div>
      ${fijo ? '' : `<label>Tramos <span class="sm">· deja vacío el "hasta" del último</span></label>
      <div class="trcab" aria-hidden="true"><span>Desde (uds.)</span><span>Hasta (uds.)</span><span>€ por unidad</span></div>
      <div id="etramos">${tramos.map((t, i) => `<div class="g2" style="margin-bottom:8px">
        <input data-td="${i}" type="number" min="0" value="${t.desde_u}" placeholder="Desde">
        <input data-th="${i}" type="number" min="0" value="${t.hasta_u == null ? '' : t.hasta_u}" placeholder="Hasta">
        <input data-tv="${i}" type="number" step="0.01" min="0" value="${t.valor}" placeholder="€/unidad">
        ${tramos.length > 1 ? `<button type="button" class="btn sec" data-tx="${i}">✕</button>` : ''}</div>`).join('')}</div>
      <div class="acts"><button type="button" class="btn sec" id="etmas">+ Añadir tramo</button></div>`}
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn" id="eguardaresq">${id ? 'Guardar' : 'Crear esquema'}</button></div>`;

    const leer = () => {
      if (fijo) return;
      tramos = [...$('etramos').children].map((d, i) => ({
        desde_u: +d.querySelector(`[data-td="${i}"]`).value || 0,
        hasta_u: d.querySelector(`[data-th="${i}"]`).value === '' ? null : +d.querySelector(`[data-th="${i}"]`).value,
        valor: +d.querySelector(`[data-tv="${i}"]`).value || 0
      }));
    };
    $('ecalc').onchange = () => { leer(); if ($('efijo')) fijoVal = $('efijo').value; calc = $('ecalc').value; pinta(); };
    if ($('etmas')) $('etmas').onclick = () => {
      leer();
      const ult = tramos[tramos.length - 1];
      tramos.push({ desde_u: (ult.hasta_u || ult.desde_u) + 1, hasta_u: null, valor: ult.valor });
      pinta();
    };
    $('dbody').querySelectorAll('[data-tx]').forEach(b => b.onclick = () => { leer(); tramos.splice(+b.dataset.tx, 1); pinta(); });
    personasEsquema(id);

    $('eguardaresq').onclick = async ev => {
      leer();
      if (!$('enom').value.trim()) { toast('Ponle un nombre', true); return; }
      ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const { data: r, error } = await db.rpc('guardar_esquema', { p: {
        id: id || null, nombre: $('enom').value.trim(), atribucion: $('eatr').value,
        calculo: calc, canal: $('ecan').value || null,
        valor_fijo: fijo ? $('efijo').value : null,
        ...(fijo ? {} : { tramos })
      }});
      ev.target.disabled = false; ev.target.textContent = id ? 'Guardar' : 'Crear esquema';
      if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
      $('dlg').close(); toast('Esquema guardado'); pintarComisiones();
    };
  };
  pinta();
  $('dlg').showModal();
}

async function cargarComerciales() {
  const { data } = await db.from('perfiles').select('id,nombre,rol,activo').order('nombre');
  // Solo quien lleva cartera o agenda comercial (no Dirección, Solo consulta ni médicos)
  COMS = (data || []).filter(u => u.activo && rolPuede(u.rol, 'equipo_comercial'));
  $('fcom').innerHTML = '<option value="">Todos</option><option value="ninguno">Sin comercial</option>' +
    COMS.map(u => `<option value="${u.id}" ${F.com === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('');
}

let ESQUEMAS = [];

let COMS = [];

/* ============================================================
   v2.263.0 · Liquidaciones por persona (punto 4 del plan del 11/10/2026; auditoría del manual).
   - «Calcular el periodo» buscaba a quién liquidar por el NOMBRE (dos personas con el mismo nombre se confundían) y solo a quien
     tenía el esquema abierto hoy. Ahora va por la persona (su id) y liquida a todos los que tuvieron un esquema vigente algún día
     de ese mes (también a quien dejó de cobrar a mitad de mes).
   - Además, volver a calcular un mes devolvía a «Borrador» las liquidaciones ya aprobadas o pagadas (y las descongelaba). Ahora
     solo se recalculan las que siguen en borrador; las aprobadas y pagadas no se tocan.
   - La lista de liquidaciones se puede ver por persona y por mes, con el total de lo que se ve.
   ============================================================ */
let LIQ_FIL = { u: '', p: '' };
