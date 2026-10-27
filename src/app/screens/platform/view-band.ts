/**
 * The «Estás viendo X · Salir» band when the delcos administrator is inside another company. Migrated from the legacy franjaVista
 * and quitarFranja (v2.413.0); moved out of org-actions.ts (plan 7.3, cut B) because start-up and the menus paint it, so it stays in
 * the core while the rest of Panel delcos is loaded on first use.
 */
import { callRpc, legacyDb, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { platformState } from './model';

interface Answer { ok?: boolean }

/** Removes the «Estás viendo…» band. */
export function removeViewBand(): void {
  document.getElementById('orgvista')?.remove();
  document.body.classList.remove('con-vista'); document.documentElement.style.setProperty('--alto-franja', '0px');
}

async function leave(button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<Answer>('salir_organizacion', {});
  if (!result?.ok) { button.disabled = false; notices.toast(t('platform.orgs.couldNotLeave'), true); return; }
  location.reload();
}

/** «Estás viendo X · Salir» when the delcos administrator is inside another company. */
export async function paintViewBand(): Promise<void> {
  if (!platformLegacy.hasProfile() || !platformLegacy.can('gestionar_plataforma')) { removeViewBand(); return; }
  const { data } = await callRpc<typeof platformState.viewed>('vista_organizacion', {});
  platformState.viewed = data ?? null;
  const viewed = platformState.viewed;
  if (!viewed) { removeViewBand(); return; }
  if (!document.getElementById('orgvista')) document.body.insertAdjacentHTML('afterbegin', '<div id="orgvista" class="orgvista" role="status"></div>');
  const band = document.getElementById('orgvista'); if (!band) return;
  const blocked = viewed.bloqueada ? ` <span class="pill p-warn">${t(viewed.bloqueada === 'desactivada' ? 'platform.view.deactivated' : 'platform.view.trialEnded')}</span>` : '';
  band.innerHTML = `<span>${t('platform.view.seeing', { name: `<b>${escapeHtml(viewed.nombre)}</b>${blocked}` })}</span>
    <button type="button" class="btn sec" id="orgvistasal">${t('platform.view.leave')}</button>`;
  document.body.classList.add('con-vista');
  document.documentElement.style.setProperty('--alto-franja', `${band.offsetHeight}px`);
  const exit = document.getElementById('orgvistasal') as HTMLButtonElement | null; if (exit) exit.onclick = (): void => { void leave(exit); };
}
