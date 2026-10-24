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
const PK_FESTIVOS = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];
function pkFestivo(iso) { return PK_FESTIVOS.includes(iso.slice(5)) || iso === isoMas(pkPascua(+iso.slice(0, 4)), -2); }
function pkLibre(iso) { const w = new Date(iso + 'T12:00:00').getDay(); return w === 0 || w === 6 || pkFestivo(iso); }
function pkDia(iso, n, hoy) {
  const f = new Date(iso + 'T12:00:00'), letra = 'DLMXJVS'[f.getDay()];
  const tit = `${f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}${pkFestivo(iso) ? ' (festivo)' : ''} · ${num(n)}`;
  return `<span class="${pkLibre(iso) ? 'fin' : ''} ${hoy ? 'u' : ''}" title="${esc(tit)}"><b>${f.getDate()}</b>${letra}</span>`;
}



