// componentes/filtros.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function htTipo(g) { return [...g.classList].find(c => c !== 'dgrid') || 'tabla'; }

function htOcultas(tipo) { try { return JSON.parse(localStorage.getItem('ht-cols-' + tipo)) || []; } catch (e) { return []; } }

function htLateralAbierto() { const d = $('tools'); return d.classList.contains('abierto') && String(HERR_CTX || '').startsWith('ht-'); }

function htDevolver() {
  const d = $('tools'), lat = d.querySelector('.htpropios.lat'); if (!lat) return;
  const sec = $('v-' + String(HERR_CTX || '').replace('ht-', '')), hold = sec && sec.querySelector('.htpanel .htpropios');
  if (hold) [...lat.children].forEach(ch => hold.appendChild(chicoEn(ch, true)));
}

// El botón va a la derecha de la cabecera y abre el panel lateral
function htColocarBoton(sec) {
  const b = sec.querySelector('.htbtn'); if (!b || b.dataset.v254) return;
  b.dataset.v254 = '1';
  const acts = b.parentElement; acts.appendChild(b); acts.classList.add('htacts');
  b.onclick = () => htAbrirLateral(sec);
  sec.querySelectorAll('.htpanel').forEach(p => p.classList.add('hide'));
  // Los selectores del panel lateral actualizan el contador
  $('tools').addEventListener('change', () => htContador(sec));
}

// Valor de una celda para ordenar o filtrar: { n: número } | { f: 'AAAA-MM-DD' } | { t: texto } | {} vacía
function htValor(txt) {
  const s = String(txt || '').replace(/\s+/g, ' ').trim();
  if (!s || s === '—' || s === '-') return {};
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) return { f: `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` };
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return { f: m[0] };
  m = s.toLowerCase().match(/^(?:[a-záéíóú]{3,4}\.? )?(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)[a-z.]*(?: (\d{4}))?/);
  if (m) { const y = m[3] || String(new Date().getFullYear()); return { f: `${y}-${String(MESES_CORTOS[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}` }; }
  m = s.match(/^[-−]?\s?\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*(?:€|%|uds?\.?|h|min|km)?$/i) || s.match(/^[-−]?\d+(?:[.,]\d+)?\s*(?:€|%|uds?\.?|h|min|km)?$/i);
  if (m) { const n = parseFloat(s.replace(/[−]/, '-').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); if (!isNaN(n)) return { n }; }
  return { t: s.toLowerCase() };
}

function htComparar(a, b) {
  const va = htValor(a), vb = htValor(b);
  const vacia = x => !('n' in x) && !('f' in x) && !('t' in x);
  if (vacia(va) || vacia(vb)) return vacia(va) - vacia(vb);
  if ('n' in va && 'n' in vb) return va.n - vb.n;
  if ('f' in va && 'f' in vb) return va.f < vb.f ? -1 : va.f > vb.f ? 1 : 0;
  return String(va.t ?? va.n ?? va.f).localeCompare(String(vb.t ?? vb.n ?? vb.f), 'es', { numeric: true, sensitivity: 'base' });
}

function htMarcarCabecera(g) {
  const tipo = htTipo(g), o = HT_ORDEN[tipo], cab = g.querySelector(':scope > .dh'); if (!cab) return;
  [...cab.children].forEach((c, i) => {
    const n = c.textContent.trim(), srv = ORD_SRV[tipo], ok = srv ? !!srv(i, n) : !htCeldaNoOrdenable(n);
    c.classList.toggle('htord', ok);
    c.classList.toggle('ord-asc', !!o && o.i === i && o.dir === 1);
    c.classList.toggle('ord-desc', !!o && o.i === i && o.dir === -1);
    if (ok) { c.setAttribute('role', 'button'); c.title = 'Ordenar por esta columna'; }
  });
}

function htOrdenarFilas(g) {
  const tipo = htTipo(g), o = HT_ORDEN[tipo]; htMarcarCabecera(g);
  if (!o || ORD_SRV[tipo]) return;
  const cab = g.querySelector(':scope > .dh'); if (!cab) return;
  const filas = [...g.querySelectorAll(':scope > .dr')];
  if (!filas.length) return;
  filas.forEach((f, k) => { if (f.dataset.htpos == null) f.dataset.htpos = k; });
  const orden = [...filas].sort((a, b) => o.dir * htComparar((a.children[o.i] || {}).textContent, (b.children[o.i] || {}).textContent) || (+a.dataset.htpos - +b.dataset.htpos));
  if (orden.some((f, k) => f !== filas[k])) { let ref = cab; orden.forEach(f => { ref.after(f); ref = f; }); }
}

