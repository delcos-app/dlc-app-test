// pantallas/cuentas.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ficha · Aviso si falta su horario de atención
async function fichaAvisoHorario(id) {
  if (FICHA_ID !== id || !$('fbody').querySelector('.fh')) return;
  if (!await faltaHorario(id) || FICHA_ID !== id || $('fhorario')) return;
  $('fbody').querySelector('.fh').insertAdjacentHTML('afterend', `<div class="avisoh" id="fhorario">
    <span>⚠ <b>Falta su horario de atención.</b> Sin él, las rutas y el planificador no saben qué días y horas atiende.</span>
    ${puedeEditar() ? '<button class="btn sec" id="fhcompletar">Completar horario</button>' : ''}</div>`);
  if ($('fhcompletar')) $('fhcompletar').onclick = () => abrirEditor(id);
}

// Ficha · Unidades pautadas por periodo y evolución de los últimos 12 meses
async function fichaUnidades(id) {
  if (FICHA_ID !== id || !$('fbody') || $('fundades')) return;
  const { data: u } = await RPC_ORIG('unidades_cuenta', { p_medico: id });
  if (!u || FICHA_ID !== id || $('fundades')) return;
  const bloque = `<div class="blk" id="fundades"><h3>Unidades atribuidas</h3>
    <div class="uper">${[['Hoy', u.hoy], ['Semana', u.semana], ['Mes', u.mes], ['Trimestre', u.trimestre], ['Año', u.anio], ['Total', u.total]]
      .map(([t, v]) => `<div><b>${num(v)}</b><span>${t}</span></div>`).join('')}</div>
    ${u.total ? `<div class="segs" id="fuserie" role="group" aria-label="Evolución">${UDS_SERIES.map(([k, t]) => `<button type="button" data-us="${k}" class="${k === UDS_SERIE ? 'on' : ''}">${t}</button>`).join('')}</div>` : ''}
    <div class="spark" id="fuspark">${sparkUnidades(u, UDS_SERIE)}</div>
    <div class="sm">${u.total ? `${num(u.pautas)} ${TT('pauta', u.pautas === 1 ? 's' : 'p', '', 'l', 'l')} · última el ${fechaCorta(u.ultima)} · <span id="fusley">${leyendaUnidades(UDS_SERIE)}</span>` : `Todavía sin ${TT('pauta', 'p', '', 'l', 'l')} registradas.`}</div></div>`;
  // v2.96.0: las ventas van en su sección plegada, al final de la ficha
  const zona = $('fventasc');
  if (zona) zona.insertAdjacentHTML('afterbegin', bloque);
  else ($('fbody').querySelector('.blk:nth-of-type(2)') || $('fbody').lastElementChild).insertAdjacentHTML('beforebegin', bloque);
  // v2.113.0: semana, mes o año (se recuerda la última elegida)
  $('fbody').querySelectorAll('#fuserie [data-us]').forEach(b => b.onclick = () => {
    UDS_SERIE = b.dataset.us; try { localStorage.setItem('dlc-uds-serie', UDS_SERIE); } catch (e) {}
    $('fbody').querySelectorAll('#fuserie [data-us]').forEach(x => x.classList.toggle('on', x === b));
    $('fuspark').innerHTML = sparkUnidades(u, UDS_SERIE); $('fusley').textContent = leyendaUnidades(UDS_SERIE);
  });
}

// Ficha · Acceso del médico a la plataforma (administración)
async function fichaAcceso(id) {
  // v2.109.0: quien tiene «Dar acceso a fichas de su cartera» lo hace desde la ficha, sin pasar por Usuarios
  if (!puede('administrar') && puede('dar_acceso_cuentas')) return fichaAccesoCartera(id);
  if (!puede('administrar') || FICHA_ID !== id || !$('fbody') || $('facceso')) return;
  const [{ data: us }, rfm] = await Promise.all([RPC_ORIG('usuarios_resumen', {}), rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id)]);
  const ya = (us || []).find(u => u.cuenta_id === id), m = (rfm && rfm.data && rfm.data.medico) || {};   // v2.128.0: m.tipo (centro o no)
  $('fbody').insertAdjacentHTML('beforeend', `<div class="blk" id="facceso"><h3>Acceso a la plataforma</h3>
    ${ya ? `<p class="sm">Tiene acceso como <b>${esc(ya.email || '')}</b>${ya.activo ? '' : ' (desactivado)'}: ${m.tipo === 'Centro' ? 'pide la reposición de sus productos, material y escribe a su comercial' : 've su portal: cifras agregadas, sin importes ni datos de personas'}.</p><p class="sm facccon" data-facccon="${ya.id}"></p>${ya.activo && typeof puedeVerComo === 'function' && puedeVerComo(ya) ? `<button class="btn sec" data-ucomo="${ya.id}">👤 Impersonalizar</button>` : ''}`
      : m.tipo === 'Centro' ? `<p class="sm">Puede tener acceso para pedir la reposición de los productos que le des de alta, pedir material y escribir a su comercial.</p>
         <button class="btn sec" id="fdaracc">Dar acceso</button>`
      : `<p class="sm">Puede tener acceso a su portal (cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')}) , pedir material y escribir a su comercial. No verá importes ni datos de ${TT('paciente', 'p', '', 'l', 'l')}.</p>
         <button class="btn sec" id="fdaracc">Dar acceso</button>`}</div>`);
  if (ya) facccon(ya.id);   // v2.335.0
  if ($('fdaracc')) $('fdaracc').onclick = async () => {
    const { data: f } = await db.rpc('ficha_cuenta', { p_id: id });
    $('ficha').close(); nuevoUsuario({ medico: { id, nombre: f.medico.nombre }, nombre: f.medico.nombre, email: f.medico.email || '', centro: f.medico.tipo === 'Centro' });
  };
}

