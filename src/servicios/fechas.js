// servicios/fechas.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function rangoPeriodo(k) {
  const h = new Date(); h.setHours(12, 0, 0, 0);
  const y = h.getFullYear(), m = h.getMonth(), q = Math.floor(m / 3);
  const D = (a, b, c) => fechaLocal(new Date(a, b, c, 12));
  const mas = n => { const d = new Date(h); d.setDate(d.getDate() + n); return fechaLocal(d); };
  switch (k) {
    case 'hoy': return [fechaLocal(h), fechaLocal(h)];
    case 'ayer': return [mas(-1), mas(-1)];
    case 'semana': return [mas(-((h.getDay() + 6) % 7)), fechaLocal(h)];
    case '7d': return [mas(-6), fechaLocal(h)];
    case 'mes': return [D(y, m, 1), D(y, m + 1, 0)];
    case 'mesant': return [D(y, m - 1, 1), D(y, m, 0)];
    case 'tri': return [D(y, q * 3, 1), D(y, q * 3 + 3, 0)];
    case 'triant': return [D(y, q * 3 - 3, 1), D(y, q * 3, 0)];
    case 'anio': return [D(y, 0, 1), D(y, 11, 31)];
    case 'anioant': return [D(y - 1, 0, 1), D(y - 1, 11, 31)];
    default: return [null, null];
  }
}

/* ============================================================
   v2.330.0 · Avisos de Pedidos: el día bajo cada barra
   - Bajo cada barra, el número del día y su letra (L, M, X, J, V, S, D); al pasar por encima, la fecha y cuántos entraron.
   - Sábados, domingos y festivos nacionales (fijos y Viernes Santo) en otro color, la barra y su día.
   ============================================================ */
function pkPascua(y) {   // domingo de Pascua (algoritmo anónimo gregoriano)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3),
    h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function mesesEntre(d, h) {
  const out = []; const x = new Date(d.slice(0, 7) + '-01T12:00:00'), fin = new Date(h.slice(0, 7) + '-01T12:00:00');
  while (x <= fin && out.length < 36) { out.push(fechaLocal(x).slice(0, 7)); x.setMonth(x.getMonth() + 1); }
  return out;
}

// Fechas SIEMPRE en hora local (España): convertir a hora universal restaba un día de 00:00 a 02:00
const isoLocal = d => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return x.toISOString().slice(0, 10); };

const hoyISO = () => isoLocal(new Date());

let fechaLarga = d => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

const fechaCorta = s => { const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); };

const DIAS = ['L', 'M', 'X', 'J', 'V'];

const DIAN = { L: 'Lunes', M: 'Martes', X: 'Miércoles', J: 'Jueves', V: 'Viernes' };

const HM = ['09:00-13:00', '09:30-13:30', '10:00-14:00', '08:00-15:00'];

const isoMas = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoLocal(d); };

const lunesDe = iso => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoLocal(d); };

const hm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(Math.round(m) % 60).padStart(2, '0');

const pedirFecha = (msg, valor, o = {}) => appVentana({ msg, titulo: o.titulo || 'Elige la fecha', ok: o.ok || 'Aceptar', campo: { valor, tipo: 'date' } });

const periodoActual = () => hoyISO().slice(0, 7);

const periodoTxt = p => {
  const [a, m] = p.split('-');
  return ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][+m - 1] + ' ' + a;
};

const siguienteLaborable = () => {
  const d = new Date(); do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoLocal(d);
};

const fechaLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const PERIODOS = [['todo', 'Todo'], ['hoy', 'Hoy'], ['ayer', 'Ayer'], ['semana', 'Esta semana'], ['7d', 'Últimos 7 días'],
  ['mes', 'Mes actual'], ['mesant', 'Mes anterior'], ['tri', 'Trimestre actual'], ['triant', 'Trimestre anterior'],
  ['anio', 'Año actual'], ['anioant', 'Año anterior'], ['pers', 'Personalizado']];

const minHora = h => h ? (+String(h).slice(0, 2) * 60 + +String(h).slice(3, 5)) : null;

const LETRA_DIA = f => 'DLMXJVS'[new Date(f + 'T12:00:00').getDay()];

const txtReciente = l => l.map(x => `${x.tipo === 'visita' ? 'visitado' : 'cita'} el ${fechaCorta(x.fecha)}${x.usuario ? ' (' + x.usuario + ')' : ''}`).join(', ');

const MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const mesTxt = m => MESES_C[+m.slice(5, 7) - 1] + ' ' + m.slice(2, 4);

const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const DIAS_SEM = [['L', 'Lunes'], ['M', 'Martes'], ['X', 'Miércoles'], ['J', 'Jueves'], ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo']];

const hoyLetra = () => 'DLMXJVS'[new Date().getDay()];

const horaCorta = f => new Date(f).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/* v2.169.0 · Datos de facturación bien antes del primer recibo (petición de Eric: «¿quién garantiza que después de la prueba los datos están
   bien?»). En «Plan y suscripción», con suscripción de Stripe, los datos con los que se factura (razón social, NIF, correo y dirección, de la
   función «pagos», acción datos) y «Corregir datos» (portal de Stripe); lo que falta, marcado. Durante la prueba, en los 7 últimos días, aviso
   arriba para revisarlos. El alta se hace en la web (www.delcos.app/empezar.html): el empezar.html del panel lleva allí. */
const diasHasta = f => f ? Math.round((Date.parse(String(f).slice(0, 10)) - Date.parse(hoyISO())) / 864e5) : null;   // días de calendario

const pdFecha = v => v ? new Date(String(v).length === 10 ? v + 'T12:00:00' : v).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fechaDiaMes = f => f ? new Date(String(f).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : '';

const DIA_NOMBRE = f => new Date(String(f).slice(0, 10) + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long' });

const cirHora = c => c.hora ? String(c.hora).slice(0, 5) : '';

const lunesCinta = f => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return isoLocal(d); };

const diasMas = (f, n) => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return isoLocal(d); };

const MESES_CORTOS = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12 };
