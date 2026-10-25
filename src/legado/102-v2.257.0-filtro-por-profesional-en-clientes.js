document.addEventListener('click', e => {
  const b = e.target.closest('#v-pacientes [data-plmed]'); if (!b) return;
  // Solo se vuelve a pedir la lista (volver a pintar los filtros dejaba los de antes en el panel lateral, con los mismos id)
  e.stopPropagation(); PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0;
  const m = $('pacmedx'); if (m && m.parentElement && m.parentElement.parentElement) m.parentElement.parentElement.remove();
  listaPacientes();
}, true);
// «Columnas» siempre abre el panel: está en la configuración de Clientes (src/app/components/list-bar, v2.421.0)




