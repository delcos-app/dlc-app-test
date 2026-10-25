/**
 * The «i» next to the title of each screen: the screen's help if it has one, else its page title and description. It ends with
 * «Ver en el manual de uso» (componentes/ayuda.js). Migrated from the legacy ponerAyudaManual (v2.410.0).
 */
import { currentScreen, manualLegacy, permissions } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

/** Screens without the «i»: the manual itself and the internal Panel delcos */
const isWithoutHelp = (screen: string): boolean => screen === 'manual' || screen === 'delcos' || screen.startsWith('pd-');

export function putHelpButton(): void {
  document.querySelectorAll('.manq').forEach(button => { button.remove(); });
  const screen = currentScreen();
  if (permissions.isProfessionalPortal() || isWithoutHelp(screen)) return;
  const title = document.getElementById(`v-${screen}`)?.querySelector<HTMLElement>('.saludo h1');
  if (!title) return;
  if ((title.closest('.saludo') ?? title).querySelector('.ai')) return;
  const label = t('manual.help');
  if (manualLegacy.help(screen)) { manualLegacy.attachHelp(title, `<button class="ai" data-ayuda="${screen}" aria-label="${label}">i</button>`); return; }
  const page = manualLegacy.pageInfo(screen);
  manualLegacy.attachHelp(title, `<button class="ai" data-ayuda-tit="${escapeHtml(orFallback(page.t, (title.textContent ?? '').trim()))}" data-ayuda-txt="${escapeHtml(orFallback(page.d, ''))}" aria-label="${label}">i</button>`);
}