function htQuitarOrden(g) {
  const filas = [...g.querySelectorAll(':scope > .dr')];
  if (filas.some(f => f.dataset.htpos == null)) return;
  let ref = g.querySelector(':scope > .dh');
  [...filas].sort((a, b) => +a.dataset.htpos - +b.dataset.htpos).forEach(f => { ref.after(f); ref = f; });
}

// Filtros por columna según el tipo de dato
function htTipoColumna(vals) {
  const v = vals.map(htValor).filter(x => Object.keys(x).length);
  if (!v.length) return 'texto';
  if (v.every(x => 'f' in x)) return 'fecha';
  if (v.every(x => 'n' in x)) return 'numero';
  return 'texto';
}

// Los filtros propios de cada pantalla se guardan en un contenedor oculto de la pantalla
// y se llevan al panel lateral al abrirlo (y vuelven al cerrarlo)
// v2.294 (R-02): los filtros propios son compactos en el panel de la pantalla y normales en el panel lateral: se marca al moverlos
function chicoEn(el, si) { [el, ...el.querySelectorAll('input, select')].forEach(x => { if (x.matches('input, select')) x.classList.toggle('chico', si); }); return el; }

function filtroGuardar(e) {
  const el = e.target; if (!el || !el.id || !/^(SELECT|INPUT)$/.test(el.tagName) || !el.closest('main .filtros, main .htpropios')) return;   // la fila de filtros o, con el modelo de página, el panel
  if (el.type === 'checkbox' || el.type === 'radio') return;
  FMEM[el.id] = el.value;
}

function filtrosRestaurar(root) {
  (root || document).querySelectorAll('.filtros select[id], .filtros input[id], .htpropios select[id], .htpropios input[id]').forEach(el => {
    if (!(el.id in FMEM) || el.value === FMEM[el.id] || el.type === 'checkbox' || el.type === 'radio') return;
    if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === FMEM[el.id])) return;
    el.value = FMEM[el.id];
  });
}

const HT = ['15:00-19:00', '16:00-19:00', '16:00-20:00', '17:00-20:00'];

let HERR_CTX = null;

// Pantallas con filtros propios que pasan al panel (la búsqueda por texto sigue a la vista)
const HT_FILTROS = { pacientes: '#v-pacientes .filtros', facturacion: '#v-facturacion .filtros', analitica: '#anper' };

const HT_ESTADO = {};   // por tabla: { texto, facetas: {col: valor} }

let HT_PEND = false;

let HT2_PEND = false;

/* v2.227.0 · Ordenar cualquier tabla por su columna y filtros por columna según su tipo (lista de Eric del 9/10/2026).
   - Pulsar el nombre de una columna ordena (▲), volver a pulsar invierte (▼) y una tercera vez quita el orden. Se recuerda por tabla.
   - Las tablas que se cargan por páginas se ordenan en la base para que valga para todas las páginas (SQL 135): Profesionales
     (buscar_cuentas: orden), Pedidos (pedidos_pagina: p_orden) y Clientes (clientes_lista: p_orden). El resto, en la pantalla.
   - «Filtros y columnas»: cada columna con el filtro de su tipo: texto («contiene»), número (desde/hasta) o fecha (desde/hasta, y nada si la
     pantalla ya tiene su «Periodo»). Fuera los desplegables inventados con lo que se ve: las listas de valores fijos son las de Clasificadores
     (su apartado propio). Tampoco se repiten columnas que la pantalla ya filtra con lo suyo (Estado, Canal…). */
const htNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

const HT_ORDEN = {};   // por tabla: { i, dir: 1 | -1, k }

const htGuardarOrden = () => { try { localStorage.setItem('delcos-orden', JSON.stringify(HT_ORDEN)); } catch (e) {} };

const htCeldaNoOrdenable = n => !n || /^(operativa|acciones?|productos)$/i.test(n);

const htNoFiltrable = n => !n || /^(operativa|acciones?)$/i.test(n);

// Los indicadores se piden aparte (RPC_ORIG): las listas «solo la última» descartarían las consultas paralelas
// Clics de la barra, los indicadores y el menú «⋯»
// Un filtro de campo personalizado cuenta si tiene algo (texto, lista o rango)
const filtroConValor = v => v != null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.values(v).some(x => x != null && x !== ''));

// ---- Memoria de filtros: lo que se elige en una fila de filtros se vuelve a poner cuando la pantalla se pinta de nuevo
const FMEM = {};
