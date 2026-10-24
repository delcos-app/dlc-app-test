/* ============================================================
   DLC OS 2.0 · v2.19.0 · Selectores con tarjeta, rutas en curso,
   Pacientes y Productos como módulos, comerciales en el directorio,
   cambios sin guardar y protección de datos
   ============================================================ */

const VE_TODO = () => puede('ver_todo');
const puedeMedicoLibre = () => puede('administrar') || nivelDe2('V') >= 2;   // v2.329.0

/* ---------------- fechas y horas: todo el campo abre el selector ---------------- */

document.addEventListener('click', e => {
  const i = e.target.closest('input[type=date], input[type=time], input[type=month], input[type=week], input[type=datetime-local]');
  if (i && !i.disabled && !i.readOnly && typeof i.showPicker === 'function') { try { i.showPicker(); } catch (err) {} }
});

/* ---------------- protección de datos: sin descargas ---------------- */

function descargar() { toast('La descarga de datos está desactivada para proteger la información.', true); }
['__dlDir', '__dlSeg', '__dlAn'].forEach(k => { try { delete window[k]; } catch (e) { window[k] = undefined; } });

/* ---------------- buscador superior: se limpia al elegir ---------------- */

document.addEventListener('click', e => {
  if (!e.target.closest('#gsug [data-gm], #gsug [data-gc], #gsug [data-gme]')) return;
  setTimeout(() => {
    $('q').value = '';
    $('q').closest('.gsearch').classList.remove('buscando');
    $('q').blur();
  }, 0);
});

/* ---------------- ventanas con cambios sin guardar ---------------- */

['dlg', 'dlg2'].forEach(id => {
  const d = $(id);
  d.addEventListener('input', e => { if (!e.target.closest('[data-nosucio]')) d.dataset.sucio = '1'; });
  d.addEventListener('change', e => { if (!e.target.closest('[data-nosucio]')) d.dataset.sucio = '1'; });
  d.addEventListener('close', () => { delete d.dataset.sucio; });
  d.addEventListener('cancel', e => { e.preventDefault(); intentarCerrar(d); });
});

async function intentarCerrar(d) {
  if (d.dataset.sucio && hayBotonGuardar(d) && !await preguntar('Si sales ahora perderás los cambios que has hecho.',
    { titulo: '¿Salir sin guardar?', ok: 'Salir sin guardar', peligro: true })) return;
  d.close();
}

/* ---------------- selector de médico (igual que el buscador principal) ---------------- */

const tarjetaMedico = m => `<div class="selcard"><span class="ic">👤</span>
  <span class="tx"><b>${esc(m.nombre)}</b>
    <span class="sm">${esc([m.especialidad, m.centro_nombre || m.centro, m.municipio].filter(Boolean).join(' · '))}</span>
    ${m.codigo ? `<span class="sm">Código ${esc(m.codigo)}</span>` : ''}</span>
  <button type="button" class="sx" aria-label="Quitar">✕</button></div>`;

function cerrarPickers(salvo) {
  document.querySelectorAll('.picker .gsug').forEach(g => { if (!salvo || !salvo.contains(g)) g.classList.add('hide'); });
}
document.addEventListener('pointerdown', e => { if (!e.target.closest('.picker')) cerrarPickers(); });

/**
 * Pinta en `el` un buscador de médicos. Al elegir, el campo se cambia por una tarjeta con ✕.
 * opciones: valor (médico elegido), alElegir(m | null), placeholder
 */
