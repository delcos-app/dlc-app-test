// nucleo/en_vivo.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function avisosEnVivo() {
  if (VIVO || !PERFIL || !PERFIL.id || typeof db.channel !== 'function') return;
  if (['localhost', '127.0.0.1', '[::1]', '::1'].includes(location.hostname)) return;   // la copia local de pruebas no tiene servidor en vivo
  try {
    let espera = null;
    const alDia = (que) => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        refrescarCampana();
        if (ES_MEDICO() && $('v-informe') && TAB === 'informe') { try { if (puede('portal_centro') && typeof centroPintar === 'function') centroPintar(); else portalMedico(); } catch (e) {} }
        if (que !== 'notif' && typeof FICHA_ID !== 'undefined' && FICHA_ID && $('fportal')) { const b = $('fportal'); b.remove(); try { fichaPortal(FICHA_ID); } catch (e) {} }
      }, 400);
    };
    VIVO = db.channel('vivo-' + PERFIL.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: 'usuario_id=eq.' + PERFIL.id }, () => alDia('notif'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes_cuenta' }, () => alDia('msg'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_material' }, () => alDia('mat'))
      .subscribe();
  } catch (e) { VIVO = null; }
}

// ——— En vivo ———
let VIVO = null;
