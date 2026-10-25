/**
 * Configuración and Administración on the phone, folded from legado 037 and 044 (v2.424.0): first the list, then the section
 * (with its «Volver», kept when the section repaints), and each person of Usuarios as a card with «Gestionar».
 */
import { legacyBActions, legacyBState } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const REPAINT_MS = 50, CLICK_LATER_MS = 50;

function onSettingsClick(event: MouseEvent): void {
  const target = event.target as Element;
  // Only the «Volver» of Configuración on the phone (other buttons share its style)
  const back = target.closest('.cfghub .cfgvolver');
  if (back) { back.closest('.cfghub')?.classList.remove('detalle'); scrollTo({ top: 0 }); return; }
  const section = target.closest('.cfghub.movil [data-cfg]'); if (!section) return;
  section.closest('.cfghub')?.classList.add('detalle'); scrollTo({ top: 0 });
  setTimeout(() => {
    legacyBActions.mobileSettings();
    const title = document.getElementById('cfgcuerpo')?.querySelector<HTMLElement>('.cfgvolver');
    if (title) title.dataset.titulo = section.querySelector('b')?.textContent ?? '';
  }, REPAINT_MS);
}

/** v2.44.0: Configuración on the phone goes step by step (list → section). */
export function listenToMobileSettings(): void {
  document.addEventListener('click', onSettingsClick, true);
  const main = document.querySelector('main');
  if (main) new MutationObserver(() => {
    const body = document.getElementById('cfgcuerpo');
    if (legacyBState.tab() === 'config' && legacyBState.isMobile() && body && !body.querySelector(':scope > .cfgvolver')) legacyBActions.mobileSettings();
  }).observe(main, { childList: true, subtree: true });
  window.addEventListener('resize', () => { if (legacyBState.tab() === 'config') legacyBActions.mobileSettings(); });
}

function openPersonActions(item: HTMLElement, actions: Element): void {
  const body = document.getElementById('dbody'), dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !dialog) return;
  const buttons = [...actions.querySelectorAll('button')];
  body.innerHTML = `<div class="fh"><div><h2>${escapeHtml(item.querySelector('.tx b')?.textContent ?? '')}</h2><div class="sm">${escapeHtml(item.querySelector('.tx .sm')?.textContent ?? '')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
        <div class="accsheet">${buttons.map((button, index) => `<button class="btn sec" data-accn="${index}">${button.innerHTML}</button>`).join('')}</div>`;
  dialog.showModal();
  body.querySelectorAll<HTMLElement>('[data-accn]').forEach(choice => {
    choice.onclick = (): void => { dialog.close(); setTimeout(() => { buttons[Number(choice.dataset.accn)]?.click(); }, CLICK_LATER_MS); };
  });
}

/** v2.37.0: in Administración → Usuarios on the phone, each person is a card with «Gestionar» (its actions in a sheet). */
export function cardsForPeopleOnMobile(): void {
  const main = document.querySelector('main'); if (!main) return;
  new MutationObserver(() => {
    if (legacyBState.tab() !== 'admin' || !legacyBState.isMobile() || legacyBState.adminSection() !== 'usuarios') return;
    document.querySelectorAll<HTMLElement>('#admcuerpo .lista > .item').forEach(item => {
      if (item.dataset.movil) return;
      item.dataset.movil = '1';
      const actions = item.querySelector('.acts'); if (!actions) return;
      actions.classList.add('hide');
      item.insertAdjacentHTML('beforeend', `<button class="btn sec umas" aria-label="${t('legacyB.mobile.actions')}">${t('legacyB.mobile.manage')}</button>`);
      const manage = item.querySelector<HTMLElement>('.umas'); if (manage) manage.onclick = (): void => { openPersonActions(item, actions); };
    });
  }).observe(main, { childList: true, subtree: true });
}
