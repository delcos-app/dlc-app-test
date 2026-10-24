let PLANT_ELEGIDA = { pago: null, factura: null }, PDF_ELEGIDO = null, PDF_EDITANDO = null;


// «Diseño del PDF»: barra de plantillas. Guardar un diseño que no es el de por defecto lo guarda en su plantilla (no en factura_pdf).
const RPC_V2342 = db.rpc;
db.rpc = function (fn, params, ...a) {
  if (fn === 'guardar_ajuste' && params && params.p_clave === 'factura_pdf' && PDF_EDITANDO) {
    const v = listaPDF(), id = PDF_EDITANDO;
    v.lista = v.lista.map(x => x.id === id ? Object.assign({}, x, { cfg: params.p_valor }) : x);
    const conDef = id === v.defecto;
    return (async () => {
      const ok = await guardarPDFPlantillas({ lista: v.lista, defecto: v.defecto });
      if (!ok) return { data: { ok: false }, error: null };
      if (conDef) return RPC_V2342.call(db, fn, params, ...a);
      setTimeout(() => { AJUSTES.factura_pdf = (v.lista.find(x => x.id === v.defecto) || {}).cfg || AJUSTES.factura_pdf; }, 0);   // el de por defecto no cambia
      return { data: { ok: true }, error: null };
    })();
  }
  return RPC_V2342.call(db, fn, params, ...a);
};

addEventListener('resize', () => { clearTimeout(FAB_RZ); FAB_RZ = setTimeout(() => { fabAOrdenador(); try { if (typeof plSync === 'function' && TAB) plSync(TAB); } catch (e) {} }, 120); });


