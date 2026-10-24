// servicios/formato.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

const num = n => Number(n || 0).toLocaleString('es');

const durTxt = ms => { const m = Math.floor(ms / 60000); return (m >= 60 ? Math.floor(m / 60) + ' h ' : '') + (m % 60) + ' min'; };

const eur = n => Number(n || 0).toLocaleString('es', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

const r2 = n => Math.round((+n || 0) * 100) / 100;

const eurI = n => eur(r2(n));

const txtMin = m => hm(m);

const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

const TIPOS_IVA = [[21, 'General · 21 %'], [10, 'Reducido · 10 %'], [4, 'Superreducido · 4 %'], [0, 'Exento · 0 %']];

// IVA: siempre una lista con los tipos legales, en cualquier ventana (se detecta por su nombre o su etiqueta)
const ES_IVA = i => /iva/i.test(i.id + ' ' + (i.dataset.f || '') + ' ' + (i.name || '')) || /\bIVA\s*\(%\)|tipo de iva/i.test(((i.id && document.querySelector(`label[for="${i.id}"]`)) || {}).textContent || '');

const ES_IMPORTE = /imp|importe|total|base|precio|pvp|coste|cobro|con_iva|conIva|sin_iva/i;

const ivaDe = x => Math.round(x * 21) / 100;

/* v2.174.0 · Recibo con IVA como en la web (repaso de Web delcos): fecha larga («el 3 de noviembre»), importes enteros sin decimales (490 €), sin la
   línea «Próximo recibo el …» que repetía la fecha y, bajo la cuota «Al mes, sin IVA», lo mismo con IVA. */
const eurW = n => { const s = eur(n); return Math.round(+n * 100) % 100 === 0 ? s.replace(/,00(?=\s?€)/, '') : s; };