function selectorMedico(el, o) {
  let valor = o.valor || null;
  const pinta = () => {
    if (valor) {
      el.innerHTML = tarjetaMedico(valor);
      el.querySelector('.sx').onclick = () => { valor = null; el.__texto = ''; pinta(); o.alElegir && o.alElegir(null); setTimeout(() => { const i = el.querySelector('input'); if (i) i.focus(); }, 0); };
      return;
    }
    el.innerHTML = `<div class="picker"><input type="search" autocomplete="off" placeholder="${esc(o.placeholder || 'Busca por nombre, centro o municipio')}" value="${esc(el.__texto || '')}">
      <div class="gsug hide"></div></div>`;
    const caja = el.querySelector('.picker'), inp = caja.querySelector('input'), sug = caja.querySelector('.gsug');
    let t, pide = 0;
    const elegir = m => { valor = m; el.__texto = ''; pinta(); o.alElegir && o.alElegir(m); };
    const listaMedicos = async (titulo, params) => {
      caja.classList.add('buscando');
      sug.innerHTML = `<div class="gload"><span class="spin"></span>Buscando ${TT('medico', 'p', '', 'l', 'l')}…</div>`; sug.classList.remove('hide');
      const { data } = await db.rpc('buscar_cuentas', Object.assign({ q: null, f_provincia: null, f_municipio: null, f_estado: null,
        f_especialidad: null, f_area: null, f_urgentes: false, f_mios: false, f_sin_visitar: false, orden: 'nombre', lim: 30, desplaz: 0 }, params));
      caja.classList.remove('buscando');
      const f = (data && data.filas) || [];
      sug.innerHTML = `<button type="button" class="gback" data-back>← Volver a los resultados</button>
        <div class="gsh">${esc(titulo)} · ${num(data ? data.total : 0)} ${TT('medico', 'p', '', 'l', 'l')}${data && data.total > 30 ? ' (se muestran 30)' : ''}</div>` +
        (f.map((m, i) => `<button type="button" data-pm="${i}"><span class="gic">${m.urgente ? '❗' : '👤'}</span>
          <span><b>${esc(m.nombre)}</b><span class="sm">${esc([m.especialidad, m.centro_nombre, m.municipio].filter(Boolean).join(' · '))}</span></span></button>`).join('')
          || `<div class="gload">Sin ${TT('medico', 'p', '', 'l', 'l')}.</div>`);
      sug.querySelector('[data-back]').onclick = () => buscarTexto();
      sug.querySelectorAll('[data-pm]').forEach(b => b.onclick = () => elegir(f[+b.dataset.pm]));
    };
    const buscarTexto = () => {
      const q = inp.value.trim(); el.__texto = inp.value;
      clearTimeout(t);
      if (q.length < 2) { sug.classList.add('hide'); caja.classList.remove('buscando'); return; }
      caja.classList.add('buscando');
      sug.innerHTML = '<div class="gload"><span class="spin"></span>Buscando…</div>'; sug.classList.remove('hide');
      const n = ++pide;
      t = setTimeout(async () => {
        const { data } = await db.rpc('buscar_global', { q, lim: 6 });
        if (n !== pide) return;
        caja.classList.remove('buscando');
        if (!data) { sug.innerHTML = '<div class="gload">No se ha podido buscar. Revisa la conexión.</div>'; return; }
        const mu = data.municipios || [], ce = data.centros || [], me = data.medicos || [];
        if (!mu.length && !ce.length && !me.length) { sug.innerHTML = `<div class="gload">Sin resultados para «${esc(q)}».</div>`; return; }
        sug.innerHTML =
          (mu.length ? '<div class="gsh">Municipios</div>' + mu.map((x, i) => `<button type="button" data-pmu="${i}"><span class="gic">📍</span>
            <span><b>${resaltarBusqueda(x.valor, q)}</b><span class="sm">${num(x.n)} ${TT('medico', 'p', '', 'l', 'l')} · ver la lista</span></span></button>`).join('') : '') +
          (ce.length ? '<div class="gsh">Centros</div>' + ce.map((x, i) => `<button type="button" data-pce="${i}"><span class="gic">🏥</span>
            <span><b>${resaltarBusqueda(x.valor, q)}</b><span class="sm">${esc(x.municipio || '')} · ${num(x.n)} ${TT('medico', 'p', '', 'l', 'l')} · ver la lista</span></span></button>`).join('') : '') +
          (me.length ? `<div class="gsh">${TT('medico', 'p', '', 'l', 'C')}</div>` + me.map((x, i) => `<button type="button" data-pme="${i}"><span class="gic">${x.urgente ? '❗' : '👤'}</span>
            <span><b>${resaltarBusqueda(x.nombre, q)}</b><span class="sm">${esc([x.especialidad, x.centro_nombre, x.municipio].filter(Boolean).join(' · '))}</span></span></button>`).join('') : '');
        sug.querySelectorAll('[data-pmu]').forEach(b => b.onclick = () => listaMedicos(mu[+b.dataset.pmu].valor, { f_municipio: mu[+b.dataset.pmu].valor }));
        sug.querySelectorAll('[data-pce]').forEach(b => b.onclick = () => listaMedicos(ce[+b.dataset.pce].valor, { q: ce[+b.dataset.pce].valor }));
        sug.querySelectorAll('[data-pme]').forEach(b => b.onclick = () => elegir(me[+b.dataset.pme]));
      }, 250);
    };
    inp.oninput = buscarTexto;
    inp.onfocus = () => { if (inp.value.trim().length >= 2 && sug.innerHTML) { cerrarPickers(caja); sug.classList.remove('hide'); } };
    inp.onkeydown = e => { if (e.key === 'Escape') { sug.classList.add('hide'); e.stopPropagation(); } };
  };
  pinta();
  el.__valor = () => valor;
}

/* ---------------- selector de paciente ---------------- */

const tarjetaPaciente = c => `<div class="selcard"><span class="ic">🧑</span>
  <span class="tx"><b>${esc(c.nombre)}</b>
    ${[c.direccion, [c.cp, c.municipio].filter(Boolean).join(' '), c.provincia].filter(Boolean).length
      ? `<span class="sm">📦 ${esc([c.direccion, [c.cp, c.municipio].filter(Boolean).join(' '), c.provincia].filter(Boolean).join(', '))}</span>`
      : '<span class="sm" style="color:var(--warn)">Sin dirección de entrega</span>'}
    <span class="sm">${esc([c.nif ? (c.tipo === 'Empresa' ? 'CIF ' : 'DNI ') + c.nif : 'Sin DNI', c.email, c.telefono || c.movil].filter(Boolean).join(' · '))}</span>
    ${c.medico ? `<span class="sm">${TT('medico', 's', '', 'l', 'C')}: ${esc(c.medico)}</span>` : ''}</span>
  <button type="button" class="sx" aria-label="Quitar">✕</button></div>`;

