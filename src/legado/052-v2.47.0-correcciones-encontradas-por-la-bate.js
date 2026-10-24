/* ============================================================
   v2.47.0 · Correcciones encontradas por la batería de QA
   ============================================================ */

// Auditoría: los cambios se leen como texto (antes salía «[object Object]» con valores complejos)
function textoValor(v) {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  if (Array.isArray(v)) return v.length ? v.slice(0, 3).map(textoValor).join(', ') + (v.length > 3 ? '…' : '') : '—';
  if (typeof v === 'object') {
    if (v.nombre) return String(v.nombre);
    const k = Object.keys(v); return k.length ? k.slice(0, 3).map(x => `${x}: ${textoValor(v[x])}`).join(', ') + (k.length > 3 ? '…' : '') : '—';
  }
  return String(v);
}
function resumenDetalle(d) {
  if (!d) return '';
  if (typeof d !== 'object') return String(d).slice(0, 120);
  if (d.nombre && typeof d.nombre !== 'object') return String(d.nombre);
  const cambios = Object.keys(d).filter(k => Array.isArray(d[k]) && d[k].length === 2).slice(0, 4);
  if (cambios.length) return cambios.map(k => `${k}: ${textoValor(d[k][0]).slice(0, 24)} → ${textoValor(d[k][1]).slice(0, 24)}`).join(' · ');
  return Object.keys(d).slice(0, 4).map(k => `${k}: ${textoValor(d[k]).slice(0, 30)}`).join(' · ');
};

// Editar usuario y asignar cartera funcionan aunque la lista de usuarios aún no esté cargada (por ejemplo, desde una notificación)
async function asegurarUsuario(id) {
  if ((USUARIOS || []).some(x => x.id === id)) return;
  const { data } = await RPC_ORIG('usuarios_resumen', {});
  USUARIOS = (data || []).map(u => Object.assign({ medicos: u.cartera, visitas: u.visitas_mes }, u));
}
asignarCartera = (orig => async function (id, ...r) { await asegurarUsuario(id); return orig(id, ...r); })(asignarCartera);
// Una llamada sin fecha se abre con la fecha de ahora (antes fallaba al abrirse)
editorLlamada = (orig => function (l, ...r) { if (l && !l.fecha) l = Object.assign({}, l, { fecha: new Date().toISOString() }); return orig(l, ...r); })(editorLlamada);

// Registro de facturación: el detalle de cada evento en texto legible
const NOMBRES_DETALLE = { importe: 'Importe', forma: 'Forma de pago', motivo: 'Motivo', para: 'Para', asunto: 'Asunto', clave: 'Ajuste', total: 'Total', serie: 'Serie', numero: 'Número' };
function detalleEvento(d) {
  if (!d || typeof d !== 'object') return d ? String(d) : '—';
  const partes = Object.keys(d).filter(k => d[k] != null && d[k] !== '' && k !== 'valor' && !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(d[k]))).map(k => {
    const v = d[k]; const n = NOMBRES_DETALLE[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));
    return `${n}: ${typeof v === 'number' && /importe|total/.test(k) ? eur(v) : textoValor(v)}`;
  });
  return partes.join(' · ').slice(0, 160) || '—';
}


