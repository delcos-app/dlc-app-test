/**
 * v2.37.0: the salesperson selectors of the account (card and editor) only offer people of type Comercial, without the suffix.
 * Folded from legado 037 (v2.424.0); it keeps watching the page because the card and the editor paint those selectors later.
 */
const SELECTS = ['fcomsel', 'ecom'], SALESPERSON = '· Comercial', SUFFIX = / · Comercial$/;

export function keepOnlySalespeople(): void {
  new MutationObserver(() => {
    SELECTS.forEach(id => {
      const select = document.getElementById(id) as HTMLSelectElement | null;
      if (!select || select.dataset.soloCom || select.options.length < 2) return;
      select.dataset.soloCom = '1';
      [...select.options].forEach(option => { if (option.value && !(option.textContent ?? '').endsWith(SALESPERSON) && !option.selected) option.remove(); });
      [...select.options].forEach(option => { option.textContent = (option.textContent ?? '').replace(SUFFIX, ''); });
    });
  }).observe(document.body, { childList: true, subtree: true });
}
