/* ============================================================
   v2.47.0 · Correcciones encontradas por la batería de QA
   ============================================================ */

;

async function asignarCartera(id, ...r) { await asegurarUsuario(id); return asignarCarteraBase(id, ...r); }
// Una llamada sin fecha se abre con la fecha de ahora (antes fallaba al abrirse)



