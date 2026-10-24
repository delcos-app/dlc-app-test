
// Aparece en cuanto la página «Correo y firma» está pintada (su botón Guardar, #cook, existe)
new MutationObserver(() => { if (TAB === 'config' && $('cook') && !$('plcorreo')) pintarPlantillasCorreo(); }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });


