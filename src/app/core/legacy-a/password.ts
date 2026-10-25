/**
 * Passwords (legado 005, v2.424.0): «He olvidado la contraseña» on the sign-in screen, the new password when arriving from the
 * recovery email, and «Cambiar contraseña» from the user menu. Registered by legado 005 at its place in the load order.
 */
import { notices } from '../../legacy/bridge';
import { passwordLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';

const MIN_LENGTH = 8;
const byId = (id: string): HTMLElement | null => document.getElementById(id);
const valueOf = (id: string): string => (byId(id) as HTMLInputElement | null)?.value ?? '';
const errorText = (error: unknown): string => (error as { message?: string }).message ?? '';

async function forgotPassword(): Promise<void> {
  const email = valueOf('lu').trim(), message = byId('lmsg');
  if (!message) return;
  if (!email) { message.textContent = t('legacyA.password.writeEmail'); return; }
  const { error } = await passwordLegacy.sendReset(email, location.origin + location.pathname);
  message.style.color = error ? 'var(--dang)' : 'var(--ok)';
  message.textContent = error ? t('legacyA.password.couldNotSend', { error: errorText(error) }) : t('legacyA.password.sent');
}

/** The old window to choose the new password (only if the clean recovery screen is not there). */
function newPasswordWindow(): void {
  const body = byId('dbody'), box = (byId('dlg') as HTMLDialogElement | null);
  if (!body || !box) return;
  body.innerHTML = `
    <div class="fh"><div><h2>${t('legacyA.password.newTitle')}</h2><div class="sm">${t('legacyA.password.newHint')}</div></div></div>
    <label for="np1">${t('legacyA.password.password')}</label><input id="np1" type="password">
    <label for="np2">${t('legacyA.password.repeat')}</label><input id="np2" type="password">
    <div class="acts u-end"><button class="btn" id="npok">${t('common.save')}</button></div>`;
  box.showModal();
  const ok = (byId('npok') as HTMLButtonElement | null);
  if (ok) ok.onclick = async (): Promise<void> => {
    if (valueOf('np1').length < MIN_LENGTH || valueOf('np1') !== valueOf('np2')) { notices.toast(t('legacyA.password.check'), true); return; }
    ok.disabled = true;
    const { error } = await passwordLegacy.update(valueOf('np1'));
    ok.disabled = false;
    if (error) { notices.toast(t('legacyA.password.couldNotChange', { error: errorText(error) }), true); return; }
    box.close(); notices.toast(t('legacyA.password.updated')); passwordLegacy.start();
  };
}

async function changeFromMenu(event: Event): Promise<void> {
  if (!(event.target as Element).closest('[data-u="pass"]')) return;
  const password = await passwordLegacy.askText(t('legacyA.password.askNew'), '', { titulo: t('legacyA.password.changeTitle'), tipo: 'password', ok: t('common.save') });
  if (!password) return;
  if (password.length < MIN_LENGTH) { notices.toast(t('legacyA.password.tooShort'), true); return; }
  const { error } = await passwordLegacy.update(password);
  notices.toast(error ? t('legacyA.password.couldNot', { error: errorText(error) }) : t('legacyA.password.updated'), Boolean(error));
}

/** Registers the three password flows (legado 005). */
export function startPasswordFlows(): void {
  byId('lform')?.insertAdjacentHTML('beforeend',
    `<button type="button" id="lolv" style="border:0;background:none;color:var(--navy);font-weight:600;cursor:pointer;margin-top:10px;font-size:13.5px">${t('legacyA.password.forgot')}</button>`);
  const forgot = byId('lolv'); if (forgot) forgot.onclick = (): void => { void forgotPassword(); };
  // Arriving from the recovery email: never with the platform behind, a clean screen with only the new password
  passwordLegacy.onRecovery(() => {
    if (passwordLegacy.hasRecoveryScreen()) { passwordLegacy.recoveryScreen(); return; }
    newPasswordWindow();
  });
  document.addEventListener('click', event => { void changeFromMenu(event); });
}
