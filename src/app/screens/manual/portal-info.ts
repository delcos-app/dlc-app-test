/**
 * The windows of the professional portal manual: a first step («Llévame» to its screen) and a section (what can be done with the
 * user's access, how it works, where it is configured, and buttons to its screen and its settings). Migrated from the legacy
 * infoManual (v2.410.0).
 */
import { manualLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { findSection, helpLines, sectionIcon, sheetLevel } from './model';

const SETTINGS_FOR_EVERYONE = ['horario', 'kpis', 'prefs'];

function openDialog(html: string): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = html;
  box.showModal();
}

/** Closes the window and goes to `screen` (Configuración opens on `section`). */
function closeAndGo(buttonId: string, screen: string, section?: string): void {
  const button = document.getElementById(buttonId);
  if (button) button.onclick = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); manualLegacy.go(screen, section); };
}

const close = `<button class="x" data-cerrar aria-label="${t('common.close')}">✕</button>`;

/** A first step: what to do and «Llévame». */
export function showFirstStep(step: FirstStep): void {
  const [stepIcon, title, text, screen] = step, about = findSection(screen)?.para;
  openDialog(`<div class="fh"><div><h2>${stepIcon} ${escapeHtml(title)}</h2><div class="sm">${t('manual.portal.firstSteps')}</div></div>${close}</div>
      <p>${escapeHtml(text)}</p>${about ? `<p class="sm">${escapeHtml(about)}</p>` : ''}
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t('manual.portal.notNow')}</button>
        ${screen === 'config' || manualLegacy.canOpenModule(screen) ? `<button class="btn" id="mangoir">${t('manual.portal.takeMe')}</button>` : ''}</div>`);
  closeAndGo('mangoir', screen, screen === 'config' ? 'prefs' : undefined);
}

function listsHtml(section: ManualSection): string {
  const level = sheetLevel(section), lines = helpLines(section.id), places = section.config ?? [];
  const can = section.hacer.map(([required, text]) => `<li class="${level >= required ? 'si' : 'no'}"><span>${level >= required ? '✓' : '🔒'}</span><span>${escapeHtml(text)}</span></li>`).join('');
  return `<h3 class="mansub">${t('manual.portal.whatYouCanDo')}</h3><ul class="manlist">${can}</ul>
    ${lines.length ? `<h3 class="mansub">${t('manual.portal.howItWorks')}</h3><ul class="manlist">${lines.map(line => `<li><span>•</span><span>${line}</span></li>`).join('')}</ul>` : ''}
    ${places.length ? `<h3 class="mansub">${t('manual.portal.whereConfigured')}</h3><div class="mancfg">${places.map(place => `<span>⚙ ${escapeHtml(place)}</span>`).join('')}</div>` : ''}`;
}

const canGoToSettings = (settings: string | undefined): boolean =>
  settings !== undefined && settings !== '' && (manualLegacy.can('administrar') || SETTINGS_FOR_EVERYONE.includes(settings));

const canOpenScreen = (destination: string | null): boolean =>
  destination !== null && destination !== 'manual' && (destination === 'config' || manualLegacy.canOpenModule(destination));

/** A section of the manual. */
export function showSection(id: string): void {
  const section = findSection(id);
  if (!section) return;
  const destination = manualLegacy.isModule(id) || ['manual', 'config'].includes(id) ? id : null, settings = manualLegacy.settingsOf(id);
  const canSettings = canGoToSettings(settings), canOpen = canOpenScreen(destination);
  openDialog(`<div class="fh"><div><h2>${sectionIcon(id)} ${escapeHtml(section.t)}</h2><div class="sm">${escapeHtml(section.para)}</div></div>${close}</div>
    ${listsHtml(section)}
    <div class="acts u-end u-wrap u-mt-14"><button class="btn sec" data-cerrar>${t('common.close')}</button>
      ${canSettings ? `<button class="btn sec" id="manircfg">${t('manual.portal.goToSettings')}</button>` : ''}
      ${canOpen ? `<button class="btn" id="manirmod">${t('manual.portal.open', { name: escapeHtml(section.t) })}</button>` : ''}</div>`);
  if (destination) closeAndGo('manirmod', destination);
  if (settings) closeAndGo('manircfg', 'config', settings);
}
