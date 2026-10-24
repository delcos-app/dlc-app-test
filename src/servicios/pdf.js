// servicios/pdf.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarJsPDF() {
  if (window.jspdf) return window.jspdf.jsPDF;
  await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = new URL('jspdf.umd.min.js', location.href).href; s.onload = ok; s.onerror = ko; document.head.appendChild(s); });
  return window.jspdf.jsPDF;
}

// (v2.183.0: aquí iba la primera versión de facturaPDF; se redefine entera más abajo)
const nombrePDF = f => `${f.numero}_${String((f.cliente || {}).nombre || 'cliente').replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '_')}.pdf`;

const PDF_DEF = { logo: true, logoPos: 'izq', logoTam: 'm', color: '#1C2733', titulo: 'FACTURA', fuente: 'helvetica', empresaCab: false, clientePos: 'der',
  cols: { precio: true, unidades: true, subtotal: true, iva: true, total: true }, fotos: true, vencimiento: true, formaPago: true, iban: true, direccion: true,
  pieTel: true, pieWeb: true, pieTexto: true, paginas: true, qrPos: 'abajo' };

const cfgPDF = () => Object.assign({}, PDF_DEF, (AJUSTES || {}).factura_pdf || {}, { cols: Object.assign({}, PDF_DEF.cols, ((AJUSTES || {}).factura_pdf || {}).cols || {}) });
