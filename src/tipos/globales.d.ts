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
// El código nuevo (src/app) se publica en window.delcos para el código viejo mientras dura la migración. Su tipo es el de verdad
// (DelcosCore de src/app/main.ts): «npm run check» escribe antes las declaraciones de src/app en .tipos/ (tsconfig.tipos.json),
// así cada adaptador de una línea se comprueba contra la función nueva (nombre, número y tipo de los argumentos).
// La configuración de config.js y la librería de Supabase llegan como propiedades de window.
interface Window { delcos: import('../../.tipos/main').DelcosCore; DLC_CONFIG: any; supabase: any }
