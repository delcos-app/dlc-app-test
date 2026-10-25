/**
 * What the platform does with a company: download all its data, delete a trial or deactivated one, deactivate or reactivate it,
 * and enter it to see it as it is (with the «Estás viendo…» band). Migrated from the legacy orgAccionesBase, orgAcciones,
 * entrarEnOrganizacion, franjaVista and quitarFranja (v2.413.0).
 */
import { callRpc, legacyDb, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml, formatNumber } from '../../services/format';
import { downloadJson, errorMessage, type Organization, platformState } from './model';

const URL_LIFE_MS = 60000;

type Repaint = () => Promise<void>;
interface Answer { ok?: boolean; error?: string; motivo?: string; acceso?: string }
const errorSuffix = (error: unknown): string => (error ? `: ${errorMessage(error)}` : '');

/** All its data as a JSON file (to hand it over if it leaves the trial). */
export async function downloadData(organization: Organization, button: HTMLButtonElement): Promise<void> {
  const label = button.textContent;
  button.disabled = true; button.textContent = t('platform.orgs.preparing');
  const { data, error } = await callRpc<unknown>('exportar_organizacion', { p_org: organization.id });
  button.disabled = false; button.textContent = label;
  if (error || !data) { notices.toast(t('platform.orgs.downloadFailed'), true); return; }
  downloadJson(data, `datos_${organization.nombre.replace(/[^\p{L}\p{N}]+/gu, '_')}_${todayIso()}.json`, URL_LIFE_MS);
  notices.toast(t('platform.orgs.downloaded'));
}

const DELETE_ERRORS = new Map<string, MessageKey>([['permiso', 'platform.orgs.noPermission'], ['principal', 'platform.orgs.mainNotDeleted'], ['activa', 'platform.orgs.onlyTrial'], ['facturas', 'platform.orgs.hasInvoices']]);

/** Deletes a trial or deactivated company (never one with invoices): its name has to be typed. */
export async function deleteOrganization(organization: Organization, repaint: Repaint): Promise<void> {
  if (organization.facturas) { notices.toast(t('platform.orgs.invoicesNoDelete', { name: organization.nombre }), true); return; }
  const typed = await platformLegacy.askText(t('platform.orgs.deleteText', { name: organization.nombre, users: formatNumber(organization.usuarios), accounts: formatNumber(organization.cuentas) }),
    '', { titulo: t('platform.orgs.delete'), ok: t('platform.orgs.deleteOk') });
  if (typed === null) return;
  if (typed.trim() !== organization.nombre) { notices.toast(t('platform.orgs.nameMismatch'), true); return; }
  const { data: result, error } = await legacyDb().rpc<Answer>('borrar_organizacion', { p_org: organization.id });
  if (error || !result?.ok) {
    const key = DELETE_ERRORS.get(result?.error ?? '');
    notices.toast(key ? t(key) : t('platform.orgs.deleteFailed') + errorSuffix(error), true);
    return;
  }
  notices.toast(t('platform.orgs.deleted', { name: organization.nombre }) + (String(result.acceso ?? '').startsWith('no_borrado') ? t('platform.orgs.deleteUsersToo') : ''));
  void repaint();
}

const ACTIVE_ERRORS = new Map<string, MessageKey>([['permiso', 'platform.orgs.noPermission'], ['principal', 'platform.orgs.mainNotDeactivated'], ['organizacion', 'platform.orgs.notFound']]);

/** Deactivates a company (its users cannot enter; its data stays) or lets it back in. */
export async function toggleActive(organization: Organization, button: HTMLButtonElement, repaint: Repaint): Promise<void> {
  const activate = organization.activa === false, users = formatNumber(organization.usuarios);
  const asked = await notices.confirm(t(activate ? 'platform.orgs.reactivateText' : 'platform.orgs.deactivateText', { users }), {
    titulo: t(activate ? 'platform.orgs.reactivateTitle' : 'platform.orgs.deactivateTitle', { name: organization.nombre }),
    ok: t(activate ? 'platform.orgs.reactivate' : 'platform.orgs.deactivate'), peligro: !activate,
  });
  if (!asked) return;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<Answer>('activar_organizacion', { p_org: organization.id, p_activa: activate });
  if (error || !result?.ok) {
    button.disabled = false;
    const key = ACTIVE_ERRORS.get(result?.error ?? '');
    notices.toast(key ? t(key) : t('platform.orgs.toggleFailed') + errorSuffix(error), true);
    return;
  }
  notices.toast(t(activate ? 'platform.orgs.reactivated' : 'platform.orgs.deactivated2', { name: organization.nombre }));
  void repaint();
}

/** Enters a company to see the platform as it does; «Salir» in the band goes back. */
export async function enterOrganization(organization: Organization): Promise<void> {
  if (!await notices.confirm(t('platform.orgs.enterText', { name: organization.nombre }), { titulo: t('platform.orgs.enterTitle', { name: organization.nombre }), ok: t('platform.orgs.enter') })) return;
  const { data: result } = await legacyDb().rpc<Answer>('entrar_organizacion', { p_org: organization.id });
  if (!result?.ok) { notices.toast(t(result?.motivo === 'permiso' ? 'platform.orgs.onlyAdmin' : 'platform.orgs.couldNotEnter'), true); return; }
  platformLegacy.prepareOrganizationChange(organization.nombre);
  location.reload();
}

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
