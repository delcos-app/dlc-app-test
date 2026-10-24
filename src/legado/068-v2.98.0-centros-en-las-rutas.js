/* ============================================================
   v2.98.0 · Centros en las rutas
   En el editor de rutas, «Añadir un centro» añade todos sus médicos (se quitan
   los que no se van a ver). La ruta guarda sus centros y cada médico se
   planifica en ese centro aunque atienda también en otros.
   ============================================================ */
function rutaCentrosHTML(centros, medicos) {
  const chip = m => `<span class="chip">${esc(m.nombre)}
    <button type="button" data-rq="${m.id}" aria-label="Quitar ${esc(m.nombre)}" style="border:0;background:none;color:var(--dang);cursor:pointer;font-weight:700">✕</button></span>`;
  if (!medicos.length) return `<div class="chips"><span class="sm">Todavía no has añadido ${TT('medico', 'p', '', 'l', 'l')}.</span></div>`;
  const grupos = centros.map(c => {
    const ms = medicos.filter(m => m.centro_ruta === c.id);
    return `<div class="rcentro"><div class="rcentrocab"><span class="rcentronom">${svgIco(ICON_NOM['building-2'])}<b>${esc(c.nombre)}</b>
        <span class="sm">${esc(c.municipio || '')}${c.municipio ? ' · ' : ''}${num(ms.length)} ${TT('medico', ms.length === 1 ? 's' : 'p', '', 'l', 'l')}</span></span>
      <button type="button" class="lnk" data-rqc="${c.id}">Quitar el centro</button></div>
      <div class="chips">${ms.map(chip).join('')}</div></div>`;
  }).join('');
  const sueltos = medicos.filter(m => !centros.some(c => c.id === m.centro_ruta));
  return grupos + (sueltos.length ? `${centros.length ? `<div class="sm rcentrootros">Otros ${TT('medico', 'p', '', 'l', 'l')}</div>` : ''}<div class="chips">${sueltos.map(chip).join('')}</div>` : '');
}
if (AYUDA.rutas) AYUDA.rutas[2].push(`Con <b>Añadir un centro</b> entran todos sus ${TT('medico', 'p', '', 'l', 'l')}: quita los que no vayas a ver. En el plan, los de un mismo centro forman una sola parada y se les planifica en ese centro aunque atiendan en otros.`);