/* Ficha base del prescriptor; abrirFicha le añade el resto de bloques */
async function pintarFichaBase(id) {
  FICHA_ID = id;
  $('fbody').innerHTML = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
  $('ficha').showModal();
  const rf = await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id);
  const data = rf.data;
  if (!data || !data.medico) { $('fbody').innerHTML = '<p class="sm">Sin conexión y sin copia guardada de esta ficha.</p>'; return; }

  const m = data.medico, cons = data.consultas || [], vis = data.visitas || [], com = data.comerciales || [];
  const dias = ['L','M','X','J','V'];

  $('fbody').innerHTML = `${rf.cache ? '<div class="cacheaviso">Sin conexión · ficha guardada en este dispositivo</div>' : ''}
    <div class="fh">
      <div><h2>${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</h2>
        <div class="sm">${esc(m.especialidad || '')}${m.area ? ' · ' + esc(m.area) : ''} · código ${esc(m.codigo)}</div></div>
      <button class="x" id="fx" aria-label="Cerrar">✕</button>
    </div>
    ${(puedeRegistrar() || puedeEditarTipo(m.tipo)) ? `<div class="acts">
      ${puedeRegistrar() ? `<button class="btn" data-act="visita" data-id="${m.id}">Registrar ${TT('visita', 's', '', 'l', 'l')}</button>` : ''}
      ${puedeEditarTipo(m.tipo) ? `<button class="btn sec" data-act="editar" data-id="${m.id}">Editar ficha</button>` : ''}
      ${puedeEditarTipo(m.tipo) ? `<button class="btn ${m.urgente ? 'sec' : 'warn'}" data-act="urgente" data-id="${m.id}" data-urg="${m.urgente ? 1 : 0}">${m.urgente ? 'Quitar urgente' : 'Marcar urgente'}</button>` : ''}
      <button class="btn sec" data-agendar="${m.id}">+ Añadir a mi agenda</button>
    </div>` : ''}
    ${fichaVisitaHTML(m, cons, vis)}
    <div class="blk"><h3>Estado</h3>
      <div>${puedeEditar()
        ? `<select data-estado="${m.id}" style="max-width:240px">${estados().map(x => `<option ${x === m.estado_comercial ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`
        : `<span class="pill p-est">${esc(m.estado_comercial)}</span>`}</div>
      ${com.length ? `<div class="sm" style="margin-top:6px">Comercial: ${com.map(esc).join(', ')}</div>` : ''}
    </div>
    ${cons.filter(c => c !== consultaDeLaVisita(cons)).map(c => `<div class="blk"><h3>${esc(c.centro_nombre || consultaPrivada())}</h3>
      <div>${esc([c.direccion, c.cp, c.municipio].filter(Boolean).join(', ')) || '<span class="sm">Sin dirección</span>'}</div>
      ${c.planta || c.sala ? `<div class="sm">${esc([c.planta, c.sala].filter(Boolean).join(' · '))}</div>` : ''}
      ${c.indicaciones ? `<div class="sm">${esc(c.indicaciones)}</div>` : ''}
      ${c.telefono ? `<div class="sm">Teléfono: ${esc(c.telefono)}</div>` : ''}
      <div class="dias" style="margin-top:8px">${dias.map(k => `<span class="${(c.dias || {})[k] ? 'on' : ''}">${k}</span>`).join('')}</div>
      ${dias.filter(k => (c.dias || {})[k]).map(k => `<div class="sm">${k}: ${esc(c.dias[k])}</div>`).join('')}
      ${c.lat ? `<div class="sm" style="margin-top:6px"><button class="lnk" type="button" data-nav="${navAttr([c.lat, c.lon])}">Cómo llegar</button></div>` : ''}
    </div>`).join('')}
    <div class="blk"><h3>${TT('visita', 'p', '', 'l', 'C')}</h3>
      ${vis.length ? vis.slice(0, 10).map(v => `<div data-vrow="${v.id}" style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <span><b>${fechaCorta(v.fecha)}</b>${v.modo === 'telefono' ? ' · Por teléfono' : v.modo === 'video' ? ' · Por videollamada' : ''} · ${esc((v.resultados || []).join(' + ') || 'Sin resultado')}
          ${v.muestras ? ` · ${v.muestras} muestras` : ''}
          ${v.nota ? `<div class="sm">${esc(v.nota)}</div>` : ''}
          ${v.proxima_fecha ? `<div class="sm">Próxima: ${fechaCorta(v.proxima_fecha)} · ${esc(v.proxima_accion || '')}</div>` : ''}</span>
        ${puedeRegistrar() ? `<button class="btn sec chico" data-editv='${esc(JSON.stringify(v))}'>Editar</button>` : ''}
      </div>`).join('') : `<div class="sm">Todavía no hay ${TT('visita', 'p', '', 'l', 'l', 'registrado')}.</div>`}</div>
    <div id="fzcampos"></div>
    <section class="blk fventas" id="fventas"><h3>Ventas y ${TT('paciente', 'p', '', 'l', 'l')}</h3><div id="fventasc"></div></section>`;
  $('fx').onclick = () => $('ficha').close();
  $('fbody').querySelectorAll('[data-editv]').forEach(b => b.onclick = () => editarVisita(JSON.parse(b.dataset.editv), id));
}

/* v2.75.0 · Cómo se llama una ficha nueva: el vocabulario del cliente o, si no lo ha cambiado, «cuenta» */
function fichaNueva() {
  if (TERMINOS && TERMINOS.medico && TERMINOS.medico.s) return { nombre: TT('medico', 's', '', 'l', 'C'), nueva: TT('medico', 's', 'nuevo', 'C', 'l') };
  return { nombre: 'Cuenta', nueva: 'Nueva cuenta' };
}

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

/** Cuenta los médicos de un filtro guardado. */
async function contarFiltro(f) {
  const { data } = await db.rpc('buscar_cuentas', {
    q: f.q || null, f_provincia: f.prov || null, f_municipio: f.muni || null,
    f_estado: f.est || null, f_especialidad: f.esp || null, f_area: null,
    f_urgentes: !!f.urg, f_mios: !!f.mios, f_sin_visitar: !!f.sin, orden: 'nombre', lim: 1, desplaz: 0, f_comercial: f.com || null
  });
  return data ? data.total : 0;
}

async function cercaDeMi(btn) {
  if (!navigator.geolocation) { toast('Este dispositivo no tiene ubicación', true); return; }
  btn.disabled = true; btn.textContent = 'Localizando…';
  navigator.geolocation.getCurrentPosition(async p => {
    const { data, error } = await db.rpc('cuentas_cerca', {
      p_lat: p.coords.latitude, p_lon: p.coords.longitude, p_km: 10, lim: 100
    });
    btn.disabled = false; btn.textContent = 'Cerca de mí';
    if (error) { toast('No se ha podido buscar: ' + error.message, true); return; }
    CERCA = { lista: data || [], pos: [p.coords.latitude, p.coords.longitude] };
    pintarCerca();
  }, () => {
    btn.disabled = false; btn.textContent = 'Cerca de mí';
    toast('No se ha podido obtener tu ubicación. Revisa los permisos del navegador.', true);
  }, { enableHighAccuracy: true, timeout: 15000 });
}

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

function proximoDiaConsulta(dias, desde) {
  const letras = 'DLMXJVS', claves = Object.keys(dias || {}).filter(k => (dias || {})[k]);
  const d = new Date((desde || hoyISO()) + 'T12:00:00');
  for (let i = 1; i <= 21; i++) {
    d.setDate(d.getDate() + 1);
    const l = letras[d.getDay()];
    if (l === 'D' || l === 'S') continue;
    if (!claves.length || claves.includes(l)) return fechaLocal(d);
  }
  return isoMas(desde || hoyISO(), 1);
}

async function conHorarios(lista) {
  const faltan = lista.filter(m => !('dias' in m)).map(m => m.id);
  if (!faltan.length) return lista;
  const { data } = await db.rpc('horarios_cuentas', { p_ids: faltan });
  const por = {}; (data || []).forEach(h => por[h.id] = h);
  return lista.map(m => por[m.id] ? Object.assign({}, m, { dias: por[m.id].dias || {} }) : m);
}

async function faltaHorario(id) {
  const { data } = navigator.onLine ? await db.rpc('ficha_cuenta', { p_id: id }) : await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id);
  const cons = (data && data.consultas) || [];
  return data && data.medico && data.medico.tipo !== 'Centro' && !cons.some(c => c.dias && Object.keys(c.dias).some(k => c.dias[k]));
}

function pintarCerca() {
  const l = CERCA.lista, tam = tamPagina(), pag = CERCA.pagina || 0;
  const vista = l.slice(pag * tam, pag * tam + tam);
  $('thead').innerHTML = '';
  $('cuenta').innerHTML = `<b>${num(l.length)}</b> ${TT('medico', l.length === 1 ? 's' : 'p', '', 'l', 'l')} a menos de 10 km de ti
    <button class="kcfg" id="cercacerrar" style="margin-left:10px">Volver a la búsqueda</button>`;
  $('lista').innerHTML = vista.length ? vista.map(m => `<button class="trow" data-id="${m.id}" style="padding:10px 14px;gap:12px">
      <span class="tcell cercakm"><b style="color:var(--navy)">${String(m.km).replace('.', ',')} km</b></span>
      <span class="tcell" style="flex:1;width:auto">
        <span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>
        <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || '')} ${esc(m.municipio || '')}</span></span>
      <span class="tcell cercaest"><span class="pill p-est">${esc(m.estado_comercial)}</span></span>
    </button>`).join('') : `<div class="vacio">No hay ${TT('medico', 'p', '', 'l', 'l')} con ubicación a menos de 10 km.</div>`;
  $('dirpag').classList.remove('hide');
  paginador($('dirpag'), l.length, pag, p => { CERCA.pagina = p; pintarCerca(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    () => { CERCA.pagina = 0; pintarCerca(); });
  $('cercacerrar').onclick = () => { CERCA = null; buscar(true); };
}

function marcarUbicado(box, i, lat, lon, texto) {
  const set = (f, v) => { let el = box.querySelector(`[data-cf="${i}|${f}"]`); if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.dataset.cf = `${i}|${f}`; box.appendChild(el); } el.value = v; };
  set('lat', lat); set('lon', lon);
  const est = box.querySelector('.cubest');
  if (est) est.innerHTML = `<b style="color:var(--ok)">✓ Ubicado</b> ${esc(texto || '')} <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}" target="_blank" rel="noopener">Ver en el mapa</a>`;
  const d = box.closest('dialog'); if (d) d.dataset.sucio = '1';
}

function ordenarCabeceraCuentas() {
  const acts = document.querySelector('#dircab .acts'), nuevo = $('nuevoBtn');
  // v2.268.0: en el móvil el botón es el «+» redondo (plSync): no se mueve a la cabecera ni se le pone texto (salía «Crear nuevo» dentro del círculo)
  if (acts && nuevo && nuevo.parentElement !== acts && !(nuevo.dataset.plfab && ES_MOVIL())) { nuevo.classList.remove('sec', 'fab'); nuevo.innerHTML = svgIco(ICON_NOM.plus) + ' Crear nuevo'; acts.appendChild(nuevo); }
  const mapa = $('mapaBtn');
  if (mapa && !mapa.classList.contains('icobtn')) { mapa.classList.add('icobtn'); mapa.title = 'Ver en el mapa'; mapa.setAttribute('aria-label', 'Ver en el mapa'); mapa.innerHTML = svgIco(ICON_NOM.map); mapa.parentElement.appendChild(mapa); }
  const tools = $('dirtools');
  if (tools && !tools.dataset.v252) { tools.dataset.v252 = '1'; tools.innerHTML = svgIco(ICON_NOM['sliders-horizontal']) + ' Filtros y columnas'; tools.classList.remove('kebab'); }
  if ($('guardarFiltro')) $('guardarFiltro').classList.add('hide');
  if ($('dupBtn')) $('dupBtn').classList.add('hide');
}

