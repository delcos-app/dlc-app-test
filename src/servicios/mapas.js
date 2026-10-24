// servicios/mapas.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function pintarMapa() {
  if (!window.L) { $('mapleg').textContent = 'El mapa necesita conexión.'; return; }
  $('mapleg').textContent = 'Cargando puntos…';

  const { data, error } = await db.rpc('mapa_cuentas', {
    q: F.q || null, f_provincia: F.prov || null, f_municipio: F.muni || null,
    f_estado: F.est || null, f_especialidad: F.esp || null, f_urgentes: !!F.urg
  });
  if (error) { $('mapleg').textContent = 'No se ha podido cargar el mapa: ' + error.message; return; }

  if (!MAPA) {
    MAPA = L.map('mapa', { preferCanvas: true }).setView([41.6, 1.9], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(MAPA);
  }
  if (CAPA) CAPA.remove();
  CAPA = L.layerGroup().addTo(MAPA);

  const puntos = data || [];
  puntos.forEach(m => {
    const col = m.urgente && !m.ultima_visita ? '#B42318' : (colEstado(m.estado) || '#6B7F95');
    L.circleMarker([m.lat, m.lon], {
      radius: m.urgente ? 7 : 5, color: '#fff', weight: 1.5, fillColor: col, fillOpacity: .92
    }).addTo(CAPA).bindPopup(
      `<b>${esc(m.nombre)}</b><br>${esc(m.especialidad || '')}<br>${esc(m.centro || '')} ${esc(m.municipio || '')}<br>
       <span style="color:${col};font-weight:700">${esc(m.estado)}</span><br>
       <a href="#" onclick="abrirFicha('${m.id}');return false">Abrir ficha</a>`);
  });

  if (puntos.length) MAPA.fitBounds(puntos.map(m => [m.lat, m.lon]), { padding: [30, 30] });
  setTimeout(() => MAPA.invalidateSize(), 60);

  $('mapleg').innerHTML =
    `<span><i style="background:#B42318"></i>Urgente sin visitar</span>` +
    ESTADOS_DEF.map(x => `<span><i style="background:${colEstado(x.valor) || '#6B7F95'}"></i>${esc(x.valor)}</span>`).join('') +
    `<span style="margin-left:auto"><b>${num(puntos.length)}</b> con ubicación de ${num(F.total)} encontrados</span>`;
}

function enlaceNav(destino, paradas, n = 'google') {
  const d = Array.isArray(destino) ? destino.join(',') : destino;
  if (n === 'waze') return 'https://waze.com/ul?ll=' + encodeURIComponent(d) + '&navigate=yes';
  if (n === 'apple') return 'https://maps.apple.com/?daddr=' + encodeURIComponent(d) + '&dirflg=d';
  const wp = paradas && paradas.length ? '&waypoints=' + encodeURIComponent(paradas.map(p => p.join(',')).join('|')) : '';
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(d) + '&travelmode=driving' + wp;
}

async function navegarA(destino, paradas) {
  if (!destino) { toast('Esta parada no tiene ubicación', true); return; }
  const varias = paradas && paradas.length;
  const op = await elegirOpcion('¿Con qué app quieres navegar?',
    varias ? 'Google Maps abre la ruta completa con todas las paradas. Waze y Apple Maps solo admiten un destino: abrirán la primera parada.' : '',
    [{ k: 'google', t: 'Google Maps' }, { k: 'waze', t: 'Waze', cls: 'sec' }, { k: 'apple', t: 'Apple Maps', cls: 'sec' }, { k: 'no', t: 'Cancelar', cls: 'sec' }]);
  if (!op || op === 'no') return;
  const dest = op === 'google' ? destino : (varias ? paradas[0] : destino), par = op === 'google' ? paradas : null;
  const web = enlaceNav(dest, par, op);
  const app = (ES_IOS || ES_ANDROID) ? enlaceNavApp(dest, par, op) : null;
  if (!app) { window.open(web, '_blank', 'noopener'); return; }
  // La app de mapas toma el control y delcos pasa a segundo plano; si no está instalada, delcos sigue a la vista y se usa la web
  let fuera = false; const marcar = () => { if (document.visibilityState === 'hidden') fuera = true; };
  document.addEventListener('visibilitychange', marcar);
  location.href = app;
  setTimeout(() => { document.removeEventListener('visibilitychange', marcar); if (!fuera && document.visibilityState === 'visible') { const w = window.open(web, '_blank'); if (!w) location.href = web; } }, 1500);   // sin el clic, el navegador puede bloquear la ventana: entonces se abre aquí mismo
}

