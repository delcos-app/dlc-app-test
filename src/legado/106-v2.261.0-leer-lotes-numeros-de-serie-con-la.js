new MutationObserver(() => { if (ESC_PEND) return; ESC_PEND = true; queueMicrotask(() => { ESC_PEND = false; escPoner(); }); })
  .observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-esc]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const inp = b.parentNode.querySelector('input'); if (inp) abrirEscaner(inp);
}, true);