async function cargarAccesoMedicos() {
  if (!(PERFIL && (puede('administrar') || VE_TODO() || puede('dar_acceso_cuentas')))) { MED_ACCESO = {}; return; }
  const { data } = await RPC_ORIG('cuentas_con_acceso', {});
  MED_ACCESO = {}; (data || []).forEach(x => { MED_ACCESO[x.cuenta_id] = x; });
}

function txtHorario(h) {
  h = h || {}; const ks = DIAS_SEM.filter(([k]) => h[k]); if (!ks.length) return '';
  // Días seguidos con el mismo horario se agrupan: «L–V 8:00-20:00 · S 9:00-14:00 · D Cerrado»
  const g = []; ks.forEach(([k]) => { const u = g[g.length - 1]; if (u && u.v === h[k] && 'LMXJVSD'.indexOf(k) === 'LMXJVSD'.indexOf(u.fin) + 1) u.fin = k; else g.push({ ini: k, fin: k, v: h[k] }); });
  return g.map(x => (x.ini === x.fin ? x.ini : x.ini + '–' + x.fin) + ' ' + x.v).join(' · ');
}

function cpPoner(box, i, cen) {
  const set = (f, v) => { const el = cpCampo(box, i, f); if (el) el.value = v == null ? '' : v; };
  set('centro_id', cen ? cen.id || '' : ''); set('centro_nombre', cen ? cen.nombre || '' : ''); set('direccion', cen ? cen.direccion || '' : '');
  set('municipio', cen ? cen.municipio || '' : ''); set('cp', cen ? cen.cp || '' : ''); set('provincia', cen ? cen.provincia || '' : '');
  set('lat', cen && cen.lat != null ? cen.lat : ''); set('lon', cen && cen.lon != null ? cen.lon : '');
  if (cen && cen.lat != null) box.dataset.lat = cen.lat; else delete box.dataset.lat;
  const d = box.closest('dialog'); if (d) d.dataset.sucio = '1';
}

// Pinta el selector de centros de una consulta: tarjeta del centro elegido o buscador
async function pintarCentroSel(box, i, modo) {
  const cont = box.querySelector(`[data-cp="${i}"]`); if (!cont) return;
  const v = f => (cpCampo(box, i, f) || {}).value || '';
  if (modo !== 'buscar' && (v('centro_id') || v('centro_nombre'))) {
    let cen = { id: v('centro_id'), nombre: v('centro_nombre'), direccion: v('direccion'), municipio: v('municipio'), cp: v('cp'), lat: v('lat'), lon: v('lon') };
    cont.innerHTML = tarjetaCentro(cen, !!cen.id);
    if (cen.id) {   // datos completos del centro: teléfono, horario y cuántos médicos tiene
      const { data: c2 } = await db.from('centros').select('id,nombre,direccion,municipio,cp,provincia,telefono,lat,lon,horario').eq('id', cen.id).maybeSingle();
      if (c2 && cont.isConnected) { cen = c2; cont.innerHTML = tarjetaCentro(cen, true); }
    }
    cont.querySelector('[data-cpcambiar]').onclick = () => pintarCentroSel(box, i, 'buscar');
    const ed = cont.querySelector('[data-cpeditar]'); if (ed) ed.onclick = () => formCentro(box, i, cen);
    const en = cont.querySelector('[data-cpenlazar]'); if (en) en.onclick = () => { pintarCentroSel(box, i, 'buscar'); const q = cont.querySelector('.cpq'); if (q) { q.value = cen.nombre; q.dispatchEvent(new Event('input')); } };
    return;
  }
  cont.innerHTML = `<div class="cpbus"><input class="cpq" type="search" placeholder="Busca el centro por nombre, calle o población" autocomplete="off">
      <div class="cpres"></div>
      <div class="acts" style="margin:8px 0 0;flex-wrap:wrap"><button type="button" class="btn sec" data-cpaqui>📍 Estoy aquí</button>
        <button type="button" class="btn sec" data-cpnuevo>+ Centro nuevo</button><button type="button" class="btn sec" data-cpprivada>${consultaPrivada()} (sin centro)</button></div></div>`;
  const q = cont.querySelector('.cpq'), res = cont.querySelector('.cpres');
  let t = null, n = 0;
  q.oninput = () => {
    clearTimeout(t); const yo = ++n, txt = q.value.trim();
    if (txt.length < 2) { res.innerHTML = ''; return; }
    t = setTimeout(async () => {
      const { data } = await RPC_ORIG('buscar_centros', { p_q: txt, p_lat: null, p_lon: null, p_radio: 400, p_lim: 8 });
      if (yo !== n) return;
      listaCentros(res, data || [], cen => { cpPoner(box, i, cen); pintarCentroSel(box, i); },
        `<button type="button" class="cpitem cpnuevo">+ Crear «${esc(txt)}» como centro nuevo</button>`, () => formCentro(box, i, { nombre: txt }));
    }, 250);
  };
  cont.querySelector('[data-cpnuevo]').onclick = () => formCentro(box, i, { nombre: q.value.trim() });
  cont.querySelector('[data-cpprivada]').onclick = () => { cpPoner(box, i, { nombre: consultaPrivada('U').toUpperCase() }); pintarCentroSel(box, i); formCentro(box, i, { nombre: consultaPrivada(), privada: true }); };
  cont.querySelector('[data-cpaqui]').onclick = e => estoyAqui(box, i, e.currentTarget);
  if (modo === 'buscar') q.focus();
}

function listaCentros(res, lista, elegir, extra, alExtra) {
  res.innerHTML = lista.map((c, k) => `<button type="button" class="cpitem" data-k="${k}"><b>${esc(c.nombre)}</b>
      <span class="sm">${esc([c.direccion, c.municipio].filter(Boolean).join(' · '))}${c.metros != null ? ` · a ${c.metros < 1000 ? c.metros + ' m' : (c.metros / 1000).toFixed(1) + ' km'}` : ''}${c.medicos ? ` · ${c.medicos} ${c.medicos === 1 ? 'médico' : 'médicos'}` : ''}</span></button>`).join('')
    + (lista.length ? '' : '<div class="sm" style="padding:8px 2px">No hay ningún centro con ese nombre.</div>') + (extra || '');
  res.querySelectorAll('[data-k]').forEach(b => b.onclick = () => elegir(lista[+b.dataset.k]));
  const x = res.querySelector('.cpnuevo'); if (x && alExtra) x.onclick = alExtra;
}

