// @ts-check
// pantallas/productos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarAlmacenes() { const { data } = await db.rpc('almacenes_lista'); ALMACENES = data || []; }

function loteRecepcion(l, uds, almId) {
  return `<div class="g2 rcl">
    <div class="g2" style="margin:0"><div><label>${window.delcos.t('legacyTexts.stockReception.units')}</label><input type="number" min="0" data-r="u" value="${uds}"></div>
      <div><label>${window.delcos.t('legacyTexts.stockReception.batch')}</label><input data-r="lote" placeholder="${window.delcos.t('legacyTexts.stockReception.batchPlaceholder')}"></div></div>
    <div class="g2" style="margin:0"><div><label>${window.delcos.t('legacyTexts.stockReception.expiry')}</label><input type="date" data-r="cad"></div>
      <div><label>${window.delcos.t('legacyTexts.stockReception.manufacture')}</label><input type="date" data-r="fab"></div></div>
    <div><label>${window.delcos.t('legacyTexts.stockReception.store')}</label><select data-r="alm">${ALMACENES.filter(a => a.activo).map(a => `<option value="${a.id}" ${a.id === almId ? 'selected' : ''}>${window.delcos.core.escapeText(a.nombre)}</option>`).join('')}</select></div></div>`;
}











async function refrescarProductos() {
  try { window.delcos.core.queue.forgetCache(); } catch (e) {}
  await cargarProductos();
  if (TAB === 'productos' && typeof window.delcos.screens.products.loadProductsModule === 'function') window.delcos.screens.products.loadProductsModule();
}



 // v2.440.0: SERVICIOS → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: PSEC → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: PRODF → estado de src/app (plan 6.6), accesible en window   // v2.88.0: filtros por campos del producto (Clasificadores)



 // v2.440.0: ESTADO_PROD → estado de src/app (plan 6.6), accesible en window

const vendible = p => (p.estado || 'Activo') === 'Activo';

const pillMaterial = e => `<span class="pill ${e === 'Pendiente' ? 'p-warn' : e === 'Entregado' ? 'p-est' : 'p-anu'}">${window.delcos.core.escapeText(e)}</span>`;

/* v2.196.0 · Material en depósito en el cliente (segunda tanda del estudio por sectores, SQL 122). Decisiones de Eric: solo en fichas de tipo
   Centro; lo usado se sabe por recuento o apuntando cada uso; lo usado crea un pedido en borrador y se propone reponerlo.
   - Ficha de un centro: bloque «Material en depósito» (unidades y productos) con «Abrir el depósito» o «Dejar material en depósito».
   - Ventana del depósito: lo que hay por lote y caducidad (aviso si caduca en menos de 60 días), lo usado en 90 días y los últimos
     movimientos; «Reponer» (de tu maletín o del almacén central), «Apuntar uso» (con referencia, sin datos del paciente) y «Recuento».
     Lo usado deja un pedido en borrador del centro («Ver el pedido») y ofrece «Reponer lo usado». */

const depCaducaPronto = f => f && f <= window.delcos.core.calendar.plusDays(window.delcos.core.calendar.today(), 60);

/* v2.198.0 · Cobertura por producto en el ciclo (segunda tanda, «Panel y ciclos», SQL 124). Decisiones de Eric: la cobertura mide los
   productos presentados en las visitas, y solo salen los que la administración marca como «Se promociona en las visitas».
   - Producto: casilla «Se promociona en las visitas».
   - Registrar visita: «Productos presentados» (los que se promocionan); el historial de la ficha dice qué se presentó.
   - Ciclo de visitas → «Por producto»: por cada producto, cuántos de A, B y C lo han oído este ciclo y a quiénes les falta (con «+ Cita»). */
 // v2.440.0: PROMO_PRODS → estado de src/app (plan 6.6), accesible en window   // [{ id, nombre }] de los productos que se promocionan (última lista leída)


async function cargarProductosBase() {
  const { data } = await db.rpc('productos_lista');
  const l = data || [];
  PRODUCTOS = l.filter(p => (p.tipo || 'producto') === 'producto');
  SERVICIOS = l.filter(p => p.tipo === 'servicio');
}



async function cargarProductos() {
  await cargarProductosBase();
  const { data } = await db.from('productos').select('id,estado');
  ESTADO_PROD = {}; (data || []).forEach(x => { ESTADO_PROD[x.id] = x.estado || 'Activo'; });
  [...PRODUCTOS, ...SERVICIOS].forEach(p => { p.estado = ESTADO_PROD[p.id] || 'Activo'; });
}

function productoPorDefecto() {
  const lista = PRODUCTOS.filter(p => p.tipo !== 'servicio' && vendible(p));
  const hab = localStorage.getItem('dlc-prod-habitual');
  return (lista.find(p => p.id === hab) || lista[0] || {}).id || '';
}

function opcionesProducto(id, nombre) {
  // En los pedidos solo aparecen los productos activos (y el que ya tuviera la línea)
  const lista = PRODUCTOS.filter(p => (p.tipo !== 'servicio' && vendible(p)) || p.id === id);
  const falta = id && !lista.some(p => p.id === id);
  return (falta ? `<option value="${id}" selected>${window.delcos.core.escapeText(nombre || window.delcos.t('legacyTexts.products.fromOrder'))}</option>` : '') +
    lista.map(p => `<option value="${p.id}" ${p.id === id ? 'selected' : ''}>${window.delcos.core.escapeText(p.nombre)}${vendible(p) ? '' : ' (' + window.delcos.core.escapeText(p.estado.toLowerCase()) + ')'}</option>`).join('')
    || '<option value="">' + window.delcos.t('legacyTexts.products.noneActive') + '</option>';
}

// Productos está en src/app/screens/products (v2.413.0). Estos nombres se quedan: el menú, la caché de pantallas (legado 057),
// los filtros de campos, Configuración, la ficha de la cuenta, «‹ Volver» (legado 089) y las pruebas los usan.

// El editor de producto y el material de visita están en src/app/screens/products/editor (v2.427.0). Estos nombres se quedan:
// Productos, Configuración, Visita y las pruebas los usan.
