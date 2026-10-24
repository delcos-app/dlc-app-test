/* ============================================================
   v2.67.0 · Centros: buscador en la ficha del médico, «Estoy aquí»
   que rellena los datos solo, centro nuevo con horario de apertura
   ============================================================ */

const DIAS_SEM = [['L', 'Lunes'], ['M', 'Martes'], ['X', 'Miércoles'], ['J', 'Jueves'], ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo']];
const hoyLetra = () => 'DLMXJVS'[new Date().getDay()];
const cpCampo = (box, i, f) => box.querySelector(`[data-cf="${i}|${f}"]`);
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


