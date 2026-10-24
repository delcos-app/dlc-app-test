
window.PM_LISTO = true;










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




