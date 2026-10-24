/* ============================================================
   DLC OS 2.0 · Entrega 17 · Bloque E
   ============================================================ */

/* ---------------- copia local para consultar sin conexión ---------------- */

const CKEY = k => 'dlc-cache-' + (PERFIL ? PERFIL.id : '') + '-' + k;
const guardarCache = (k, d) => { try { localStorage.setItem(CKEY(k), JSON.stringify({ t: Date.now(), d })); } catch (e) {} };
const leerCache = k => { try { const x = JSON.parse(localStorage.getItem(CKEY(k)) || 'null'); return x ? x : null; } catch (e) { return null; } };

/** Llama a una función del servidor y guarda copia; sin conexión devuelve la última copia. */
async function rpcCache(fn, params, clave) {
  if (navigator.onLine) {
    const { data, error } = await db.rpc(fn, params);
    if (!error) { guardarCache(clave, data); return { data, cache: false }; }
  }
  const c = leerCache(clave);
  if (c) return { data: c.d, cache: true, fecha: c.t };
  return { data: null, cache: true };
}


/* ---------------- administración: secciones nuevas ---------------- */




/* ---------------- cartera y contraseña de un usuario ---------------- */





