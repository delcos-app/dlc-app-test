// componentes/teclado.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function teclaLista(inp) {
  const caja = inp.closest('.gsearch, .picker, .cpbus');
  if (caja) return caja.querySelector('.gsug, .cpres');
  // Lo primero con resultados que haya después del buscador, en su ventana o en su pantalla
  const zona = inp.closest('dialog, section, .card') || document.body;
  return [...zona.querySelectorAll(TECLA_LISTAS)].find(l => (inp.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING)
    && !l.closest('.hide') && teclaItems(l).length) || null;
}

function teclaItems(l) {
  const xs = l.matches('table') ? [...l.querySelectorAll(':scope > tbody > tr')]
    : l.matches('.dgrid') ? [...l.querySelectorAll(':scope > .dr')]
    : l.matches('.lista') ? [...l.children]
    : [...l.querySelectorAll('button, [role=option], a[href]')];
  return xs.filter(x => teclaVisible(x) && !x.matches('.gsh, .gload, .vacio, [disabled]'));
}

function teclaActivar(x) {
  const b = x.matches('button, a[href], [role=option], tr, .dr') ? x : (x.querySelector('button, a[href], [data-inificha]') || x);
  b.click();
}

/* v2.111.0 · Teclado en escritorio.
   1. Buscadores: con las flechas se recorren los resultados (el desplegable de sugerencias o, en los buscadores que filtran
      una lista o una tabla, sus filas) e Intro abre el marcado. El elemento marcado lleva la clase .activo.
   2. F5 (o Ctrl+R) recarga la app y vuelve a la pantalla en la que se estaba; Ctrl+F5 (o Ctrl+Mayús+R) entra de cero. */
const TECLA_LISTAS = '.gsug, .cpres, .lista, .dgrid, [role=listbox], table';

const teclaVisible = x => x.offsetParent !== null && !x.classList.contains('hide');
