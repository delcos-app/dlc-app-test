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




const pmFaltaTxt = () => {
  const t = { horario: typeof PM_CENTRO === 'function' && PM_CENTRO() ? 'dónde y cuándo atendéis' : 'dónde y cuándo atiendes', telefono: 'un teléfono de contacto', visitas: `cómo prefieres ${TT('visita', 'p', 'el', 'l', 'l')}` };
  const l = PM.faltan.map(x => t[x]).filter(Boolean);
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1] : l[0] || 'algún dato';
};






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

abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); await fichaPropuesta(id); return r; })(abrirFicha);