// v2.242.0: aquí iba la primera versión de geocodificar (se redefine entera más abajo)
async function geoInversa(lat, lon) {
  try { const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`); return await r.json(); } catch (e) { return null; }
}

function enlaceNavApp(destino, paradas, n) {
  const d = Array.isArray(destino) ? destino.join(',') : String(destino);
  if (n === 'waze') return 'waze://?ll=' + encodeURIComponent(d) + '&navigate=yes';
  if (n === 'apple') return ES_IOS ? 'maps://?daddr=' + encodeURIComponent(d) + '&dirflg=d' : null;
  if (ES_IOS) return 'comgooglemaps://?daddr=' + [...(paradas || []).map(p => p.join(',')), d].map(encodeURIComponent).join('+to:') + '&directionsmode=driving';
  if (ES_ANDROID && !(paradas && paradas.length)) return 'google.navigation:q=' + encodeURIComponent(d) + '&mode=d';
  return null;   // Android con paradas: solo el enlace web admite la ruta entera
}

async function cambiarNavegador(n) {
  const prefs = Object.assign({}, PERFIL.preferencias || {}, { navegador: n });
  const { data } = await db.rpc('guardar_preferencias', { p: prefs });
  PERFIL.preferencias = data || prefs;
  toast('Navegación con ' + (NAVEGADORES.find(x => x[0] === n) || [])[1]);
  if (PLAN) pintarPlan();
}

function rellenarDireccion(box, i, a) {
  if (!a) return;
  const set = (f, v) => { const el = box.querySelector(`[data-cf="${i}|${f}"]`); if (el && v && !el.value.trim()) el.value = v; };
  set('direccion', [a.road, a.house_number].filter(Boolean).join(', '));
  set('municipio', (a.city || a.town || a.village || a.municipality || '').toUpperCase());
  set('cp', a.postcode || ''); set('provincia', (a.province || a.state_district || a.county || a.state || '').toUpperCase());
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

// v2.175.0 (decisión de Eric: autopista a 120 km/h): los primeros 30 km en línea recta a 40 km/h (ciudad) y lo que pase de 30 km a 100 km/h en línea
// recta (la carretera es ~1,2 veces más larga: unos 120 km/h por autopista); antes, todo a 40
const minutosEntre = (a, b) => { if (!a || !b || a[0] == null || b[0] == null) return 0; const d = km(a, b);
  return Math.max(6, Math.round(Math.min(d, 30) / 40 * 60 + Math.max(d - 30, 0) / 100 * 60) + 5); };

const NAVEGADORES = [['google', 'Google Maps'], ['apple', 'Apple Maps'], ['waze', 'Waze']];

const navActual = () => (PERFIL.preferencias || {}).navegador || 'google';

// Cada navegación pregunta con qué app abrirla (Google Maps admite la ruta con todas sus paradas)
const navAttr = (d, p) => esc(JSON.stringify({ d, p: p && p.length ? p : null }));

const selectorNav = () => `<select id="navsel" title="Navegador de mapas" style="max-width:160px">${
  NAVEGADORES.map(([v, t]) => `<option value="${v}" ${navActual() === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;

/* v2.180.0 · Direcciones bien situadas (aviso de Eric: el Dr. Margalet, en Barcelona, salía en Marbella).
   - geocodificar(q, o): busca solo en España y, si se le da el municipio (o.municipio), solo vale un resultado de ese municipio; si el texto libre no
     lo encuentra, prueba con calle, municipio y código postal por separado. Si solo aparece en otro sitio, devuelve ese resultado con `fuera` (el
     municipio donde sale) y quien llama no guarda el punto.
   - «Calidad del dato»: «Direcciones que no cuadran» (SQL 114, ubicaciones_dudosas): consultas a más de 50 km del resto de su municipio, con
     «Volver a situar» (busca de nuevo con el municipio y guarda el punto si cuadra) y «Ficha». */
const normGeo = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

async function rutasMapa(...a) { if (RN) return; const r = await rutasMapaBase.apply(this, a); const m = $('rmapa'), g = $('rngrid'); if (m && g && g.nextElementSibling !== m) { g.after(m); if (RM_MAPA) setTimeout(() => { try { RM_MAPA.resize(); } catch (e) {} }, 50); } return r; }
