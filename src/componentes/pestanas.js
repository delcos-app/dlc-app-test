// componentes/pestanas.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function subnavFacturacion() {
  // v2.75.0: durante el revelado atómico hay una copia congelada de la pantalla; el submenú va en la real
  const real = sel => [...document.querySelectorAll('#v-facturacion ' + sel)].find(x => !x.closest('.congelada'));
  const nav = real('.subnav'); if (!nav) return;
  const enConfig = FAC_CONFIG.some(x => x[0] === FSEC);
  if (enConfig) FAC_ULTIMA = FSEC;
  nav.querySelectorAll('[data-fsec]').forEach(b => { if (FAC_CONFIG.some(x => x[0] === b.dataset.fsec)) b.classList.add('hide'); });
  if (!nav.querySelector('[data-faccfg]') && puede('administrar')) {
    nav.insertAdjacentHTML('beforeend', `<button data-faccfg="1">${svgIco(ICON_NOM.settings)} Configuración</button>`);
    nav.querySelector('[data-faccfg]').onclick = () => { FSEC = FAC_ULTIMA; cargarFacturacion(); };
  }
  if (nav.querySelector('[data-faccfg]')) nav.querySelector('[data-faccfg]').setAttribute('aria-pressed', String(enConfig));
  let sub = real('.faccfgsub');
  if (sub && sub.previousElementSibling !== nav) { sub.remove(); sub = null; }
  if (enConfig && !sub) {
    nav.insertAdjacentHTML('afterend', `<div class="cfgsubs faccfgsub">${FAC_CONFIG.map(([k, t]) => `<button data-fsub="${k}" class="${k === FSEC ? 'on' : ''}">${t}</button>`).join('')}</div>`);
    // v2.87.0: «Diseño del PDF» se abre desde la configuración de facturación
    sub = real('.faccfgsub');
    if (sub && puede('administrar') && !sub.querySelector('[data-fpdf]')) sub.insertAdjacentHTML('beforeend', '<button data-fpdf="1">Diseño del PDF</button>');
    const bp = sub && sub.querySelector('[data-fpdf]'); if (bp) bp.onclick = () => disenoPDF();
    document.querySelectorAll('#v-facturacion [data-fsub]').forEach(b => b.onclick = () => { FSEC = b.dataset.fsub; cargarFacturacion(); });
  } else if (!enConfig && sub) sub.remove();
}