async function centroDesdeUbicacion(box, i, lat, lon) {
  let inv = null;
  try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&accept-language=es&lat=${lat}&lon=${lon}`); inv = await r.json(); } catch (e) { /* sin datos del mapa: se rellena a mano */ }
  const a = (inv && inv.address) || {};
  const nombre = (inv && inv.name) || a.hospital || a.clinic || a.doctors || a.amenity || a.healthcare || a.building || '';
  formCentro(box, i, { nombre, direccion: [a.road, a.house_number].filter(Boolean).join(', '), cp: a.postcode || '',
    municipio: (a.city || a.town || a.village || a.municipality || '').toUpperCase(), provincia: (a.province || a.state_district || a.county || '').toUpperCase(), lat, lon },
    nombre ? 'Datos rellenados con tu ubicación: revísalos.' : 'Dirección rellenada con tu ubicación. El mapa no conoce el nombre del centro: escríbelo.');
}

async function fichaAccesoCartera(id) {
  if (FICHA_ID !== id || !$('fbody') || $('facceso')) return;
  const [{ data: acc }, { data: mia }, rf] = await Promise.all([
    RPC_ORIG('cuentas_con_acceso', {}),
    VE_TODO() ? Promise.resolve({ data: [1] }) : db.from('atribuciones').select('cuenta_id').eq('cuenta_id', id).eq('usuario_id', PERFIL.id).is('hasta', null).limit(1),
    rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id)]);
  const ya = (acc || []).find(x => x.cuenta_id === id), m = (rf && rf.data && rf.data.medico) || {};
  // Solo en las fichas de su cartera (o en todas si ve todo)
  if ((!ya && !(mia || []).length) || FICHA_ID !== id || $('facceso')) return;
  $('fbody').insertAdjacentHTML('beforeend', `<div class="blk" id="facceso"><h3>Acceso a la plataforma</h3>
    ${ya ? `<p class="sm">Tiene acceso${ya.email ? ` como <b>${esc(ya.email)}</b>` : ''}${ya.activo ? '' : ' (desactivado)'}: ${m.tipo === 'Centro' ? 'pide la reposición de sus productos, material y escribe a su comercial' : 've su portal: cifras agregadas, sin importes ni datos de personas'}.</p>${ya.activo && typeof puedeVerComo === 'function' && puedeVerComo(ya) ? `<button class="btn sec" data-ucomo="${ya.id}">👤 Impersonalizar</button>` : ''}`
      : `<p class="sm">${m.tipo === 'Centro' ? 'Puede tener acceso para pedir la reposición de los productos que le des de alta, pedir material y escribir a su comercial.' : `Puede tener acceso a su portal (cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')}), pedir material y escribir a su comercial. No verá importes ni datos de ${TT('paciente', 'p', '', 'l', 'l')}.`}</p>
         <div class="g2"><div><label for="faccmail">Correo</label><input id="faccmail" type="email" value="${esc(m.email || '')}" placeholder="nombre@correo.com"></div>
         <div style="align-self:end"><button class="btn sec" id="fdaracc">Dar acceso</button></div></div><div class="sm" id="faccmsg"></div>`}</div>`);
  if (!$('fdaracc')) return;
  $('fdaracc').onclick = async ev => {
    const email = $('faccmail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('Escribe un correo válido', true); return; }
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('dar_acceso_cuenta', { p_cuenta: id, p_email: email });
    const motivo = { permiso: 'Tu rol no puede dar acceso', cartera: `Solo puedes dar acceso a ${TT('medico', 'p', '', 'l', 'l')} de tu cartera`,
      ya_tiene: 'Esta ficha ya tiene acceso', correo_en_uso: 'Ese correo ya es de otro usuario', email: 'El correo no es válido',
      sin_rol_portal: 'No hay ningún rol con acceso al portal: créalo en Configuración → Roles' };
    if (error || !r || !r.ok) { ev.target.disabled = false; toast(motivo[(r && r.error) || ''] || 'No se ha podido dar acceso', true); return; }
    const pass = 'Tmp-' + Math.random().toString(36).slice(2, 8);
    const tmp = window.supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: e2 } = await tmp.auth.signUp({ email, password: pass, options: { data: { nombre: m.nombre || email.split('@')[0], usuario: email.split('@')[0] } } });
    ev.target.disabled = false;
    if (e2) { toast('No se ha podido crear el acceso: ' + e2.message, true); return; }
    ev.target.remove(); $('faccmail').disabled = true; MED_ACCESO = null;
    $('faccmsg').innerHTML = `<b style="color:var(--ok)">Acceso creado.</b> Contraseña temporal: <b>${esc(pass)}</b>. Pásasela y que la cambie al entrar.`;
  };
}

// Ficha: historial de cambios (de la ficha y de sus consultas), plegado al final; solo administración
async function fichaHistorial(id) {
  if (!puede('administrar') || FICHA_ID !== id || !$('fbody') || $('fhist')) return;
  const { data } = await RPC_ORIG('historial_entidad', { p_entidad: 'cuentas', p_id: id, lim: 100 });
  const l = Array.isArray(data) ? data : [];
  if (FICHA_ID !== id || !$('fbody') || $('fhist')) return;
  const lineas = a => a.accion === 'Edición' && a.detalle && typeof a.detalle === 'object'
    ? Object.keys(a.detalle).filter(k => Array.isArray(a.detalle[k]) && a.detalle[k].length === 2)
        .map(k => `<span class="sm">${esc(campoTxt(k))}: ${esc(textoValor(a.detalle[k][0]).slice(0, 40) || '—')} → ${esc(textoValor(a.detalle[k][1]).slice(0, 40) || '—')}</span>`).join('')
    : `<span class="sm">${esc(resumenDetalle(a.detalle))}</span>`;
  $('fbody').insertAdjacentHTML('beforeend', `<details class="blk" id="fhist"><summary>Historial de cambios <span class="n">${num(l.length)}</span></summary>
    <div class="lista">${l.map(a => `<div class="item" style="cursor:default"><span class="tx">
        <b>${esc(a.accion)}${a.entidad === 'ubicaciones' ? ' · ' + TT('consulta', 's', '', 'l', 'l') : ''}</b>
        <span class="sm">${esc(a.usuario)} · ${new Date(a.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        ${lineas(a)}</span>${a.deshacible ? `<button type="button" class="btn sec" data-fhx="${a.id}">Deshacer</button>` : ''}</div>`).join('')
      || '<div class="sm">Sin cambios registrados.</div>'}</div></details>`);
  $('fhist').querySelectorAll('[data-fhx]').forEach(b => b.onclick = () => deshacerUno(+b.dataset.fhx, () => abrirFicha(id)));
}

/* v2.128.0 · Portal del centro (parte del extra «Portal»). Un centro (ficha de tipo Centro) con acceso entra en «Mi centro»: pide la
   reposición de los productos que tiene dados de alta, al precio que le pone su comercial; el pedido llega como borrador para confirmar.
   Ve sus pedidos y lo comprado, pide material y escribe a su comercial (lo mismo que el médico). En la ficha del centro, «Productos
   del centro». */
async function cargarCentro() {
  // v2.282.0: página nueva (al final del archivo); al arrancar se espera a que esté leída
  if (!window.PM_LISTO || typeof cargarCentro2282 !== 'function') { const v0 = $('v-informe'); if (v0 && !v0.innerHTML.trim()) v0.innerHTML = '<div class="card">' + skelCard('Cargando…') + '</div>'; setTimeout(cargarCentro, 30); return; }
  if (window.PC_LISTO) return cargarCentro2282();
  const v = $('v-informe');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu centro</div><h1 id="ctnom">…</h1>
      <div class="sm" style="color:rgba(255,255,255,.85)">Pide la reposición de tus productos y sigue tus pedidos</div></div></div>
    <div id="ctcuerpo" class="angrid"><div class="card">${skelCard('Cargando…')}</div></div>`;
  pintarCentro();
}

async function pintarCentro() {
  // Al arrancar, esto se pinta antes de leerse el final de este archivo: se espera a que esté
  try { void MOTIVO_PORTAL; void NOMBRE_ESTADO_CENTRO; } catch (e) { setTimeout(pintarCentro, 300); return; }
  if (!$('ctcuerpo')) return;
  const [{ data: prods }, { data: mp }] = await Promise.all([RPC_ORIG('productos_portal', {}), RPC_ORIG('mis_pedidos_portal', {})]);
  if (!$('ctcuerpo')) return;
  if (mp && mp.nombre) $('ctnom').textContent = mp.nombre;
  const lp = Array.isArray(prods) ? prods : [], peds = (mp && mp.pedidos) || [], pp = (mp && mp.por_producto) || [];
  const conIva = x => r2((+x.precio || 0) * (1 + (+x.iva || 0) / 100));
  $('ctcuerpo').innerHTML = `
    <div class="card ancard ancha" id="ctped"><h2>Pedir reposición</h2>
      ${lp.length ? `<div class="lista" id="ctprods">${lp.map(x => `<div class="item ctlin" style="cursor:default"><span class="tx"><b>${esc(x.nombre)}</b>
          <span class="sm">${eurI(conIva(x))} con IVA${x.propio ? ' · tu precio' : ''}</span></span>
          <input type="number" min="0" max="1000" step="1" value="0" data-ctp="${x.producto_id}" data-ctpr="${conIva(x)}" aria-label="Unidades de ${esc(x.nombre)}"></div>`).join('')}</div>
        <label for="ctnota">Nota</label><input id="ctnota" placeholder="Opcional: horario de entrega, persona de contacto…">
        <div class="nvtot"><span>Total <b id="cttot">${eurI(0)}</b> con IVA</span><button type="button" class="btn" id="ctok">Enviar pedido</button></div>
        <p class="leer">Tu comercial lo revisa y lo confirma; aquí verás cuándo está confirmado y preparado.</p>`
        : '<p class="sm" style="padding:0 16px">Todavía no tienes productos para pedir. Tu comercial te los dará de alta.</p>'}</div>
    <div class="card ancard" id="ctlista"><h2>Tus pedidos</h2>
      ${peds.length ? `<div class="lista">${peds.map(p => `<div class="item" style="cursor:default"><span class="tx">
          <b>${p.numero ? esc(p.numero) + ' · ' : ''}${fechaCorta(String(p.fecha).slice(0, 10))}</b>
          <span class="sm">${esc((p.lineas || []).map(l => `${l.producto} × ${num(l.unidades)}`).join(', '))}${p.total != null ? ' · ' + eurI(p.total) : ''}</span></span>
          <span class="pill ${NOMBRE_ESTADO_CENTRO[p.estado] || ''}">${esc(p.estado)}</span></div>`).join('')}</div>` : '<div class="sm" style="padding:0 16px">Todavía no hay pedidos.</div>'}</div>
    <div class="card ancard" id="ctcompra"><h2>Lo que has comprado</h2>
      ${pp.length ? barrasH(pp.map(x => ({ n: x.producto, v: x.unidades })), v => num(v) + ' uds.') : vacioGrafico('Aparecerá cuando tengas pedidos completados.')}
      <p class="leer">Unidades de los últimos 12 meses, por producto.</p></div>`;
  const total = () => [...$('ctcuerpo').querySelectorAll('[data-ctp]')].reduce((s, i) => s + (Math.max(0, +i.value || 0)) * (+i.dataset.ctpr || 0), 0);
  $('ctcuerpo').querySelectorAll('[data-ctp]').forEach(i => i.oninput = i.onchange = () => { $('cttot').textContent = eurI(total()); });
  if ($('ctok')) $('ctok').onclick = async ev => {
    const lineas = [...$('ctcuerpo').querySelectorAll('[data-ctp]')].map(i => ({ producto_id: i.dataset.ctp, unidades: Math.floor(+i.value || 0) })).filter(x => x.unidades > 0);
    if (!lineas.length) { toast('Pon las unidades de algún producto', true); return; }
    ev.target.disabled = true;
    const { data: r } = await db.rpc('pedido_portal', { p_lineas: lineas, p_nota: $('ctnota').value.trim() || null });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(r && r.motivo === 'vacio' ? 'Pon las unidades de algún producto' : motivoPortal(r), true); return; }
    toast('Pedido enviado: tu comercial lo confirmará'); pintarCentro();
  };
  portalMedico();
}

// ---- 5. Horario de atención en todos sus centros
function centroConConsulta(c, fecha) {
  const v = ventanasDe(c.dias, fecha);
  if (!v || v.length) return null;   // sin horario en ese centro (no se sabe) o con consulta ese día: nada que cambiar
  return (c.otros_dias || []).find(o => o && o.lugar !== c.centro_nombre && (w => w && w.length)(ventanasDe(o.dias, fecha))) || null;
}

async function fichaCentro(id) {
  const dlg = $('dlg');
  dlg.classList.remove('pequena');
  $('dbody').innerHTML = `<div class="fh"><div><h2>Centro</h2></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="skel" style="width:60%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>`;
  if (!dlg.open) dlg.showModal();
  // v2.310.0: con la ficha se pide su cuenta de tipo Centro (un solo centro), para abrirla desde aquí
  const [{ data, error }, { data: cta }] = await Promise.all([db.rpc('ficha_centro', { p_id: id }), db.from('cuentas').select('id').eq('centro_id', id).maybeSingle().then(r => r, () => ({ data: null }))]);
  if (!dlg.open) return;
  if (error || !data || !data.datos) {
    $('dbody').innerHTML = `<div class="fh"><div><h2>Centro</h2></div><button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="banda-peligro">No se ha podido abrir el centro${error ? ': ' + esc(error.message) : ''}.</div>`;
    return;
  }
  const c = data.datos, l = data.profesionales || [];
  const dir = [c.direccion, [c.cp, c.municipio].filter(Boolean).join(' '), c.provincia].filter(Boolean).join(', ');
  const hor = HOR_TXT(c.horario);
  const quien = TT('medico', 'p', '', 'l', 'C');
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${esc(c.nombre)}</h2><div class="sm">${esc(dir || 'Sin dirección')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="fcacts">
      ${c.telefono ? `<a class="btn sec" href="tel:${esc(c.telefono)}">Llamar · ${esc(c.telefono)}</a>` : ''}
      ${c.lat != null ? '<button type="button" class="btn sec" id="fcllegar">Cómo llegar</button>' : ''}
      ${data.puede_editar ? '<button type="button" class="btn sec" id="fceditar">Editar centro</button>' : ''}
      ${cta && cta.id ? `<button type="button" class="btn sec" id="fccuenta" data-fccta="${cta.id}">Ficha comercial</button>` : ''}
    </div>
    ${hor ? `<div class="vcdatos"><div class="vcfila"><span>Horario</span><b>${esc(hor)}</b></div></div>` : ''}
    <div class="fcprocab"><h3>${esc(quien)} · ${num(l.length)}</h3>${data.puede_fichas ? '<button type="button" class="btn" id="fcanadir">+ Añadir</button>' : ''}</div>
    <div id="fcsel"></div>
    ${l.length ? `<div class="lista fclista">${l.map(m => {
      const donde = [m.planta ? 'Planta ' + m.planta : '', m.sala ? 'Sala ' + m.sala : ''].filter(Boolean).join(' · ');
      const dias = HOR_TXT(m.dias);
      return `<div class="item fcpro">
        <span class="tx"><b>${m.urgente ? '❗ ' : ''}${esc(m.nombre)}</b>
          <span class="sm">${esc([m.especialidad, donde].filter(Boolean).join(' · ') || '—')}</span>
          ${dias ? `<span class="sm">Atiende: ${esc(dias)}</span>` : ''}</span>
        <span class="acts" style="margin:0">
          <button type="button" class="btn sec" data-fcf="${m.id}">Ficha</button>
          <button type="button" class="btn sec" data-fcc="${m.id}">+ Cita</button>
          ${data.puede_fichas ? `<button type="button" class="btn sec fcquitar" data-fcq="${m.id}" aria-label="Quitar a ${esc(m.nombre)} del centro">Quitar</button>` : ''}
        </span></div>`; }).join('')}</div>`
      : `<div class="vacio">Todavía no hay ${esc(quien.toLowerCase())} en este centro.${data.puede_fichas ? ' Añádelos con «+ Añadir».' : ''}</div>`}`;
  if ($('fcllegar')) $('fcllegar').onclick = () => navegarA([+c.lat, +c.lon]);
  if ($('fceditar')) $('fceditar').onclick = () => editarCentroFicha(c);
  if ($('fcanadir')) $('fcanadir').onclick = () => {
    $('fcanadir').disabled = true;
    selectorMedico($('fcsel'), { alElegir: async m => {
      if (!m) return;
      const { data: r, error: e } = await db.rpc('centro_anadir_profesional', { p_centro: c.id, p_cuenta: m.id });
      if (e || !r || !r.ok) { toast(r && r.error === 'permiso' ? `No puedes cambiar la ficha de ${m.nombre}` : 'No se ha podido añadir', true); fichaCentro(c.id); return; }
      toast(r.ya ? `${m.nombre} ya estaba en el centro: queda enlazado` : `${m.nombre} añadido a ${c.nombre}`);
      fichaCentro(c.id);
    } });
    const i = $('fcsel').querySelector('input'); if (i) i.focus();
  };
  $('dbody').querySelectorAll('[data-fcf]').forEach(b => b.onclick = () => { dlg.close(); FICHA_CENTRO = c.nombre; abrirFicha(b.dataset.fcf); });
  $('dbody').querySelectorAll('[data-fcc]').forEach(b => b.onclick = () => { FICHA_CENTRO = c.nombre; nuevaCita(b.dataset.fcc); });
  $('dbody').querySelectorAll('[data-fcq]').forEach(b => b.onclick = async () => {
    const m = l.find(x => x.id === b.dataset.fcq); if (!m) return;
    const unica = +m.consultas <= 1;
    if (!await preguntar(`Se quita a ${m.nombre} de ${c.nombre}: ${TT('consulta', 's', 'este', 'l', 'l')} desaparece de su ficha.${unica ? ` Era su única ${TT('consulta', 's', '', 'l', 'l')}: su ficha se queda sin centro.` : ''}`,
      { titulo: '¿Quitar del centro?', ok: 'Quitar', peligro: true })) return;
    const { data: r, error: e } = await db.rpc('centro_quitar_profesional', { p_centro: c.id, p_cuenta: m.id });
    if (e || !r || !r.ok) { toast(r && r.error === 'permiso' ? `No puedes cambiar la ficha de ${m.nombre}` : 'No se ha podido quitar', true); return; }
    toast(`${m.nombre} ya no está en ${c.nombre}`);
    fichaCentro(c.id);
  });
}

function editarCentroFicha(c) {
  const h = c.horario || {};
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Editar centro</h2><div class="sm">Los cambios se pasan a ${TT('consulta', 'p', 'el', 'l', 'l')} enlazadas a este centro</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="ecn">Nombre del centro</label><input id="ecn" value="${esc(c.nombre || '')}"></div>
      <div><label for="ect">Teléfono</label><input id="ect" value="${esc(c.telefono || '')}" inputmode="tel"></div></div>
    <div class="g2"><div><label for="ecd">Dirección</label><input id="ecd" value="${esc(c.direccion || '')}"></div>
      <div><label for="ecc">Código postal</label><input id="ecc" value="${esc(c.cp || '')}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="ecm">Población</label><input id="ecm" value="${esc(c.municipio || '')}"></div>
      <div><label for="ecp">Provincia</label><input id="ecp" value="${esc(c.provincia || '')}"></div></div>
    <label>Horario de apertura</label>
    <div class="cphor">${DIAS_SEM.map(([d, n]) => `<div><span>${n}</span><input data-ech="${d}" value="${esc(h[d] || '')}" placeholder="${d === 'D' ? 'Cerrado' : '8:00-20:00'}"></div>`).join('')}</div>
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="ecvolver">Volver</button><button type="button" class="btn" id="ecok">Guardar cambios</button></div>`;
  $('ecvolver').onclick = () => fichaCentro(c.id);
  $('ecok').onclick = async ev => {
    const v = k => $(k).value.trim();
    if (!v('ecn')) { toast('Escribe el nombre del centro', true); return; }
    const horario = {}; $('dbody').querySelectorAll('[data-ech]').forEach(x => { if (x.value.trim()) horario[x.dataset.ech] = x.value.trim(); });
    const cambioDir = v('ecd') !== (c.direccion || '') || v('ecm') !== (c.municipio || '') || v('ecc') !== (c.cp || '');
    ev.target.disabled = true;
    let lat = c.lat, lon = c.lon;
    if (cambioDir && (v('ecd') || v('ecm'))) {
      const g = await geocodificar([v('ecd'), v('ecc'), v('ecm'), v('ecp'), 'España'].filter(Boolean).join(', '), { direccion: v('ecd'), municipio: v('ecm'), cp: v('ecc') }).catch(() => null);
      if (g && !g.fuera) { lat = +g.lat; lon = +g.lon; } else if (g && g.fuera) toast(`La dirección sale en ${g.fuera}, no en ${v('ecm')}: se guarda sin mover el punto del mapa`, true);
    }
    const { data: r, error } = await RPC_ORIG('guardar_centro', { p: { id: c.id, nombre: v('ecn'), telefono: v('ect'), direccion: v('ecd'), cp: v('ecc'),
      municipio: v('ecm'), provincia: v('ecp'), lat, lon, horario } });
    ev.target.disabled = false;
    if (error || !r || !r.ok) { toast((r && r.error) || 'No se ha podido guardar', true); return; }
    toast('Centro guardado'); fichaCentro(c.id);
  };
}

function formPrivada(box, i) {
  const cont = box.querySelector(`[data-cp="${i}"]`); if (!cont) return;
  const v = f => ((cpCampo(box, i, f) || {}).value || '').trim(), k = 'pv' + i + '_';
  let lat = v('lat') ? +v('lat') : null, lon = v('lon') ? +v('lon') : null;
  const dirAntes = [v('direccion'), v('cp'), v('municipio')].join('|');
  let situada = false;                                         // se ha situado en el mapa desde que se abrió el formulario
  cont.innerHTML = `<div class="cpform cppriv">
    <div class="cpformcab"><b>${consultaPrivada()}</b><span class="sm">Dónde atiende (en su casa, un despacho…). Se guarda con la ficha.</span></div>
    <div class="g2"><div><label for="${k}d">Dirección</label><input id="${k}d" value="${esc(v('direccion'))}" placeholder="Calle, número, piso"></div>
      <div><label for="${k}c">Código postal</label><input id="${k}c" value="${esc(v('cp'))}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="${k}m">Población</label><input id="${k}m" value="${esc(v('municipio'))}"></div>
      <div><label for="${k}p">Provincia</label><input id="${k}p" value="${esc(v('provincia'))}"></div></div>
    <div class="cpubi sm">${lat ? '<b style="color:var(--ok)">✓ Ubicada</b>' : 'Sin ubicación todavía'}
      <button type="button" class="lnk" data-pvgeo>🔎 Buscar la dirección en el mapa</button> <button type="button" class="lnk" data-pvaqui>📍 Estoy aquí</button></div>
    <div class="acts" style="justify-content:flex-end;margin:10px 0 0"><button type="button" class="btn sec" data-pvcancel>Cancelar</button><button type="button" class="btn" data-pvok>Guardar</button></div></div>`;
  const val = x => $(k + x).value.trim();
  const ubicada = t => { const u = cont.querySelector('.cpubi'); u.firstChild.replaceWith(Object.assign(document.createElement('b'), { style: 'color:var(--ok)', textContent: '✓ Ubicada ' + (t || '') })); };
  const rellenar = a => {
    if (!a) return;
    if (!val('d') && a.road) $(k + 'd').value = [a.road, a.house_number].filter(Boolean).join(', ');
    if (!val('c') && a.postcode) $(k + 'c').value = a.postcode;
    if (!val('m')) $(k + 'm').value = (a.city || a.town || a.village || a.municipality || '').toUpperCase();
    if (!val('p')) $(k + 'p').value = (a.province || a.state_district || a.county || a.state || '').toUpperCase();
  };
  const buscar = async (silencio) => {
    if (!val('d') && !val('m')) { if (!silencio) toast('Escribe la dirección o la población', true); return false; }
    const q = [val('d'), val('c'), val('m'), val('p'), 'España'].filter(Boolean).join(', ');
    const r = await geocodificar(q, { direccion: val('d'), municipio: val('m'), cp: val('c') }).catch(() => null);
    if (!r) { if (!silencio) toast('No se ha encontrado esa dirección. Prueba con calle, número y población.', true); return false; }
    if (r.fuera) { toast(`Esa dirección sale en ${r.fuera}, no en ${val('m')}: revísala (no se ha guardado el punto)`, true); return false; }
    lat = +r.lat; lon = +r.lon; situada = true; rellenar(r.address); ubicada(); return true;
  };
  cont.querySelector('[data-pvgeo]').onclick = async e => { const t = e.target.textContent; e.target.textContent = 'Buscando…'; await buscar(); e.target.textContent = t; };
  cont.querySelector('[data-pvaqui]').onclick = async e => {
    if (!navigator.geolocation) { toast('Este dispositivo no da la ubicación', true); return; }
    const t = e.target.textContent; e.target.textContent = 'Localizando…';
    try {
      const pos = await new Promise((ok, ko) => navigator.geolocation.getCurrentPosition(ok, ko, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }));
      lat = +pos.coords.latitude.toFixed(6); lon = +pos.coords.longitude.toFixed(6); situada = true;
      const inv = await geoInversa(lat, lon); rellenar(inv && inv.address); ubicada('con tu ubicación: revisa la dirección');
    } catch (err) { toast('No se ha podido obtener tu ubicación: revisa el permiso de ubicación del navegador', true); }
    finally { e.target.textContent = t; }
  };
  cont.querySelector('[data-pvcancel]').onclick = () => pintarCentroSel(box, i);
  cont.querySelector('[data-pvok]').onclick = async ev => {
    if (!val('d') && !val('m')) { toast('Escribe al menos la población', true); $(k + 'm').focus(); return; }
    // Si la dirección ha cambiado y no se ha vuelto a situar, se busca en el mapa (si no se encuentra, se guarda sin punto)
    if ([val('d'), val('c'), val('m')].join('|') !== dirAntes && !situada) {
      ev.target.disabled = true; const ok = await buscar(true); ev.target.disabled = false;
      if (!ok) { lat = null; lon = null; }
    }
    cpPoner(box, i, { nombre: 'CONSULTA PRIVADA', direccion: val('d'), cp: val('c'), municipio: val('m').toUpperCase(), provincia: val('p').toUpperCase(), lat, lon });
    pintarCentroSel(box, i);
    toast(lat != null ? `${consultaPrivada()} lista: se guarda con la ficha` : 'Dirección puesta, sin punto en el mapa: se guarda con la ficha');
  };
  $(k + (v('direccion') ? 'd' : 'm')).focus();
}

// ——— En la ficha del equipo: lo que ha enviado desde su portal ———
async function fichaPropuesta(id) {
  if (ES_MEDICO() || FICHA_ID !== id || !$('fbody') || $('fprop')) return;
  const { data: p } = await RPC_ORIG('ficha_propuesta', { p_cuenta: id });
  if (!p || FICHA_ID !== id || !$('fbody') || $('fprop')) return;
  const d = p.datos || {}, rf = await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id), m = (rf && rf.data && rf.data.medico) || {};
  const fila = (t, ahora, nuevo) => nuevo && nuevo !== ahora ? `<div class="fpdif"><span class="sm">${t}</span><span>${ahora ? `<s>${esc(ahora)}</s> → ` : ''}<b>${esc(nuevo)}</b></span></div>` : '';
  const horario = dd => PM_DIAS.filter(k => dd && dd[k]).map(k => `${PM_DIAN[k].slice(0, 3)} ${esc(dd[k])}`).join(' · ') || 'Sin horario';
  const html = `<section class="blk fprop" id="fprop"><h3>Datos enviados desde su portal <span class="pill p-warn">Por revisar</span></h3>
    <p class="sm">${esc(p.quien || TT('medico', 's', 'el', 'l', 'C'))} los envió el ${horaCorta(p.modificado_en)}. Pásalos a la ficha con «Editar la ficha» y márcalos como revisados.</p>
    ${fila('Teléfono', m.telefono, d.telefono)}${fila('Correo', m.email, d.email)}
    ${(d.consultas || []).map(c => `<div class="fpcon"><b>${esc(c.nombre || TT('consulta', 's', '', 'l', 'C'))}</b> ${c.centro_id || c.ubicacion_id ? '' : '<span class="pill p-per">Centro nuevo</span>'}
      <span class="sm">${esc([c.direccion, c.municipio].filter(Boolean).join(' · '))}</span><span class="sm">${horario(c.dias)}</span></div>`).join('')}
    ${d.visitas && (d.visitas.como || d.visitas.momento) ? `<div class="fpdif"><span class="sm">${TT('visita', 'p', '', 'l', 'C')}</span><span>${esc([d.visitas.como, d.visitas.momento].filter(Boolean).join(' · '))}</span></div>` : ''}
    ${d.notas ? `<div class="fpdif"><span class="sm">Notas</span><span>${esc(d.notas)}</span></div>` : ''}
    <div class="acts" style="justify-content:flex-start;margin:8px 0 0">${$('fbody').querySelector('[data-act=editar]') ? '<button type="button" class="btn sec" id="fpropedit">Editar la ficha</button>' : ''}
      <button type="button" class="btn" id="fpropok">Marcar como revisado</button></div></section>`;
  // Debajo de la cabecera de la ficha (nombre y botones), antes del primer bloque
  const ref = [...$('fbody').children].find(x => x.matches('.blk, section, .card') && x.id !== 'fprop');
  if (ref) ref.insertAdjacentHTML('beforebegin', html); else $('fbody').insertAdjacentHTML('beforeend', html);
  if ($('fpropedit')) $('fpropedit').onclick = () => { const e = $('fbody').querySelector('[data-act=editar]'); if (e) e.click(); };
  $('fpropok').onclick = async () => {
    const { data: r } = await db.rpc('revisar_propuesta', { p_id: p.id });
    if (!r || !r.ok) { toast(r && r.error === 'permiso' ? 'No tienes permiso para revisarlo' : 'No se ha podido marcar', true); return; }
    toast('Marcado como revisado'); const b = $('fprop'); if (b) b.remove();
  };
}

async function cargarCentro2282() {
  const v = $('v-informe');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu centro</div><h1 id="ctnom">…</h1>
      <div class="sm" style="color:rgba(255,255,255,.85)">Pide la reposición de tus productos y sigue tus pedidos</div></div></div>
    <div class="pmtabs" role="tablist">${[['res', 'Resumen'], ['ped', 'Pedir reposición'], ['ficha', 'Mi centro'], ['mat', 'Material y dudas']].map(([k, t]) =>
      `<button type="button" role="tab" data-pmt="${k}" class="${PM.tab === k ? 'on' : ''}" aria-selected="${PM.tab === k}">${t}<span class="pmtpunto" hidden></span></button>`).join('')}</div>
    <div data-pmp="res" id="mdcuerpo" ${PM.tab === 'res' ? '' : 'hidden'}>${pmEsqueleto()}</div>
    <div data-pmp="ped" id="pcped" ${PM.tab === 'ped' ? '' : 'hidden'}>${pmEsqueleto(true)}</div>
    <div data-pmp="ficha" id="pmficha" ${PM.tab === 'ficha' ? '' : 'hidden'}>${pmEsqueleto(true)}</div>
    <div data-pmp="mat" id="pmmat" ${PM.tab === 'mat' ? '' : 'hidden'}><div id="mdportal" class="pmfila"></div></div>`;
  if (!['res', 'ped', 'ficha', 'mat'].includes(PM.tab)) PM.tab = 'res';
  v.querySelectorAll('[data-pmt]').forEach(b => b.onclick = () => pmTab(b.dataset.pmt));
  await centroPintar();
  portalMedico();
}

async function bajaCuenta(id, baja) {
  const { data: r, error } = await db.rpc('baja_cuenta', { p_id: id, p_baja: baja });
  if (error || !r || !r.ok) { toast('No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true); return false; }
  try { invalidarCache(); } catch (e) {}
  toast(baja ? 'Ficha dada de baja' + (r.citas_quitadas ? ` · ${r.citas_quitadas} ${r.citas_quitadas === 1 ? 'cita quitada' : 'citas quitadas'} de la agenda` : '') : 'Ficha dada de alta de nuevo');
  if (TAB === 'directorio' && typeof buscar === 'function') buscar(true);
  return true;
}

function dpHTML(dias, idx) {
  const st = {};
  DIAS.forEach(k => {
    const t = String((dias || {})[k] || '');
    const r = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/.exec(t);
    st[k] = {
      M: /mañana/i.test(t) || (r && +r[1].slice(0, 2) < 14),
      T: /tarde/i.test(t) || (r && +r[1].slice(0, 2) >= 14),
      h: r ? r[1] + '-' + r[2] : ''
    };
  });
  const sel = (k, f) => `<select data-dh="${idx}|${k}|${f}"><option value="">Sin hora</option>${
    (f === 'M' ? HM : HT).map(x => `<option ${st[k].h === x ? 'selected' : ''}>${x.replace('-', ' - ')}</option>`).join('')}</select>`;
  return `<div class="dp" data-dp="${idx}">
    <div class="qk"><button type="button" data-qk="${idx}|lvm">L-V mañanas</button>
      <button type="button" data-qk="${idx}|lvt">L-V tardes</button>
      <button type="button" data-qk="${idx}|clr">Limpiar</button></div>
    ${DIAS.map(k => `<div class="dprow"><b>${DIAN[k].slice(0, 3)}</b>
      <div class="dpc"><button type="button" class="dpt" data-dt="${idx}|${k}|M" aria-pressed="${!!st[k].M}">${st[k].M ? '✓ ' : ''}Mañana</button>${st[k].M ? sel(k, 'M') : ''}</div>
      <div class="dpc"><button type="button" class="dpt" data-dt="${idx}|${k}|T" aria-pressed="${!!st[k].T}">${st[k].T ? '✓ ' : ''}Tarde</button>${st[k].T ? sel(k, 'T') : ''}</div>
    </div>`).join('')}</div>`;
}

function dpLeer(cont, idx) {
  const out = {};
  DIAS.forEach(k => {
    const partes = [];
    ['M', 'T'].forEach(f => {
      const b = cont.querySelector(`[data-dt="${idx}|${k}|${f}"]`);
      if (b && b.getAttribute('aria-pressed') === 'true') {
        const s = cont.querySelector(`[data-dh="${idx}|${k}|${f}"]`);
        const h = s && s.value ? ' ' + s.value.replace(/\s/g, '') : '';
        partes.push((f === 'M' ? 'Mañana' : 'Tarde') + h);
      }
    });
    if (partes.length) out[k] = partes.join('; ');
  });
  return out;
}

function dpEstado(cont, idx) {
  const st = {};
  DIAS.forEach(k => {
    st[k] = { M: false, T: false, h: { M: '', T: '' } };
    ['M', 'T'].forEach(f => {
      const b = cont.querySelector(`[data-dt="${idx}|${k}|${f}"]`);
      if (b) st[k][f] = b.getAttribute('aria-pressed') === 'true';
      const s = cont.querySelector(`[data-dh="${idx}|${k}|${f}"]`);
      if (s) st[k].h[f] = s.value;
    });
  });
  return st;
}

function repintarDp(cont, idx, st) {
  const dias = {};
  DIAS.forEach(k => {
    const p = [];
    if (st[k].M) p.push('Mañana' + (st[k].h.M ? ' ' + st[k].h.M.replace(/\s/g, '') : ''));
    if (st[k].T) p.push('Tarde' + (st[k].h.T ? ' ' + st[k].h.T.replace(/\s/g, '') : ''));
    if (p.length) dias[k] = p.join('; ');
  });
  cont.outerHTML = dpHTML(dias, idx);
}

function consHTML(c, i) {
  // Los datos del centro van en campos ocultos: los rellena el selector de centros (buscar, «Estoy aquí» o centro nuevo)
  const h = (f, v) => `<input type="hidden" data-cf="${i}|${f}" value="${esc(v == null ? '' : v)}">`;
  return `<div class="cons" data-cons="${i}" ${c.lat ? `data-lat="${c.lat}"` : ""}>
    <span class="consbar"><span class="consprio">Principal</span>
      <button type="button" class="kmv" data-cmov="-1" title="Subir (más prioridad)" aria-label="Subir">↑</button>
      <button type="button" class="kmv" data-cmov="1" title="Bajar (menos prioridad)" aria-label="Bajar">↓</button>
      <button type="button" class="quitar" data-quitar="${i}">Quitar</button></span>
    <input type="hidden" data-cid="${i}" value="${esc(c.id || '')}">
    ${h('centro_id', c.centro_id)}${h('centro_nombre', c.centro_nombre)}${h('municipio', c.municipio)}${h('provincia', c.provincia)}
    ${h('direccion', c.direccion)}${h('cp', c.cp)}${h('lat', c.lat)}${h('lon', c.lon)}
    <label>Centro</label><div class="cenpick" data-cp="${i}"></div>
    <div class="g2" style="margin-top:10px">
      <div><label>Planta</label><input data-cf="${i}|planta" value="${esc(c.planta || '')}" maxlength="60" placeholder="p. ej. 2.ª planta"></div>
      <div><label>Sala o despacho</label><input data-cf="${i}|sala" value="${esc(c.sala || '')}" maxlength="60" placeholder="p. ej. Despacho 14"></div>
    </div>
    <label>Indicaciones para llegar</label><input data-cf="${i}|indicaciones" value="${esc(c.indicaciones || '')}" maxlength="300" placeholder="p. ej. Entrar por la puerta B y preguntar en recepción">
    <div class="g2" style="margin-top:10px">
      <div><label>Teléfono ${TT('consulta', 's', 'del', 'l', 'l')}</label><input data-cf="${i}|telefono" value="${esc(c.telefono || '')}" inputmode="tel" placeholder="Si es distinto del del centro"></div><div></div>
    </div>
    <label>Días y horario de ${TT('visita', 's', '', 'l', 'l')}</label>${dpHTML(c.dias || {}, i)}
  </div>`;
}

async function cambiarEstado(id, estado) {
  const { error } = await db.from('cuentas').update({ estado_comercial: estado }).eq('id', id);
  if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
  toast('Estado: ' + estado);
  buscar(true); cargarInicio();
}

/* v2.77.0 · Valores con categoría (p. ej. Traumatología › Columna): el selector los agrupa */
function optsGrupos(lista, v) {
  const hijos = {}; lista.forEach(x => { if (x.padre) (hijos[x.padre] = hijos[x.padre] || []).push(x); });
  const op = x => `<option value="${esc(x.valor)}" ${v === x.valor ? 'selected' : ''}>${esc(x.valor)}</option>`;
  let h = '<option value=""></option>';
  if (v && !lista.some(x => x.valor === v)) h += `<option selected>${esc(v)}</option>`;
  lista.filter(x => !x.padre).forEach(x => {
    h += hijos[x.valor] ? `<optgroup label="${esc(x.valor)}">${op(x)}${hijos[x.valor].map(op).join('')}</optgroup>` : op(x);
  });
  // Subcategorías cuya categoría ya no está en la lista
  Object.keys(hijos).filter(p => !lista.some(x => !x.padre && x.valor === p)).forEach(p => { h += `<optgroup label="${esc(p)}">${hijos[p].map(op).join('')}</optgroup>`; });
  return h;
}

async function verCartera(id) {
  const u = USUARIOS.find(x => x.id === id) || {};
  cargando($('dbody'), 'Cargando la cartera…');
  $('dlg').showModal();
  const pinta = async q => {
    const { data } = await db.rpc('cartera_usuario', { p_usuario: id, q: q || null, lim: 500 });
    const l = data || [];
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Cartera de ${esc(u.nombre || '')}</h2>
        <div class="sm">${num(l.length)} ${TT('medico', 'p', '', 'l', 'l', 'asignado')}</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <input id="cbusca" value="${esc(q || '')}" placeholder="Buscar dentro de la cartera">
      <div class="lista" style="max-height:52vh;overflow:auto">${l.map(m => `<div class="item" style="cursor:default">
        <span class="ic ${m.urgente ? 'w' : ''}">${m.urgente ? '!' : '·'}</span>
        <span class="tx"><b>${esc(m.nombre)}</b><span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro || '')} ${esc(m.municipio || '')}
          ${m.ultima_visita ? ` · ${TT('visita', 's', 'ultimo', 'l', 'l')} ` + fechaCorta(m.ultima_visita) : ' · sin visitar'}</span></span>
        <span class="acts" style="margin:0">
          <button class="btn sec" data-cficha="${m.id}">Ficha</button>
          <button class="btn sec dang" data-cquita="${m.id}">Quitar</button></span></div>`).join('')
        || `<div class="vacio">Sin ${TT('medico', 'p', '', 'l', 'l', 'asignado')}.</div>`}</div>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" id="cmas">Asignar más ${TT('medico', 'p', '', 'l', 'l')}</button></div>`;

    let t;
    $('cbusca').oninput = e => { clearTimeout(t); t = setTimeout(() => pinta(e.target.value.trim()), 300); };
    $('dbody').querySelectorAll('[data-cficha]').forEach(b => b.onclick = () => { $('dlg').close(); abrirFicha(b.dataset.cficha); });
    $('dbody').querySelectorAll('[data-cquita]').forEach(b => b.onclick = async () => {
      if (!await preguntar(`Dejará de verlo en su cartera. El histórico de ${TT('visita', 'p', '', 'l', 'l')} no cambia.`,
        { titulo: '¿Quitar de la cartera?', ok: 'Quitar', peligro: true })) return;
      const { data: r } = await db.rpc('quitar_de_cartera', { p_usuario: id, p_medico: b.dataset.cquita });
      if (r && r.ok === false) { toast('No tienes permiso', true); return; }
      toast('Quitado de la cartera'); pinta(q); cargarAdmin();
    });
    $('cmas').onclick = () => { $('dlg').close(); asignarCartera(id); };
  };
  pinta('');
}

