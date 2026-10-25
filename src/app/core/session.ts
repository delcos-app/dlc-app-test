/**
 * The session: «Impersonalizar» another user (and its purple bar), being sent out when the user is deactivated, clearing local data
 * and guests (professionals and centres with access to their portal). Migrated from the legacy nucleo/sesion.js (v2.425.0); entrarComo,
 * comprobarAcceso, limpiarDatosLocales, pintarBarraSuplantacion, prepararCambioOrg, suplantando, esInvitado… stay as adapters.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t, type MessageKey } from '../i18n';
import { escapeHtml } from '../services/format';
import { firstName, wordFor } from './vocabulary';

const ACCESS_CHECK_MS = 3000;

/** The last errors of this session (attached to «Reportar un problema»). */
export const SESSION_ERRORS: { t: string; tipo: string; m: string; pantalla: string }[] = [];

export interface Impersonation { access_token?: string; refresh_token?: string; nombre?: string; id?: string; como?: string; rol?: string; desde?: number }

/** Who is impersonating (saved before opening the other user's session), or null. */
export const impersonating = (): Impersonation | null => {
  try { return JSON.parse(localStorage.getItem(coreLegacy.impersonationKey()) ?? 'null') as Impersonation | null; } catch { return null; }
};

export const isGuest = (user: { rol: string } | null | undefined): boolean =>
  Boolean(user) && (coreLegacy.roleCan(user?.rol ?? '', 'portal_prescriptor') || coreLegacy.roleCan(user?.rol ?? '', 'portal_centro'));

/** What a guest sees. */
export const guestSees = (user: { rol: string }): string => (coreLegacy.roleCan(user.rol, 'portal_centro')
  ? t('core.session.centreGuestSees')
  : t('core.session.professionalGuestSees', { requests: wordFor('pauta', 'p'), customers: wordFor('paciente', 'p') }));

const ERROR_KEYS: Readonly<Record<string, MessageKey>> = {
  administrador: 'core.session.errors.administrator', permiso: 'core.session.errors.permission', inactivo: 'core.session.errors.inactive',
  propio: 'core.session.errors.own', otra: 'core.session.errors.otherCompany', no_encontrado: 'core.session.errors.notFound',
  plan: 'core.session.errors.plan', sesion: 'core.session.errors.session',
};

/** Why impersonating failed, by the code the server answers. */
export const IMPERSONATION_ERRORS: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(ERROR_KEYS).map(([code, key]) => [code, t(key)]));

/** A menu tab is out of the plan (locked). */
export const outOfPlan = (button: Element | null): boolean => Boolean(button) && Boolean(button?.classList.contains('bloq'));

/** Removes what this device keeps of the user (cached reads, profile, working day). */
export function clearLocalData(): void {
  try { Object.keys(localStorage).filter(key => /^dlc-(rc-|perfil|jornada-)/.test(key)).forEach(key => { localStorage.removeItem(key); }); } catch { /* nothing kept */ }
}

/** Empties the screens of other modules, so they are painted again when opened. */
export const emptyModules = (except?: string): void => {
  ['v-pacientes', 'v-productos', 'v-ventas'].forEach(id => { const section = document.getElementById(id); if (id !== except && section) section.innerHTML = ''; });
};

/** Changing organisation: the reload stays covered until the new organisation's menu, brand and screen are there. */
export function prepareOrganizationChange(target: string | null | undefined): void {
  try { sessionStorage.setItem('dlc-cambio-org', target ?? ''); sessionStorage.removeItem('dlc-f5'); localStorage.removeItem('app-marca'); } catch { /* the reload still works */ }
}

/** The purple bar while impersonating. */
export function paintImpersonationBar(): void {
  const saved = impersonating();
  let bar = document.getElementById('barrasup');
  if (!saved) { bar?.remove(); return; }
  if (!bar) { document.body.insertAdjacentHTML('afterbegin', '<div id="barrasup"></div>'); bar = document.getElementById('barrasup'); }
  if (!bar) return;
  const profile = coreLegacy.profile();
  bar.innerHTML = `<span>👤 <b>${t('core.session.impersonating', { name: escapeHtml(profile ? profile.nombre : saved.como) })}</b>${profile ? ` · ${escapeHtml(profile.rol)}` : ''} · ${t('core.session.underTheirName')}</span>
    <button class="btn chico" id="supvolver">${t('core.session.stop', { name: escapeHtml(firstName(saved.nombre)) })}</button>`;
  const back = document.getElementById('supvolver'); if (back) back.onclick = (): void => { void coreLegacy.backToMySession(); };
}

