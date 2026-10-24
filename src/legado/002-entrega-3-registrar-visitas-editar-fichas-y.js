/* ============================================================
   DLC OS 2.0 · Entrega 3: registrar visitas, editar fichas y altas
   ============================================================ */

// Catálogos por su papel en la plataforma (clasificadores.papel), nunca por la clave que les ponga cada cliente
const CAT = { resultado_visita: [], especialidad: [], area: [], motivo_urgencia: [], forma_pago: [] };
const DIAS = ['L', 'M', 'X', 'J', 'V'];
const DIAN = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes' };
const HM = ['09:00-13:00', '09:30-13:30', '10:00-14:00', '08:00-15:00'];
const HT = ['15:00-19:00', '16:00-19:00', '16:00-20:00', '17:00-20:00'];
let FICHA_ID = null;

const puedeEditar = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).M || 0) >= 2);
const puedeEditarTipo = t => PERFIL && (puede('administrar') || ((PERFIL.areas || {})[t === 'Centro' ? 'C' : 'M'] || 0) >= 2);
const puedeCrearTipo = t => PERFIL && (puede('administrar') || ((PERFIL.areas || {})[t === 'Centro' ? 'C' : 'M'] || 0) >= 3);
const puedeCrear = () => puedeCrearTipo('Persona') || puedeCrearTipo('Centro');
const puedeRegistrar = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).S || 0) >= 2);

let tToast;
function toast(msg, err) {
  const t = $('toast');
  t.textContent = msg; t.className = 'toast' + (err ? ' err' : '');
  clearTimeout(tToast); tToast = setTimeout(() => t.classList.add('hide'), 3200);
}

async function cargarCatalogos() {
  const claves = Object.keys(CAT);
  const res = await Promise.all(claves.map(k => db.rpc('catalogo_papel', { p_papel: k })));
  claves.forEach((k, i) => { CAT[k] = res[i].data || []; });
  cargarCampos().catch(() => {});
}

/* ---------------- selector de días ---------------- */

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

document.addEventListener('click', e => {
  const t = e.target.closest('[data-dt]');
  if (t) {
    const cont = t.closest('.dp'), [idx, k, f] = t.dataset.dt.split('|');
    const dias = dpLeer(cont.parentElement, idx);
    const st = dpEstado(cont, idx);
    st[k][f] = !st[k][f];
    repintarDp(cont, idx, st);
    return;
  }
  const q = e.target.closest('[data-qk]');
  if (q) {
    const cont = q.closest('.dp'), [idx, modo] = q.dataset.qk.split('|');
    const st = dpEstado(cont, idx);
    DIAS.forEach(k => {
      if (modo === 'clr') { st[k].M = st[k].T = false; st[k].h = { M: '', T: '' }; }
      if (modo === 'lvm') st[k].M = true;
      if (modo === 'lvt') st[k].T = true;
    });
    repintarDp(cont, idx, st);
  }
});

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

/* ---------------- registrar visita ---------------- */


/* ---------------- editar ficha y altas ---------------- */

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

