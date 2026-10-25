/**
 * Account e-mails: resend the activation link (from the sign-in screen and the user sheet) and send the password reset. Migrated
 * from the legacy reenviarActivacion, accesoSinActivar and restablecerPassword (v2.414.0); the three names stay as adapters
 * (sign-in, legado 129, Configuración and the tests).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Where the notices go: by default, the toast. */
export interface Reporter { readonly ok?: (text: string) => void; readonly err?: (text: string) => void }

const returnAddress = (): string => location.origin + location.pathname;

function resendFailure(error: { message: string; status?: number | string }): string {
  if (/rate|seconds|429|security purposes/i.test(error.message + String(error.status ?? ''))) return t('access.activation.justSent');
  if (/already|confirmed/i.test(error.message)) return t('access.activation.alreadyActive');
  return t('access.activation.couldNotSend', { error: error.message });
}

/** Sends a new activation e-mail; true if it was sent. */
export async function resendActivation(email: unknown, reporter: Reporter = {}): Promise<boolean> {
  const address = String(email ?? '').trim();
  const fail = reporter.err ?? ((text: string): void => { notices.toast(text, true); });
  if (!EMAIL.test(address)) { fail(t('access.activation.writeEmail')); return false; }
  const { error } = await legacyDb().auth.resend({ type: 'signup', email: address, options: { emailRedirectTo: returnAddress() } });
  if (error) { fail(resendFailure(error)); return false; }
  (reporter.ok ?? ((text: string): void => { notices.toast(text); }))(t('access.activation.sent', { email: address }));
  return true;
}

/** On the sign-in screen: the notice and «Enviarme un enlace nuevo» with the e-mail written there. */
export function showNotActivated(text: string): void {
  const message = document.getElementById('lmsg'); if (!message) return;
  message.innerHTML = `<span>${escapeHtml(text)}</span> <button type="button" class="btn sec chico" id="lreenv">${t('access.activation.sendNewLink')}</button>`;
  const button = document.getElementById('lreenv') as HTMLButtonElement | null;
  if (!button) return;
  button.onclick = async (): Promise<void> => {
    button.disabled = true;
    const email = (document.getElementById('lu') as HTMLInputElement | null)?.value;
    await resendActivation(email, {
      ok: sent => { message.textContent = sent; },
      err: failed => { const line = message.querySelector('span'); if (line) line.textContent = failed; button.disabled = false; },
    });
  };
}

/** Sends a user the e-mail to create a new password, after asking. */
export async function resetPassword(user: { email?: string | null }): Promise<void> {
  const email = user.email;
  if (!email) { notices.toast(t('access.reset.noEmail'), true); return; }
  if (!await notices.confirm(t('access.reset.text', { email }), { titulo: t('access.reset.title'), ok: t('access.reset.ok') })) return;
  const { error } = await legacyDb().auth.resetPasswordForEmail(email, { redirectTo: returnAddress() });
  if (error) { notices.toast(t('access.reset.couldNotSend', { error: error.message }), true); return; }
  notices.toast(t('access.reset.sent', { email }));
}
