/* ============================================================
   DLC OS 2.0 · Entrega 17 · Bloque E
   ============================================================ */

/* ---------------- copia local para consultar sin conexión ---------------- */


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





