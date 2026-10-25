/**
 * Page behaviour that the legacy layers added with document listeners: the frozen copy while a Configuración section or a page tab
 * changes (v2.252.0, v2.255.0), the parts of a section waking up when touched and the Inicio indicators' buttons next to the title
 * (v2.344.0), and the «Guardar» of a page knowing what changed (D-042, v2.376.0). Moved from legado 099, 100, 157 and 161 (v2.424.0).
 */
import { pageLegacy } from '../../legacy/legado-d-bridge';
import { closestOf } from './events';

/** v2.252.0 and v2.255.0: the section (or page) of before stays fixed and dimmed until the new one is whole. */
export function installFrozenChanges(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest('#v-config .cfuidx [data-ck], #v-config .cfucab [data-cks]');
    if (!button || pageLegacy.currentScreen() !== 'config' || button.classList.contains('on')) return;
    const page = document.querySelector<HTMLElement>('#v-config .cfupag');
    // On a phone the index covers the page: the whole screen
    if (page?.offsetParent && !pageLegacy.isMobile()) pageLegacy.freeze(page); else pageLegacy.freeze(document.getElementById('v-config'));
  }, true);
}

export function installFrozenTabs(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest('main .pagtabs [data-ptab]');
    if (!button || button.classList.contains('on')) return;
    pageLegacy.freeze(button.closest<HTMLElement>('main > section'));
  }, true);
}

/** Inicio indicators in Configuración: «Restaurar» and «Guardar» next to the title. */
function indicatorButtonsInHeader(): void {
  if (pageLegacy.currentScreen() !== 'config' || pageLegacy.settingsKey() !== 'inicio.kpis') return;
  const header = document.querySelector('#v-config .cfucab'), body = document.getElementById('cfgcuerpo'); if (!header || !body) return;
  const actions = [...body.querySelectorAll('.acts')].filter(item => item.querySelector('.btn') && !item.classList.contains('cfuacts')).pop(); if (!actions) return;
  header.querySelectorAll('.cfuacts').forEach(item => { item.remove(); });
  actions.classList.add('cfuacts'); header.appendChild(actions);
}

/** Legado 157: touching a part gives it back its pieces (in capture, before its button does anything). */
export function installSettingsParts(): void {
  ['pointerdown', 'focusin', 'keydown'].forEach(name => {
    document.addEventListener(name, event => {
      const section = closestOf(event.target, '#cfgcuerpo-hub .cfgsec');
      if (section) pageLegacy.wakeSection(section);
    }, true);
  });
  new MutationObserver(indicatorButtonsInHeader).observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { pageLegacy.cloneSettingsStyles(); }, 0);
}

const PAGE_CHOICES = '.segs > button, [aria-pressed], [role=radio], [role=switch]';
const NOT_PAGE_CHOICES = '.cfucab, .cfuidx, .pagtabs, .cfgsubs, dialog:not(.encajada:has([data-pagina]))';

/** D-042: a page with one «Guardar» marks the block that changed (writing, or choosing with buttons). */
export function installPageSave(): void {
  ['input', 'change'].forEach(name => {
    document.addEventListener(name, event => {
      const page = pageLegacy.currentPage(); if (!page || !event.isTrusted) return;
      const target = event.target as Element;
      if (!page.cuerpo.contains(target) || target.closest('dialog:not(.encajada:has([data-pagina])), .cfucab') || target.matches(pageLegacy.notAChange())) return;
      pageLegacy.markChanged(target, page.cuerpo);
    }, true);
  });
  document.addEventListener('click', event => {
    const page = pageLegacy.currentPage(); if (!page || !event.isTrusted) return;
    const button = (event.target as Element).closest(PAGE_CHOICES);
    if (!button || !page.cuerpo.contains(button) || button.closest(NOT_PAGE_CHOICES)) return;
    pageLegacy.markChanged(button, page.cuerpo);
  }, true);
  new MutationObserver(() => { pageLegacy.placeSaveButtonSoon(); }).observe(document.body, { childList: true, subtree: true });
}
