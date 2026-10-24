// servicios/api.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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
async function escribir(fn, payload, etiqueta) {
  if (!navigator.onLine) {
    colaGuardar(colaLeer().concat([{ fn, payload: marcarSinConexion(fn, payload), etiqueta, t: Date.now() }]));
    pintarConexion();
    toast('Sin conexión: se enviará al recuperarla');
    return { offline: true };
  }
  const { data, error } = await db.rpc(fn, payload);
  if (error) {
    if (String(error.message || '').match(/fetch|network|Failed/i)) {
      colaGuardar(colaLeer().concat([{ fn, payload: marcarSinConexion(fn, payload), etiqueta, t: Date.now() }]));
      pintarConexion();
      toast('Guardado en este dispositivo: se enviará luego');
      return { offline: true };
    }
    return { error };
  }
  return { data };
}

function invalidarCache() {
  RC.clear(); RC_VUELO.clear(); RC_EPOCA++;
  try { ESQUEMAS = []; } catch (e) {}          // listas guardadas en memoria que deben volver a pedirse
  try { Object.keys(localStorage).filter(k => k.startsWith('dlc-rc-')).forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

function marcarSinConexion(fn, payload) {
  if (fn !== 'registrar_actividad' || !payload || !payload.p) return payload;
  return Object.assign({}, payload, { p: Object.assign({}, payload.p, { sin_conexion: true }) });
}

function colaPoner(op) {
  try { colaGuardar(colaLeer().concat([op])); return true; }
  catch (e) { toast('El móvil no tiene espacio para guardar este cambio sin conexión', true); return false; }
}

function colaKoPoner(op, motivo) { try { localStorage.setItem(COLA_KO, JSON.stringify(colaKo().concat([Object.assign({}, op, { motivo, falla: Date.now() })]))); } catch (e) {} }
