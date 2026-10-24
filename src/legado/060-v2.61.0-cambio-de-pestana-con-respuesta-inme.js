/* ============================================================
   v2.61.0 · Cambio de pestaña con respuesta inmediata, ayudas
   breves con enlace al manual, diseño del PDF de factura
   configurable y ajustes de Facturación, Manual, Analítica y Cuentas
   ============================================================ */

/* ---------------- 1. Cambio de pestaña: respuesta inmediata y vista anterior atenuada ---------------- */

// Se registra al apoyar el dedo o el ratón (antes del clic), para que la vista fija sepa qué botón se ha pulsado
document.addEventListener('pointerdown', e => { CLIC_PESTANA = e.target.closest('button, [data-ag]'); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') CLIC_PESTANA = e.target.closest && e.target.closest('button, [data-ag]'); }, true);
// Pestañas de la configuración de Facturación también
document.addEventListener('click', e => { const b = e.target.closest('main [data-fsub], main [data-faccfg]'); if (b && b.getAttribute('aria-pressed') !== 'true' && !b.classList.contains('on')) congelar(b.closest('main > section')); }, true);

/* ---------------- 2. Ayudas: breves, con enlace al manual ---------------- */

new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList.contains('aipop')) resumirAyuda(n); })
  .observe(document.body, { childList: true });
function resumirAyudaBase(pop) {
  const txt = pop.textContent || '';
  const lis = [...pop.querySelectorAll('li')];
  if (txt.length > 320 || lis.length > 3) {
    lis.slice(3).forEach(l => l.remove());
    // El texto principal se deja en su primera frase
    const w = document.createTreeWalker(pop, NodeFilter.SHOW_TEXT); let primero = true;
    while (w.nextNode()) { const x = w.currentNode; if (x.parentElement.tagName === 'B' || x.parentElement.closest('li')) continue;
      if (primero && x.nodeValue.length > 200) { const cut = x.nodeValue.slice(0, 200); x.nodeValue = cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' '))) + '…'; } primero = false; }
  }
  const mod = TAB;
  pop.insertAdjacentHTML('beforeend', `<a href="#" class="aiman">Ver más en el manual de uso →</a>`);
  pop.querySelector('.aiman').onclick = ev => {
    ev.preventDefault(); pop.remove(); ir('manual');
    setTimeout(() => { const q = $('manq'); const nom = (document.querySelector(`nav.main [data-t="${mod}"]`) || {}).textContent || mod; if (q) { q.value = nom.trim(); q.dispatchEvent(new Event('input', { bubbles: true })); } }, 350);
  };
}
// Texto explicativo de una tarjeta → ayuda «i» junto a su título
// v2.242.0: aquí iba textoAAyuda (nadie la usaba)

/* ---------------- 3. Facturación: Series, Registro y VeriFactu ---------------- */

new MutationObserver(() => ajustarFacturacion()).observe($('v-facturacion'), { childList: true, subtree: true });

/* ---------------- 4. Cuentas: el icono sigue el modo real (mapa o lista) ---------------- */


/* ---------------- 5. Diseño del PDF de la factura ---------------- */

new MutationObserver(botonDisenoPDF).observe($('v-facturacion'), { childList: true, subtree: true });


/* ---------------- v2.62.0 · acceso: recordar el correo y mantener la sesión ---------------- */

(function () {
  const lu = $('lu'), f = $('lform'); if (!lu || !f) return;
  try { const c = localStorage.getItem('dlc-ultimo-correo'); if (c && !lu.value) { lu.value = c; setTimeout(() => { if ($('lp') && document.activeElement !== lu) $('lp').focus(); }, 50); } } catch (e) {}
  if (!$('lrecordar')) $('lbtn').insertAdjacentHTML('beforebegin', `<label class="opt lrecordar"><input type="checkbox" id="lrecordar" ${localStorage.getItem('dlc-no-recordar') ? '' : 'checked'}> Mantener la sesión iniciada en este dispositivo</label>`);
  f.addEventListener('submit', () => {
    try {
      localStorage.setItem('dlc-ultimo-correo', lu.value.trim());
      if ($('lrecordar').checked) localStorage.removeItem('dlc-no-recordar'); else localStorage.setItem('dlc-no-recordar', '1');
      document.cookie = 'dlc-sesion-viva=1; path=/; SameSite=Lax';   // cookie de sesión: dura hasta cerrar el navegador
    } catch (e) {}
  }, true);
})();


