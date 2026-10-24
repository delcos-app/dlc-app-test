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




