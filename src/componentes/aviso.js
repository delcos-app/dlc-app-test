// @ts-check
// componentes/aviso.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function avisoCache(el, fecha) {
  if (!el) return;
  el.insertAdjacentHTML('afterbegin', `<div class="cacheaviso">Sin conexión · datos guardados
    ${fecha ? 'el ' + new Date(fecha).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</div>`);
}

function avisoSinSalida(el) {
  if (prefsActivas().salida || !el || el.querySelector('.sinsalida')) return;
  el.insertAdjacentHTML('afterbegin', `<div class="avisoh sinsalida"><span>📍 <b>Aún no has configurado tu punto de salida.</b> Las horas se calculan desde la ${TT('visita', 's', 'primer', 'l', 'l')}, sin el desplazamiento inicial.</span>
    <button class="btn sec chico" data-irprefs>Configurarlo</button></div>`);
}

// Si después se abre (o se vuelve a abrir) una ventana con el aviso a la vista, el aviso vuelve a ponerse encima
function subirAviso() { const t = $('toast'); if (!t || t.classList.contains('hide') || typeof t.showPopover !== 'function' || !t.hasAttribute('popover')) return; try { if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch (e) {} }

let tToast;

const avisoRevisita = () => Object.assign({ on: true, dias: 7 }, ((PERFIL.preferencias || {}).avisos || {}).revisita || {});
