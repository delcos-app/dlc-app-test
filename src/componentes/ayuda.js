// componentes/ayuda.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function ponerAyudas() {
  ANCLAS_AYUDA.forEach(([sel, k]) => {
    const h = document.querySelector(sel);
    if (h && !h.querySelector(':scope > .ai')) h.insertAdjacentHTML('beforeend', `<button class="ai" data-ayuda="${k}" aria-label="Ayuda">i</button>`);
  });
  const dt = $('dirtools');
  if (dt && !(dt.previousElementSibling && dt.previousElementSibling.matches('.ai')))
    dt.insertAdjacentHTML('beforebegin', '<button class="ai ai-dir" data-ayuda="directorio" aria-label="Ayuda">i</button>');
}

const ANCLAS_AYUDA = [
  ['#v-inicio .saludo h1', 'inicio'], ['#c-agenda > h2', 'ini_agenda'], ['#c-acciones > h2', 'ini_acciones'],
  ['#c-urgentes > h2', 'ini_urgentes'], ['#c-ultimas > h2', 'ini_ultimas'], ['#c-recom > h2', 'ini_recom'],
  ['#c-pend > h2', 'ini_pend'], ['#c-comision > h2', 'ini_comision'],
  ['#v-agenda .saludo h1', 'agenda'], ['#v-rutas .saludo h1', 'rutas'], ['#v-seguimiento .saludo h1', 'seguimiento'],
  ['#v-ventas .saludo h1', 'ventas'], ['#v-analitica .saludo h1', 'analitica'], ['#v-config .saludo h1', 'config'],
  ['#v-admin .saludo h1', 'admin'], ['#v-duplicados .saludo h1', 'duplicados']
];

const anclaAyuda = b => {
  const k = b.dataset.ayuda || '';
  if (b.dataset.manual) return b.dataset.manual;
  if (MANUAL_ANCLA[k]) return MANUAL_ANCLA[k];
  if (/^ini_/.test(k)) return MANUAL_ANCLA.inicio;
  return MANUAL_ANCLA[TAB] || '';
};
