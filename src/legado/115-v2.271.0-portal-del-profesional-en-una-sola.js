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
window.PM_LISTO = true;

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

const pmFaltaTxt = () => {
  const t = { horario: typeof PM_CENTRO === 'function' && PM_CENTRO() ? 'dónde y cuándo atendéis' : 'dónde y cuándo atiendes', telefono: 'un teléfono de contacto', visitas: `cómo prefieres ${TT('visita', 'p', 'el', 'l', 'l')}` };
  const l = PM.faltan.map(x => t[x]).filter(Boolean);
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1] : l[0] || 'algún dato';
};

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

document.addEventListener('click', e => {
  const b = e.target.closest('#pmficha [data-pmhd], #pmficha [data-pmhp], #pmficha [data-pmhx], #pmficha [data-pmha], #pmficha [data-pmcx], #pmficha [data-pmcr]');
  if (!b || !PM.ficha) return;
  pmLeerForm();
  const F = PM.ficha;
  if (b.dataset.pmhd) {   // encender o apagar un día: al encenderlo copia el horario del día marcado más cercano
    const [i, k] = b.dataset.pmhd.split('|'), d = F.consultas[+i].dias;
    if ((d[k] || []).length) delete d[k];
    else { const prev = PM_DIAS.filter(x => (d[x] || []).length); d[k] = prev.length ? d[prev[0]].map(r => r.slice()) : [['09:00', '14:00']]; }
  }
  if (b.dataset.pmhp) {
    const [i, m] = b.dataset.pmhp.split('|'), d = F.consultas[+i].dias;
    let dias = PM_DIAS.filter(x => (d[x] || []).length); if (!dias.length) dias = ['L', 'M', 'X', 'J', 'V'];
    const r = m === 'm' ? [['09:00', '14:00']] : m === 't' ? [['16:00', '20:00']] : m === 'mt' ? [['09:00', '14:00'], ['16:00', '20:00']] : (d[dias[0]] || [['09:00', '14:00']]);
    dias.forEach(x => d[x] = r.map(y => y.slice()));
  }
  if (b.dataset.pmhx) { const [i, k, j] = b.dataset.pmhx.split('|'), d = F.consultas[+i].dias; d[k].splice(+j, 1); if (!d[k].length) delete d[k]; }
  if (b.dataset.pmha) { const [i, k] = b.dataset.pmha.split('|'), l = F.consultas[+i].dias[k], u = l[l.length - 1]; l.push(u && u[1] < '15:00' ? ['16:00', '20:00'] : ['', '']); }
  if (b.dataset.pmcx) F.consultas.splice(+b.dataset.pmcx, 1);
  if (b.dataset.pmcr) {
    const x = (PM.cres || [])[+b.dataset.pmcr];
    F.consultas.push(x ? { centro_id: x.id, nombre: x.nombre, direccion: x.direccion, municipio: x.municipio, dias: {} } : { nombre: $('pmcq').value.trim(), direccion: '', dias: {} });
    $('pmcq').value = ''; $('pmcres').innerHTML = '';
  }
  pmRepintarConsultas();
});
document.addEventListener('focusout', e => { const x = e.target.closest && e.target.closest('#pmficha [data-pmhi]'); if (x) { const v = pmHora(x.value); if (v) x.value = v; } });

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

// ——— Material y dudas: las tarjetas de siempre, en su pestaña, con su ayuda ———
portalMedico = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  if (!ES_MEDICO()) return r;   // v2.282.0: también el centro
  const c = $('mdcons'); if (c) c.remove();   // la constancia va en el Resumen
  const ay = { mdmat: ['Pedir material', 'Pide el material que te ofrece la empresa (folletos, catálogos…). Le llega a tu comercial, que te lo entrega; mientras está pendiente lo puedes anular.'],
    mdmsg: ['Dudas a tu comercial', 'Escribe a tu comercial cualquier duda. Te contestará aquí y te llegará un aviso.'] };
  Object.entries(ay).forEach(([id, [t, x]]) => { const h = document.querySelector('#' + id + ' > h2'); if (h && !h.querySelector('.ai')) h.insertAdjacentHTML('beforeend', ' ' + pmAyu(t, x)); });
  return r;
})(portalMedico);