function selectorPaciente(el, o) {
  let valor = o.valor || null;
  const pinta = () => {
    if (valor) {
      el.innerHTML = tarjetaPaciente(valor);
      el.querySelector('.sx').onclick = () => { valor = null; pinta(); o.alElegir && o.alElegir(null); };
      return;
    }
    el.innerHTML = `<div style="display:flex;gap:8px"><div class="picker" style="flex:1">
        <input type="search" autocomplete="off" placeholder="Nombre, teléfono o DNI"><div class="gsug hide"></div></div>
      <button type="button" class="btn sec" data-pnuevo>+ Nuevo</button></div>`;
    const caja = el.querySelector('.picker'), inp = caja.querySelector('input'), sug = caja.querySelector('.gsug');
    let t, pide = 0;
    inp.oninput = () => {
      const q = inp.value.trim();
      clearTimeout(t);
      if (q.length < 2) { sug.classList.add('hide'); caja.classList.remove('buscando'); return; }
      caja.classList.add('buscando');
      sug.innerHTML = `<div class="gload"><span class="spin"></span>Buscando ${TT('paciente', 'p', '', 'l', 'l')}…</div>`; sug.classList.remove('hide');
      const n = ++pide;
      t = setTimeout(async () => {
        const { data } = await db.rpc('contactos_lista', { q, lim: 8 });
        if (n !== pide) return;
        caja.classList.remove('buscando');
        const l = data || [];
        sug.innerHTML = `<div class="gsh">${TT('paciente', 'p', '', 'l', 'C')}</div>` + (l.map((x, i) => `<button type="button" data-pc="${i}"><span class="gic">🧑</span>
          <span><b>${esc(x.nombre)}</b><span class="sm">${esc([x.telefono || x.movil, x.nif, x.municipio, x.medico].filter(Boolean).join(' · '))}</span></span></button>`).join('')
          || `<div class="gload">Sin coincidencias. Créalo con «+ Nuevo».</div>`);
        sug.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { valor = l[+b.dataset.pc]; pinta(); o.alElegir && o.alElegir(valor); });
      }, 250);
    };
    el.querySelector('[data-pnuevo]').onclick = () => editorContacto({ nombre: inp.value.trim() }, c => {
      valor = Object.assign({}, c); pinta(); o.alElegir && o.alElegir(valor);
    });
  };
  pinta();
}

/* ---------------- nueva cita con el selector de médico ---------------- */

