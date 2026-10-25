// pantallas/portal.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// ——— Lado de quien lleva la ficha ———

// (v2.183.0: aquí iba la primera versión de elegirPago; se redefine entera más abajo)
async function pagoPortal(boton) { const d = await pagoLlamar({ accion: 'portal' }, boton); if (d && d.url) location.href = d.url; }

function pmTab(k) {
  PM.tab = k;
  document.querySelectorAll('#v-informe [data-pmt]').forEach(b => { b.classList.toggle('on', b.dataset.pmt === k); b.setAttribute('aria-selected', b.dataset.pmt === k); });
  document.querySelectorAll('#v-informe [data-pmp]').forEach(p => p.hidden = p.dataset.pmp !== k);
  window.scrollTo({ top: 0 });
}

function pmEsqueleto(ficha) {
  const c = '<div class="card ancard pmsk"><span class="plsk"></span></div>';
  return ficha ? `<div class="pmfila">${c}${c}</div><div class="pmfila">${c}</div>` : `<div class="pmfila pm3">${c}${c}${c}</div><div class="pmfila pm3">${c}${c}${c}</div>`;
}

// ——— Resumen ———
// v2.293 (SQL 155): «Pautas más utilizadas»: qué parte de las pautas del periodo es de cada formato (1, 2, 2 + 1 de regalo…). Sin personas.
function pmFormatoTxt(f) {
  const m = /^(d+)+(d+)$/.exec(f);
  if (m) return `${m[1]} + ${m[2]} de regalo`;
  if (f === '4+') return '4 o más unidades';
  return f === '1' ? '1 unidad' : f + ' unidades';
}

function pmFormatos(d) {
  const P = TT('pauta', 'p', '', 'l', 'l'), l = d.formatos || [], tot = l.reduce((a, x) => a + (x.n || 0), 0);
  const ayu = pmAyu(P.charAt(0).toUpperCase() + P.slice(1) + ' más utilizadas', `Cómo son las ${P} del periodo elegido arriba a la derecha: qué parte es de 1 unidad, de 2, de 2 + 1 de regalo… Sirve para ver qué formato se utiliza más. Solo porcentajes: no se muestra ningún dato de personas.`);
  return `<div class="card ancard" id="pmformatos"><h2>${P.charAt(0).toUpperCase() + P.slice(1)} más utilizadas ${ayu}</h2>
    ${tot ? barrasH(l.map(x => ({ n: pmFormatoTxt(x.formato), v: Math.round(x.n / tot * 100) })), v => v + ' %') : vacioGrafico(`Cuando haya ${P} en el periodo, verás aquí qué formatos se utilizan más.`)}</div>`;
}

// v2.292: las cifras del periodo en una tarjeta en lista, en la fila de «Métricas» y «Por producto» (antes, 4 indicadores sueltos encima;
// Eric eligió la lista «C»). Cada fila con su «i». Sin «pacientes» (casi ningún pedido lleva su ficha) ni «pautas registradas» (Eric: confunde).
function pmPeriodo(d) {
  const P = TT('pauta', 'p', '', 'l', 'l'), Ps = TT('pauta', 's', '', 'l', 'l');
  const f = [
    [num(d.unidades), 'Unidades', `Total de unidades de producto de las ${P} del periodo elegido arriba a la derecha.`],
    [d.ultima_pauta ? fechaCorta(d.ultima_pauta) : '—', 'Última ' + Ps, `Fecha de la ${Ps} más reciente del periodo.`]];
  return `<div class="card ancard" id="pmperiodo"><h2>Resumen del periodo</h2>
    <div class="pmperl">${f.map(x => `<div><span>${esc(x[1])} ${pmAyu(x[1], x[2])}</span><b>${x[0]}</b></div>`).join('')}</div></div>`;
}

function pmResumen(d, k, pac) {
  const meses = mesesEntre(d.desde, d.hasta), serie = {}; (d.serie || []).forEach(s => serie[s.mes] = s);
  const ll = d.llamadas || {}, conv = ll.total ? Math.round(ll.con_pedido / ll.total * 100) : null;
  const mx = Math.max(1, ...meses.map(m => (serie[m] || {}).unidades || 0));
  const evol = d.unidades ? `<div class="pmleg"><span><i></i>Unidades</span><span><i class="v"></i>${TT('pauta', 'p', '', 'C', 'l')}</span></div>
    <div class="pmev" style="--n:${meses.length}">${meses.map(m => {
      const s = serie[m] || {}, u = s.unidades || 0, n = s.pautas || 0;
      const mes = new Date(m + '-01T12:00').toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
      return `<div class="pmcol" title="${esc(mes)}: ${num(u)} unidades, ${num(n)} ${TT('pauta', 'p', '', 'l', 'l')}"><div class="pmbar"><b>${u ? num(u) : ''}</b><i style="height:${u ? Math.max(3, u / mx * 100) : 0}%"></i></div>
        <span class="pmm">${esc(mes)}</span><span class="pmn">${n ? `<em>${num(n)}</em>` : ''}</span></div>`; }).join('')}</div>`
    : vacioGrafico(`Cuando haya ${TT('pauta', 'p', '', 'l', 'l')} registradas, verás aquí cómo evolucionan.`);
  const cons = !k.ok ? '<p class="sm">No disponible.</p>' : k.pocos
    ? `<p class="sm">En los últimos ${num(k.meses || 12)} meses se han iniciado ${num(k.empezaron)} ${TT('pauta', 'p', '', 'l', 'l')}. A partir de ${num(k.minimo || 5)} verás aquí cifras de continuidad.</p>`
    : `<div class="minis cons"><div><b>${num(k.empezaron)}</b><span>iniciadas</span></div><div><b>${k.empezaron ? Math.round(k.repiten / k.empezaron * 100) + '%' : '—'}</b><span>se repiten</span></div>
        <div><b>${k.dias_entre ? num(k.dias_entre) + ' días' : '—'}</b><span>entre una y otra</span></div><div><b>${num(k.sin_pedir)}</b><span>más de 60 días sin repetirse</span></div></div>`;
  const falta = PM.faltan.length ? `<div class="pmaviso"><div><b>Completa tu ficha</b><span class="sm">Falta ${esc(pmFaltaTxt())}. Así tu comercial pasa a verte cuando mejor te va.</span></div>
      <button type="button" class="btn" data-pmir="ficha">Completar mi ficha</button></div>` : '';
  return `${pmActividad(d)}${falta}
    <div class="pmfila pm3">
      ${pmPeriodo(d)}
      <div class="card ancard"><h2>Métricas de ${TT('pauta', 'p', '', 'l', 'l')} ${pmAyu(`Métricas de ${TT('pauta', 'p', '', 'l', 'l')}`, `Cada barra son las unidades de las ${TT('pauta', 'p', '', 'l', 'l')} registradas en el mes; el número de debajo, cuántas ${TT('pauta', 'p', '', 'l', 'l')} fueron. Cambia el periodo arriba a la derecha.${d.ultima_pauta ? ' Última ' + TT('pauta', 's', '', 'l', 'l') + ': ' + fechaCorta(d.ultima_pauta) + '.' : ''}`)}</h2>${evol}</div>
      <div class="card ancard"><h2>Por producto ${pmAyu('Por producto', `Qué productos aparecen en las ${TT('pauta', 'p', '', 'l', 'l')} registradas en el periodo y qué parte de las unidades es cada uno.`)}</h2>
        ${(d.productos || []).length ? `<div class="pmdon">${svgDonut(d.productos.map(x => ({ n: x.nombre, v: x.unidades })))}</div>` : vacioGrafico('Aparecerá el reparto por producto.')}</div></div>
    <div class="pmfila">
      ${pmFormatos(d)}
      <div class="card ancard" id="pmconst"><h2>Continuidad de las ${TT('pauta', 'p', '', 'l', 'l')} ${pmAyu(`Continuidad de las ${TT('pauta', 'p', '', 'l', 'l')}`, `En los últimos 12 meses: cuántas ${TT('pauta', 'p', '', 'l', 'l')} han empezado, qué parte se ha repetido al menos una vez, cuántos días pasan de media entre una vez y la siguiente, y cuántas llevan más de 60 días sin repetirse.`)}</h2>${cons}</div></div>`;
}

