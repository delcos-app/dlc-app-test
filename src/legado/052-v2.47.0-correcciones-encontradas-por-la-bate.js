/* ============================================================
   v2.47.0 · Correcciones encontradas por la batería de QA
   ============================================================ */

;

asignarCartera = (orig => async function (id, ...r) { await asegurarUsuario(id); return orig(id, ...r); })(asignarCartera);
// Una llamada sin fecha se abre con la fecha de ahora (antes fallaba al abrirse)
editorLlamada = (orig => function (l, ...r) { if (l && !l.fecha) l = Object.assign({}, l, { fecha: new Date().toISOString() }); return orig(l, ...r); })(editorLlamada);

// Registro de facturación: el detalle de cada evento en texto legible
const NOMBRES_DETALLE = { importe: 'Importe', forma: 'Forma de pago', motivo: 'Motivo', para: 'Para', asunto: 'Asunto', clave: 'Ajuste', total: 'Total', serie: 'Serie', numero: 'Número' };


