// @ts-check
// servicios/api.js · la cola de escrituras y la caché de lecturas están en src/app/core/write-queue.ts y read-cache.ts (v2.425.0). Se quedan
// el estado compartido (cachés, contadores, consultas en curso), las claves antiguas de las respuestas y estos nombres: el legado, los
// puentes y las pruebas los usan. Normas: docs/normas_codigo.md.

function copiarClavesAntiguas(x) {
  if (Array.isArray(x)) { x.forEach(copiarClavesAntiguas); return; }
  if (!x || typeof x !== 'object') return;
  for (const k of Object.keys(x)) { copiarClavesAntiguas(x[k]); const v = CLAVES_NEUTRAS[k]; if (v && !(v in x)) x[v] = x[k]; }
}

async function respuestaConClavesAntiguas(url, r) {
  const m = /\/rest\/v1\/rpc\/([a-z0-9_]+)/.exec(String(url));
  if (!m || !FN_NEUTRAS.has(m[1]) || !r.ok) return r;
  const t = await r.clone().text();
  if (!RE_NEUTRAS.test(t)) return r;
  let j; try { j = JSON.parse(t); } catch (e) { return r; }
  copiarClavesAntiguas(j);
  const h = new Headers(r.headers); h.delete('content-length');
  return new Response(JSON.stringify(j), { status: r.status, statusText: r.statusText, headers: h });
}

/** Ejecuta una escritura; si no hay conexión, la guarda y la reenvía después. */
function escribir(fn, payload, etiqueta) { return window.delcos.core.queue.write(fn, payload, etiqueta); }
function invalidarCache() { return window.delcos.core.queue.forgetCache(); }
// Carga dentro de una tarjeta (paginación, cambios de página): mismo criterio
function colaLeer() { return window.delcos.core.queue.queued(); }
function escribirRpc(fn, payload) { return window.delcos.core.reads.writeQueued(fn, payload); }
/** Llama a una función del servidor y guarda copia; sin conexión devuelve la última copia. */
function rpcCache(fn, params, clave) { return window.delcos.core.reads.readCached(fn, params, clave); }

const RPC_TTL = {                 // segundos
  panel_inicio: 60, propuestas_rutas: 120, comision_periodo: 120, resumen_duplicados: 600,
  agenda_rango: 60, agenda_mes: 60, pendientes_ruta: 60, rutas_visibles: 120,
  buscar_cuentas: 60, buscar_global: 60, opciones_filtros: 600, mapa_cuentas: 120,
  ficha_cuenta: 30, seguimiento_lista: 60, resumen_seguimiento: 120,
  catalogo: 900, catalogos_todos: 900, productos_lista: 600, usuarios_lista: 300,
  esquemas_lista: 300, liquidaciones_lista: 120, pedidos_lista: 60, contactos_lista: 60,
  analitica_tabla: 120, analitica_unidades: 120, cartera_usuario: 60, duplicados_pendientes: 30
};

const RPC_ESCRITURA = /^(actualizar_|anular_|aplazar_|asignar_|recibir_|movimiento_|atribuir_|borrar_|crear_|estado_cita|guardar_|liquidar|ordenar_|perfil_nuevo|quitar_|registrar_actividad|registrar_visita|resolver_accion|tocar|unificar_|descartar_)/;

 // v2.440.0: RC_EPOCA → estado de src/app (plan 6.6), accesible en window

const rcLS = k => 'dlc-rc-' + (PERFIL ? PERFIL.id : '') + '-' + k;

const rcCopia = r => ({ data: r.data == null ? r.data : JSON.parse(JSON.stringify(r.data)), error: r.error || null });

const RPC_ORIG_FROM = t => FROM_ORIG(t);

 // v2.440.0: ESCRITURAS → estado de src/app (plan 6.6), accesible en window

const ES_ESCRITURA = /^(guardar|registrar_(?!error)|emitir|rectificar|marcar|borrar|eliminar|asignar|unificar|validar|anular|crear|descartar|restaurar|estado_|recibir|traspasar|vincular|mover|aplicar|reprogramar|cancelar|confirmar|terminar)/;

const CACHE_MOD = {};   // módulo → { clave, t, esc }

// 1. Todas las consultas a la base de datos, cuenten desde donde se hagan (también las que no pasan por los atajos)
let RED_PEND = 0;

const RED_EN_CURSO = new Set();   // momento de inicio de cada consulta en curso

let RED_ULTIMO_FIN = 0;   // cuándo terminó la última consulta

/* ============================================================
   v2.249.0 · Contactos y Clientes de una vez (listas sin fantasmas, primer grupo). Se sigue enseñando el esqueleto sin cargador
   encima (modelo «Lista» de la v2.236), pero ahora es fiel: cada pieza de la estructura (cabecera, indicadores, barra con
   buscador, filtros rápidos y recuento, tabla) está en su sitio desde el primer momento y al llegar los datos solo cambia lo de
   dentro. Antes el recuento del esqueleto medía distinto que la cifra y empujaba el buscador y los filtros, y en Clientes los
   filtros rápidos aparecían tarde (su desplegable se crea al llegar los datos) y salían dos esqueletos seguidos porque la lista
   esperaba a la de poblaciones. Ahora:
   - El recuento tiene sitio fijo y los filtros rápidos sin desplegable todavía se ven con su nombre, en espera (plespera).
   - Clientes pide a la vez las poblaciones y la lista (DB_PRE: lo pedido antes se entrega una vez, sin volver a la red) y el
     buscador espera 300 ms (antes 600: la barra y el campo oculto esperaban cada uno lo suyo).
   - Arreglos: «Volver a la búsqueda» de «Cerca de mí» funciona desde la barra (era una copia sin clic y con el id repetido);
     con el mapa abierto no queda la tabla vacía debajo; el resumen de filtros de antes (#chips) ya no aparece encima
     de la tabla empujándola (lo dicen los filtros rápidos y el número de la barra).
   ============================================================ */
// ---- Lo pedido antes, entregado una vez sin volver a la red
const DB_PRE = new Map();

// ---- La cola: lo que el servidor rechaza se guarda aparte para revisarlo
const COLA_KO = 'dlc-cola-ko';
