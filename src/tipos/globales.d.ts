// Globales que vienen de fuera de src/ (librerías y config.js). Solo para la comprobación de tipos: no se publica en app.js.
declare const supabase: any;
declare const L: any;
declare const maplibregl: any;
declare const jspdf: any;
declare const QRCode: any;
declare const XLSX: any;
declare const ZXing: any;
declare const BarcodeDetector: any;
declare const CONFIG: any;
// El código nuevo (src/app) se publica en window.delcos para el código viejo mientras dura la migración
interface Window { delcos: any }
