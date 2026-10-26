// @ts-check
// servicios/pdf.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// El PDF de la factura está en src/app/services/pdf (v2.427.0). Estos nombres se quedan: Pedidos, el portal, Facturación,
// Configuración, Organización, legado 156 y las pruebas los usan.
const nombrePDF = f => window.delcos.core.pdf.pdfFileName(f);
const PDF_DEF = window.delcos.core.pdf.DEFAULT_DESIGN;
function listaPDF() { return window.delcos.core.pdf.templateList(); }
function guardarPDFPlantillas(v) { return window.delcos.core.pdf.saveTemplates(v); }
function facturaPDF(f, rn, cfg) { return window.delcos.core.pdf.invoicePdf(f, rn, cfg || null); }
function disenoPDF() { return window.delcos.core.pdf.openDesigner(); }
