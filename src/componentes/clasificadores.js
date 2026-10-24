// componentes/clasificadores.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Los mismos criterios que campos_cumplen() en la base (para Productos, que se filtra aquí)
function clasCumple(v, f) {
  v = v || {};
  return Object.entries(f || {}).every(([k, c]) => {
    const x = v[k];
    if (!c || typeof c !== 'object') return x === c;
    if ('contiene' in c && !clasNorm(x).includes(clasNorm(c.contiene))) return false;
    for (const op of ['desde', 'hasta']) {
      if (!(op in c)) continue;
      if (x == null || x === '') return false;
      const a = typeof c[op] === 'number' ? +x : String(x);
      if (typeof a === 'number' && isNaN(a)) return false;
      if (op === 'desde' ? a < c[op] : a > c[op]) return false;
    }
    return true;
  });
}

function clasColsGuardadas(amb) { try { return JSON.parse(localStorage.getItem('clas-cols-' + amb)) || {}; } catch (e) { return {}; } }

// Columnas visibles: lo que haya elegido la persona o, si no ha elegido, «Columna en la tabla»
function clasVisibles(amb) {
  const g = clasColsGuardadas(amb);
  return (CAMPOS[amb] || []).filter(c => c.clave in g ? g[c.clave] : c.en_tabla);
}

function clasVeColumna(amb, clave) {
  if (amb === 'medico') return !!(colsConfig().find(c => c.k === 'cp:' + clave) || {}).on;
  return clasVisibles(amb).some(c => c.clave === clave);
}

function clasPonerColumna(amb, clave, on) {
  // Cuentas: sus columnas se guardan con las demás de la tabla (Elegir columnas)
  if (amb === 'medico') {
    const D = colsConfig(), x = D.find(c => c.k === 'cp:' + clave);
    if (x) x.on = on; else D.push({ k: 'cp:' + clave, on, w: 150 });
    colsGuardar(D); return;
  }
  const g = clasColsGuardadas(amb); g[clave] = on;
  try { localStorage.setItem('clas-cols-' + amb, JSON.stringify(g)); } catch (e) { /* sin almacenamiento: dura hasta recargar */ }
}

// Las columnas de los campos se añaden a la rejilla de la tabla
function clasRejilla(g, n) {
  if (!g || !n) return;
  const cs = getComputedStyle(g);
  g.style.setProperty('--cols', cs.getPropertyValue('--cols').trim() + ' 130px'.repeat(n));
  g.style.minWidth = (parseInt(cs.minWidth) || 900) + 140 * n + 'px';
}

// Texto de un filtro activo (para los chips)
function clasTextoFiltro(c, f) {
  if (f && typeof f === 'object') {
    if ('contiene' in f) return `${c.nombre} contiene «${f.contiene}»`;
    const t = x => campoTexto(c, x);
    return 'desde' in f && 'hasta' in f ? `${c.nombre}: de ${t(f.desde)} a ${t(f.hasta)}` : 'desde' in f ? `${c.nombre}: desde ${t(f.desde)}` : `${c.nombre}: hasta ${t(f.hasta)}`;
  }
  return `${c.nombre}: ${campoTexto(c, f)}`;
}

async function clasCargarValores(amb) {
  const { data } = await db.rpc('valores_campos', { p_ambito: amb });
  if (data) CLAS_VALORES[amb] = data;
  return CLAS_VALORES[amb] || {};
}

