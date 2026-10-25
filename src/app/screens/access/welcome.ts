/**
 * The welcome window after signing up (three first steps) and the sign-in screen. Migrated from the legacy bienvenidaAlta and
 * mostrarLogin (v2.414.0); both names stay as adapters (legado 076 and the navigation call them).
 */
import { goTo, term } from '../../legacy/bridge';
import { restLegacy } from '../../legacy/rest-bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';

const STEPS: readonly (readonly [string, MessageKey, MessageKey])[] = [
  ['importar', 'access.welcome.importTitle', 'access.welcome.importText'],
  ['equipo', 'access.welcome.teamTitle', 'access.welcome.teamText'],
  ['marca', 'access.welcome.brandTitle', 'access.welcome.brandText'],
];

function welcomeHtml(plan: { en_prueba?: boolean; periodo_fin?: string | null }): string {
  const trialEnd = plan.periodo_fin ? formatShortDate(plan.periodo_fin) : '';
  const steps = STEPS.map(([key, title, text], index) => `<button type="button" class="bienpaso" data-bien="${key}"><span class="bienn">${index + 1}</span>
      <span><b>${escapeHtml(t(title))}</b><span class="sm">${escapeHtml(t(text, { professionals: term('medico', { number: 'p' }) }))}</span></span></button>`).join('');
  return `<div class="fh"><div><h2>${t('access.welcome.title')}</h2>
      <div class="sm">${t('access.welcome.running', { app: escapeHtml(restLegacy.appName()) })}${plan.en_prueba && plan.periodo_fin ? t('access.welcome.trialUntil', { date: trialEnd }) : ''}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <p>${t('access.welcome.intro')}</p>
    <div class="bienpasos">${steps}</div>
    ${plan.en_prueba ? `<p class="sm">${t('access.welcome.trialNote', { date: trialEnd })}</p>` : ''}
    <div class="acts u-end"><button class="btn" data-cerrar>${t('access.welcome.start')}</button></div>`;
}

function openStep(step: string): void {
  if (step === 'importar') { restLegacy.setSettingsSection('importar'); goTo('config'); }
  else if (step === 'equipo') goTo('usuarios');
  else goTo('organizacion');
}

/** The welcome window with the first three steps (and the end of the free trial, if any). */
export async function showWelcome(): Promise<void> {
  try { await restLegacy.loadPlan(); } catch { /* the window shows without the trial */ }
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = welcomeHtml(restLegacy.plan());
  body.querySelectorAll<HTMLElement>('[data-bien]').forEach(button => {
    button.onclick = (): void => { box.close(); openStep(button.dataset.bien ?? ''); };
  });
  box.showModal();
}

/** Shows the sign-in screen (optionally with a message) and hides the app. */
export function showLogin(message?: string): void {
  document.body.classList.add('sin-sesion');
  document.getElementById('bootsplash')?.classList.add('hide');
  document.getElementById('app')?.classList.add('hide');
  document.getElementById('login')?.classList.remove('hide');
  const line = document.getElementById('lmsg');
  if (message && line) line.textContent = message;
  restLegacy.setAppVisible(false);
}
