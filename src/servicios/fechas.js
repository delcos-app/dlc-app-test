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
