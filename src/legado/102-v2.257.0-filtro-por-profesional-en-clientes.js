/* ============================================================
   v2.257.0 · Filtro por profesional en Clientes y uso de TomTom en el Panel delcos (pendientes repasados con Eric, 11/10/2026).
   - Clientes: el filtro por profesional (al llegar desde su ficha) se aplicaba pero no se veía en la pantalla: ahora es un filtro
     rápido marcado en la barra, con su «✕» para quitarlo. «Columnas» abría y cerraba el panel según estuviera: ahora siempre lo abre.
   - Panel delcos → Estado de la plataforma: cuántas consultas de rutas (TomTom) se han hecho hoy frente al tope de todas las empresas,
     en el mes, y por empresa frente a su cupo (rutas_uso_resumen, SQL 138).
   ============================================================ */
plSync = (orig => function (tab, ...x) {
  const r = orig.call(this, tab, ...x);
  if (tab !== 'pacientes') return r;
  const rap = document.querySelector('#v-pacientes > .pltool .plrap'); if (!rap) return r;
  let b = rap.querySelector('[data-plmed]');
  if (!PAC.medico) { if (b) b.remove(); return r; }
  const txt = `${TT('medico', 's', '', 'l', 'C')}: ${PAC.medicoNombre || '—'}`;
  if (!b) { rap.insertAdjacentHTML('afterbegin', '<button type="button" class="plchip on plmed" data-plmed title="Quitar este filtro"><span></span><i aria-hidden="true">✕</i></button>'); b = rap.querySelector('[data-plmed]'); }
  const s = b.querySelector('span'); if (s.textContent !== txt) s.textContent = txt;
  return r;
})(plSync);
document.addEventListener('click', e => {
  const b = e.target.closest('#v-pacientes [data-plmed]'); if (!b) return;
  // Solo se vuelve a pedir la lista (volver a pintar los filtros dejaba los de antes en el panel lateral, con los mismos id)
  e.stopPropagation(); PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0;
  const m = $('pacmedx'); if (m && m.parentElement && m.parentElement.parentElement) m.parentElement.parentElement.remove();
  listaPacientes();
}, true);
PL.pacientes.columnas = () => {
  const abrir = () => { const c = $('tools') && $('tools').querySelector('.t2abrir'); if (c) c.click(); };
  const t = $('tools');
  if (t && t.classList.contains('abierto') && t.querySelector('.t2abrir')) return abrir();
  const b = document.querySelector('#v-pacientes .htbtn'); if (!b) return;
  b.click(); setTimeout(abrir, 80);
};