/** Visitas o citas de estos médicos cerca de la fecha (sin contar ese mismo día). */
async function recientesDe(ids, fecha) {
  const a = avisoRevisita(); if (!a.on || !ids.length) return {};
  const { data } = await db.rpc('actividades_recientes', { p_ids: ids, p_desde: isoMas(fecha, -(a.dias - 1)), p_hasta: isoMas(fecha, a.dias - 1) });
  const por = {};
  (data || []).filter(x => x.fecha !== fecha).forEach(x => (por[x.cuenta_id] = por[x.cuenta_id] || []).push(x));
  return por;
}

async function cargarFiltros(soloMunicipios) {
  const { data, error } = await db.rpc('opciones_filtros', { f_provincia: F.prov || null });
  if (error) return;
  OPF = data;
  const pon = (sel, lista, etiqueta, valor) => {
    $(sel).innerHTML = `<option value="">${etiqueta}</option>` +
      lista.map(o => `<option value="${esc(o.v)}" ${valor === o.v ? 'selected' : ''}>${esc(o.v)} (${o.n})</option>`).join('');
  };
  if (!soloMunicipios) {
    pon('fprov', data.provincias, 'Todas las provincias', F.prov);
    pon('fesp', data.especialidades, todosLos('especialidad'), F.esp);
    pon('fest', data.estados, 'Todos los estados', F.est);
  }
  pon('fmuni', data.municipios, 'Todos los municipios', F.muni);
}

function fila(m) {
  const d = m.dias || {};
  return `<button class="fila" data-id="${m.id}">
    <span><span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>
      <span class="sm">${esc(m.especialidad || 'Sin ' + TT('especialidad', 's', '', 'l', 'l'))}</span></span>
    <span class="c2"><span class="nm" style="font-size:13.5px">${esc(m.centro_nombre || consultaPrivada())}</span>
      <span class="sm">${esc([m.municipio, m.provincia].filter(Boolean).join(' · '))}</span></span>
    <span class="c3"><span class="dias">${['L','M','X','J','V'].map(k => `<span class="${d[k] ? 'on' : ''}">${k}</span>`).join('')}</span></span>
    <span class="pill p-est">${esc(m.estado_comercial)}</span>
  </button>`;
}
