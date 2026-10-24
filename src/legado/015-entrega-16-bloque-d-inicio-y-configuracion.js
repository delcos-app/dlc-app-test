/* ============================================================
   DLC OS 2.0 · Entrega 16 · Bloque D: Inicio y configuración
   ============================================================ */

/* ---------------- recomendaciones y pendientes en Inicio ---------------- */

async function tarjetasRuta() {
  const cr = $('c-recom'), cp = $('c-pend');
  if (!cr) return;
  const { data } = await db.rpc('propuestas_rutas', { lim: 40 });
  if (!data) { cr.innerHTML = ''; return; }
  PROPUESTAS = data;
  const dn = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes' }[data.dia] || 'hoy';
  const bloques = [
    ['hoy', '📅', `Atienden ${dn}`],
    ['urgentes', '❗', 'Urgentes sin visitar'],
    ['interesados', '🔥', `${TT('medico', 'p', '', 'l', 'C', 'interesado')} sin ${TT('visita', 's', '', 'l', 'l')} en 20 días`],
    ['sin_visitar', '🆕', 'Sin visitar nunca']
  ].filter(([k]) => (data[k] || []).length);

  cr.innerHTML = bloques.length ? `<h2>Rutas sugeridas</h2>
    <p class="sm">Calculadas con tus datos de hoy. Al pulsar, se planifica la ruta.</p>
    <div class="lista">${bloques.map(([k, ic, t]) => `<button class="item" data-recruta="${k}">
      <span class="ic">${ic}</span><span class="tx"><b>${t}</b>
        <span class="sm">${num(data[k].length)} ${TT('medico', 'p', '', 'l', 'l')} con ubicación</span></span>
      <span class="rn">${num(data[k].length)}</span></button>`).join('')}</div>
    <button class="verlo" data-ir-rutas>Ver todas las rutas</button>` : '';

  cr.querySelectorAll('[data-recruta]').forEach(b => b.onclick = async e => {
    const k = b.dataset.recruta;
    ir('rutas');
    await new Promise(r => setTimeout(r, 60));   // esperamos a que exista la pantalla de rutas
    planDesdeLista(PROPUESTAS[k], k, e.currentTarget);
  });
  if (cr.querySelector('[data-ir-rutas]')) cr.querySelector('[data-ir-rutas]').onclick = () => ir('rutas');

  const pend = data.pendientes || [];
  if (cp) cp.innerHTML = pend.length ? `<h2><span style="color:var(--warn)">Pendientes de rutas anteriores</span>
      <span class="n">${pend.length}</span></h2>
    <p class="sm">Los planificaste y no se visitaron.</p>
    <div class="lista">${pend.slice(0, 5).map(m => `<button class="item" data-id="${m.id}">
      <span class="ic w">!</span><span class="tx"><b>${esc(m.nombre)}</b>
        <span class="sm">${esc(m.especialidad || '')} · ${esc(m.centro_nombre || m.municipio || '')}</span></span></button>`).join('')}</div>
    <button class="verlo" data-ir-agenda>Ver los ${pend.length} en Agenda</button>` : '';
  if (cp && cp.querySelector('[data-ir-agenda]')) cp.querySelector('[data-ir-agenda]').onclick = () => ir('agenda');
}