async function abrirEditor(id, tipo) {
  let m = { tipo: tipo || 'Persona', estado_comercial: estadoPapel('inicial') }, cons = [{}];
  if (id) {
    const { data, error } = await db.rpc('ficha_cuenta', { p_id: id });
    if (error) { toast('No se ha podido abrir: ' + error.message, true); return; }
    m = data.medico; cons = (data.consultas || []).length ? data.consultas : [{}];
  }
  const esCentro = m.tipo === 'Centro';
  const opts = (lista, v) => (lista || []).some(x => x.padre) ? optsGrupos(lista, v) : `<option value=""></option>` + lista.map(x =>
    `<option ${v === x.valor ? 'selected' : ''}>${esc(x.valor)}</option>`).join('');

  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${id ? 'Editar ficha' : esCentro ? 'Nuevo centro' : esc(fichaNueva().nueva)}</h2>
      <div class="sm">${id ? esc(m.nombre) : esCentro ? 'Empresa, tienda, oficina u otro local' : `${TT('medico', 's', '', 'l', 'C')} con sus centros`}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="en">${esCentro ? 'Nombre del centro' : 'Apellidos, Nombre'}</label>
    <input id="en" value="${esc(m.nombre || '')}" placeholder="${esCentro ? 'CENTRO SANT JORDI' : 'GARCIA LOPEZ, ANA'}" autocapitalize="characters">
    ${esCentro ? '' : `<div class="g2">
      <div><label for="ee">${TT('especialidad', 's', '', 'l', 'C')}</label><select id="ee">${opts(CAT.especialidad, m.especialidad)}</select></div>
      <div><label for="ea">Área</label><select id="ea">${opts(CAT.area, m.area)}</select></div></div>`}
    <div class="g2">
      <div><label for="et">Teléfono</label><input id="et" value="${esc(m.telefono || '')}" inputmode="tel"></div>
      <div><label for="em">Email</label><input id="em" type="email" value="${esc(m.email || '')}"></div>
    </div>
    <label for="ect">Contacto (secretaría, teléfono, email)</label><input id="ect" value="${esc(m.contacto || '')}">
    ${esCentro ? '' : `<label class="chksr"><input type="checkbox" id="esr" ${m.sin_reporting ? 'checked' : ''}><span><b>Sin reporting</b><span class="sm">Solo ${TT('visita', 's', '', 'l', 'l')} presencial: no quiere informes ni feedback.</span></span></label>`}
    <label for="eno">Nota</label><textarea id="eno" rows="3">${esc(m.nota || '')}</textarea>
    ${camposHTML('medico', m.clasificadores)}
    <div id="econs">${cons.map(consHTML).join('')}</div>
    <div class="acts"><button type="button" class="btn sec" id="eadd">+ Añadir ${TT('consulta', 's', '', 'l', 'l')}</button></div>
    <div id="edup"></div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="eguardar">${id ? 'Guardar cambios' : 'Crear'}</button>
    </div>`;

  // v2.75.0: cualquier consulta se puede quitar y ordenar; la primera es la principal
  const sigIdx = () => 1 + Math.max(-1, ...[...$('econs').children].map(b => +b.dataset.cons || 0));
  $('eadd').onclick = () => {
    $('econs').insertAdjacentHTML('beforeend', consHTML({}, sigIdx()));
  };
  $('econs').onclick = e => {
    const q = e.target.closest('[data-quitar]');
    if (q) {
      q.closest('.cons').remove();
      if (!$('econs').children.length) $('econs').insertAdjacentHTML('beforeend', consHTML({}, sigIdx()));
      return;
    }
    const mv = e.target.closest('[data-cmov]');
    if (mv) {
      const box = mv.closest('.cons');
      if (mv.dataset.cmov === '-1' && box.previousElementSibling) box.parentElement.insertBefore(box, box.previousElementSibling);
      else if (mv.dataset.cmov === '1' && box.nextElementSibling) box.parentElement.insertBefore(box.nextElementSibling, box);
    }
  };

  const recoger = () => {
    const consultas = [...$('econs').children].map(box => {
      const i = box.dataset.cons;
      const g = f => (box.querySelector(`[data-cf="${i}|${f}"]`) || {}).value || '';
      return {
        id: (box.querySelector(`[data-cid="${i}"]`) || {}).value || null, centro_id: g('centro_id') || null,
        centro_nombre: g('centro_nombre').toUpperCase(), municipio: g('municipio').toUpperCase(),
        provincia: g('provincia').toUpperCase(), direccion: g('direccion'), cp: g('cp'),
        telefono: g('telefono'), dias: dpLeer(box, i), lat: g('lat') || null, lon: g('lon') || null,
        planta: g('planta').trim(), sala: g('sala').trim(), indicaciones: g('indicaciones').trim()
      };
    });
    return {
      id: id || null, tipo: m.tipo,
      nombre: $('en').value.trim().toUpperCase(),
      especialidad: esCentro ? '' : ($('ee') || {}).value || '',
      area: esCentro ? '' : ($('ea') || {}).value || '',
      telefono: $('et').value.trim(), email: $('em').value.trim(),
      contacto: $('ect').value.trim(),
      nota: $('eno').value.trim(), estado_comercial: m.estado_comercial, consultas,
      sin_reporting: $('esr') ? $('esr').checked : !!m.sin_reporting
    };
  };

  let avisado = false;
  $('eguardar').onclick = async ev => {
    const p = recoger();
    if (!p.nombre || p.nombre.length < 3) { toast('Escribe el nombre', true); return; }
    const cps = camposLeer($('dbody'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    if (!id && !esCentro && p.nombre.indexOf(',') < 0) { toast('Escribe el nombre como APELLIDOS, NOMBRE', true); return; }

    if (!id && !avisado) {
      const { data: dup } = await db.rpc('duplicados_de', {
        p_nombre: p.nombre, p_tipo: p.tipo, p_municipio: (p.consultas[0] || {}).municipio || null
      });
      const altos = (dup || []).filter(d => d.pct >= 70);
      if (altos.length) {
        avisado = true;
        $('edup').innerHTML = `<div class="dupbox"><b>Puede que ya exista</b>
          <div class="sm">Si es la misma persona, cancela y abre su ficha. Si no lo es, vuelve a pulsar Crear.</div>
          ${altos.map(d => `<div class="l"><span><b>${esc(d.nombre)}</b><br><span class="sm">${[d.especialidad, d.centro, d.municipio].filter(Boolean).map(esc).join(' · ')}</span></span>
            <span><b>${d.pct}%</b></span></div>`).join('')}</div>`;
        $('eguardar').textContent = 'Crear de todos modos';
        return;
      }
    }

    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    const { data, error } = await db.rpc('guardar_cuenta', { p });
    ev.target.disabled = false; ev.target.textContent = id ? 'Guardar cambios' : 'Crear';
    if (error) { toast('No se ha podido guardar: ' + error.message, true); return; }
    if (cps && !(await camposGuardar(cps, (data && data.medico && data.medico.id) || id))) return;
    $('dlg').close();
    toast(id ? 'Ficha guardada' : 'Creado correctamente');
    buscar(true); cargarInicio();
    if (data && data.medico) abrirFicha(data.medico.id);
  };
  $('dlg').showModal();
}

/* ---------------- acciones desde la ficha ---------------- */

async function cambiarEstado(id, estado) {
  const { error } = await db.from('cuentas').update({ estado_comercial: estado }).eq('id', id);
  if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
  toast('Estado: ' + estado);
  buscar(true); cargarInicio();
}

async function alternarUrgente(id, esUrgente, nombre) {
  let motivo = null;
  if (!esUrgente) {
    motivo = await pedirTexto('Motivo (opcional). Puedes escribirlo o elegir uno:', '',
      { titulo: 'Marcar como urgente', ok: 'Marcar urgente', opciones: CAT.motivo_urgencia.map(x => x.valor) });
    if (motivo === null) return;
  }
  const { error } = await db.from('cuentas')
    .update({ urgente: !esUrgente, urgente_motivo: esUrgente ? null : (motivo || 'Marcado desde la app') })
    .eq('id', id);
  if (error) { toast('No se ha podido cambiar: ' + error.message, true); return; }
  toast(esUrgente ? 'Ya no es urgente' : 'Marcado como urgente');
  abrirFicha(id); buscar(true); cargarInicio();
}

/* ---------------- enganches ---------------- */

document.addEventListener('click', e => {
  if (e.target.closest('.x[data-cerrar]')) intentarCerrar($('dlg'));
  else if (e.target.closest('[data-cerrar]')) $('dlg').close();
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const id = a.dataset.id;
  if (a.dataset.act === 'visita') abrirVisita(id);
  if (a.dataset.act === 'editar') abrirEditor(id);
  if (a.dataset.act === 'urgente') alternarUrgente(id, a.dataset.urg === '1');
});

document.addEventListener('change', e => {
  const s = e.target.closest('[data-estado]');
  if (s) cambiarEstado(s.dataset.estado, s.value);
});

$('dlg2').addEventListener('click', e => {
  if (e.target.closest('.x[data-cerrar2]')) intentarCerrar($('dlg2'));
  else if (e.target.closest('[data-cerrar2]')) $('dlg2').close();
});

/* v2.75.0 · Cómo se llama una ficha nueva: el vocabulario del cliente o, si no lo ha cambiado, «cuenta» */
function fichaNueva() {
  if (TERMINOS && TERMINOS.medico && TERMINOS.medico.s) return { nombre: TT('medico', 's', '', 'l', 'C'), nueva: TT('medico', 's', 'nuevo', 'C', 'l') };
  return { nombre: 'Cuenta', nueva: 'Nueva cuenta' };
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
$('nuevoBtn').addEventListener('click', () => {
  if (!puedeCrear()) { toast('No tienes permiso para crear fichas', true); return; }
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Crear nuevo</h2><div class="sm">¿Qué quieres dar de alta?</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="opciones" style="margin-top:10px">
      <button class="opt ${puedeCrearTipo('Persona') ? '' : 'hide'}" data-crear="Persona" style="flex-direction:column;align-items:flex-start;gap:4px;padding:16px">
        <b style="font-size:16px;color:var(--navy)">${esc(fichaNueva().nombre)}</b><span class="sm">${TT('medico', 's', '', 'l', 'C')} con sus centros y horarios</span></button>
      <button class="opt ${puedeCrearTipo('Centro') ? '' : 'hide'}" data-crear="Centro" style="flex-direction:column;align-items:flex-start;gap:4px;padding:16px">
        <b style="font-size:16px;color:var(--navy)">Centro</b><span class="sm">Empresa, tienda, oficina u otro local</span></button>
    </div>`;
  $('dbody').querySelectorAll('[data-crear]').forEach(b => b.onclick = () => abrirEditor(null, b.dataset.crear));
  $('dlg').showModal();
});



