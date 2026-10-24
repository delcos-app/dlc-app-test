/* ============================================================
   DLC OS 2.0 · Entrega 7: mapa, móvil y avisos de versión
   ============================================================ */

let MAPA = null, CAPA = null, MODO_MAPA = false, CAPA_RUTA = null;

/* ---------------- barra inferior en móvil ---------------- */

$('bnav').addEventListener('click', e => {
  const b = e.target.closest('[data-t]');
  if (b) ir(b.dataset.t);
});


/* ---------------- mapa ---------------- */

$('mapaBtn').addEventListener('click', () => {
  MODO_MAPA = !MODO_MAPA;
  $('mapaBtn').textContent = MODO_MAPA ? 'Ver lista' : 'Ver mapa';
  $('mapawrap').classList.toggle('hide', !MODO_MAPA);
  $('lista').classList.toggle('hide', MODO_MAPA);
  $('dirpag').classList.toggle('hide', MODO_MAPA);
  if (MODO_MAPA) pintarMapa();
});



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

/* ---------------- el plan del día, dibujado ---------------- */

function mapaDelPlan() {
  if (!PLAN || !window.L) return;
  const caja = $('planmapa');
  if (!caja) return;
  if (!caja.dataset.on) {
    caja.dataset.on = '1'; caja.style.height = 'min(55vh,460px)';
    const conSal = PLAN.salida.lat != null, centro = conSal ? [PLAN.salida.lat, PLAN.salida.lon] : PLAN.paradas[0].xy;
    const m = L.map('planmapa').setView(centro, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    const pin = (xy, txt, col) => L.marker(xy, { icon: L.divIcon({ className: 'mpin', html: `<span style="background:${col}">${txt}</span>`, iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(m);
    if (conSal) pin([PLAN.salida.lat, PLAN.salida.lon], 'S', '#0E6B4C').bindPopup('Salida · ' + esc(PLAN.salida.nombre));
    PLAN.paradas.forEach((p, i) => pin(p.xy, String(i + 1), '#17457A')
      .bindPopup(`<b>${i + 1}. ${esc(p.centro)}</b><br>${hm(p.llegada)}–${hm(p.fin)}<br>${p.medicos.map(x => esc(x.nombre)).join('<br>')}`));
    const linea = conSal ? [[PLAN.salida.lat, PLAN.salida.lon]].concat(PLAN.paradas.map(p => p.xy), [[PLAN.salida.lat, PLAN.salida.lon]]) : PLAN.paradas.map(p => p.xy);
    L.polyline(linea, { color: '#17457A', weight: 3, dashArray: '6 6' }).addTo(m);
    m.fitBounds(linea, { padding: [30, 30] });
    setTimeout(() => m.invalidateSize(), 60);
  }
}

/* ---------------- aviso de versión nueva ---------------- */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (!reg) return;
    reg.addEventListener('updatefound', () => {
      const nuevo = reg.installing;
      if (!nuevo) return;
      nuevo.addEventListener('statechange', () => {
        if (nuevo.state === 'installed' && navigator.serviceWorker.controller) $('nuevaver').classList.remove('hide');
      });
    });
    setInterval(() => reg.update().catch(() => {}), 15 * 60 * 1000);
  });
  $('actualizar').onclick = () => location.reload(true);
}



