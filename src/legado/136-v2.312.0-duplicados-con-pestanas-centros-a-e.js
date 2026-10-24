/* ============================================================
   v2.312.0 · Duplicados con pestañas, centros a elegir y centros que se unifican con sus profesionales (peticiones de Eric).
   · Pestañas «Profesionales» y «Centros» (el mismo funcionamiento; las parejas siempre son del mismo tipo).
   · Al comparar dos profesionales, además de los datos, sus centros (consultas): se conservan los marcados, también los dos.
   · Al comparar dos centros: con qué dirección se queda y, al unificar, los profesionales de los dos pasan al que queda
     (los enlazados y los que solo tenían el nombre del centro); si alguno queda dos veces en el mismo centro, se deja una.
   Sin SQL: unificar_cuentas ya junta todo lo que cuelga de la ficha (consultas, visitas, citas, cartera…).
   ============================================================ */
let DUP_TIPO = {}, DUP_PEST = 'Persona';
function pintarListasDup() {
  if (!$('dpendc')) return;
  const p0 = DUP_PEND, q0 = DUP_PARES;
  const cuenta = t => p0.filter(x => dupTipoDe(x.id) === t).length + q0.filter(p => dupTipoDe(p.a_id) === t).length;
  DUP_PEND = p0.filter(x => dupTipoDe(x.id) === DUP_PEST); DUP_PARES = q0.filter(p => dupTipoDe(p.a_id) === DUP_PEST);
  try { pintarListasDupBase(); } finally { DUP_PEND = p0; DUP_PARES = q0; }
  const grid = document.querySelector('#v-duplicados .dupgrid');
  if (grid && !$('duppest')) grid.insertAdjacentHTML('beforebegin', '<div class="segs duppest" id="duppest" role="group" aria-label="Tipo de ficha"></div>');
  if ($('duppest')) $('duppest').innerHTML = [['Persona', TT('medico', 'p', '', 'l', 'C')], ['Centro', 'Centros']].map(([k, t]) =>
    `<button type="button" data-dpest="${k}" class="${DUP_PEST === k ? 'on' : ''}" aria-pressed="${DUP_PEST === k}">${esc(t)} <span class="n">${num(cuenta(k))}</span></button>`).join('');
}
document.addEventListener('click', e => {
  const b = e.target.closest('#duppest [data-dpest]'); if (!b) return;
  DUP_PEST = b.dataset.dpest; DUP_ACTUAL = null; pintarListasDup(); panelDupVacio('');
});