// ——— Sin manual, sin «Inicio» y Configuración con lo suyo ———
arbolCfgUnico = (orig => function (...a) {
  const g = orig.apply(this, a);
  if (!ES_MEDICO()) return g;
  return g.map(([t, l]) => [t, (l || []).filter(x => x.k === 'datos' || x.k === 'notif').map(x => x.k === 'datos' ? Object.assign({}, x, { d: 'Nombre, teléfono, idioma y contraseña' }) : x)]).filter(([, l]) => l.length);
})(arbolCfgUnico);
resumirAyuda = (orig => function (pop) {
  orig.call(this, pop);
  if (ES_MEDICO()) pop.querySelectorAll('.aiman').forEach(x => x.remove());
})(resumirAyuda);
ir = (orig => function (t, ...a) {
  if (ES_MEDICO() && !['informe', 'config', 'perfil'].includes(t)) t = 'informe';   // v2.282.0: también el centro
  return orig.call(this, t, ...a);
})(ir);

// ——— En la ficha del equipo: lo que ha enviado desde su portal ———
async function fichaPropuesta(id) {
  if (ES_MEDICO() || FICHA_ID !== id || !$('fbody') || $('fprop')) return;
  const { data: p } = await RPC_ORIG('ficha_propuesta', { p_cuenta: id });
  if (!p || FICHA_ID !== id || !$('fbody') || $('fprop')) return;
  const d = p.datos || {}, rf = await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id), m = (rf && rf.data && rf.data.medico) || {};
  const fila = (t, ahora, nuevo) => nuevo && nuevo !== ahora ? `<div class="fpdif"><span class="sm">${t}</span><span>${ahora ? `<s>${esc(ahora)}</s> → ` : ''}<b>${esc(nuevo)}</b></span></div>` : '';
  const horario = dd => PM_DIAS.filter(k => dd && dd[k]).map(k => `${PM_DIAN[k].slice(0, 3)} ${esc(dd[k])}`).join(' · ') || 'Sin horario';
  const html = `<section class="blk fprop" id="fprop"><h3>Datos enviados desde su portal <span class="pill p-warn">Por revisar</span></h3>
    <p class="sm">${esc(p.quien || TT('medico', 's', 'el', 'l', 'C'))} los envió el ${horaCorta(p.modificado_en)}. Pásalos a la ficha con «Editar la ficha» y márcalos como revisados.</p>
    ${fila('Teléfono', m.telefono, d.telefono)}${fila('Correo', m.email, d.email)}
    ${(d.consultas || []).map(c => `<div class="fpcon"><b>${esc(c.nombre || TT('consulta', 's', '', 'l', 'C'))}</b> ${c.centro_id || c.ubicacion_id ? '' : '<span class="pill p-per">Centro nuevo</span>'}
      <span class="sm">${esc([c.direccion, c.municipio].filter(Boolean).join(' · '))}</span><span class="sm">${horario(c.dias)}</span></div>`).join('')}
    ${d.visitas && (d.visitas.como || d.visitas.momento) ? `<div class="fpdif"><span class="sm">${TT('visita', 'p', '', 'l', 'C')}</span><span>${esc([d.visitas.como, d.visitas.momento].filter(Boolean).join(' · '))}</span></div>` : ''}
    ${d.notas ? `<div class="fpdif"><span class="sm">Notas</span><span>${esc(d.notas)}</span></div>` : ''}
    <div class="acts" style="justify-content:flex-start;margin:8px 0 0">${$('fbody').querySelector('[data-act=editar]') ? '<button type="button" class="btn sec" id="fpropedit">Editar la ficha</button>' : ''}
      <button type="button" class="btn" id="fpropok">Marcar como revisado</button></div></section>`;
  // Debajo de la cabecera de la ficha (nombre y botones), antes del primer bloque
  const ref = [...$('fbody').children].find(x => x.matches('.blk, section, .card') && x.id !== 'fprop');
  if (ref) ref.insertAdjacentHTML('beforebegin', html); else $('fbody').insertAdjacentHTML('beforeend', html);
  if ($('fpropedit')) $('fpropedit').onclick = () => { const e = $('fbody').querySelector('[data-act=editar]'); if (e) e.click(); };
  $('fpropok').onclick = async () => {
    const { data: r } = await db.rpc('revisar_propuesta', { p_id: p.id });
    if (!r || !r.ok) { toast(r && r.error === 'permiso' ? 'No tienes permiso para revisarlo' : 'No se ha podido marcar', true); return; }
    toast('Marcado como revisado'); const b = $('fprop'); if (b) b.remove();
  };
}
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); await fichaPropuesta(id); return r; })(abrirFicha);




