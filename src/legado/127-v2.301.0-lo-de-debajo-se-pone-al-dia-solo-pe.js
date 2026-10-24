/* ============================================================
   v2.301.0 · Lo de debajo se pone al día solo (petición de Eric): al guardar una ficha, un centro o sus profesionales,
   las citas y listas que dependen de ellos se refrescan sin recargar. Se borra al momento lo guardado en memoria (así la
   ventana que vuelve a abrirse ya trae lo nuevo) y la pantalla de debajo se repinta en silencio al cerrarse las ventanas.
   ============================================================ */
const ESCRITURAS_FICHAS = new Set(['guardar_cuenta', 'guardar_centro', 'centro_anadir_profesional', 'centro_quitar_profesional', 'guardar_campos',
  'unificar_cuentas', 'archivar_cuenta', 'clasificar_cuentas']);
db.rpc = (orig => function (fn, args, ...r) {
  const res = orig.call(this, fn, args, ...r);
  if (!ESCRITURAS_FICHAS.has(fn) || !res || typeof res.then !== 'function') return res;
  return res.then(x => {
    if (x && !x.error) { invalidarCache(); try { DB_PRE.clear(); } catch (e) {} setTimeout(refrescarDebajo, 0); }
    return x;
  });
})(db.rpc);
['dlg', 'dlg2', 'ficha'].forEach(id => { const d = $(id); if (d) d.addEventListener('close', () => setTimeout(() => { if (DATOS_CAMBIADOS) refrescarDebajo(); }, 450)); });

