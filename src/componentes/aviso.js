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
let AVISOS_MUDOS = false;   // true mientras se prueba algo que podría avisar sin que deba verse (citaConMenu)

const avisoRevisita = () => Object.assign({ on: true, dias: 7 }, ((PERFIL.preferencias || {}).avisos || {}).revisita || {});

/**
 * Aviso de la esquina. Fundido de sus capas (R-12):
 * - en solo lectura (empresa con el pago pendiente), un error se explica con ese motivo (v2.162.0);
 * - entra deslizándose aunque sustituya a otro que sigue a la vista (un nodo nuevo repite la entrada) y se va desvaneciéndose (.sale,
 *   260 ms) a los 3,2 s (v2.187.0);
 * - siempre por encima de todo: las ventanas modales van en la capa superior del navegador, así que se abre también ahí como
 *   «popover» manual, después de ellas (v2.308.0).
 * @param {string} msg
 * @param {boolean} [err]
 */
function toast(msg, err) {
  if (AVISOS_MUDOS) return;
  if (err && PAGO_ESTADO && PAGO_ESTADO.solo_lectura) msg = 'Tu empresa está en solo lectura hasta que se actualice el pago (Plan y suscripción)';
  const v = $('toast');
  if (!v) return;
  const t = /** @type {HTMLElement} */ (v.cloneNode(true)); v.replaceWith(t);
  t.textContent = msg; t.className = 'toast' + (err ? ' err' : '');
  clearTimeout(tToast);
  tToast = setTimeout(() => { t.classList.add('sale'); tToast = setTimeout(() => { t.classList.add('hide'); t.classList.remove('sale'); }, 260); }, 3200);
  if (typeof t.showPopover === 'function') {
    try { if (!t.hasAttribute('popover')) t.setAttribute('popover', 'manual'); if (t.matches(':popover-open')) t.hidePopover(); t.showPopover(); } catch (e) {}
  }
}
