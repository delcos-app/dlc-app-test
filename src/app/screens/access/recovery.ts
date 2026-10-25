/**
 * Recovering the password (or creating it from an invitation) in a clean screen, and the login form, folded from legado 046 and
 * 047 (v2.424.0): the platform does not open with the link's session; on saving, the session is closed and the user goes back to
 * the access screen (or, from an invitation, straight in). pantallaRecuperacion stays as an adapter (the startup and the
 * navigation call it).
 */
import { legacyBActions, legacyBState, rawDb } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

const MIN_LENGTH = 8, NOTICE_DELAY_MS = 300;
const formOf = (id: string): HTMLFormElement | null => document.getElementById(id) as HTMLFormElement | null;
const inputValue = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function recoveryHtml(invitation: boolean): string {
  const head = invitation ? `<h1>${t('legacyB.recovery.welcomeTitle')}</h1><p class="sm">${t('legacyB.recovery.welcomeText')}</p>`
    : `<h1>${t('legacyB.recovery.newTitle')}</h1><p class="sm">${t('legacyB.recovery.newText')}</p>`;
  return `<section id="recupera"><form class="lbox" id="rform" autocomplete="off">
      <img src="${escapeHtml(orFallback(legacyBState.brandLogo(), 'logo-app.png'))}" alt="">
      ${head}
      <label for="rp1">${t('legacyB.recovery.newPassword')}</label><input id="rp1" type="password" autocomplete="new-password" required>
      <label for="rp2">${t('legacyB.recovery.repeat')}</label><input id="rp2" type="password" autocomplete="new-password" required>
      <p class="sm" id="rmsg" style="min-height:18px;margin:8px 0 0"></p>
      <button class="btn" id="rok" type="submit" style="width:100%;margin-top:10px">${t('legacyB.recovery.save')}</button>
      ${invitation ? '' : `<button class="btn sec" id="rcancel" type="button" style="width:100%;margin-top:8px">${t('legacyB.recovery.cancel')}</button>`}</form></section>`;
}

/** Closes the link's session, forgets the local data and goes back to the access screen with `query`. */
async function leave(query: string): Promise<void> {
  try { await rawDb().auth.signOut(); } catch { /* already closed */ }
  try { legacyBActions.clearLocalData(); localStorage.removeItem('dlc-os-sesion'); } catch { /* nothing stored */ }
  location.replace(location.origin + location.pathname + query);
}

const failureText = (message: string): string => {
  if (/same|different/i.test(message)) return t('legacyB.recovery.mustDiffer');
  return /session|expired|invalid/i.test(message) ? t('legacyB.recovery.linkExpired') : t('legacyB.recovery.couldNotChange', { error: message });
};

async function save(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  const first = inputValue('rp1'), second = inputValue('rp2'), message = document.getElementById('rmsg'), button = document.getElementById('rok') as HTMLButtonElement | null;
  if (!message || !button) return;
  message.style.color = 'var(--dang)';
  if (first.length < MIN_LENGTH) { message.textContent = t('legacyB.recovery.tooShort'); return; }
  if (first !== second) { message.textContent = t('legacyB.recovery.noMatch'); return; }
  button.disabled = true; button.textContent = t('legacyB.recovery.saving');
  const { error } = await rawDb().auth.updateUser({ password: first });
  if (error) { button.disabled = false; button.textContent = t('legacyB.recovery.save'); message.textContent = failureText(error.message); return; }
  // v2.168.0: from an invitation the user goes straight in (the link's session is already theirs)
  if (legacyBState.invitationLink()) { location.replace(`${location.origin}${location.pathname}?bienvenida=1`); return; }
  await leave('?clave=cambiada');
}

/** The new password screen, over everything (the open windows are closed), with the strength meter. */
export function showRecovery(): void {
  legacyBState.setRecovering(true);
  document.documentElement.classList.add('recuperando');
  ['dlg', 'dlg2', 'ficha', 'mini'].forEach(id => { const dialog = document.getElementById(id) as HTMLDialogElement | null; if (dialog?.open) try { dialog.close(); } catch { /* closing */ } });
  if (!document.getElementById('recupera')) {
    document.body.insertAdjacentHTML('beforeend', recoveryHtml(legacyBState.invitationLink()));
    const form = formOf('rform'); if (form) form.onsubmit = (event): void => { void save(event); };
    const cancel = document.getElementById('rcancel'); if (cancel) cancel.onclick = (): void => { void leave(''); };
  }
  completeRecoveryForm();
}

/** v2.45.2: the recovery form without the browser's own warnings, with the strength meter (also when it opened before this point). */
export function completeRecoveryForm(): void {
  const form = formOf('rform'); if (!form) return;
  form.noValidate = true;
  legacyBActions.passwordMeter(document.getElementById('rp1'), document.getElementById('rp2'), document.getElementById('rok'));
}

/** Notices on the access screen: the password was changed, or the link expired. */
export function showAccessNotices(): void {
  const notice = (text: string, ok: boolean): void => {
    const message = document.getElementById('lmsg'); if (!message) return;
    message.style.color = ok ? 'var(--ok)' : 'var(--dang)'; message.textContent = text;
  };
  if (new URLSearchParams(location.search).get('clave') === 'cambiada') {
    setTimeout(() => { notice(t('legacyB.recovery.changed'), true); }, NOTICE_DELAY_MS); history.replaceState(null, '', location.pathname);
  }
  if (legacyBState.expiredLink()) {
    setTimeout(() => { notice(t('legacyB.recovery.expired'), false); }, NOTICE_DELAY_MS); history.replaceState(null, '', location.pathname);
  }
}

function loginError(email: string, password: string): string {
  if (!email) return t('legacyB.login.writeEmail');
  if (!/\S+@\S+\.\S+/.test(email)) return t('legacyB.login.invalidEmail');
  return password ? '' : t('legacyB.login.writePassword');
}

/** v2.45.2: «Entrar» is active once email and password are written (or the browser filled them in); errors in the platform's style. */
export function prepareLoginForm(): void {
  const form = formOf('lform'), email = document.getElementById('lu') as HTMLInputElement | null, password = document.getElementById('lp') as HTMLInputElement | null;
  const button = document.getElementById('lbtn') as HTMLButtonElement | null;
  if (!form || !email || !password || !button) return;
  form.noValidate = true;
  let autofilled = false;
  const update = (): void => { button.disabled = !((email.value.trim() && password.value) || autofilled); };
  [email, password].forEach(input => {
    input.addEventListener('input', () => { autofilled = false; update(); }); input.addEventListener('change', update);
    // The browser may fill in the saved data without an event: its animation tells it
    input.addEventListener('animationstart', event => { if (event.animationName === 'autorelleno') { autofilled = true; update(); } });
  });
  update(); [400, 1500].forEach(delay => setTimeout(update, delay));
  form.addEventListener('submit', event => {
    const error = loginError(email.value.trim(), password.value); if (!error) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const message = document.getElementById('lmsg'); if (message) { message.style.color = 'var(--dang)'; message.textContent = error; }
    (email.value.trim() ? password : email).focus();
  }, true);
}