async function nuevaCita(medicoId, fecha) {
  let elegido = null;
  if (medicoId) {
    const { data } = await db.rpc('ficha_cuenta', { p_id: medicoId });
    const m = data && data.medico, c = data && (data.consultas || [])[0];
    if (m) elegido = Object.assign({}, m, { centro_nombre: c ? c.centro_nombre : '', municipio: c ? c.municipio : '' });
  }
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Nueva cita</h2><div class="sm">Se añade a tu agenda</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label>${TT('medico', 's', '', 'l', 'C')}</label><div id="ncsel"></div>
    <div class="g2">
      <div><label for="ncf">Día</label><input id="ncf" type="date" value="${esc(fecha || hoyISO())}"></div>
      <div><label for="nch">Hora</label><input id="nch" type="time"></div>
    </div>
    <label for="ncn">Nota</label><input id="ncn" placeholder="p. ej. llevar reporting">
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="ncok">Añadir a la agenda</button></div>`;
  selectorMedico($('ncsel'), { valor: elegido, alElegir: m => { elegido = m; } });
  $('ncok').onclick = async ev => {
    if (!elegido) { toast(`Elige ${TT('medico', 's', 'un', 'l', 'l')}`, true); return; }
    const decision = await citaRepetida(elegido.id, $('ncf').value);
    if (!decision) return;
    ev.target.disabled = true;
    const r = await escribir('guardar_cita', { p: {
      cuenta_id: elegido.id, fecha: $('ncf').value, hora: $('nch').value || null,
      centro_nombre: elegido.centro_nombre || elegido.centro || null, estado: 'Planificada', origen: 'Agenda',
      usuario_id: TAB === 'agenda' && AG_VISTA ? AG_VISTA.id : null,
      nota: $('ncn').value.trim(), op_id: 'c-' + elegido.id + '-' + $('ncf').value + '-' + Date.now()
    }});
    ev.target.disabled = false;
    if (r.error) { toast('No se ha podido: ' + r.error.message, true); return; }
    $('dlg').close(); toast('Cita añadida'); if (TAB === 'agenda') cargarAgenda(); cargarInicio();
  };
  $('dlg').showModal();
}

/* ---------------- documento de identidad ---------------- */

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
function validarDoc(v, tipo) {
  v = (v || '').toUpperCase().replace(/[\s-]/g, '');
  if (!v) return { ok: true, v };
  if (tipo === 'Empresa') {
    const m = v.match(/^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/);
    if (!m) return { ok: false, v, msg: 'El CIF son una letra, 7 números y un dígito o letra de control (p. ej. B24920548).' };
    let a = 0, b = 0;
    m[2].split('').forEach((d, i) => { if (i % 2) a += +d; else { const x = 2 * d; b += Math.floor(x / 10) + x % 10; } });
    const c = (10 - (a + b) % 10) % 10, letra = 'JABCDEFGHI'[c];
    return (m[3] === String(c) || m[3] === letra) ? { ok: true, v } : { ok: false, v, msg: 'El dígito de control del CIF no es correcto.' };
  }
  let n = v;
  if (/^[XYZ]\d{7}[A-Z]$/.test(n)) n = 'XYZ'.indexOf(n[0]) + n.slice(1);
  if (!/^\d{8}[A-Z]$/.test(n)) return { ok: false, v, msg: 'El DNI son 8 números y una letra; el NIE, X, Y o Z seguida de 7 números y una letra.' };
  return LETRAS_DNI[+n.slice(0, 8) % 23] === n[8] ? { ok: true, v } : { ok: false, v, msg: 'La letra no corresponde a ese número.' };
}

/* ---------------- alta y edición de paciente ---------------- */

function editorContacto(c, alGuardar, op) {
  c = c || {}; op = op || {};
  // v2.119.0: en un cliente nuevo, desplegable «Registro de llamada» (abierto si se viene de registrar una llamada)
  const conLlamada = !c.id && !!op.llamada;   // v2.125.0: solo si se viene de una llamada antigua; el recorrido es «Nueva venta»
  let tipo = c.tipo || 'Persona';
  let medico = c.cuenta_id ? { id: c.cuenta_id, nombre: c.medico || `${TT('medico', 's', '', 'l', 'C', 'asignado')}`, codigo: c.medico_codigo || '' } : null;
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>${c.id ? `Editar ${TT('paciente', 's', '', 'l', 'l')}` : `${TT('paciente', 's', 'nuevo', 'C', 'l')}`}</h2>
      <div class="sm">Datos de entrega y facturación</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="subnav" style="margin:6px 0 4px"><button type="button" data-ktipo="Persona" aria-pressed="${tipo === 'Persona'}">Persona</button>
      <button type="button" data-ktipo="Empresa" aria-pressed="${tipo === 'Empresa'}">Empresa</button></div>
    <div class="g2">
      <div><label for="konom" id="konoml">${tipo === 'Empresa' ? 'Razón social' : 'Nombre y apellidos'}</label><input id="konom" value="${esc(c.nombre || '')}"></div>
      <div><label for="konif" id="konifl">${tipo === 'Empresa' ? 'CIF' : 'DNI o NIE'}</label>
        <input id="konif" value="${esc(c.nif || '')}" placeholder="${tipo === 'Empresa' ? 'B12345678' : '12345678Z'}" autocapitalize="characters">
        <div class="sm" id="konifm" style="margin-top:4px"></div></div>
    </div>
    <label>${TT('medico', 's', '', 'l', 'C')} que lo trata</label><div id="kosel"></div>
    <div class="sm" style="margin-top:4px" id="komsm">Las unidades de sus pedidos se atribuyen a ${TT('medico', 's', 'este', 'l', 'l')} y a su comercial.</div>
    ${puedeMedicoLibre() ? `<label class="opt prepbox"><input type="checkbox" id="komlibre"> ${esc(TT('medico', 's', '', 'l', 'C'))} distinto en cada pedido (no se guarda en la ficha)</label>` : ''}
    <div class="g2">
      <div><label for="kodir">Dirección de entrega</label><input id="kodir" value="${esc(c.direccion || '')}"></div>
      <div><label for="kocp">Código postal</label><input id="kocp" value="${esc(c.cp || '')}" inputmode="numeric"></div>
    </div>
    <div class="g2">
      <div><label for="komun">Población</label><input id="komun" value="${esc(c.municipio || '')}"></div>
      <div><label for="kopro">Provincia</label><input id="kopro" value="${esc(c.provincia || '')}"></div>
    </div>
    <div class="g2">
      <div><label for="kotel">Teléfono</label><input id="kotel" value="${esc(c.telefono || '')}" inputmode="tel"></div>
      <div><label for="komov">Móvil</label><input id="komov" value="${esc(c.movil || '')}" inputmode="tel"></div>
    </div>
    <div class="g2">
      <div><label for="komail">Email</label><input id="komail" type="email" value="${esc(c.email || '')}"></div>
      <div id="koempw" class="${tipo === 'Empresa' ? 'koinv' : ''}"><label for="koemp">Empresa ${pmAyu('Empresa', 'Si la persona factura a nombre de una empresa, escribe aquí su nombre. Con «Empresa» arriba no hace falta.')}</label><input id="koemp" value="${esc(c.empresa || '')}"></div>
    </div>
    <label for="konota">Nota</label><input id="konota" value="${esc(c.nota || '')}">
    ${conLlamada ? llamadaAltaHTML(op.llamada) : ''}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
      <button class="btn sec" id="kocancel">Cancelar</button>
      <button class="btn ${conLlamada && op.llamada ? 'sec' : ''}" id="kook">${c.id ? 'Guardar' : `Crear ${TT('paciente', 's', '', 'l', 'l')}`}</button>
      ${conLlamada && op.llamada ? '<button class="btn" id="kopedido">🛒 Crear y hacer pedido</button>' : ''}</div>`;

  selectorMedico($('kosel'), { valor: medico, alElegir: m => { medico = m; } });
  // v2.329.0: clientes como un equipo comercial, con un profesional distinto en cada pedido
  let libreAntes = false;
  const libreVer = () => { const on = !!($('komlibre') && $('komlibre').checked); $('kosel').classList.toggle('hide', on); $('komsm').classList.toggle('hide', on); if ($('kosel').previousElementSibling) $('kosel').previousElementSibling.classList.toggle('hide', on); };
  if ($('komlibre')) {
    $('komlibre').onchange = libreVer;
    if (c.id) db.from('contactos').select('cuenta_por_pedido').eq('id', c.id).maybeSingle().then(({ data }) => { libreAntes = !!(data && data.cuenta_por_pedido); if ($('komlibre')) { $('komlibre').checked = libreAntes; libreVer(); } });
  }
  const revisaDoc = () => {
    const r = validarDoc($('konif').value, tipo);
    $('konifm').innerHTML = r.ok ? '' : `<span style="color:var(--danger)">${esc(r.msg)}</span>`;
    return r;
  };
  $('konif').oninput = revisaDoc;
  $('dlg2body').querySelectorAll('[data-ktipo]').forEach(b => b.onclick = () => {
    tipo = b.dataset.ktipo;
    $('dlg2body').querySelectorAll('[data-ktipo]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('konifl').textContent = tipo === 'Empresa' ? 'CIF' : 'DNI o NIE';
    $('konoml').textContent = tipo === 'Empresa' ? 'Razón social' : 'Nombre y apellidos';
    $('konif').placeholder = tipo === 'Empresa' ? 'B12345678' : '12345678Z';
    $('koempw').classList.toggle('koinv', tipo === 'Empresa');   // v2.341.0: el hueco se queda (antes desaparecía y todo lo de debajo saltaba)
    if ($('konif').value) revisaDoc();
  });
  $('kocancel').onclick = () => $('dlg2').close();
  camposInsertar($('dlg2body'), 'cliente', c.id, $('kook') && $('kook').closest('.acts'));
  if (conLlamada) llamadaAltaActivar(() => medico, op.llamada);
  const crear = async (ev, conPedido) => {
    if (!$('konom').value.trim()) { toast('Escribe el nombre', true); return; }
    const ll = conLlamada ? llamadaAltaLeer() : null;
    const cps = camposLeer($('dlg2'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    const doc = revisaDoc();
    if (!doc.ok) { toast(tipo === 'Empresa' ? 'Revisa el CIF' : 'Revisa el DNI o NIE', true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data: r, error } = await db.rpc('guardar_contacto', { p: {
      id: c.id || null, nombre: $('konom').value.trim(), nif: doc.v, tipo,
      direccion: $('kodir').value.trim(), cp: $('kocp').value.trim(), municipio: $('komun').value.trim(),
      provincia: $('kopro').value.trim(), telefono: $('kotel').value.trim(), movil: $('komov').value.trim(),
      email: $('komail').value.trim(), empresa: tipo === 'Empresa' ? '' : $('koemp').value.trim(), nota: $('konota').value.trim(),
      cuenta_id: medico && !($('komlibre') && $('komlibre').checked) ? medico.id : null
    }});
    ev.target.disabled = false; ev.target.textContent = c.id ? 'Guardar' : conPedido ? '🛒 Crear y hacer pedido' : `Crear ${TT('paciente', 's', '', 'l', 'l')}`;
    if (error && /cliente_duplicado/.test(error.hint || '')) { toast(error.message, true); if ($('konif')) $('konif').dispatchEvent(new Event('input')); return; }   // v2.225.0
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    if (cps && !(await camposGuardar(cps, (r && r.contacto && r.contacto.id) || c.id))) return;
    const libre = !!($('komlibre') && $('komlibre').checked);
    if ($('komlibre') && libre !== libreAntes) {
      const { data: ml, error: me } = await db.rpc('guardar_cuenta_por_pedido', { p_id: (r && r.contacto && r.contacto.id) || c.id, p_valor: libre });
      if (me || (ml && ml.ok === false)) { toast('No se ha podido guardar la opción del profesional', true); return; }
      if (libre && r && r.contacto) r.contacto.cuenta_id = null;
    }
    if (libre) medico = null;
    $('dlg2').close(); toast(c.id ? `${TT('paciente', 's', '', 'l', 'C', 'guardado')}` : `${TT('paciente', 's', '', 'l', 'C', 'creado')}`);
    const res = Object.assign({}, r.contacto, medico ? { medico: medico.nombre, medico_codigo: medico.codigo } : {});
    // v2.119.0: la llamada queda registrada con el cliente recién creado (si se ha apuntado algo o se viene de una llamada)
    let lid = null;
    if (ll && (conPedido || ll.motivo || ll.resultado || ll.nota || op.llamada)) lid = await llamadaAltaGuardar(ll, { contacto_id: res.id, nombre: res.nombre,
      telefono: res.movil || res.telefono || '', medico, resultado: conPedido ? (ll.resultado || 'Pedido hecho') : ll.resultado }, op.llamada);
    if (conPedido) {
      if (lid) LLAMADA_PEND = lid;
      await editorPedido({ contacto: res, medico: medico ? { id: medico.id, nombre: medico.nombre } : null });
      return;
    }
    if (alGuardar) alGuardar(res);
    if (TAB === 'pacientes') listaPacientes();
    if (lid && TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas();
  };
  $('kook').onclick = ev => crear(ev, false);
  if ($('kopedido')) $('kopedido').onclick = ev => crear(ev, true);
  // «No compra»: solo la llamada, sin crear el cliente, con lo apuntado de él
  if ($('kosolo')) $('kosolo').onclick = async ev => {
    const ll = llamadaAltaLeer();
    const nombre = $('konom').value.trim(), telefono = $('komov').value.trim() || $('kotel').value.trim();
    if (!nombre && !telefono) { toast('Apunta al menos su nombre o su teléfono', true); return; }
    ev.target.disabled = true;
    const datos = { tipo, nif: $('konif').value.trim(), email: $('komail').value.trim(), direccion: $('kodir').value.trim(), cp: $('kocp').value.trim(),
      municipio: $('komun').value.trim(), provincia: $('kopro').value.trim(), empresa: $('koemp').value.trim(), nota: $('konota').value.trim() };
    Object.keys(datos).forEach(k => { if (!datos[k]) delete datos[k]; });
    const lid = await llamadaAltaGuardar(ll, { contacto_id: null, nombre, telefono, medico, resultado: ll.resultado, datos }, op.llamada);
    ev.target.disabled = false;
    if (!lid) return;
    $('dlg2').close(); toast('Llamada registrada (sin crear cliente)');
    if (TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas();
  };
  $('dlg2').showModal();
}

/* ---------------- módulos Pacientes y Productos ---------------- */

const vaciarModulos = salvo => ['v-pacientes', 'v-productos', 'v-ventas'].forEach(k => { if (k !== salvo) $(k).innerHTML = ''; });



// Ventas queda solo con los pedidos

// Visibilidad de los módulos nuevos según permisos

/* ---------------- directorio: comerciales ---------------- */

let COMS = [];
async function cargarComerciales() {
  const { data } = await db.from('perfiles').select('id,nombre,rol,activo').order('nombre');
  // Solo quien lleva cartera o agenda comercial (no Dirección, Solo consulta ni médicos)
  COMS = (data || []).filter(u => u.activo && rolPuede(u.rol, 'equipo_comercial'));
  $('fcom').innerHTML = '<option value="">Todos</option><option value="ninguno">Sin comercial</option>' +
    COMS.map(u => `<option value="${u.id}" ${F.com === u.id ? 'selected' : ''}>${esc(u.nombre)}</option>`).join('');
}
$('fcom').addEventListener('change', e => { F.com = e.target.value; buscar(true); });

COLS.push({ k: 'comerciales', t: 'Comerciales', w: 190 });
function colsConfig() {
  let g = null;
  try { g = JSON.parse(localStorage.getItem(colKey()) || 'null'); } catch (e) {}
  if (!g || !g.length) g = COLS.map(c => ({ k: c.k, on: COLS_DEF.includes(c.k) || (c.k === 'comerciales' && VE_TODO()), w: c.w }));
  COLS.forEach(c => { if (!g.some(x => x.k === c.k)) g.push({ k: c.k, on: c.k === 'comerciales' && VE_TODO(), w: c.w }); });
  return g.filter(x => x.k !== 'comerciales' || VE_TODO());
}
function celda(m, k) {
  if (k === 'nombre') return `<span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>`;
  if (k === 'dias') return `<span class="dias">${['L', 'M', 'X', 'J', 'V'].map(d =>
    `<span class="${(m.dias || {})[d] ? 'on' : ''}" title="${esc((m.dias || {})[d] || '')}">${d}</span>`).join('')}</span>`;
  if (k === 'estado_comercial') return `<span class="pill p-est">${esc(m.estado_comercial)}</span>`;
  if (k === 'ultima_visita') return `<span class="sm">${m.ultima_visita ? fechaCorta(m.ultima_visita) : '—'}</span>`;
  if (k === 'telefono') return `<span class="sm">${esc(m.telefono || m.consulta_telefono || '')}</span>`;
  if (k.startsWith('cp:')) { const cl = k.slice(3); return `<span class="sm">${esc(campoTexto((CAMPOS.medico || []).find(x => x.clave === cl), (m.clasificadores || {})[cl]))}</span>`; }
  if (k === 'comerciales') {
    const c = m.comerciales || [];
    return `<span class="comchips">${c.length ? c.map(x => `<span>${esc(nombrePila(x.nombre))}</span>`).join('') : '<span class="sin">Sin asignar</span>'}</span>`;
  }
  return `<span class="sm">${esc(m[k] || '')}</span>`;
}

function filtroActual() {
  const f = {};
  ['q', 'prov', 'muni', 'esp', 'est', 'com'].forEach(k => { if (F[k]) f[k] = F[k]; });
  if (F.urg) f.urg = true;
  if (F.mios) f.mios = true;
  if (F.sin) f.sin = true;
  return f;
}
function textoFiltro(f) {
  const p = [];
  if (f.urg) p.push('urgentes');
  if (f.mios) p.push('de mi cartera');
  if (f.sin) p.push('sin visitar');
  if (f.est) p.push(f.est);
  if (f.esp) p.push(f.esp);
  if (f.muni) p.push(f.muni); else if (f.prov) p.push(f.prov);
  if (f.com) p.push(f.com === 'ninguno' ? 'sin comercial' : 'de ' + ((COMS.find(u => u.id === f.com) || {}).nombre || 'un comercial'));
  if (f.q) p.push('“' + f.q + '”');
  return p.length ? p.join(' · ') : `Todos ${TT('medico', 'p', 'el', 'l', 'l')}`;
}
function aplicarFiltroGuardado(f) {
  Object.assign(F, { q: '', prov: '', muni: '', esp: '', est: '', com: '', urg: false, mios: false, sin: false, orden: 'nombre', pagina: 0 });
  if (f.q) { F.q = f.q; $('q').value = f.q; }
  ['prov', 'muni', 'esp', 'est', 'com'].forEach(k => { if (f[k]) { F[k] = f[k]; const s = $('f' + k); if (s) s.value = f[k]; } });
  if (f.urg) F.urg = true;
  if (f.mios) F.mios = true;
  if (f.sin) F.sin = true;
  ir('directorio'); buscar(true);
}

/* ---------------- ficha del médico: comercial en «Editar ficha» ---------------- */

abrirEditor = (orig => async function (id, tipo) {
  await orig(id, tipo);
  if (!id || !puede('administrar') || !$('eguardar')) return;
  const acts = $('eguardar').closest('.acts');
  acts.insertAdjacentHTML('beforebegin', `<label for="ecom">Comercial asignado</label>
    <select id="ecom"><option>Cargando…</option></select>
    <div class="sm" style="margin-top:4px">Las ventas nuevas se atribuyen al comercial asignado en ese momento.</div>`);
  if (!COMS.length) await cargarComerciales();
  const { data: act } = await RPC_ORIG('responsable_de_cuenta', { p_medico: id });
  const antes = act ? act.id : '';
  $('ecom').innerHTML = '<option value="">Sin comercial</option>' + COMS.filter(u => rolPuede(u.rol, 'cartera') || u.id === antes).map(u =>
    `<option value="${u.id}" ${u.id === antes ? 'selected' : ''}>${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('');
  $('eguardar').addEventListener('click', async () => {
    const ahora = $('ecom') ? $('ecom').value : antes;
    if (ahora === antes) return;
    const { data: r } = await db.rpc('asignar_responsable_cuenta', { p_medico: id, p_usuario: ahora || null });
    if (r && r.ok === false) toast('No se ha podido cambiar el comercial', true);
  });
})(abrirEditor);

/* ---------------- administración: asignar cartera viendo la lista ---------------- */

async function asignarCartera(id) {
  const u = USUARIOS.find(x => x.id === id); if (!u) return;
  const { data: op } = await db.rpc('opciones_filtros', {});
  const sel = lista => '<option value=""></option>' + ((lista || []).map(o => `<option value="${esc(o.v)}">${esc(o.v)} (${o.n})</option>`).join(''));
  const fuera = new Set();
  let total = 0, pagina = 0;
  $('dbody').innerHTML = `<div data-nosucio>
    <div class="fh"><div><h2>Cartera de ${esc(u.nombre)}</h2>
      <div class="sm">Ahora tiene ${num(u.medicos)} ${TT('medico', 'p', '', 'l', 'l', 'asignado')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <p class="sm">Elige los filtros, revisa la lista y desmarca los que no quieras.</p>
    <div class="g2">
      <div><label for="aprov">Provincia</label><select id="aprov">${sel(op.provincias)}</select></div>
      <div><label for="amuni">Municipio</label><select id="amuni">${sel(op.municipios)}</select></div></div>
    <div class="g2">
      <div><label for="aesp">${TT('especialidad', 's', '', 'l', 'C')}</label><select id="aesp">${sel(op.especialidades)}</select></div>
      <div><label for="aest">Estado</label><select id="aest">${sel(op.estados)}</select></div></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="aurg"> Solo urgentes</label>
    <div id="amsg" class="cuenta" style="padding:10px 0 0"></div>
    <div id="alista"></div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" id="aquitar">Quitar seleccionados</button>
      <button class="btn" id="aasignar">Asignar seleccionados</button></div></div>`;

  const filtros = () => ({ f_provincia: $('aprov').value || null, f_municipio: $('amuni').value || null,
    f_especialidad: $('aesp').value || null, f_estado: $('aest').value || null, f_urgentes: $('aurg').checked });
  const cuenta = () => {
    $('amsg').innerHTML = `<b>${num(total - fuera.size)}</b> seleccionados de ${num(total)} con estos filtros
      ${fuera.size ? ` · <button class="kcfg" id="atodos">volver a marcar todos</button>` : ''}`;
    if ($('atodos')) $('atodos').onclick = () => { fuera.clear(); pinta(); };
  };
  const pinta = async () => {
    cargando($('alista'), `Buscando ${TT('medico', 'p', '', 'l', 'l')}…`);
    const { data } = await db.rpc('buscar_cuentas', Object.assign({ q: null, f_area: null, f_mios: false, f_sin_visitar: false,
      orden: 'nombre', lim: 50, desplaz: pagina * 50 }, filtros()));
    total = data ? data.total : 0;
    const f = (data && data.filas) || [];
    $('alista').innerHTML = `<div class="carsel">${f.map(m => `<label class="item" style="cursor:pointer;margin:0">
        <input type="checkbox" data-am="${m.id}" ${fuera.has(m.id) ? '' : 'checked'}>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc([m.especialidad, m.centro_nombre, m.municipio].filter(Boolean).join(' · '))}</span></span>
        <span class="comchips">${(m.comerciales || []).map(x => `<span>${esc(nombrePila(x.nombre))}</span>`).join('') || '<span class="sin">Sin asignar</span>'}</span>
      </label>`).join('') || `<div class="vacio">${TT('medico', 's', 'ningun', 'C', 'l')} con estos filtros.</div>`}</div><div id="apag"></div>`;
    $('alista').querySelectorAll('[data-am]').forEach(c => c.onchange = () => { if (c.checked) fuera.delete(c.dataset.am); else fuera.add(c.dataset.am); cuenta(); });
    $('apag').innerHTML = total > 50 ? pagHTML(total, pagina, 50).replace(/<span class="ptam">[\s\S]*?<\/span><\/div>$/, '</div>') : '';
    $('apag').querySelectorAll('[data-pg]').forEach(b => b.onclick = () => { pagina = +b.dataset.pg; pinta(); });
    cuenta();
  };
  ['aprov', 'amuni', 'aesp', 'aest', 'aurg'].forEach(k => $(k).onchange = () => { pagina = 0; fuera.clear(); pinta(); });

  const aplicar = async (quitar, ev) => {
    const ids = ((await db.rpc('ids_filtrados', filtros())).data || []).filter(x => !fuera.has(x));
    if (!ids.length) { toast(`No hay ${TT('medico', 's', 'ningun', 'l', 'l', 'seleccionado')}`, true); return; }
    if (!await preguntar(`Se van a ${quitar ? 'quitar' : 'asignar'} ${num(ids.length)} ${TT('medico', 'p', '', 'l', 'l')} ${quitar ? 'de' : 'a'} ${u.nombre}.`,
      { titulo: quitar ? 'Quitar cartera' : 'Asignar cartera', ok: quitar ? 'Quitar' : 'Asignar', peligro: quitar })) return;
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('asignar_cartera', { p: { usuario_id: id, medicos: ids, quitar } });
    ev.target.disabled = false;
    if (error || (r && r.ok === false)) { toast('No se ha podido: ' + ((error && error.message) || 'sin permiso'), true); return; }
    toast(`${num(r.filas)} ${TT('medico', 'p', '', 'l', 'l')} ${quitar ? 'retirados' : 'asignados'}${r.movidos ? ` · ${num(r.movidos)} salieron de otra cartera (cartera exclusiva)` : ''}`);
    $('dlg').close(); cargarAdmin();
  };
  $('aasignar').onclick = ev => aplicar(false, ev);
  $('aquitar').onclick = ev => aplicar(true, ev);
  $('dlg').showModal();
  pinta();
}

/* ---------------- rutas: plan desde ahora, ruta en curso, pausar y reanudar ---------------- */

const RPKEY = () => 'dlc-ruta-pausa-' + (PERFIL ? PERFIL.id : '');
// v2.242.0: aquí iba rutaPausada (nadie la usaba)




/** Ventana con varias opciones; devuelve la clave elegida o null. */
function elegirOpcion(titulo, msg, botones) {
  return new Promise(res => {
    const d = $('mini');
    d.innerHTML = `<div class="fbox"><div class="fh"><h2>${esc(titulo)}</h2></div>
      <p style="margin:0 0 10px;white-space:pre-line">${esc(msg)}</p>
      <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">${botones.map(b =>
        `<button class="btn ${b.cls || ''}" data-op="${b.k}">${esc(b.t)}</button>`).join('')}</div></div>`;
    const fin = v => { d.close(); res(v); };
    d.querySelectorAll('[data-op]').forEach(b => b.onclick = () => fin(b.dataset.op === 'no' ? null : b.dataset.op));
    d.oncancel = e => { e.preventDefault(); fin(null); };
    d.onclick = e => { if (e.target === d) fin(null); };
    d.showModal();
  });
}





// Tras registrar una visita, se actualizan la barra y la lista de la ruta
$('dlg').addEventListener('close', () => {
  if (!rutaActiva()) return;
  setTimeout(() => { pintarRutaBarra(); pintarRutaEnCurso(); }, 400);
});

/* ---------------- ayudas actualizadas ---------------- */

Object.assign(AYUDA, {
  directorio: ['Directorio', `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver.`, [
    'El buscador de arriba filtra por nombre, centro o municipio.',
    `El municipio y la provincia cuentan ${todosLos('consulta').toLowerCase()} ${TT('medico', 's', 'del', 'l', 'l')}, no solo la principal.`,
    `Administración y televenta ven los comerciales de cada ${TT('medico', 's', '', 'l', 'l')} y pueden filtrar por comercial.`,
    '«⋮» abre los filtros y las columnas.',
    '«★ Guardar filtro» convierte los filtros actuales en un indicador de Inicio.',
    '«Cerca de mí» usa la ubicación del dispositivo.']],
  seguimiento: ['Seguimiento', `Cómo avanza cada ${TT('medico', 's', '', 'l', 'l')}.`, [
    'Los indicadores de arriba muestran el embudo por estado comercial y la calidad de los datos.',
    '«Mostrar» filtra por visitados, sin visitar, con próxima acción o atrasados.',
    '«Hecha» cierra la próxima acción; «Aplazar» le pone otra fecha.']],
  analitica: ['Analítica', 'Unidades o importe agrupados como elijas.', [
    `Elige la dimensión: ${TT('medico', 's', '', 'l', 'l')}, comercial, producto, municipio, mes o canal.`,
    'La tabla por meses sirve para ver tendencias.',
    'Los datos no se pueden descargar: se consultan solo dentro de la plataforma.']],
  rutas: ['Rutas', 'Crea rutas y conviértelas en el plan del día.', [
    `<b>Lista fija</b>: tú eliges ${TT('medico', 'p', 'el', 'l', 'l')}. <b>Por criterios</b>: se rellena sola con los filtros.`,
    'El plan ordena las paradas por cercanía y calcula las horas con tu horario. Si ya ha pasado tu hora de salida, empieza a contar desde ahora.',
    `Al pulsar <b>Empezar ruta</b> verás la lista de paradas con el botón <b>Registrar ${TT('visita', 's', '', 'l', 'l')}</b> en cada ${TT('medico', 's', '', 'l', 'l')}. «Cómo llegar» abre el navegador solo cuando tú lo pides.`,
    '<b>Pausar</b> guarda los pendientes para seguir otro día; al reanudar se recalculan orden y horas.',
    `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación. Completar la dirección y los días de atención mejora mucho las rutas.`]],
  pacientes: [`${TT('paciente', 'p', '', 'l', 'C')}`, `Las personas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `Cada ${TT('paciente', 's', '', 'l', 'l')} tiene un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se elige al darlo de alta o se asigna solo con su primer pedido.`,
    'Para una persona se pide el DNI o NIE; para una empresa, el CIF. La app comprueba que la letra o el control sean correctos.',
    `Desde la ficha ves sus pedidos y creas uno nuevo con ${TT('medico', 's', 'el', 'l', 'l')} ya puesto.`]],
  productos: ['Productos', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    'Escribe el precio sin IVA o con IVA: el otro se calcula con el IVA del producto.',
    'Un producto inactivo no aparece al crear pedidos, pero se conserva en el histórico.']],
  ventas: ['Ventas', 'Pedidos y unidades atribuidas.', [
    'Los pedidos se guardan como <b>borrador</b> (editable y se puede eliminar; no cuenta en métricas) o se <b>confirman</b> (cuenta en métricas y comisiones; solo se puede anular).',
    'Importes sin IVA; el IVA de cada producto se suma aparte.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.']]
});
ANCLAS_AYUDA.push(['#v-pacientes .saludo h1', 'pacientes'], ['#v-productos .saludo h1', 'productos'], ['#renc .card > h2', 'rutas']);


