

document.querySelectorAll('input[type=password]').forEach(ojoClave);
new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) {
  if (n.nodeType !== 1) continue;
  if (n.matches && n.matches('input[type=password]')) ojoClave(n);
  else if (n.querySelectorAll) n.querySelectorAll('input[type=password]').forEach(ojoClave);
} }).observe(document.body, { childList: true, subtree: true });




