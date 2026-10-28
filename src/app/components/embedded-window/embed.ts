/**
 * Windows in the page: on a desktop, inside Configuración and the pages with tabs, a window takes the content area (no dark backdrop,
 * no floating window) and the section comes back when it closes; on a phone windows already take the screen. Window sizes, the
 * stacked window and «loading» on the dialog. Migrated from the legacy componentes/ventana.js (v2.422.0); the dialog patches that
 * use these stay in legado 058 and 072.
 */
import { currentScreen } from '../../legacy/bridge';
import { shellLegacy } from '../../legacy/shell-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

/** Below this width, windows are not put in the page. */
export const EMBED_MIN_WIDTH = 900;

type HomedDialog = HTMLDialogElement & { __casa?: Node | null };

const byId = (id: string): HTMLElement | null => document.getElementById(id);

/** The area a window takes, or null to open it floating (narrow screen, other screens, or while a card opens). */
export function embedArea(): HTMLElement | null {
  if (shellLegacy.openingCard() || innerWidth < EMBED_MIN_WIDTH) return null;
  const screen = currentScreen();
  if (screen === 'config') return byId('cfgcuerpo-hub') ?? byId('cfgcuerpo');
  if (shellLegacy.hasPage(screen)) return document.querySelector<HTMLElement>(`#v-${screen} .pagcuerpo`) ?? byId('cfgcuerpo');
  return null;
}

const fixedBottom = (selector: string): number => {
  const element = document.querySelector(selector);
  return element && /fixed|sticky/.test(getComputedStyle(element).position) ? element.getBoundingClientRect().bottom : 0;
};

/** v2.122.0: the window goes IN the page, where the section was; it only needs the height of the fixed header. */
export function placeEmbedded(): void {
  // v2.134.0: with the side menu, nav.main takes the whole height and is not a header
  const selectors = ['header', '.top', document.body.classList.contains('menulat') ? '' : 'nav.main'].filter(Boolean);
  document.documentElement.style.setProperty('--alto-cab', `${Math.max(0, ...selectors.map(fixedBottom))}px`);
}

/** Back to <body> before closing, so a repaint of the section does not take the window with it. */
export function returnEmbedded(dialog: HomedDialog): void {
  if (dialog.__casa && dialog.parentNode !== dialog.__casa) dialog.__casa.appendChild(dialog);
}

/** Closes the windows shown in the page (changing section, tab or screen). */
export function closeEmbedded(): void {
  ['dlg2', 'dlg'].forEach(id => {
    const dialog = byId(id) as HTMLDialogElement | null;
    if (dialog?.open && dialog.classList.contains('encajada')) dialog.close();
  });
}

/** Shows the dialog as loading while `work` runs. */
export async function withDialogLoading<T>(work: () => Promise<T>): Promise<T> {
  const dialog = byId('dlg');
  dialog?.classList.add('cargando');
  try { return await work(); } finally { dialog?.classList.remove('cargando'); }
}

/** Opens a window on top of the current one, which comes back when this one closes (legado 058 gives it back). */
export async function openStacked(paint: () => unknown, backText?: string): Promise<void> {
  const dialog = byId('dlg') as HTMLDialogElement | null, body = byId('dbody');
  if (!dialog || !body) return;
  shellLegacy.windowStack().push({ nodos: [...body.childNodes], clases: dialog.className, titulo: backText });
  shellLegacy.setStacking(true);
  const keep = document.createDocumentFragment(); [...body.childNodes].forEach(node => { keep.appendChild(node); });
  if (dialog.open) dialog.close();
  try { await paint(); } finally { shellLegacy.setStacking(false); }
  if (!dialog.open) dialog.showModal();
  const head = body.querySelector('.fh');
  if (head && !body.querySelector('.pilavolver')) head.insertAdjacentHTML('beforebegin', `<button class="pilavolver" type="button">${shellLegacy.iconOf('arrow-left')} ${escapeHtml(orFallback(backText, t('common.back')))}</button>`);
  const back = body.querySelector<HTMLElement>('.pilavolver'); if (back) back.onclick = (): void => { dialog.close(); };
}