// Comparar: los centros (consultas) a conservar y, si son centros, su dirección y sus profesionales
async function compararEn(el, idA, idB) {
  await compararEnBase.call(this, el, idA, idB);
  const btn = el.querySelector('#duniok'); if (!btn) return;
  const [{ data: A }, { data: B }, { data: tip }] = await Promise.all([db.rpc('ficha_cuenta', { p_id: idA }), db.rpc('ficha_cuenta', { p_id: idB }),
    db.from('cuentas').select('id, tipo, centro_id, nombre').in('id', [idA, idB])]);
  if (!A || !B || !el.querySelector('#duniok')) return;
  const t = {}; (tip || []).forEach(x => { t[x.id] = x; });
  const esCentro = (t[idA] || {}).tipo === 'Centro' && (t[idB] || {}).tipo === 'Centro';
  const cons = [...(A.consultas || []).map(c => ({ ...c, de: A.medico.nombre })), ...(B.consultas || []).map(c => ({ ...c, de: B.medico.nombre }))].filter(c => c.id);
  const txt = c => [c.centro_nombre, c.direccion, c.municipio].filter(Boolean).join(' · ') || 'Sin dirección';
  let html = '';
  if (esCentro) {
    const [fa, fb] = await Promise.all([(t[idA] || {}).centro_id ? db.rpc('ficha_centro', { p_id: t[idA].centro_id }) : { data: null }, (t[idB] || {}).centro_id ? db.rpc('ficha_centro', { p_id: t[idB].centro_id }) : { data: null }]);
    const pa = ((fa.data || {}).profesionales || []).length, pb = ((fb.data || {}).profesionales || []).length;
    html = `<div class="dupcons"><h3>Dirección del centro</h3><p class="sm">Se conserva la marcada.</p>
      ${cons.map((c, i) => `<label class="opt"><input type="radio" name="dupdir" value="${c.id}" ${i === 0 ? 'checked' : ''}> <span>${esc(txt(c))} <span class="sm">· de ${esc(c.de)}</span></span></label>`).join('') || '<p class="sm">Ninguno de los dos tiene dirección.</p>'}
      <h3>${esc(TT('medico', 'p', '', 'l', 'C'))}</h3><p class="sm">Los de los dos centros (${num(pa)} + ${num(pb)}) pasan al que se conserva. Si alguno estaba en los dos, queda una sola vez.</p></div>`;
  } else if (cons.length) {
    html = `<div class="dupcons"><h3>Centros y ${TT('consulta', 'p', '', 'l', 'l')}</h3><p class="sm">Se conservan los marcados en la ficha que queda: puedes quedarte con los dos.</p>
      ${cons.map(c => `<label class="opt"><input type="checkbox" data-dupcons="${c.id}" checked> <span>${esc(txt(c))} <span class="sm">· de ${esc(c.de)}</span></span></label>`).join('')}</div>`;
  }
  // Lo marcado se recuerda: el panel se vuelve a pintar al elegir qué ficha queda o qué dato se conserva
  const quita = new Set(); let dir = cons[0] && cons[0].id;
  const poner = () => {
    const b2 = el.querySelector('#duniok'); if (!b2 || !html || el.querySelector('.dupcons')) return;
    b2.closest('.acts').insertAdjacentHTML('beforebegin', html);
    el.querySelectorAll('[data-dupcons]').forEach(x => { x.checked = !quita.has(x.dataset.dupcons); x.onchange = () => { if (x.checked) quita.delete(x.dataset.dupcons); else quita.add(x.dataset.dupcons); }; });
    el.querySelectorAll('input[name=dupdir]').forEach(x => { x.checked = x.value === dir; x.onchange = () => { if (x.checked) dir = x.value; }; });
  };
  poner();
  if (el.__dupObs) el.__dupObs.disconnect();
  el.__dupObs = new MutationObserver(poner); el.__dupObs.observe(el, { childList: true });
  // Al pulsar «Unificar» (antes de preguntar): qué consultas se quitan después
  if (el.__dupClic) el.removeEventListener('click', el.__dupClic, true);
  el.__dupClic = ev => {
    if (!ev.target.closest('#duniok')) return;
    const q = esCentro ? cons.filter(c => c.id !== dir).map(c => c.id) : [...quita];
    if (!esCentro && cons.length && q.length === cons.length) { ev.stopImmediatePropagation(); ev.preventDefault(); toast(`Deja marcado al menos un centro o ${TT('consulta', 's', '', 'l', 'l')}`, true); return; }
    DUP_TRAS = { quitar: q, esCentro, a: t[idA] || {}, b: t[idB] || {} };
  };
  el.addEventListener('click', el.__dupClic, true);
}
db.rpc = (orig => function (fn, args, ...r) {
  const res = orig.call(this, fn, args, ...r);
  if (fn !== 'unificar_cuentas' || !DUP_TRAS || !res || typeof res.then !== 'function') return res;
  const tras = DUP_TRAS; DUP_TRAS = null;
  return res.then(async x => {
    if (!x || x.error || (x.data && x.data.ok === false)) return x;
    try {
      if (tras.quitar.length) await db.from('ubicaciones').delete().in('id', tras.quitar);
      if (tras.esCentro) await db.from('ubicaciones').update({ principal: true }).eq('cuenta_id', args.p.queda);   // la dirección que queda pasa también al centro-lugar
      if (tras.esCentro) await dupJuntarCentros(args.p.queda === tras.a.id ? tras.a : tras.b, args.p.queda === tras.a.id ? tras.b : tras.a);
    } catch (e) { toast('Unificadas, pero no se ha podido terminar de ordenar los centros: ' + e.message, true); }
    return x;
  });
})(db.rpc);