// ——— Mi ficha: datos ———
function pmRangos(txt) {
  const t = String(txt || ''), out = [];
  const re = /(\d{1,2})(?::(\d{2}))?\s*[-–a]\s*(\d{1,2})(?::(\d{2}))?/g; let m;
  while ((m = re.exec(t))) out.push([pmHora(m[1] + ':' + (m[2] || '00')), pmHora(m[3] + ':' + (m[4] || '00'))]);
  if (!out.length && /mañana/i.test(t)) out.push(['09:00', '14:00']);
  if (/tarde/i.test(t) && !out.some(r => r[0] >= '14:00')) out.push(['16:00', '20:00']);
  return out;
}

function pmHora(v) {
  const s = String(v || '').replace(/[^\d:]/g, '');
  let h, m;
  if (s.includes(':')) [h, m] = s.split(':'); else if (s.length <= 2) { h = s; m = '00'; } else { h = s.slice(0, s.length - 2); m = s.slice(-2); }
  h = +h; m = +(m || 0);
  if (!s || isNaN(h) || h > 23 || m > 59) return '';
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function pmFichaDatos(f) {
  PM.faltan = f.faltan || []; PM.prop = f.propuesta || null; PM.ubic = f.ubicaciones || [];
  const p = (PM.prop && PM.prop.datos) || {}, c = f.cuenta || {};
  const dias = o => { const r = {}; PM_DIAS.forEach(k => { const l = Array.isArray(o && o[k]) ? o[k].map(x => Array.isArray(x) ? x : pmRangos(x)[0]).filter(Boolean) : pmRangos(o && o[k]); if (l.length) r[k] = l; }); return r; };
  PM.ficha = {
    telefono: p.telefono != null ? p.telefono : (c.telefono || ''), email: p.email != null ? p.email : (c.email || ''),
    consultas: (p.consultas || PM.ubic.map(u => ({ centro_id: u.centro_id, ubicacion_id: u.id, nombre: u.nombre, direccion: u.direccion, municipio: u.municipio, dias: u.dias })))
      .map(x => Object.assign({}, x, { dias: dias(x.dias) })),
    visitas: Object.assign({ como: '', momento: '' }, p.visitas || {}), notas: p.notas || ''
  };
}

// ——— Mi ficha: pantalla ———
function pmPintarFicha() {
  const box = $('pmficha'); if (!box || !PM.ficha) return;
  const F = PM.ficha;
  document.querySelectorAll('#v-informe [data-pmt=ficha] .pmtpunto').forEach(x => x.hidden = !PM.faltan.length);
  const estado = PM.prop ? (PM.prop.estado === 'Pendiente' ? `Enviado el ${horaCorta(PM.prop.modificado_en)}: tu comercial lo revisará.` : `Tu comercial revisó tus datos. Si algo cambia, vuelve a enviarlo.`)
    : 'Todavía no nos has enviado tus datos.';
  box.innerHTML = `
    <div class="pmcheck" id="pmcheck"></div>
    <div class="card ancard pmcons pmcont"><h2>Contacto y ${TT('visita', 'p', '', 'l', 'l')} ${pmAyu('Contacto y ' + TT('visita', 'p', '', 'l', 'l'), 'Cómo puede contactarte tu comercial y cómo y cuándo te va mejor que pase a verte. Escribe lo que prefieras: lo revisa antes de pasarlo a tu ficha y lo tendrá en cuenta al organizar su agenda.')}</h2>
      <div class="pmcampos"><div><label for="pmtel">Teléfono <span class="pmreq">Necesario</span></label><input id="pmtel" inputmode="tel" value="${esc(F.telefono)}" placeholder="Móvil o fijo"></div>
        <div><label for="pmmail">Correo</label><input id="pmmail" type="email" value="${esc(F.email)}" placeholder="tu@correo.es"></div>
        <div><label for="pmcomo">Cómo prefieres ${TT('visita', 'p', 'el', 'l', 'l')} <span class="pmreq">Necesario</span></label><select id="pmcomo"><option value="">Elige…</option>${PM_COMO.map(x => `<option ${F.visitas.como === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
        <div><label for="pmmom">Mejor momento</label><input id="pmmom" value="${esc(F.visitas.momento)}" placeholder="p. ej. martes a última hora"></div>
        <div class="pmancho"><label for="pmnot">Notas para tu comercial</label><textarea id="pmnot" rows="2" placeholder="Acceso, planta, a quién preguntar…">${esc(F.notas)}</textarea></div></div></div>
    <div class="card ancard pmcons"><h2>${PM_CENTRO() ? 'Dónde y cuándo atendéis' : 'Dónde atiendes'} <span class="pmreq">Necesario: al menos un día con horario</span> ${pmAyu(PM_CENTRO() ? 'Dónde y cuándo atendéis' : 'Dónde atiendes', 'Añade cada centro o lugar donde atiendes y su horario. Busca el centro por su nombre o población; si no aparece, añádelo tú. En el horario, pulsa los días y escribe las horas; con «Rellenar» pones de golpe el mismo horario en todos los días marcados.')}</h2>
      <div id="pmclist" class="pmclist">${F.consultas.map((c, i) => pmConsulta(c, i)).join('') || '<p class="sm">Todavía no hay ningún lugar.</p>'}</div>
      <div class="pmcadd"><input id="pmcq" type="search" placeholder="Añadir un centro: escribe su nombre o la población" aria-label="Buscar un centro"><div id="pmcres" class="pmcres"></div></div></div>
    <div class="pmpie"><span class="sm" id="pmest">${esc(estado)}</span><button type="button" class="btn" id="pmenviar">Enviar a mi comercial</button></div>`;
  let t;
  $('pmcq').oninput = () => { clearTimeout(t); t = setTimeout(pmBuscarCentro, 250); };
  $('pmenviar').onclick = pmEnviar;
  box.addEventListener('input', pmPintarCheck); box.addEventListener('change', pmPintarCheck); pmPintarCheck();   // v2.279.0
}

function pmConsulta(c, i) {
  const nuevo = (!c.centro_id && !c.ubicacion_id) || !String(c.nombre || '').trim();   // v2.279.0: sin nombre, se escribe
  return `<div class="pmc" data-pmc="${i}">
    <div class="pmccab">${nuevo ? `<div class="g2 pmcnuevo"><div><label>Centro o lugar</label><input data-pmcf="${i}|nombre" value="${esc(c.nombre || '')}"></div>
        <div><label>Dirección y población</label><input data-pmcf="${i}|direccion" value="${esc([c.direccion, c.municipio].filter(Boolean).join(', '))}" placeholder="Calle, número, población"></div></div>`
      : `<div><b>${esc(c.nombre || TT('consulta', 's', '', 'l', 'C'))}</b><span class="sm">${esc([c.direccion, c.municipio].filter(Boolean).join(' · '))}</span></div>`}
      <button type="button" class="btn sec chico pmcx" data-pmcx="${i}">Quitar</button></div>
    ${pmHorario(c.dias || {}, i)}</div>`;
}

// Horario flexible y rápido: días que se encienden, varias franjas con horas libres, y rellenar de golpe
function pmHorario(d, i) {
  return `<div class="pmhz">
    <div class="pmhzpre"><span class="sm">Rellenar los días marcados:</span>
      <button type="button" class="chip" data-pmhp="${i}|m">Mañana 9:00–14:00</button><button type="button" class="chip" data-pmhp="${i}|t">Tarde 16:00–20:00</button>
      <button type="button" class="chip" data-pmhp="${i}|mt">Mañana y tarde</button><button type="button" class="chip" data-pmhp="${i}|c">Copiar el primer día</button></div>
    ${PM_DIAS.map(k => { const l = d[k] || []; return `<div class="pmhd ${l.length ? 'on' : ''}">
      <button type="button" class="pmhdia" data-pmhd="${i}|${k}" aria-pressed="${!!l.length}">${PM_DIAN[k]}</button>
      <div class="pmhr">${l.length ? l.map((r, j) => `<span class="pmhf"><input data-pmhi="${i}|${k}|${j}|0" value="${esc(r[0])}" inputmode="numeric" maxlength="5" aria-label="Desde">
          <span>a</span><input data-pmhi="${i}|${k}|${j}|1" value="${esc(r[1])}" inputmode="numeric" maxlength="5" aria-label="Hasta">
          <button type="button" class="pmhx" data-pmhx="${i}|${k}|${j}" aria-label="Quitar esta franja">✕</button></span>`).join('')
          + `<button type="button" class="pmhmas" data-pmha="${i}|${k}">+ Otra franja</button>` : '<span class="sm">No atiende</span>'}</div></div>`; }).join('')}</div>`;
}

function pmLeerForm() {
  const F = PM.ficha; if (!F || !$('pmtel')) return;
  F.telefono = $('pmtel').value.trim(); F.email = $('pmmail').value.trim();
  F.visitas = { como: $('pmcomo').value, momento: $('pmmom').value.trim() }; F.notas = $('pmnot').value.trim();
  document.querySelectorAll('#pmficha [data-pmcf]').forEach(x => { const [i, k] = x.dataset.pmcf.split('|'); F.consultas[+i][k] = x.value.trim(); if (k === 'direccion') F.consultas[+i].municipio = ''; });
  document.querySelectorAll('#pmficha [data-pmhi]').forEach(x => { const [i, k, j, p] = x.dataset.pmhi.split('|'); const r = (F.consultas[+i].dias[k] || [])[+j]; if (r) r[+p] = pmHora(x.value) || x.value.trim(); });
}

function pmRepintarConsultas() { const l = $('pmclist'); if (l) l.innerHTML = PM.ficha.consultas.map((c, i) => pmConsulta(c, i)).join('') || '<p class="sm">Todavía no hay ningún lugar.</p>'; pmPintarCheck(); }

async function pmBuscarCentro() {
  const q = $('pmcq').value.trim(), box = $('pmcres'); if (!box) return;
  if (q.length < 2) { box.innerHTML = ''; return; }
  const { data } = await RPC_ORIG('portal_buscar_centros', { p_q: q });
  if ($('pmcq').value.trim() !== q) return;
  PM.cres = Array.isArray(data) ? data : [];
  box.innerHTML = PM.cres.map((x, i) => `<button type="button" data-pmcr="${i}"><b>${esc(x.nombre)}</b><span class="sm">${esc([x.direccion, x.municipio].filter(Boolean).join(' · '))}</span></button>`).join('')
    + `<button type="button" data-pmcr="nuevo" class="pmcnew"><b>No lo encuentro: añadir «${esc(q)}»</b><span class="sm">Escribe después su dirección</span></button>`;
}

async function pmEnviar() {
  pmLeerForm();
  const F = PM.ficha, mal = [];
  F.consultas.forEach(c => Object.values(c.dias || {}).forEach(l => l.forEach(r => { if (!/^\d\d:\d\d$/.test(r[0]) || !/^\d\d:\d\d$/.test(r[1]) || r[1] <= r[0]) mal.push(c.nombre); })));
  if (mal.length) { toast('Revisa las horas de ' + mal[0] + ': cada franja necesita una hora de inicio y otra de fin posterior', true); return; }
  if (F.consultas.some(c => !String(c.nombre || '').trim())) { toast('Pon el nombre de cada centro', true); return; }
  const datos = { telefono: F.telefono, email: F.email, visitas: F.visitas, notas: F.notas,
    consultas: F.consultas.map(c => ({ centro_id: c.centro_id || null, ubicacion_id: c.ubicacion_id || null, nombre: c.nombre, direccion: c.direccion || '', municipio: c.municipio || '',
      dias: Object.fromEntries(Object.entries(c.dias || {}).map(([k, l]) => [k, l.map(r => r[0] + '-' + r[1]).join(', ')])) })) };
  const b = $('pmenviar'); b.disabled = true;
  const { data: r } = await db.rpc('portal_guardar_ficha', { p: datos });
  b.disabled = false;
  if (!r || !r.ok) { toast('No se ha podido enviar', true); return; }
  toast('Enviado a tu comercial');
  const { data: f } = await RPC_ORIG('portal_mi_ficha', {}); if (f && f.ok) pmFichaDatos(f);
  pmPintarFicha();
  const av = document.querySelector('#mdcuerpo > .pmaviso'); if (av && !PM.faltan.length) av.remove();
}

// Mi ficha: lo necesario para quitar el aviso, al día según se rellena
function pmPintarCheck() {
  const box = $('pmcheck'); if (!box || !PM.ficha) return;
  try { pmLeerForm(); } catch (e) {}
  const F = PM.ficha;
  const tel = !!String(F.telefono || '').trim(), como = !!String((F.visitas || {}).como || '').trim();
  const horario = (F.consultas || []).some(c => Object.values(c.dias || {}).some(l => (l || []).some(r => /^\d\d:\d\d$/.test(r[0]) && /^\d\d:\d\d$/.test(r[1]) && r[1] > r[0])));
  const todo = tel && como && horario;
  box.classList.toggle('ok', todo);
  box.innerHTML = `<b>${todo ? 'Tu ficha tiene todo lo necesario' : 'Para completar tu ficha'}</b>
    <ul><li class="${tel ? 'ok' : ''}">Un teléfono de contacto</li><li class="${horario ? 'ok' : ''}">${PM_CENTRO() ? 'Dónde y cuándo atendéis' : 'Dónde y cuándo atiendes'} (al menos un día con su horario)</li><li class="${como ? 'ok' : ''}">Cómo prefieres las ${TT('visita', 'p', '', 'l', 'l')}</li></ul>
    <span class="sm">${todo ? 'Envíalo a tu comercial y el aviso de «faltan datos» desaparece.' : 'El resto es opcional. Cuando lo tengas, pulsa «Enviar a mi comercial».'}</span>`;
}

function pcPintarPedido(lp) {
  const box = $('pcped'); if (!box) return;
  const conIva = x => r2((+x.precio || 0) * (1 + (+x.iva || 0) / 100));
  const dirs = [...new Set((PM.ubic || []).map(u => [u.direccion, u.municipio].filter(Boolean).join(', ')).filter(Boolean))];
  const prod = x => {
    const pu = conIva(x), packs = Array.isArray(x.packs) ? x.packs : [], pvp = +x.pvp_recomendado || 0;
    if (!packs.length) return `<div class="pcprod"><div class="pcpcab"><b>${esc(x.nombre)}</b><span class="sm">${eurI(pu)} la unidad con IVA${x.propio ? ' · vuestro precio' : ''}</span></div>
      <div class="pclin"><span class="sm">Unidades</span><input type="number" step="1" value="0" data-ctp="${x.producto_id}" data-ctpr="${pu}" aria-label="Unidades de ${esc(x.nombre)}"><span class="pcerr" hidden></span></div></div>`;
    return `<div class="pcprod"><div class="pcpcab"><b>${esc(x.nombre)}</b><span class="sm">${eurI(pu)} la unidad con IVA${pvp ? ` · PVP de referencia ${eurI(pvp)}` : ''}</span></div>
      <div class="pcpacks">${packs.map((k, i) => {
        const c = +k.compra || 0, g = +k.regalo || 0, imp = r2(c * pu), coste = (c + g) ? imp / (c + g) : 0;
        return `<div class="pclin pcpack"><span class="pcpk"><b>Pack ${num(c)}${g ? ' + ' + num(g) : ''}</b><span class="sm">${num(c + g)} unidades${g ? ` (${num(g)} de regalo)` : ''}</span></span>
          <span class="pcdato"><b>${eurI(imp)}</b><span class="sm">con IVA</span></span>
          <span class="pcdato"><b>${eurI(coste)}</b><span class="sm">por unidad</span></span>
          ${pvp ? `<span class="pcdato"><b>${pcPct((pvp - coste) / pvp)}</b><span class="sm">de margen</span></span>` : '<span></span>'}
          <input type="number" step="1" value="0" data-pcpk="${x.producto_id}" data-pci="${i}" data-pcc="${c}" data-pcg="${g}" data-pcimp="${imp}" aria-label="Cuántos packs ${num(c)}${g ? '+' + num(g) : ''}">
          <span class="pcerr" hidden></span></div>`;
      }).join('')}</div></div>`;
  };
  box.innerHTML = `<div class="card ancard pmcons pcped"><h2>Pedir reposición ${pmAyu('Pedir reposición', `Elige cuántos packs quieres de cada producto (de 0 a ${num(PC_PACK_MAX)} de cada pack). El coste por unidad incluye las de regalo, y el margen se calcula sobre el PVP de referencia. La bonificación es de cada pedido. Tu comercial lo revisa y lo confirma; en «Resumen» verás cómo va.`)}</h2>
    ${lp.length ? `<div id="ctprods">${lp.map(prod).join('')}</div>
      <div class="pcent"><b>Entrega</b>
        <label class="opt"><input type="radio" name="pcent" value="una" checked> En la dirección del centro</label>
        <label class="opt"><input type="radio" name="pcent" value="varias"> Repartir entre varias direcciones</label>
        <div id="pcentl" class="pcentl" hidden><datalist id="pcdirs">${dirs.map(d => `<option value="${esc(d)}">`).join('')}</datalist>
          <div id="pcentf"></div><button type="button" class="btn sec chico" id="pcentmas">+ Otra dirección</button><span class="sm" id="pcentres"></span></div></div>
      ${window.PC_ANT ? '<p class="sm pcant">Pago por adelantado: cuando tu comercial lo confirme, descarga la factura proforma en «Resumen» y haz la transferencia. Lo preparamos en cuanto llegue.</p>' : ''}<label for="ctnota">Nota</label><input id="ctnota" placeholder="Opcional: horario de entrega, persona de contacto…">
      <div class="pctot"><span id="pctxt">Total <b id="cttot">${eurI(0)}</b> con IVA</span><button type="button" class="btn" id="ctok">Enviar pedido</button></div>`
      : '<p class="sm">Todavía no tenéis productos para pedir. Tu comercial os los dará de alta.</p>'}</div>`;
  if (!lp.length) return;
  const entFila = (d = '', u = '') => `<div class="pcef"><input list="pcdirs" placeholder="Dirección de entrega" value="${esc(d)}" data-pced><input type="number" step="1" placeholder="Unidades" value="${esc(u)}" data-pceu><button type="button" class="pmhx" data-pcex aria-label="Quitar esta dirección">✕</button></div>`;
  const entPintar = () => { if (!$('pcentf').children.length) $('pcentf').innerHTML = entFila() + entFila(); };   // sin repintar: se perdería lo escrito
  const revisar = () => {
    let total = 0, uds = 0, regalo = 0, mal = 0;
    box.querySelectorAll('[data-ctp], [data-pcpk]').forEach(i => {
      const n = Number(i.value || 0), e = i.closest('.pclin').querySelector('.pcerr'), pk = !!i.dataset.pcpk, max = pk ? PC_PACK_MAX : PC_MAX;
      const bad = !Number.isInteger(n) || n < 0 || n > max;
      e.hidden = !bad; e.textContent = bad ? (n > max ? (pk ? `Como máximo ${num(max)} packs de este tipo en cada pedido` : `Como máximo ${num(max)} unidades en cada pedido`) : 'Escribe un número entero') : '';
      if (bad) { mal++; return; }
      if (pk) { total += n * (+i.dataset.pcimp || 0); uds += n * ((+i.dataset.pcc || 0) + (+i.dataset.pcg || 0)); regalo += n * (+i.dataset.pcg || 0); }
      else { total += n * (+i.dataset.ctpr || 0); uds += n; }
    });
    const varias = (box.querySelector('[name=pcent]:checked') || {}).value === 'varias';
    $('pcentl').hidden = !varias;
    let repartidas = 0;
    if (varias) { entPintar(); box.querySelectorAll('[data-pceu]').forEach(i => { repartidas += Math.max(0, Math.floor(+i.value || 0)); }); }
    const res = $('pcentres');
    if (res) { res.textContent = varias ? `Repartidas ${num(repartidas)} de ${num(uds)} unidades` : ''; res.classList.toggle('pcmal', varias && repartidas !== uds); }
    $('pctxt').innerHTML = `Total <b id="cttot">${eurI(total)}</b> con IVA${uds ? ` · ${num(uds)} unidades${regalo ? ` (${num(regalo)} de regalo)` : ''}` : ''}`;
    return { mal, uds, varias, repartidas };
  };
  box.addEventListener('input', revisar); box.addEventListener('change', revisar);
  box.addEventListener('click', e => {
    if (e.target.closest('#pcentmas')) { $('pcentf').insertAdjacentHTML('beforeend', entFila()); revisar(); }
    const x = e.target.closest('[data-pcex]'); if (x) { x.closest('.pcef').remove(); revisar(); }
  });
  $('ctok').onclick = async ev => {
    const r = revisar();
    if (r.mal) { toast('Revisa las cantidades marcadas en rojo', true); return; }
    const lineas = [];
    box.querySelectorAll('[data-pcpk]').forEach(i => { const n = Math.floor(+i.value || 0); if (n > 0) lineas.push({ producto_id: i.dataset.pcpk, pack: { compra: +i.dataset.pcc, regalo: +i.dataset.pcg }, packs: n }); });
    box.querySelectorAll('[data-ctp]').forEach(i => { const n = Math.floor(+i.value || 0); if (n > 0) lineas.push({ producto_id: i.dataset.ctp, unidades: n }); });
    if (!lineas.length) { toast('Elige algún pack o pon unidades', true); return; }
    let entregas = null;
    if (r.varias) {
      entregas = [...box.querySelectorAll('.pcef')].map(f => ({ direccion: f.querySelector('[data-pced]').value.trim(), unidades: Math.floor(+f.querySelector('[data-pceu]').value || 0) }))
        .filter(x => x.direccion && x.unidades > 0);
      if (entregas.length < 2 || r.repartidas !== r.uds) { toast(`Reparte las ${num(r.uds)} unidades entre al menos dos direcciones`, true); return; }
    }
    ev.target.disabled = true;
    const { data: res } = await db.rpc('pedido_portal', { p_lineas: lineas, p_nota: $('ctnota').value.trim() || null, p_entregas: entregas });
    ev.target.disabled = false;
    if (!res || !res.ok) {
      const m = res && res.motivo;
      toast(m === 'vacio' ? 'Elige algún pack o pon unidades' : m === 'pack' ? `Ese pack de ${res.producto || 'producto'} ya no está disponible: vuelve a cargar la página`
        : m === 'unidades' ? `Revisa las cantidades de ${res.producto || 'un producto'}` : m === 'entregas' ? `Las direcciones tienen que sumar ${num(res.total)} unidades` : motivoPortal(res), true);
      return;
    }
    toast('Pedido enviado: tu comercial lo confirmará'); PM.tab = 'res'; await centroPintar(); pmTab('res');
  };
  revisar();
}

async function pcProforma(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const { data: f } = await RPC_ORIG('portal_proforma', { p_id: id });
    if (!f || !f.ok) { toast(f && f.motivo === 'no_encontrado' ? 'Ese pedido ya no está pendiente de pago' : motivoPortal(f), true); return; }
    const d = f.diseno || {};
    const C = Object.assign({}, PDF_DEF, d, { cols: Object.assign({}, PDF_DEF.cols, d.cols || {}) },
      { titulo: 'FACTURA PROFORMA', formaPago: true, iban: true, vencimiento: false });
    const doc = await facturaPDF(f, '', C);
    doc.save(f.numero + '.pdf');
    toast(`Proforma descargada. Pon «${f.concepto}» como concepto de la transferencia`);
  } catch (e) { toast('No se ha podido preparar la proforma', true); registrarError('app', 'Proforma del portal', { e: String(e) }); }
  finally { if (btn) btn.disabled = false; }
}

function pcDebeHtml(peds) {
  const n = (peds || []).filter(p => p.proforma).length;
  return n ? `<div class="pmaviso pcdebe"><div><b>${n === 1 ? 'Tienes un pedido pendiente de pago' : `Tienes ${num(n)} pedidos pendientes de pago`}</b><span class="sm">Descarga la factura proforma en «Tus pedidos» y haz la transferencia: lo preparamos en cuanto llegue.</span></div></div>` : '';
}

/* ============================================================
   v2.285.0 · Portal del centro: lotes, facturas y material para descargar (SQL 153).
   - «Tus pedidos»: cada pedido con sus lotes (y caducidad) y sus facturas o rectificativas, que se descargan en PDF con el
     diseño de la empresa.
   - «Material y dudas»: «Material para descargar» con el material de sus productos que la empresa marca «Para los centros»
     (en el producto, Material para presentar → «Para los centros»).
   ============================================================ */
function pcExtraPed(p) {
  const lotes = p.lotes || [], facs = p.facturas || [];
  return (lotes.length ? `<span class="sm pclotes">Lote${lotes.length > 1 ? 's' : ''}: ${lotes.map(l => `${esc(l.producto)} ${esc(l.lote)}${l.caducidad ? ' (cad. ' + fechaCorta(String(l.caducidad).slice(0, 10)) + ')' : ''}`).join(' · ')}</span>` : '')
    + (facs.length ? `<span class="pcfacs">${facs.map(f => `<button type="button" class="lnk" data-pcfac="${f.id}">${f.rectificativa ? 'Rectificativa' : 'Factura'} ${esc(f.numero || '')}</button>`).join('')}</span>` : '');
}

async function pcFactura(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const { data: f } = await RPC_ORIG('portal_factura', { p_id: id });
    if (!f || !f.ok) { toast(motivoPortal(f), true); return; }
    const d = f.diseno || {};
    const C = Object.assign({}, PDF_DEF, d, { cols: Object.assign({}, PDF_DEF.cols, d.cols || {}) });
    const doc = await facturaPDF(f, f.rectifica_num || '', C);
    doc.save(nombrePDF(f));
  } catch (e) { toast('No se ha podido preparar la factura', true); registrarError('app', 'Factura del portal', { e: String(e) }); }
  finally { if (btn) btn.disabled = false; }
}

async function pcMaterialBajar(id, btn) {
  if (btn) btn.disabled = true;
  try {
    const { data: m } = await RPC_ORIG('portal_material_archivo', { p_id: id });
    if (!m || !m.ok) { toast(motivoPortal(m), true); return; }
    const bin = atob(m.datos || ''), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: m.tipo || 'application/octet-stream' }));
    const a = document.createElement('a'); a.href = url; a.download = m.nombre || 'material'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (e) { toast('No se ha podido descargar', true); }
  finally { if (btn) btn.disabled = false; }
}

async function pcDescargas() {
  const caja = $('pmmat'); if (!caja || $('pcdesc')) return;
  caja.insertAdjacentHTML('afterbegin', `<div class="card ancard" id="pcdesc"><h2>Material para descargar ${pmAyu('Material para descargar', 'Dípticos, fichas de producto, guías de mostrador y otro material que la empresa prepara para los centros, de los productos que tenéis dados de alta. Pulsa para descargarlo.')}</h2><div id="pcdescl">${skelCard('Cargando…')}</div></div>`);
  const { data: l } = await RPC_ORIG('portal_materiales', {});
  const box = $('pcdescl'); if (!box) return;
  const lista = Array.isArray(l) ? l : [];
  const kb = n => n ? (n > 1048576 ? (n / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB') : '';
  box.innerHTML = lista.length ? `<div class="lista">${lista.map(m => `<div class="item"><span class="tx"><b>${esc(m.nombre)}</b>
      <span class="sm">${esc(m.producto)} · ${m.tipo === 'application/pdf' ? 'PDF' : 'Imagen'}${m.tamano ? ' · ' + kb(m.tamano) : ''}</span></span>
      <button type="button" class="btn sec chico" data-pcmat="${m.id}">Descargar</button></div>`).join('')}</div>`
    : '<p class="sm">Todavía no hay material para descargar.</p>';
}

function pmActividad(d) {
  const sel = document.querySelector('#mdper [data-per]'), cuando = PM_PER_TXT[sel ? sel.value : 'semana'] || 'En este periodo';
  const n = +d.pautas || 0, t = terminoDe('pauta');
  if (n > 0) return `<div class="banda-ok pmact" id="pmact"><b>${cuando} se ${n === 1 ? 'ha' : 'han'} activado ${num(n)} ${esc(n === 1 ? t.s : t.p)}</b></div>`;
  return `<div class="banda-info pmact" id="pmact"><b>${cuando} no se ha activado ${t.g === 'f' ? 'ninguna' : 'ningún'} ${esc(t.s)}.</b>
    ¿Necesitas material, información o resolver alguna duda? Escríbenos y te ayudamos.
    <button type="button" class="btn sec chico" data-pmir="mat">Material y dudas</button></div>`;
}

async function cargarInforme() {
  if (puede('portal_centro')) return cargarCentro();   // v2.128.0: el portal del centro
  // v2.271.0: página nueva (al final del archivo); al arrancar se espera a que esté leída
  if (!window.PM_LISTO) { const v0 = $('v-informe'); if (v0 && !v0.innerHTML.trim()) v0.innerHTML = '<div class="card">' + skelCard('Cargando tu informe…') + '</div>'; setTimeout(cargarInforme, 30); return; }
  return cargarInforme2271();
  const v = $('v-informe');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu portal</div><h1 id="mdnom">…</h1><div id="mdesp" class="sm" style="color:rgba(255,255,255,.85)"></div></div>
      <div class="medper"><div id="mdper"></div></div></div>
    <div id="mdcuerpo"><div class="card">${skelCard('Cargando tu informe…')}</div></div>`;
  const pinta = async () => {
    const r = $('mdper').__rango();
    const { data: d } = await RPC_ORIG('informe_cuenta', { p_desde: r.desde, p_hasta: r.hasta });
    if (!d || !d.ok) {
      // v2.291: sin ficha vinculada, las dos pestañas lo dicen (antes «Mi ficha» se quedaba cargando) y la cabecera lleva su nombre
      const sin = `<div class="card"><div class="vacio">Tu usuario todavía no está vinculado a tu ficha de ${TT('medico', 's', '', 'l', 'l')}. Avisa a la empresa para activarlo.</div></div>`;
      $('mdcuerpo').innerHTML = sin; if ($('pmficha')) $('pmficha').innerHTML = sin;
      $('mdnom').textContent = (PERFIL && PERFIL.nombre) || ''; return;
    }
    $('mdnom').textContent = d.medico.nombre; $('mdesp').textContent = d.medico.especialidad || '';
    const top = d.posicion && d.posicion <= 3 ? 'Top 3' : d.posicion && d.posicion <= 5 ? 'Top 5' : d.posicion && d.posicion <= 10 ? 'Top 10' : null;
    const ll = d.llamadas || {}, conv = ll.total ? Math.round(ll.con_pedido / ll.total * 100) : null;
    const meses = mesesEntre(d.desde, d.hasta), serie = {}; (d.serie || []).forEach(s => serie[s.mes] = s);
    $('mdcuerpo').innerHTML = `
      <div class="kpis vtot mdk">
        <div class="kpi"><b>${num(d.unidades)}</b><span>unidades atribuidas</span></div>
        <div class="kpi"><b>${num(d.pautas)}</b><span>${TT('pauta', 'p', '', 'l', 'l')} (pedidos)</span></div>
        <div class="kpi"><b>${num(d.pacientes)}</b><span>${TT('paciente', 'p', '', 'l', 'l')}</span></div>
        <div class="kpi"><b>${num(d.repiten)}</b><span>${TT('paciente', 'p', '', 'l', 'l')} que repiten</span></div>
        <div class="kpi ${top ? 'ok' : ''}"><b>${top ? '🏆 ' + top : d.posicion ? 'Nº ' + d.posicion : '—'}</b><span>${d.posicion ? `de ${num(d.prescriptores)} ${TT('medico', 'p', '', 'l', 'l')}` : 'sin ventas en el periodo'}</span></div>
      </div>
      <div class="angrid">
        <div class="card ancard ancha"><h2>Tus ${TT('pauta', 'p', '', 'l', 'l')} mes a mes</h2>
          ${d.unidades ? svgBarras(meses, meses.map(m => (serie[m] || {}).unidades || 0), meses.map(m => (serie[m] || {}).pautas || 0), ['Unidades', TT('pauta', 'p', '', 'l', 'C')])
            : vacioGrafico(`Cuando tus ${TT('paciente', 'p', '', 'l', 'l')} hagan su pedido, verás aquí la evolución.`)}
          <p class="leer">Cada barra son las unidades atribuidas en el mes y la línea, el número de ventas.${d.ultima_pauta ? ' Última venta: ' + fechaCorta(d.ultima_pauta) + '.' : ''}</p></div>
        <div class="card ancard"><h2>Qué ${TT('pauta', 'p', '', 'l', 'l')}</h2>
          ${(d.productos || []).length ? svgDonut(d.productos.map(x => ({ n: x.nombre, v: x.unidades }))) : vacioGrafico('Aparecerá el reparto por producto.')}</div>
        <div class="card ancard"><h2>Llamadas de tus ${TT('paciente', 'p', '', 'l', 'l')}</h2>
          <div class="minis"><div><b>${num(ll.total || 0)}</b><span>llamadas</span></div><div><b>${conv == null ? '—' : conv + '%'}</b><span>acaban en pedido</span></div></div>
          ${(ll.por_resultado || []).length ? barrasH(ll.por_resultado.map(x => ({ n: x.resultado, v: x.n })), num) : `<p class="sm" style="padding:0 16px">Todavía no hay llamadas registradas en el periodo.</p>`}
          <p class="leer">${TT('paciente', 'p', '', 'l', 'C')} que llaman a la empresa. Si muchos llaman por dudas o por precio, podemos darte material para explicarlo.</p></div>
      </div>
      <p class="sm" style="text-align:center;margin:18px 0">Por confidencialidad no se muestran datos de tus ${TT('paciente', 'p', '', 'l', 'l')} ni importes.</p>`;
  };
  montarPeriodo($('mdper'), { id: 'informe', valor: 'anio', alCambiar: pinta });
  pinta();
  portalMedico();   // v2.126.0
}

// Mensajes: el hilo de una ficha (el médico ve los suyos; quien lleva la ficha, los de esa ficha)
function hiloMensajes(l, yoMedico) {
  return l.length ? `<div class="hilo">${l.map(x => `<div class="msj ${x.del_portal === yoMedico ? 'mio' : 'suyo'}"><div>${esc(x.texto)}</div>
      <span class="sm">${x.del_portal ? TT('medico', 's', '', 'l', 'C') : 'Equipo'} · ${horaCorta(x.creado_en)}</span></div>`).join('')}</div>`
    : '<div class="sm">Todavía no hay mensajes.</div>';
}

// cargarInforme (en su sitio) espera a que se lea este final y llama aquí: al arrancar, «Mi informe» se pinta antes
async function cargarInforme2271() {
  const v = $('v-informe'), pac = TT('paciente', 'p', '', 'l', 'l');
  v.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">Tu portal</div><h1 id="mdnom">…</h1><div id="mdesp" class="sm" style="color:rgba(255,255,255,.85)"></div></div>
      <div class="medper"><div id="mdper"></div></div></div>
    <div class="pmtabs" role="tablist">${[['res', 'Resumen'], ['ficha', 'Mi ficha'], ['mat', 'Material y dudas']].map(([k, t]) =>
      `<button type="button" role="tab" data-pmt="${k}" class="${PM.tab === k ? 'on' : ''}" aria-selected="${PM.tab === k}">${t}<span class="pmtpunto" hidden></span></button>`).join('')}</div>
    <div data-pmp="res" id="mdcuerpo" ${PM.tab === 'res' ? '' : 'hidden'}>${pmEsqueleto()}</div>
    <div data-pmp="ficha" id="pmficha" ${PM.tab === 'ficha' ? '' : 'hidden'}>${pmEsqueleto(true)}</div>
    <div data-pmp="mat" id="pmmat" ${PM.tab === 'mat' ? '' : 'hidden'}><div id="mdportal" class="pmfila"></div></div>`;
  v.querySelectorAll('[data-pmt]').forEach(b => b.onclick = () => pmTab(b.dataset.pmt));
  const pinta = async () => {
    const r = $('mdper').__rango();
    const [{ data: d }, { data: c }, { data: f }] = await Promise.all([RPC_ORIG('informe_cuenta', { p_desde: r.desde, p_hasta: r.hasta }),
      RPC_ORIG('constancia_pacientes', { p_meses: 12 }), PM.ficha ? Promise.resolve({ data: null }) : RPC_ORIG('portal_mi_ficha', {})]);
    if (f && f.ok) pmFichaDatos(f);
    if (!$('mdcuerpo')) return;
    if (!d || !d.ok) {
      // v2.291: sin ficha vinculada, las dos pestañas lo dicen (antes «Mi ficha» se quedaba cargando) y la cabecera lleva su nombre
      const sin = `<div class="card"><div class="vacio">Tu usuario todavía no está vinculado a tu ficha de ${TT('medico', 's', '', 'l', 'l')}. Avisa a la empresa para activarlo.</div></div>`;
      $('mdcuerpo').innerHTML = sin; if ($('pmficha')) $('pmficha').innerHTML = sin;
      $('mdnom').textContent = (PERFIL && PERFIL.nombre) || ''; return;
    }
    $('mdnom').textContent = d.medico.nombre; $('mdesp').textContent = d.medico.especialidad || '';
    $('mdcuerpo').innerHTML = pmResumen(d, c || {}, pac);
    $('mdcuerpo').querySelectorAll('[data-pmir]').forEach(b => b.onclick = () => pmTab(b.dataset.pmir));
    pmPintarFicha();
  };
  try { localStorage.removeItem('dlc-per-informe-' + (PERFIL ? PERFIL.id : '')); } catch (e) {}   // v2.353.0: al entrar, siempre «Esta semana»
  montarPeriodo($('mdper'), { id: 'informe', valor: 'semana', alCambiar: pinta });
  await pinta();
  portalMedico();
}

/* v2.126.0 · Portal del médico (extra «Portal» de la organización). En «Mi informe», además: la constancia de sus pacientes solo en
   cifras (sin ninguna fila por paciente), pedir material de lo que la empresa permite y escribir dudas a su comercial. En la ficha,
   quien la lleva entrega el material y contesta. En Configuración → Portal del médico, qué material se puede pedir y cuánto. */
// v2.242.0: aquí iba la primera versión de hayExtra (se redefine entera más abajo)
const MOTIVO_PORTAL = { permiso: 'No tienes permiso', extra: 'Tu empresa no tiene el portal activado', material: 'Ese material ya no se puede pedir',
  cantidad: 'Esa cantidad supera el máximo', vacio: 'Escribe el mensaje', cerrada: 'Ya estaba cerrado', no_existe: 'Ya no existe' };

const motivoPortal = r => MOTIVO_PORTAL[(r && r.motivo) || ''] || 'No se ha podido hacer';

/* ============================================================
   v2.271.0 · Portal del profesional en una sola página (revisión de Eric, 12/10/2026; variante C elegida; necesita el SQL 146).
   - Pestañas dentro de la página: «Resumen», «Mi ficha» y «Material y dudas». Sin «Inicio», sin manual y, en Configuración, solo
     «Mis datos» (sin módulos, actividad, rol ni «al entrar, abrir») y «Notificaciones».
   - Resumen: 4 indicadores y debajo, en dos columnas iguales alineadas con ellos, «Tu evolución» (un solo gráfico: unidades por mes y,
     debajo, cuántas ventas), «Por producto», «Llamadas recibidas a tu nombre» y «Constancia». Sin posición entre profesionales.
     Cada bloque se explica en su ayuda «i».
   - Mi ficha: contacto, dónde pasa consulta (centros de la base, sin más datos que nombre y dirección, o uno nuevo), un horario
     flexible y rápido por centro (días, varias franjas con horas libres y botones para rellenar de golpe), cómo prefiere las visitas
     y notas. Se envía como propuesta a su comercial (portal_guardar_ficha); si le falta algo, aviso arriba y notificación (SQL 146).
   - En la ficha del equipo: «Datos enviados desde su portal» con lo que tenéis y lo que propone, «Editar la ficha» y «Marcar como
     revisado».
   ============================================================ */
const PM = { tab: 'res', ficha: null, faltan: [], prop: null, ubic: [] };

const pmAyu = (t, x) => `<button type="button" class="ai" data-ayuda-tit="${esc(t)}" data-ayuda-txt="${esc(x)}" aria-label="Qué es">i</button>`;

const PM_DIAS = ['L', 'M', 'X', 'J', 'V', 'S'];

const PM_DIAN = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };

const PM_COMO = ['Con cita previa', 'Sin cita, al final de la consulta', 'Sin cita, en cualquier hueco', 'Por teléfono o videollamada', 'Prefiero que me escribáis antes'];

const pmFaltaTxt = () => {
  const t = { horario: typeof PM_CENTRO === 'function' && PM_CENTRO() ? 'dónde y cuándo atendéis' : 'dónde y cuándo atiendes', telefono: 'un teléfono de contacto', visitas: `cómo prefieres ${TT('visita', 'p', 'el', 'l', 'l')}` };
  const l = PM.faltan.map(x => t[x]).filter(Boolean);
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1] : l[0] || 'algún dato';
};

/* ============================================================
   v2.282.0 · Portal del centro con el mismo modelo que el del profesional (petición de Eric, 12/10/2026).
   Una sola página con pestañas: «Resumen» (4 indicadores; «Tus pedidos» y «Lo que has comprado» del mismo tamaño, con su «i»),
   «Pedir reposición» (sus productos con su precio; sin máximo en el campo: por encima de 1.000 unidades —lo que acepta
   pedido_portal, que descartaba en silencio— avisa en la fila y no envía), «Mi centro» (la misma ficha que el profesional, con
   sus textos) y «Material y dudas». Configuración, ayudas y navegación, como el portal del profesional.
   ============================================================ */
const PM_CENTRO = () => typeof puede === 'function' && puede('portal_centro');

const PC_MAX = 1000;

/* ============================================================
   v2.283.0 · Packs para los centros (petición de Eric, 12/10/2026, con las directrices comerciales de los centros; SQL 151).
   - Producto: «Packs para los centros» (compras N, te regalan M) y PVP de referencia con IVA. Con packs, el centro pide ese
     producto solo por packs desde su portal; el regalo va en el pedido como línea aparte al 100 % de descuento.
   - Portal del centro, «Pedir reposición»: cada pack con sus unidades, su importe, el coste real por unidad y el margen sobre el
     PVP de referencia; cuántos packs de cada (0 a 50, avisando en la fila si no vale); entrega en la dirección del centro o
     repartida entre varias direcciones (las unidades repartidas tienen que cuadrar). La bonificación es de cada pedido.
   ============================================================ */
const PC_PACK_MAX = 50;

const pcPct = v => (Math.round(v * 1000) / 10).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';

/* ============================================================
   v2.353.0 · Portal del profesional: la actividad del periodo, de un vistazo (Eric, 22/10/2026). Al entrar el periodo es «Esta semana».
   Con alguna solicitud completada: «Esta semana se han activado 2 …», escueto. Sin ninguna: lo dice y ofrece «Material y dudas».
   Solo cuenta lo completado (SQL 177): nunca se enseña nada que no lo esté.
   ============================================================ */
const PM_PER_TXT = { hoy: 'Hoy', ayer: 'Ayer', semana: 'Esta semana', '7d': 'En los últimos 7 días', mes: 'Este mes', mesant: 'El mes pasado',
  tri: 'Este trimestre', triant: 'El trimestre pasado', anio: 'Este año', anioant: 'El año pasado', todo: 'En total', pers: 'En estas fechas' };

// ——— Lado del médico ———
async function portalMedicoBase() {
  // Al arrancar, «Mi informe» se pinta antes de leerse el final de este archivo y antes de tener el plan: se espera a los dos
  try { void MOTIVO_PORTAL; void PLAN_ACTUAL; } catch (e) { setTimeout(portalMedico, 300); return; }
  if (!('estado' in PLAN_ACTUAL)) { const { data } = await RPC_ORIG('plan_uso', {}); if (data && data.plan) PLAN_ACTUAL = data.plan; }
  if (!ES_MEDICO() || !hayExtra('portal') || !$('v-informe')) return;
  let caja = $('mdportal');
  if (!caja) { $('v-informe').insertAdjacentHTML('beforeend', '<div id="mdportal" class="angrid"></div>'); caja = $('mdportal'); }
  const [{ data: c }, { data: perm }, { data: sols }, { data: msgs }] = await Promise.all([
    puede('portal_centro') ? Promise.resolve({ data: null }) : RPC_ORIG('constancia_pacientes', { p_meses: 12 }), RPC_ORIG('portal_material_permitido', {}),
    db.from('solicitudes_material').select('id,material,cantidad,nota,estado,creado_en,cerrado_en').order('creado_en', { ascending: false }).limit(20),
    db.from('mensajes_cuenta').select('id,texto,del_portal,creado_en,leido_en').order('creado_en', { ascending: true }).limit(200)]);
  caja = $('mdportal'); if (!caja) return;   // v2.318.0: si se ha vuelto a pintar mientras llegaban los datos, la caja de ahora
  const pac = TT('paciente', 'p', '', 'l', 'l'), k = c || {};
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
  const constancia = !k.ok ? '<div class="sm">No disponible.</div>' : k.pocos
    ? `<p class="sm" style="padding:0 16px">En los últimos ${num(k.meses || 12)} meses han empezado ${num(k.empezaron)} ${pac}. A partir de ${num(k.minimo || 5)} verás aquí su constancia (con menos no se muestra, para que nadie pueda reconocerlos).</p>`
    : `<div class="minis cons">
        <div><b>${num(k.empezaron)}</b><span>empezaron</span></div>
        <div><b>${pct(k.repiten, k.empezaron)}</b><span>repiten (${num(k.repiten)})</span></div>
        <div><b>${k.dias_entre ? num(k.dias_entre) + ' días' : '—'}</b><span>entre pedidos</span></div>
        <div><b>${num(k.dejaron)}</b><span>lo dejaron tras el primero</span></div>
        <div><b>${num(k.sin_pedir)}</b><span>llevan más de 60 días sin pedir</span></div></div>
      ${(k.por_producto || []).length ? barrasH(k.por_producto.map(x => ({ n: x.producto, v: Math.round(x.repiten / x.pacientes * 100) })), v => v + '% repiten') : ''}`;
  const lp = Array.isArray(perm) ? perm : [];
  const ls = sols || [], lm = msgs || [];
  caja.innerHTML = `
    <div class="card ancard ancha" id="mdcons"><h2>Continuidad de las ${TT('pauta', 'p', '', 'l', 'l')}</h2>${constancia}
      <p class="leer">En los últimos 12 meses: cuántas ${TT('pauta', 'p', '', 'l', 'l')} han empezado, qué parte se ha repetido y cada cuántos días.</p></div>
    <div class="card ancard" id="mdmat"><h2>Pedir material</h2>
      ${lp.length ? `<div class="g2"><div><label for="mdmatm">Material</label><select id="mdmatm">${lp.map(x => `<option value="${esc(x.valor)}" data-max="${x.max}">${esc(x.valor)}</option>`).join('')}</select></div>
        <div><label for="mdmatn">Cantidad</label><input id="mdmatn" type="number" min="1" value="1"><span class="sm" id="mdmatmax">Máximo ${num(lp[0].max)} por petición</span></div></div>
        <label for="mdmatt">Nota para tu comercial</label><input id="mdmatt" placeholder="Opcional">
        <div class="acts" style="justify-content:flex-start"><button type="button" class="btn" id="mdmatok">Pedir</button></div>`
      : '<p class="sm" style="padding:0 16px">Tu empresa todavía no ofrece material para pedir.</p>'}
      ${ls.length ? `<div class="lista" id="mdmatl">${ls.map(x => `<div class="item" style="cursor:default"><span class="tx"><b>${num(x.cantidad)} × ${esc(x.material)}</b>
          <span class="sm">${horaCorta(x.creado_en)}${x.nota ? ' · ' + esc(x.nota) : ''}</span></span>${pillMaterial(x.estado)}
          ${x.estado === 'Pendiente' ? `<button type="button" class="btn sec chico" data-mdanu="${x.id}">Anular</button>` : ''}</div>`).join('')}</div>` : ''}</div>
    <div class="card ancard" id="mdmsg"><h2>Dudas a tu comercial</h2>
      <div id="mdhilo">${hiloMensajes(lm, true)}</div>
      <textarea id="mdmsgt" rows="2" placeholder="Escribe tu duda" aria-label="Tu mensaje"></textarea>
      <div class="acts" style="justify-content:flex-start"><button type="button" class="btn" id="mdmsgok">Enviar</button></div></div>`;
  if (puede('portal_centro') && $('mdcons')) $('mdcons').remove();
  // v2.277.0: sin máximo en el campo (rebajaba en silencio lo escrito); en cuanto lo escrito pasa del máximo, el aviso se pone en rojo
  const mdMatAviso = () => {
    const w = $('mdmatmax'), o = $('mdmatm') && $('mdmatm').selectedOptions[0]; if (!w || !o) return;
    const m = +o.dataset.max, n = +$('mdmatn').value || 0;
    w.classList.toggle('mdmatpasa', n > m); w.textContent = (n > m ? 'Como máximo ' : 'Máximo ') + num(m) + ' por petición';
  };
  if ($('mdmatm')) $('mdmatm').onchange = mdMatAviso;
  if ($('mdmatn')) $('mdmatn').addEventListener('input', mdMatAviso);
  if ($('mdmatok')) $('mdmatok').onclick = async ev => {
    ev.target.disabled = true;
    const mx = +$('mdmatm').selectedOptions[0].dataset.max, n = +$('mdmatn').value || 0;
    if (n < 1 || n > mx) { ev.target.disabled = false; mdMatAviso(); toast(n < 1 ? 'Indica cuántos necesitas' : `Como máximo ${num(mx)} por petición: pide ${num(mx)} o escribe en la nota cuántos necesitas`, true); return; }
    const { data: r } = await db.rpc('pedir_material', { p_material: $('mdmatm').value, p_cantidad: n, p_nota: $('mdmatt').value.trim() || null });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(r && r.motivo === 'cantidad' ? `Como máximo ${num(r.max)}` : motivoPortal(r), true); return; }
    toast('Pedido enviado a tu comercial'); portalMedico();
  };
  caja.querySelectorAll('[data-mdanu]').forEach(b => b.onclick = async () => {
    const { data: r } = await db.rpc('cerrar_material', { p_id: b.dataset.mdanu, p_estado: 'Anulado' });
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast('Pedido de material anulado'); portalMedico();
  });
  if ($('mdmsgok')) $('mdmsgok').onclick = async ev => {
    const t = $('mdmsgt').value.trim(); if (!t) { toast('Escribe el mensaje', true); return; }
    ev.target.disabled = true;
    const { data: r } = await db.rpc('enviar_mensaje_cuenta', { p_cuenta: null, p_texto: t });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast('Mensaje enviado'); portalMedico();
  };
  if (lm.some(x => !x.del_portal && !x.leido_en)) RPC_ORIG('leer_mensajes_cuenta', { p_cuenta: null });
}

// ——— Configuración: qué material se puede pedir y cuánto ———
async function pintarCfgPortalBase() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = `<div class="card">${skelCard('Cargando…')}</div>`;
  const [{ data: cat }, { data: perm }, { data: aj }] = await Promise.all([
    db.rpc('catalogo_papel', { p_papel: 'material_visita' }), RPC_ORIG('portal_material_permitido', {}),
    db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle()]);
  if (!$('cfgcuerpo')) return;
  const l = cat || [], p = Array.isArray(perm) ? perm : [], conAjuste = !!(aj && aj.valor && aj.valor.material);
  const de = v => p.find(x => x.valor === v);
  c.innerHTML = `<div class="card"><div class="fh"><div><h2>Portal ${TT('medico', 's', 'del', 'l', 'l')}</h2>
      <div class="sm">Qué material pueden pedir ${TT('medico', 'p', 'el', 'l', 'l')} desde su portal y cuánto como máximo cada vez. Les llega a su comercial.</div></div></div>
    ${l.length ? `<div class="lista" id="cfpmat">${l.map(x => { const d = de(x.valor); return `<label class="item" style="cursor:default">
        <input type="checkbox" data-cfpm="${esc(x.valor)}" ${d ? 'checked' : ''}> <span class="tx"><b>${esc(x.valor)}</b></span>
        <span class="sm">Máximo</span> <input type="number" min="1" max="1000" value="${d ? d.max : 20}" data-cfpx="${esc(x.valor)}" style="max-width:110px" aria-label="Máximo de ${esc(x.valor)}"></label>`; }).join('')}</div>
      ${conAjuste ? '' : '<p class="sm" style="padding:0 16px">Ahora mismo se puede pedir todo el material, hasta 20 de cada. Guarda para decidirlo tú.</p>'}
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="cfpok">Guardar</button></div>`
      : '<div class="vacio">No hay material en el catálogo «Material comercial entregado». Añádelo en Clasificadores.</div>'}</div>`;
  if ($('cfpok')) $('cfpok').onclick = async () => {
    const material = [...c.querySelectorAll('[data-cfpm]')].filter(x => x.checked)
      .map(x => ({ valor: x.dataset.cfpm, max: Math.max(1, Math.min(1000, +c.querySelector(`[data-cfpx="${CSS.escape(x.dataset.cfpm)}"]`).value || 20)) }));
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'portal', p_valor: Object.assign({}, (aj && aj.valor) || {}, { material }) });   // v2.284.0: sin borrar el resto del ajuste
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast('Guardado'); pintarCfgPortal();
  };
}

// ——— Material y dudas: las tarjetas de siempre, en su pestaña, con su ayuda ———
async function portalMedico(...a) {
  const r = await portalMedicoBase.apply(this, a);
  if (!ES_MEDICO()) return r;   // v2.282.0: también el centro
  const c = $('mdcons'); if (c) c.remove();   // la constancia va en el Resumen
  const ay = { mdmat: ['Pedir material', 'Pide el material que te ofrece la empresa (folletos, catálogos…). Le llega a tu comercial, que te lo entrega; mientras está pendiente lo puedes anular.'],
    mdmsg: ['Dudas a tu comercial', 'Escribe a tu comercial cualquier duda. Te contestará aquí y te llegará un aviso.'] };
  Object.entries(ay).forEach(([id, [t, x]]) => { const h = document.querySelector('#' + id + ' > h2'); if (h && !h.querySelector('.ai')) h.insertAdjacentHTML('beforeend', ' ' + pmAyu(t, x)); });
  return r;
}

// Configuración → Portal: pago por adelantado de los pedidos del centro
async function pintarCfgPortal(...a) {
  const r = await pintarCfgPortalBase.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || $('cfpant')) return r;
  const { data: aj } = await db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle();
  if (!$('cfgcuerpo') || $('cfpant')) return r;
  const on = !!(aj && aj.valor && aj.valor.pago_anticipado);
  c.insertAdjacentHTML('beforeend', `<div class="card" id="cfpantc"><div class="fh"><div><h2>Pedidos del portal del centro ${typeof pmAyu === 'function' ? pmAyu('Pago por adelantado', 'Con el pago por adelantado, al confirmar un pedido del portal el centro lo ve «Pendiente de pago» y descarga la factura proforma con vuestros datos y el IBAN para hacer la transferencia. Cuando la recibáis, marcad el pago como cobrado en el pedido: el centro recibe el aviso y el pedido se prepara como siempre. El IBAN y los datos salen de Facturación → Datos fiscales.') : ''}</h2></div></div>
    <label class="opt"><input type="checkbox" id="cfpant" ${on ? 'checked' : ''}> Pago por adelantado (transferencia antes de preparar el pedido)</label>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="cfpantok" type="button">Guardar</button></div></div>`);
  $('cfpantok').onclick = async ev => {
    ev.target.disabled = true;
    const { data: a2 } = await db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle();
    const { data: x, error } = await db.rpc('guardar_ajuste', { p_clave: 'portal', p_valor: Object.assign({}, (a2 && a2.valor) || {}, { pago_anticipado: $('cfpant').checked }) });
    ev.target.disabled = false;
    if (error || (x && x.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast($('cfpant').checked ? 'Guardado: los centros pagarán por adelantado' : 'Guardado: sin pago por adelantado');
  };
  return r;
}
