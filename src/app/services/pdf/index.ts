/**
 * The invoice PDF (v2.427.0): jsPDF, the designs and templates, drawing the invoice, downloading it and the designer. Published as
 * window.delcos.core.pdf for the legacy names cargarJsPDF, nombrePDF, PDF_DEF, listaPDF, guardarPDFPlantillas, facturaPDF,
 * descargarFacturaPDF and disenoPDF, which stay as adapters.
 */
export { chooseTemplate, completeDesign, currentDesign, DEFAULT_DESIGN, designOfTemplate, saveTemplates, templateList } from './design';
export { openDesigner } from './designer';
export { loadJsPdf, pdfFileName } from './document';
export { companyForPdf, downloadInvoicePdf, sampleInvoice } from './download';
export { invoicePdf } from './invoice';
