// componentes/graficos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function svgBarras(meses, a, b, etiquetas) {
  // v2.108.0: con dos series ya no se mezclan dos escalas en un mismo eje: se dibujan dos gráficos pequeños,
  // uno encima del otro, con los mismos meses alineados (arriba barras, abajo línea), cada uno con su escala y su título.
  const caja = $('angraf'), W = Math.max(420, Math.min(1400, ((caja && caja.clientWidth) || 700) - 40)), P = 34, n = meses.length || 1;
  const salta = typeof ES_MOVIL === 'function' && ES_MOVIL() && n > 6, labOk = i => !salta || (n - 1 - i) % 2 === 0;   // v2.338.0: en el móvil, un mes sí y otro no (se pisaban)
  const x = i => P + (W - P * 2) * (i + .5) / n;
  const esEur = t => /importe|euros|€/i.test(t || '');
  const fmt = (v, t) => esEur(t) ? eurI(v) : num(v);
  const barras = (serie, etq, H, conMeses) => {
    const max = Math.max(1, ...serie), base = H - (conMeses ? 26 : 10), y = v => base - (base - 22) * v / max, bw = Math.max(6, (W - P * 2) / n * .62);
    return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="${esc(etq)} por mes">
      <line x1="${P}" y1="${base}" x2="${W - P}" y2="${base}" class="eje"/>
      ${serie.map((v, i) => `<g><rect x="${x(i) - bw / 2}" y="${y(v)}" width="${bw}" height="${base - y(v)}" rx="4" class="barra1"><title>${mesTxt(meses[i])}: ${fmt(v, etq)} ${esEur(etq) ? '' : esc(etq.toLowerCase())}</title></rect>
        ${v ? `<text x="${x(i)}" y="${y(v) - 5}" class="val">${fmt(v, etq)}</text>` : ''}
        ${conMeses && labOk(i) ? `<text x="${x(i)}" y="${H - 8}" class="lab">${mesTxt(meses[i])}</text>` : ''}</g>`).join('')}
    </svg>`;
  };
  if (!b) return barras(a, etiquetas[0], 230, true);
  const linea = (serie, etq, H) => {
    const max = Math.max(1, ...serie), base = H - 26, y = v => base - (base - 22) * v / max;
    // Etiqueta solo en el máximo y en el último mes con dato
    const ultimo = serie.reduce((k, v, i) => v ? i : k, -1), imax = serie.indexOf(Math.max(...serie));
    return `<svg viewBox="0 0 ${W} ${H}" class="grafico" role="img" aria-label="${esc(etq)} por mes">
      <line x1="${P}" y1="${base}" x2="${W - P}" y2="${base}" class="eje"/>
      <polyline points="${serie.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" class="linea2"/>
      ${serie.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" class="punto2"><title>${mesTxt(meses[i])}: ${fmt(v, etq)}</title></circle>
        ${v && (i === imax || i === ultimo) ? `<text x="${x(i)}" y="${y(v) - 9}" class="val">${fmt(v, etq)}</text>` : ''}
        ${labOk(i) ? `<text x="${x(i)}" y="${H - 8}" class="lab">${mesTxt(meses[i])}</text>` : ''}`).join('')}
    </svg>`;
  };
  return `<div class="grafdos">
    <div class="grafuno"><div class="graftit"><i class="c1"></i>${esc(etiquetas[0])}</div>${barras(a, etiquetas[0], 150, false)}</div>
    <div class="grafuno"><div class="graftit"><i class="c2"></i>${esc(etiquetas[1])}</div>${linea(b, etiquetas[1], 170)}</div>
  </div>`;
}

function barrasH(items, fmt) {
  const max = Math.max(1, ...items.map(x => x.v));
  return `<div class="barrash">${items.map((x, i) => `<div class="bh"><span class="bhn">${i + 1}. ${esc(x.n)}</span>
    <span class="bhb"><i style="width:${Math.max(2, x.v / max * 100)}%"></i></span><b>${fmt(x.v)}</b></div>`).join('')}</div>`;
}

function anLinea(vals, meses) {
  const mx = Math.max(...vals), mn = Math.min(...vals, 0), W = 200, H = 40, rg = (mx - mn) || 1;
  const pts = vals.map((x, i) => [i * W / 5, H - 4 - (H - 8) * (x - mn) / rg]);
  const dl = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return `<svg class="avsp" viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${dl} L200 46 L0 46 Z"/><path class="l" pathLength="100" d="${dl}"/></svg>
    <span class="avpt" style="left:${(pts[5][0] / 2).toFixed(1)}%;top:${(pts[5][1] / 46 * 100).toFixed(1)}%"></span>
    <div class="avm">${meses.map(([a]) => `<span>${AN_MES[+a.slice(5, 7) - 1]}</span>`).join('')}</div>`;
}

/* v2.339.0 · «Reparto por producto» en barras (Eric: el anillo dejaba media tarjeta vacía): total arriba y, por producto, barra con
   unidades y porcentaje, hasta 10 (los demás juntos en «Otros»), con el mismo ritmo que la tarjeta de al lado. */
function barrasReparto(items) {
  const l = [...items].sort((a, b) => b.v - a.v), tot = l.reduce((n, x) => n + x.v, 0) || 1;
  const vis = l.length > 10 ? [...l.slice(0, 9), { n: 'Otros (' + (l.length - 9) + ')', v: l.slice(9).reduce((n, x) => n + x.v, 0) }] : l;
  const pc = v => { const p = v / tot * 100; return (p > 0 && p < 1 ? '<1' : Math.round(p)) + ' %'; };
  return `<div class="reptot"><b>${num(tot)}</b> unidades · ${num(l.length)} ${l.length === 1 ? 'producto' : 'productos'}</div>
    <div class="barrash reparto">${vis.map(x => `<div class="bh"><span class="bhn" title="${esc(x.n)}">${esc(x.n)}</span>
      <svg class="bhsvg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect class="f" width="100" height="12" rx="6"/><rect class="v" width="${Math.max(2, x.v / tot * 100).toFixed(1)}" height="12" rx="6"/></svg><b>${num(x.v)}</b><span class="sm bhp">${pc(x.v)}</span></div>`).join('')}</div>`;
}
