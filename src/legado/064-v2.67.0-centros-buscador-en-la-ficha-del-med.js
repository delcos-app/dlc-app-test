/* ============================================================
   v2.67.0 · Centros: buscador en la ficha del médico, «Estoy aquí»
   que rellena los datos solo, centro nuevo con horario de apertura
   ============================================================ */

const DIAS_SEM = [['L', 'Lunes'], ['M', 'Martes'], ['X', 'Miércoles'], ['J', 'Jueves'], ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo']];
const hoyLetra = () => 'DLMXJVS'[new Date().getDay()];
function txtHorario(h) {
  h = h || {}; const ks = DIAS_SEM.filter(([k]) => h[k]); if (!ks.length) return '';
  // Días seguidos con el mismo horario se agrupan: «L–V 8:00-20:00 · S 9:00-14:00 · D Cerrado»
  const g = []; ks.forEach(([k]) => { const u = g[g.length - 1]; if (u && u.v === h[k] && 'LMXJVSD'.indexOf(k) === 'LMXJVSD'.indexOf(u.fin) + 1) u.fin = k; else g.push({ ini: k, fin: k, v: h[k] }); });
  return g.map(x => (x.ini === x.fin ? x.ini : x.ini + '–' + x.fin) + ' ' + x.v).join(' · ');
}
const cpCampo = (box, i, f) => box.querySelector(`[data-cf="${i}|${f}"]`);
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
function tarjetaCentro(c, enlazado) {
  const hor = c.horario && Object.keys(c.horario).length ? c.horario : null;
  const hoy = hor && hor[hoyLetra()];
  return `<div class="cpcard"><div class="cpcab"><b>${esc(c.nombre || 'Sin nombre')}</b>
      ${enlazado ? '' : '<span class="pill p-warn" title="' + TT('consulta', 's', 'este', 'C', 'l') + ' aún no está enlazada con un centro de la base">Sin enlazar</span>'}</div>
    <span class="sm">${esc([c.direccion, [c.cp, c.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || 'Sin dirección')}</span>
    ${c.telefono ? `<span class="sm">☎ <a href="tel:${esc(c.telefono)}">${esc(c.telefono)}</a></span>` : ''}
    ${hor ? `<span class="sm">🕘 ${hoy ? `<b>Hoy ${esc(hoy)}</b> · ` : ''}${esc(txtHorario(hor))}</span>` : enlazado ? '<span class="sm" style="color:var(--muted)">Sin horario de apertura</span>' : ''}
    ${c.lat ? '' : '<span class="sm" style="color:var(--warn)">Sin ubicación: no saldrá en rutas ni en el mapa</span>'}
    <div class="acts" style="margin:8px 0 0;flex-wrap:wrap">
      ${c.lat ? `<button type="button" class="btn sec" data-nav="${navAttr([+c.lat, +c.lon])}">Cómo llegar</button>` : ''}
      ${enlazado ? '<button type="button" class="btn sec" data-cpeditar>Editar centro</button>' : '<button type="button" class="btn" data-cpenlazar>Enlazar con un centro</button>'}
      <button type="button" class="btn sec" data-cpcambiar>Cambiar</button></div></div>`;
}
function listaCentros(res, lista, elegir, extra, alExtra) {
  res.innerHTML = lista.map((c, k) => `<button type="button" class="cpitem" data-k="${k}"><b>${esc(c.nombre)}</b>
      <span class="sm">${esc([c.direccion, c.municipio].filter(Boolean).join(' · '))}${c.metros != null ? ` · a ${c.metros < 1000 ? c.metros + ' m' : (c.metros / 1000).toFixed(1) + ' km'}` : ''}${c.medicos ? ` · ${c.medicos} ${c.medicos === 1 ? 'médico' : 'médicos'}` : ''}</span></button>`).join('')
    + (lista.length ? '' : '<div class="sm" style="padding:8px 2px">No hay ningún centro con ese nombre.</div>') + (extra || '');
  res.querySelectorAll('[data-k]').forEach(b => b.onclick = () => elegir(lista[+b.dataset.k]));
  const x = res.querySelector('.cpnuevo'); if (x && alExtra) x.onclick = alExtra;
}
// «Estoy aquí»: primero los centros que ya tenemos a menos de 250 m; si no, centro nuevo con los datos del mapa
async function estoyAqui(box, i, b) {
  if (!navigator.geolocation) { toast('Este dispositivo no da la ubicación', true); return; }
  const txt = b.textContent; b.disabled = true; b.textContent = 'Localizando…';
  try {
    const pos = await new Promise((ok, ko) => navigator.geolocation.getCurrentPosition(ok, ko, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }));
    const lat = +pos.coords.latitude.toFixed(6), lon = +pos.coords.longitude.toFixed(6);
    const { data } = await RPC_ORIG('buscar_centros', { p_q: null, p_lat: lat, p_lon: lon, p_radio: 250, p_lim: 6 });
    const cerca = data || [];
    const res = box.querySelector(`[data-cp="${i}"] .cpres`);
    if (cerca.length && res) {
      res.innerHTML = '<div class="sm cpaviso">¿Estás en uno de estos centros?</div>';
      const cont = document.createElement('div'); res.appendChild(cont);
      listaCentros(cont, cerca, cen => { cpPoner(box, i, cen); pintarCentroSel(box, i); toast('Centro elegido: ' + cen.nombre); },
        '<button type="button" class="cpitem cpnuevo">No, es otro centro: crearlo con mi ubicación</button>', () => centroDesdeUbicacion(box, i, lat, lon));
    } else await centroDesdeUbicacion(box, i, lat, lon);
  } catch (err) { toast('No se ha podido obtener tu ubicación: revisa el permiso de ubicación del navegador', true); }
  finally { b.disabled = false; b.textContent = txt; }
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
// Formulario de centro (nuevo o corregir): los mismos datos de siempre, con horario de apertura
function formCentro(box, i, c, aviso) {
  const cont = box.querySelector(`[data-cp="${i}"]`); if (!cont) return;
  c = c || {}; const hor = c.horario || {}, k = 'cf' + i + '_';
  if (c.privada) { pintarCentroSel(box, i); return; }
  cont.innerHTML = `<div class="cpform">
    <div class="cpformcab"><b>${c.id ? 'Editar centro' : 'Centro nuevo'}</b>${aviso ? `<span class="sm cpaviso">${esc(aviso)}</span>` : ''}</div>
    <div class="g2"><div><label for="${k}n">Nombre del centro</label><input id="${k}n" value="${esc(c.nombre || '')}" placeholder="p. ej. Centro Sagrada Família"></div>
      <div><label for="${k}t">Teléfono</label><input id="${k}t" value="${esc(c.telefono || '')}" inputmode="tel"></div></div>
    <div class="g2"><div><label for="${k}d">Dirección</label><input id="${k}d" value="${esc(c.direccion || '')}"></div>
      <div><label for="${k}c">Código postal</label><input id="${k}c" value="${esc(c.cp || '')}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="${k}m">Población</label><input id="${k}m" value="${esc(c.municipio || '')}"></div>
      <div><label for="${k}p">Provincia</label><input id="${k}p" value="${esc(c.provincia || '')}"></div></div>
    <div class="cpubi sm">${c.lat ? '<b style="color:var(--ok)">✓ Ubicado</b>' : 'Sin ubicación todavía'} <button type="button" class="lnk" data-cpgeo>🔎 Buscar la dirección en el mapa</button></div>
    <label>Horario de apertura</label>
    <div class="cphor">${DIAS_SEM.map(([d, n]) => `<div><span>${n}</span><input data-hd="${d}" value="${esc(hor[d] || '')}" placeholder="${d === 'D' ? 'Cerrado' : '8:00-20:00'}"></div>`).join('')}</div>
    <button type="button" class="lnk" data-cpcopiar>Copiar el horario del lunes al resto de días laborables</button>
    <div class="acts" style="justify-content:flex-end;margin:10px 0 0"><button type="button" class="btn sec" data-cpcancel>Cancelar</button><button type="button" class="btn" data-cpguardar>${c.id ? 'Guardar cambios' : 'Crear centro'}</button></div></div>`;
  let lat = c.lat != null && c.lat !== '' ? +c.lat : null, lon = c.lon != null && c.lon !== '' ? +c.lon : null;
  const val = x => $(k + x).value.trim();
  cont.querySelector('[data-cpcopiar]').onclick = () => { const l = cont.querySelector('[data-hd="L"]').value; ['M', 'X', 'J', 'V'].forEach(d => { cont.querySelector(`[data-hd="${d}"]`).value = l; }); };
  cont.querySelector('[data-cpgeo]').onclick = async e => {
    const q = [val('d'), val('c'), val('m'), val('p'), 'España'].filter(Boolean).join(', ');
    if (!val('d') && !val('m')) { toast('Escribe la dirección o la población', true); return; }
    e.target.textContent = 'Buscando…';
    const r = await geocodificar(q, { direccion: val('d'), municipio: val('m'), cp: val('c') }).catch(() => null);
    e.target.textContent = '🔎 Buscar la dirección en el mapa';
    if (!r) { toast('No se ha encontrado esa dirección. Prueba con calle, número y población.', true); return; }
    if (r.fuera) { toast(`Esa dirección sale en ${r.fuera}, no en ${val('m')}: revísala`, true); return; }
    lat = +r.lat; lon = +r.lon;
    const a = r.address || {};
    if (!val('c') && a.postcode) $(k + 'c').value = a.postcode;
    if (!val('m')) $(k + 'm').value = (a.city || a.town || a.village || a.municipality || '').toUpperCase();
    if (!val('p')) $(k + 'p').value = (a.province || a.state_district || a.county || '').toUpperCase();
    cont.querySelector('.cpubi').firstChild.replaceWith(Object.assign(document.createElement('b'), { style: 'color:var(--ok)', textContent: '✓ Ubicado ' }));
  };
  cont.querySelector('[data-cpcancel]').onclick = () => pintarCentroSel(box, i, c.id ? undefined : 'buscar');
  cont.querySelector('[data-cpguardar]').onclick = async ev => {
    if (!val('n')) { toast('Escribe el nombre del centro', true); $(k + 'n').focus(); return; }
    const horario = {}; cont.querySelectorAll('[data-hd]').forEach(x => { if (x.value.trim()) horario[x.dataset.hd] = x.value.trim(); });
    ev.target.disabled = true;
    const { data, error } = await RPC_ORIG('guardar_centro', { p: { id: c.id || null, nombre: val('n'), telefono: val('t'), direccion: val('d'), cp: val('c'), municipio: val('m'), provincia: val('p'), lat, lon, horario } });
    ev.target.disabled = false;
    if (error || !data || !data.ok) { toast('No se ha podido guardar el centro' + (data && data.error ? ': ' + (data.error === 'permiso' ? 'no tienes permiso' : data.error) : ''), true); return; }
    cpPoner(box, i, data.centro); pintarCentroSel(box, i);
    toast(c.id ? 'Centro actualizado' : 'Centro creado y elegido');
  };
  $(k + 'n').focus();
}
// Cada consulta del editor de la ficha pinta su selector al aparecer
new MutationObserver(() => {
  const cons = $('econs'); if (!cons) return;
  [...cons.children].forEach(box => {
    const i = box.dataset.cons, cp = box.querySelector(`[data-cp="${i}"]`);
    if (cp && !cp.dataset.listo) { cp.dataset.listo = '1'; pintarCentroSel(box, i); }
  });
}).observe(document.body, { childList: true, subtree: true });

// Médico «sin reporting»: la ventana de visita no ofrece los resultados de reporting
abrirVisita = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    const { data } = await db.from('cuentas').select('sin_reporting').eq('id', id).maybeSingle();
    const d = $('dlg');
    if (data && data.sin_reporting && d && d.open) {
      let n = 0;
      d.querySelectorAll('.chips button, [data-res], .chip').forEach(b => { if (/reporting/i.test(b.textContent)) { b.style.display = 'none'; n++; } });
      if (n && !d.querySelector('.srnota')) {
        const ch = d.querySelector('.chips, [data-res]'); const cont = ch && (ch.classList.contains('chips') ? ch : ch.parentElement);
        if (cont) cont.insertAdjacentHTML('afterend', `<p class="sm srnota">${TT('medico', 's', 'este', 'C', 'l')} no quiere reporting: solo ${TT('visita', 's', '', 'l', 'l')} presencial.</p>`);
      }
    }
  } catch (e) { /* si no se puede comprobar, la ventana queda como siempre */ }
  return r;
})(abrirVisita);