// Control de filtro de un campo según su tipo y cuántos valores tiene
function clasControl(c, act, vals, id) {
  const a = `id="${id}"`;
  if (c.tipo === 'si_no') return `<select ${a} data-clv><option value="">Todos</option>${[['true', 'Sí'], ['false', 'No']].map(([v, t]) =>
    `<option value="${v}" ${act === (v === 'true') ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  if (c.tipo === 'numero' || c.tipo === 'fecha') {
    const r = act && typeof act === 'object' ? act : {}, tipo = c.tipo === 'fecha' ? 'type="date"' : 'type="text" inputmode="decimal"';
    const val = x => x == null ? '' : esc(c.tipo === 'numero' ? String(x).replace('.', ',') : String(x));
    return `<div class="clasrango"><input ${a} ${tipo} data-clr="desde" value="${val(r.desde)}" placeholder="Desde" aria-label="${esc(c.nombre)}: desde">
      <input ${tipo} data-clr="hasta" value="${val(r.hasta)}" placeholder="Hasta" aria-label="${esc(c.nombre)}: hasta"></div>`;
  }
  const lista = c.tipo === 'lista' ? (c.valores || []) : (vals[c.clave] || []);
  if (lista.length <= CLAS_MAX_LISTA) {
    const ops = typeof act === 'string' && act && !lista.includes(act) ? lista.concat([act]) : lista;
    return `<select ${a} data-clv><option value="">Todos</option>${ops.map(v => `<option ${act === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
  }
  // Muchos valores: buscador con sugerencias
  const txt = act && typeof act === 'object' ? act.contiene || '' : typeof act === 'string' ? act : '';
  return `<input ${a} type="search" data-clbus list="${id}_l" value="${esc(txt)}" placeholder="Escribe para buscar" autocomplete="off">
    <datalist id="${id}_l">${lista.map(v => `<option value="${esc(v)}">`).join('')}</datalist>`;
}

// Sección «Clasificadores»: un filtro y la casilla «Columna» por cada campo de la pantalla
async function clasPintar(cont, amb, estado, alCambiar, alColumna, titulo) {
  if (!cont) return;
  const campos = clasCampos(amb);
  const cab = titulo === 'h3' ? '<h3 style="margin-top:18px">Clasificadores</h3>' : '<h4>Clasificadores</h4>';
  if (!campos.length) {
    cont.innerHTML = puedeCatalogos() ? `<div class="htbloque clasif">${cab}<p class="sm">Esta pantalla aún no tiene campos propios. Se crean en Configuración → Clasificadores.</p></div>` : '';
    return;
  }
  const vals = campos.some(c => c.tipo === 'texto' || (c.tipo === 'lista' && (c.valores || []).length > CLAS_MAX_LISTA)) ? await clasCargarValores(amb) : {};
  if (!cont.isConnected) return;
  const pref = 'clas_' + amb + '_';
  cont.innerHTML = `<div class="htbloque clasif">${cab}${campos.map((c, i) => `<div class="clascampo" data-clk="${esc(c.clave)}">
      <div class="clascab"><label for="${pref}${i}">${esc(c.nombre)}</label>
        <label class="clascol" title="Ver «${esc(c.nombre)}» como columna de la tabla"><input type="checkbox" data-clcol ${clasVeColumna(amb, c.clave) ? 'checked' : ''}> Columna</label></div>
      ${clasControl(c, estado[c.clave], vals, pref + i)}</div>`).join('')}</div>`;
  cont.querySelectorAll('[data-clk]').forEach(b => {
    const k = b.dataset.clk, c = campos.find(x => x.clave === k);
    const sel = b.querySelector('select[data-clv]');
    if (sel) sel.onchange = () => { if (!sel.value) delete estado[k]; else estado[k] = c.tipo === 'si_no' ? sel.value === 'true' : sel.value; alCambiar(); };
    const bus = b.querySelector('input[data-clbus]');
    if (bus) { let t; bus.oninput = () => { clearTimeout(t); t = setTimeout(() => { const x = bus.value.trim(); if (x) estado[k] = { contiene: x }; else delete estado[k]; alCambiar(); }, 400); }; }
    const rs = [...b.querySelectorAll('input[data-clr]')];
    rs.forEach(r => r.onchange = () => {
      const o = {};
      for (const z of rs) {
        const v = z.value.trim(); if (!v) continue;
        const n = c.tipo === 'numero' ? +v.replace(',', '.') : v;
        if (c.tipo === 'numero' && isNaN(n)) { toast(`«${c.nombre}» tiene que ser un número`, true); return; }
        o[z.dataset.clr] = n;
      }
      if (Object.keys(o).length) estado[k] = o; else delete estado[k];
      alCambiar();
    });
    const col = b.querySelector('[data-clcol]');
    if (col) col.onchange = () => { clasPonerColumna(amb, k, col.checked); alColumna(); };
  });
}

function clasPintarLateral(sec) {
  const P = clasPantalla(sec), cont = $('tools').querySelector('.htclas');
  if (P && cont && htLateralAbierto() && HERR_CTX === 'ht-' + sec.id.replace('v-', '')) clasPintar(cont, P.amb, P.estado(), P.recargar, P.recargar);
}
