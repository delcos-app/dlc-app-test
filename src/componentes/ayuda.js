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