/** Deactivated while working: out at once (checked at most every 3 seconds unless forced). */
function canCheck(force: boolean | undefined): string | null {
  const id = coreLegacy.profile()?.id;
  if (coreLegacy.accessLost() || !id || document.body.classList.contains('sin-sesion') || !navigator.onLine) return null;
  return force || Date.now() - coreLegacy.accessCheckedAt() >= ACCESS_CHECK_MS ? id : null;
}

async function sendOut(): Promise<void> {
  coreLegacy.setAccessLost();
  try { sessionStorage.setItem('delcos-fuera', '1'); } catch { /* still signs out */ }
  try { localStorage.removeItem(coreLegacy.profileKey()); localStorage.removeItem('dlc-os-sesion'); } catch { /* still signs out */ }
  clearLocalData();
  try { await coreLegacy.db().auth.signOut(); } catch { /* reloads anyway */ }
  location.reload();
}

export async function checkAccess(force?: boolean): Promise<void> {
  const id = canCheck(force); if (!id) return;
  coreLegacy.setAccessCheckedAt(Date.now());
  const { data, error } = await coreLegacy.db().from<{ id: string; activo: boolean } | null>('perfiles').select('id, activo').eq('id', id).maybeSingle();
  if (error || data?.activo) return;   // without network or a passing failure, nobody is sent out
  await sendOut();
}

interface ImpersonationAnswer { ok?: boolean; error?: string; detalle?: string; nombre?: string; rol?: string; token_hash?: string }

async function askServer(id: string): Promise<{ data: ImpersonationAnswer | null; error: { message?: string; context?: { status?: number; json?: () => Promise<unknown> } } | null }> {
  const answer = await coreLegacy.db().functions.invoke('impersonar', { body: { usuario_id: id } });
  const { error } = answer, data = answer.data as ImpersonationAnswer | null;
  // The old function answered with an HTTP error: the reason is read anyway
  if (error && !data && typeof error.context?.json === 'function') {
    try { return { data: await error.context.json() as ImpersonationAnswer, error }; } catch { /* no reason */ }
  }
  return { data, error };
}

type ServerError = { message?: string; context?: { status?: number } } | null;

const logFailure = (reason: string, error: ServerError, detail: string | undefined): void => {
  coreLegacy.registerError('api', `Impersonalizar: ${reason || 'sin respuesta'}`, { estado: error?.context?.status, detalle: detail });
};

function failed(answer: ImpersonationAnswer | null, error: ServerError): void {
  const code = answer?.error ?? '', known = IMPERSONATION_ERRORS[code], message = error?.message ?? '', detail = answer?.detalle;
  const reason = [detail, message, code].find(Boolean) ?? t('core.session.noAnswer');
  coreLegacy.toast(known ?? t('core.session.couldNotEnter', { reason }), true);
  if (!known || code === 'sesion') logFailure(code || message, error, detail);
  coreLegacy.hideLoading();
}

/** «Impersonalizar» a user: after confirming, opens their session; the own session is kept to come back. */
export async function impersonate(id: string): Promise<void> {
  const user = coreLegacy.users().find(item => item.id === id) ?? { id, nombre: t('core.session.thisPerson'), rol: '' };
  const text = t(isGuest(user) ? 'core.session.confirmGuest' : 'core.session.confirmUser', { name: user.nombre });
  if (!await coreLegacy.confirm(text, { titulo: t('core.session.confirmTitle', { name: user.nombre }), ok: t('core.session.confirmOk') })) return;
  coreLegacy.showLoading(t('core.session.loading', { name: user.nombre }));
  const { data: { session } } = await coreLegacy.db().auth.getSession();
  if (!session) { coreLegacy.hideLoading(); coreLegacy.toast(IMPERSONATION_ERRORS.sesion ?? '', true); return; }
  const { data, error } = await askServer(id);
  if (!data?.ok) { failed(data, error); return; }
  const profile = coreLegacy.profile();
  localStorage.setItem(coreLegacy.impersonationKey(), JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token,
    nombre: profile?.nombre, id: profile?.id, como: data.nombre, rol: data.rol, desde: Date.now() }));
  const { error: opening } = await coreLegacy.db().auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (opening) {
    localStorage.removeItem(coreLegacy.impersonationKey());
    await coreLegacy.db().auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    coreLegacy.registerError('api', 'Impersonalizar: no se abre la sesión', { mensaje: opening.message });
    coreLegacy.toast(t('core.session.couldNotOpen', { error: opening.message ?? '' }), true); coreLegacy.hideLoading(); return;
  }
  clearLocalData();
  location.reload();
}
