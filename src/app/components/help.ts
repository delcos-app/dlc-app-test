/**
 * The «i» of help next to the titles: glued to the last word (a title on two lines never leaves the «i» alone below), and the
 * manual section each one opens. Migrated from componentes/ayuda.js (v2.416.0); pegarAyuda, ponerAyudas and anclaAyuda stay as
 * adapters. The list of titles (ANCLAS_AYUDA) stays in legacy: legado 019 adds to it while loading.
 */
import { componentsLegacy } from '../legacy/components-bridge';
import { currentScreen } from '../legacy/bridge';
import { t } from '../i18n';

/** Puts `button` after the last word of `title`, both inside a span that does not break. */
export function glueHelp(title: Element, button: string): void {
  const last = [...title.childNodes].reverse().find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  const parts = last?.textContent?.match(/^([\s\S]*?)(\S+)(\s*)$/);
  if (!last || !parts) { title.insertAdjacentHTML('beforeend', button); return; }
  const glued = document.createElement('span'); glued.className = 'ai-pegada';
  glued.append(parts[2] ?? ''); glued.insertAdjacentHTML('beforeend', button);
  last.textContent = parts[1] ?? ''; last.after(glued);
}

/** The «i» of every known title on screen, and the one of the accounts' tools. */
export function addHelpButtons(): void {
  componentsLegacy.helpAnchors().forEach(([selector, key]) => {
    const title = document.querySelector(selector);
    if (title && !title.querySelector('.ai')) glueHelp(title, `<button class="ai" data-ayuda="${key}" aria-label="${t('components.help.label')}">i</button>`);
  });
  const tools = document.getElementById('dirtools');
  if (tools && !tools.previousElementSibling?.matches('.ai'))
    tools.insertAdjacentHTML('beforebegin', `<button class="ai ai-dir" data-ayuda="directorio" aria-label="${t('components.help.label')}">i</button>`);
}

/** The manual section an «i» opens: its own, its key's, Inicio's for the home cards, or the screen's. */
export function helpAnchor(button: HTMLElement): string {
  const key = button.dataset.ayuda ?? '';
  if (button.dataset.manual) return button.dataset.manual;
  const anchors = componentsLegacy.manualAnchors();
  if (anchors[key]) return anchors[key];
  if (key.startsWith('ini_')) return anchors.inicio ?? '';
  return anchors[currentScreen()] ?? '';
}
