/**
 * «Acceso a la plataforma» in the account card: whether the professional or the centre has access to its portal, and how to
 * give it. Administration gives it through the new-user window; whoever may «Dar acceso a fichas de su cartera» (v2.109.0) gives
 * it here, for the accounts of their portfolio. Migrated from the legacy fichaAcceso / fichaAccesoCartera (v2.404.0).
 */
import { accessLegacy, cachedRpc, callRpc, cardSectionsLegacy, legacyDb, notices, permissions, salesTeam, term } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { stillShown } from './card-tools';

const CENTRE = 'Centro', EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const canShow = (id: string): boolean => stillShown(id) && Boolean(document.getElementById('fbody')) && !document.getElementById('facceso');

const accountOf = async (id: string): Promise<CardAccount | Record<string, never>> =>
  (await cachedRpc<CardData>('ficha_cuenta', { p_id: id }, `ficha-${id}`)).data?.medico ?? {};

/** Who has access; administration also sees their last connection (data-facccon, v2.335.0). */
function hasAccessHtml(user: PlatformUser, isCentre: boolean, withConnection: boolean): string {
  const impersonate = user.activo && accessLegacy.canImpersonate(user) ? `<button class="btn sec" data-ucomo="${user.id}">${t('accounts.access.impersonate')}</button>` : '';
  return `<p class="sm">${t('accounts.access.hasAccess')}${user.email ? t('accounts.access.asEmail', { email: escapeHtml(user.email) }) : ''}${user.activo ? '' : t('accounts.access.disabled')}: ${t(isCentre ? 'accounts.access.centreUses' : 'accounts.access.portalUses')}.</p>`
    + (withConnection ? `<p class="sm facccon" data-facccon="${user.id}"></p>` : '') + impersonate;
}

const canText = (isCentre: boolean): string => (isCentre ? t('accounts.access.centreCan')
  : t('accounts.access.portalCan', { prescriptions: term('pauta', { number: 'p' }), patients: term('paciente', { number: 'p' }) }));

/** Administration: who has access, or «Dar acceso» through the new-user window. */
async function adminAccess(id: string): Promise<void> {
  const [{ data: users }, account] = await Promise.all([callRpc<PlatformUser[]>('usuarios_resumen', {}), accountOf(id)]);
  if (!canShow(id)) return;
  const user = (users ?? []).find(item => item.cuenta_id === id), isCentre = account.tipo === CENTRE;
  document.getElementById('fbody')?.insertAdjacentHTML('beforeend', `<div class="blk" id="facceso"><h3>${t('accounts.access.title')}</h3>
    ${user ? hasAccessHtml(user, isCentre, true) : `<p class="sm">${canText(isCentre)}</p>
         <button class="btn sec" id="fdaracc">${t('accounts.access.give')}</button>`}</div>`);
  if (user) accessLegacy.connectionInfo(user.id);   // v2.335.0
  const give = document.getElementById('fdaracc');
  if (give) give.onclick = async (): Promise<void> => {
    const { data } = await legacyDb().rpc<CardData>('ficha_cuenta', { p_id: id });
    const professional = data?.medico; if (!professional) return;
    (document.getElementById('ficha') as HTMLDialogElement | null)?.close();
    accessLegacy.newUser({ medico: { id, nombre: professional.nombre }, nombre: professional.nombre, email: professional.email ?? '', centro: professional.tipo === CENTRE });
  };
}

const FAILURES: Readonly<Record<string, MessageKey>> = {
  permiso: 'accounts.access.noPermission', cartera: 'accounts.access.notYours', ya_tiene: 'accounts.access.alreadyHas',
  correo_en_uso: 'accounts.access.emailInUse', email: 'accounts.access.emailWrong', sin_rol_portal: 'accounts.access.noPortalRole',
};

/** The server checks the user may do it and links the email to the account; false (with the reason shown) if not. */
async function linkAccess(id: string, email: string): Promise<boolean> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('dar_acceso_cuenta', { p_cuenta: id, p_email: email });
  if (!error && result?.ok) return true;
  const key = FAILURES[result?.error ?? ''];
  notices.toast(key ? t(key, { professionals: term('medico', { number: 'p' }) }) : t('accounts.access.couldNotGive'), true);
  return false;
}

/** Gives access from the card: the server checks and links, then the user is created with a temporary password to pass on. */
async function giveAccess(id: string, account: CardAccount | Record<string, never>, button: HTMLButtonElement): Promise<void> {
  const field = document.getElementById('faccmail') as HTMLInputElement | null, email = field?.value.trim() ?? '';
  if (!EMAIL.test(email)) { notices.toast(t('accounts.access.invalidEmail'), true); return; }
  button.disabled = true;
  if (!await linkAccess(id, email)) { button.disabled = false; return; }
  const password = `Tmp-${Math.random().toString(36).slice(2, 8)}`;
  const failure = await accessLegacy.signUp(email, password, orFallback(account.nombre, email.split('@').shift() ?? email));
  button.disabled = false;
  if (failure) { notices.toast(t('accounts.access.couldNotCreate', { error: failure.message ?? '' }), true); return; }
  button.remove(); if (field) field.disabled = true; accessLegacy.forgetAccessCache();
  const message = document.getElementById('faccmsg'); if (message) message.innerHTML = t('accounts.access.created', { password: escapeHtml(password) });
}

/** Whoever may give access to the accounts of their portfolio (only those, or all if they see everything). */
async function portfolioAccess(id: string): Promise<void> {
  if (!canShow(id)) return;
  const mine = permissions.seesEverything() ? Promise.resolve({ data: [1] })
    : legacyDb().from<{ cuenta_id: string }[]>('atribuciones').select('cuenta_id').eq('cuenta_id', id).eq('usuario_id', salesTeam.currentUserId()).is('hasta', null).limit(1);
  const [{ data: withAccess }, { data: inPortfolio }, account] = await Promise.all([callRpc<(PlatformUser & { cuenta_id: string })[]>('cuentas_con_acceso', {}), mine, accountOf(id)]);
  const user = (withAccess ?? []).find(item => item.cuenta_id === id);
  if ((!user && !(inPortfolio ?? []).length) || !canShow(id)) return;
  const isCentre = account.tipo === CENTRE;
  document.getElementById('fbody')?.insertAdjacentHTML('beforeend', `<div class="blk" id="facceso"><h3>${t('accounts.access.title')}</h3>
    ${user ? hasAccessHtml(user, isCentre, false) :`<p class="sm">${canText(isCentre)}</p>
         <div class="g2"><div><label for="faccmail">${t('accounts.access.email')}</label><input id="faccmail" type="email" value="${escapeHtml(account.email ?? '')}" placeholder="${t('accounts.access.emailPlaceholder')}"></div>
         <div style="align-self:end"><button class="btn sec" id="fdaracc">${t('accounts.access.give')}</button></div></div><div class="sm" id="faccmsg"></div>`}</div>`);
  const give = document.getElementById('fdaracc') as HTMLButtonElement | null;
  if (give) give.onclick = (): void => { void giveAccess(id, account, give); };
}

/** The «Acceso a la plataforma» block, for administration or for whoever may give access in their portfolio. */
export async function platformAccess(id: string): Promise<void> {
  if (!cardSectionsLegacy.can('administrar') && cardSectionsLegacy.can('dar_acceso_cuentas')) { await portfolioAccess(id); return; }
  if (!cardSectionsLegacy.can('administrar') || !canShow(id)) return;
  await adminAccess(id);
}
