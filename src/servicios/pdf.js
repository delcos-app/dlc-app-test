// servicios/pdf.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = new URL('jspdf.umd.min.js', location.href).href; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.jspdf.jsPDF;
}
