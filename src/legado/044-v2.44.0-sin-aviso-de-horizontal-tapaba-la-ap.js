/* ============================================================
   v2.44.0 · Sin aviso de horizontal (tapaba la app al abrir el
   teclado), idioma que se guarda de verdad, Configuración en el
   móvil por pasos (lista → apartado), contenido que no se sale de
   la pantalla y ubicación de centros y consultas con un toque
   ============================================================ */

/* ---------------- horizontal: no se muestra ningún aviso ---------------- */


/* ---------------- idioma ---------------- */

// El idioma se guarda en el perfil y se aplica al recargar, para que todo salga ya traducido
// Al entrar se usa el idioma del perfil; como mucho una recarga por sesión, para no quedar en bucle

/* ---------------- Configuración en el móvil: primero la lista, después el apartado ---------------- */

document.addEventListener('click', e => {
  // Solo el «Volver» de Configuración en el móvil (otros botones comparten el estilo)
  const v = e.target.closest('.cfghub .cfgvolver'); if (v) { const hub = v.closest('.cfghub'); if (hub) hub.classList.remove('detalle'); scrollTo({ top: 0 }); return; }
  const b = e.target.closest('.cfghub.movil [data-cfg]');
  if (b) { const hub = b.closest('.cfghub'); hub.classList.add('detalle'); scrollTo({ top: 0 });
    setTimeout(() => { cfgMovil(); const t = $('cfgcuerpo') && $('cfgcuerpo').querySelector('.cfgvolver'); if (t) t.dataset.titulo = b.querySelector('b').textContent; }, 50); }
}, true);
// Cada vez que el apartado se repinta, se mantiene el botón de volver
new MutationObserver(() => { if (TAB === 'config' && ES_MOVIL() && $('cfgcuerpo') && !$('cfgcuerpo').querySelector(':scope > .cfgvolver')) cfgMovil(); })
  .observe(document.querySelector('main'), { childList: true, subtree: true });
window.addEventListener('resize', () => { if (TAB === 'config') cfgMovil(); });
// «Elegir qué notificaciones recibo» abre ese apartado directamente

/* ---------------- ubicación de centros y consultas ---------------- */

function rellenarDireccion(box, i, a) {
  if (!a) return;
  const set = (f, v) => { const el = box.querySelector(`[data-cf="${i}|${f}"]`); if (el && v && !el.value.trim()) el.value = v; };
  set('direccion', [a.road, a.house_number].filter(Boolean).join(', '));
  set('municipio', (a.city || a.town || a.village || a.municipality || '').toUpperCase());
  set('cp', a.postcode || ''); set('provincia', (a.province || a.state_district || a.county || a.state || '').toUpperCase());
}
// Botones en cada consulta del editor de la ficha
new MutationObserver(() => {
  const cons = $('econs'); if (!cons) return;
  [...cons.children].forEach(box => {
    if (box.querySelector('.cubica')) return;
    const i = box.dataset.cons, dir = box.querySelector(`[data-cf="${i}|direccion"]`); if (!dir) return;
    const g = dir.closest('.g2'); if (!g) return;
    g.insertAdjacentHTML('afterend', `<div class="cubica"><div class="cubest sm">${box.dataset.lat ? '<b style="color:var(--ok)">✓ Ubicado</b>' : 'Sin ubicación: no saldrá en rutas ni en el mapa'}</div>
      <div class="acts" style="margin:6px 0 0"><button type="button" class="btn sec chico" data-cbus="${i}">🔎 Buscar la dirección</button><button type="button" class="btn sec chico" data-cgeo="${i}">📍 Estoy aquí</button></div></div>`);
    const prov = box.querySelector(`[data-cf="${i}|provincia"]`);
    if (prov && prov.value === 'BARCELONA' && !box.querySelector(`[data-cid="${i}"]`).value) prov.value = '';
  });
}).observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', async e => {
  const bus = e.target.closest('[data-cbus]'), geo = e.target.closest('[data-cgeo]');
  if (!bus && !geo) return;
  const i = (bus || geo).dataset.cbus || (bus || geo).dataset.cgeo, box = (bus || geo).closest('[data-cons]');
  const v = f => ((box.querySelector(`[data-cf="${i}|${f}"]`) || {}).value || '').trim();
  const b = bus || geo, txt = b.textContent; b.disabled = true; b.textContent = bus ? 'Buscando…' : 'Localizando…';
  try {
    if (bus) {
      const q = [v('direccion'), v('cp'), v('municipio'), v('provincia'), 'España'].filter(Boolean).join(', ');
      if (!v('direccion') && !v('municipio')) { toast('Escribe la dirección o el municipio', true); return; }
      const r = await geocodificar(q, { direccion: v('direccion'), municipio: v('municipio'), cp: v('cp') });
      if (!r) { toast('No se ha encontrado esa dirección. Prueba con calle, número y municipio.', true); return; }
      if (r.fuera) { toast(`Esa dirección sale en ${r.fuera}, no en ${v('municipio')}: revísala (no se ha guardado el punto)`, true); return; }
      rellenarDireccion(box, i, r.address); marcarUbicado(box, i, +r.lat, +r.lon, r.display_name.split(',').slice(0, 3).join(','));
      toast('Ubicado');
    } else {
      if (!navigator.geolocation) { toast('Este dispositivo no da la ubicación', true); return; }
      const pos = await new Promise((ok, ko) => navigator.geolocation.getCurrentPosition(ok, ko, { enableHighAccuracy: true, timeout: 12000 }));
      const lat = +pos.coords.latitude.toFixed(6), lon = +pos.coords.longitude.toFixed(6);
      const inv = await geoInversa(lat, lon);
      rellenarDireccion(box, i, inv && inv.address);
      marcarUbicado(box, i, lat, lon, inv ? inv.display_name.split(',').slice(0, 3).join(',') : `${lat}, ${lon}`);
      toast('Ubicado donde estás');
    }
  } catch (err) { toast(geo ? 'No se ha podido obtener tu ubicación: revisa el permiso de ubicación' : 'No se ha podido buscar', true); }
  finally { b.disabled = false; b.textContent = txt; }
}, true);


