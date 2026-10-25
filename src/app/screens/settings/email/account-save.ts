/**
 * «Correo y firma»: saving the account (each missing datum marked in its field) and the test email. Migrated from the legacy
 * pintarCorreo (v2.417.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { settingsExtraLegacy, type FunctionResult } from '../../../legacy/settings3-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { nonZeroOr, orFallback } from '../../../services/values';

export interface Signature { nombre?: string; cargo?: string; empresa?: string; telefono?: string; telefono2?: string; web?: string; direccion?: string; aviso?: string; logo?: string }
export interface EmailConfig {
  proveedor: string; host: string; puerto: number; seguridad: string; usuario: string; remitente_nombre: string; remitente_email: string; color: string;
  firma: Signature; hay_clave?: boolean;
}

const DEFAULT_PORT = 465;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const text = (id: string): string => (input(id)?.value ?? '').trim();
const message = (html: string): void => { const box = document.getElementById('comsg'); if (box) box.innerHTML = html; };

const readSignature = (): Signature => ({
  nombre: text('fnom'), cargo: text('fcar'), empresa: text('femp'), web: text('fweb'), telefono: text('ftel'), telefono2: text('ftel2'), direccion: text('fdir'),
  aviso: text('faviso'), logo: input('flogo')?.checked ? 'si' : 'no',
});

/** The sender: the one written or, if the access identifier is an email, that one. */
const senderOf = (user: string): string => orFallback(text('coemail'), user.includes('@') ? user : '');

function readConfig(): Omit<EmailConfig, 'hay_clave'> {
  const user = text('cousu'), value = (id: string, fallback: string): string => input(id)?.value ?? fallback;
  return {
    proveedor: value('coprov', ''), host: text('cohost'), puerto: nonZeroOr(Number(input('copuer')?.value), DEFAULT_PORT), seguridad: value('coseg', 'ssl'), usuario: user,
    remitente_nombre: text('conom'), remitente_email: senderOf(user), color: value('fcolor', ''), firma: readSignature(),
  };
}

function missingData(config: Omit<EmailConfig, 'hay_clave'>, hasPassword: boolean): (readonly [string, MessageKey])[] {
  const errors: (readonly [string, MessageKey])[] = [];
  if (!config.host) errors.push(['cohost', 'settingsExtra.email.missingHost']);
  if (!config.usuario) errors.push(['cousu', 'settingsExtra.email.missingUser']);
  if (!hasPassword && !input('copass')?.value) errors.push(['copass', 'settingsExtra.email.missingPassword']);
  if (!config.remitente_email) errors.push(['coemail', 'settingsExtra.email.missingSender']);
  else if (!EMAIL.test(config.remitente_email)) errors.push(['coemail', 'settingsExtra.email.invalidSender']);
  return errors;
}

function markMissing(errors: readonly (readonly [string, MessageKey])[]): void {
  document.querySelectorAll('#cfgcuerpo .campoerr').forEach(item => { item.remove(); });
  document.querySelectorAll('#cfgcuerpo .conerr').forEach(item => { item.classList.remove('conerr'); });
  for (const [id, key] of errors) {
    const element = input(id); if (!element) continue;
    element.classList.add('conerr'); (element.closest('.selw, .numw') ?? element).insertAdjacentHTML('afterend', `<span class="campoerr">${t(key)}</span>`);
  }
  if (!errors.length) return;
  message(`<b class="u-danger">${errors.length === 1 ? t('settingsExtra.email.oneMissing') : t('settingsExtra.email.manyMissing', { count: errors.length })}</b>${t('settingsExtra.email.reviewMarked')}`);
  const first = errors[0]; if (first) input(first[0])?.focus();
}

function failureText(reason: string): string {
  if (/Could not find the function|PGRST202/i.test(reason)) return t('settingsExtra.email.noFunction');
  return reason === 'permiso' ? t('settingsExtra.email.ownerOnly') : t('settingsExtra.email.couldNotSave', { reason });
}

function reasonOf(error: unknown, result: { error?: string } | null): string {
  if (!error) return result?.error ?? '';
  const failure = error as { message?: string; code?: string };
  return orFallback(failure.message, failure.code ?? '');
}

function showFailure(reason: string): void {
  const failure = failureText(reason), detail = reason && !failure.includes(reason) ? `<span class="errtec">${escapeHtml(t('settingsExtra.email.technicalDetail', { reason }))}</span>` : '';
  message(`<b class="u-danger">${escapeHtml(failure)}</b>${detail}`);
  notices.toast(failure, true);
}

async function save(config: EmailConfig): Promise<boolean> {
  const value = readConfig(), errors = missingData(value, Boolean(config.hay_clave));
  markMissing(errors); if (errors.length) return false;
  const password = input('copass')?.value ?? '';
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('guardar_correo', { p: value, p_clave: password || null });
  if (error || result?.ok === false) { showFailure(reasonOf(error, result)); return false; }
  if (password) config.hay_clave = true;
  message(`<b class="u-ok">${t('settingsExtra.email.saved')}</b>`);
  const field = input('copass'); if (field) { field.value = ''; field.placeholder = t('settingsExtra.email.passwordSaved'); }
  notices.toast(t('settingsExtra.email.savedToast')); return true;
}

const TEST_ERRORS = new Map<string, MessageKey>([
  ['credenciales', 'settingsExtra.email.badCredentials'], ['conexion', 'settingsExtra.email.noConnection'], ['sin_smtp', 'settingsExtra.email.noSmtp'],
  ['permiso', 'settingsExtra.email.noPermission'], ['sesion', 'settingsExtra.email.sessionExpired'],
]);

type TestAnswer = { ok?: boolean; error?: string } | null;

/** The answer of the send function; on an error, the body it came with (if any). */
async function answerOf(response: FunctionResult<{ ok?: boolean; error?: string }>): Promise<TestAnswer> {
  const context = (response.error as { context?: { json?: () => Promise<TestAnswer> } } | null)?.context;
  if (!response.error || typeof context?.json !== 'function') return response.data;
  try { return await context.json(); } catch { return response.data; }
}

function testResult(answer: TestAnswer, failed: boolean): string {
  if (answer?.ok) return t('settingsExtra.email.testSent');
  const known = answer?.error ? TEST_ERRORS.get(answer.error) : undefined;
  if (known) return t(known);
  return t('settingsExtra.email.couldNotSend') + (failed && !answer ? t('settingsExtra.email.noSendFunction') : escapeHtml(answer?.error ?? ''));
}

async function sendTest(config: EmailConfig): Promise<void> {
  if (!await save(config)) return;
  const box = document.getElementById('comsg'); if (box) box.textContent = t('settingsExtra.email.sendingTest');
  const response = await settingsExtraLegacy.sendTestEmail();
  message(testResult(await answerOf(response), Boolean(response.error)));
}

/** «Guardar» and «Enviarme un correo de prueba». */
export function bindSaving(config: EmailConfig): void {
  const ok = document.getElementById('cook'), test = document.getElementById('coprueba');
  if (ok) ok.onclick = (): void => { void settingsExtraLegacy.withButtonLoading(ok, t('settingsExtra.email.saving'), () => save(config)); };
  if (test) test.onclick = (): void => { void settingsExtraLegacy.withButtonLoading(test, t('settingsExtra.email.sending'), () => sendTest(config)); };
}
