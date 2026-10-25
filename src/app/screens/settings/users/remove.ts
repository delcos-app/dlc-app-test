/**
 * Delete a user completely (administration, v2.87.0; borrar_usuario_seguro since v2.272.0). Orders, invoices, payments and the audit
 * log are always kept. Migrated from the legacy borrarUsuario (v2.420.0).
 */
import { currentScreen, legacyDb, notices } from '../../../legacy/bridge';
import { usersLegacy, type UserRow } from '../../../legacy/settings4-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { dialog, dialogBody, input, words } from './model';

interface DeleteResult { ok?: boolean; error?: string; detalle?: string; acceso?: string }

const REASONS = new Map<string, MessageKey>([
  ['permiso', 'settingsRest.remove.reasons.permiso'], ['uno_mismo', 'settingsRest.remove.reasons.unoMismo'],
  ['ultimo_admin', 'settingsRest.remove.reasons.ultimoAdmin'], ['no_existe', 'settingsRest.remove.reasons.noExiste'],
]);
/** Errors the user causes: they are not logged as failures. */
const EXPECTED = ['permiso', 'uno_mismo', 'ultimo_admin'];

function reasonOf(result: DeleteResult | null, error: { message?: string } | null): string {
  const code = result?.error ?? '';
  if (code === 'referencias') return t('settingsRest.remove.reasons.referencias', { detail: result?.detalle ?? '' });
  const known = REASONS.get(code);
  return known ? t(known) : (error?.message ?? t('settingsRest.remove.noAnswer'));
}

/** v2.272.0: the reason, inside the window. */
function showError(text: string): void {
  let box = document.getElementById('buerr');
  if (!box) { document.getElementById('buok')?.closest('.acts')?.insertAdjacentHTML('beforebegin', '<p class="buerr" id="buerr" role="alert"></p>'); box = document.getElementById('buerr'); }
  if (box) box.textContent = text;
}

function failed(result: DeleteResult | null, error: { message?: string } | null): void {
  const text = t('settingsRest.remove.failed', { reason: reasonOf(result, error) });
  showError(text); notices.toast(text, true);
  if (!result || !EXPECTED.includes(result.error ?? '')) {
    usersLegacy.logError(t('settingsRest.remove.log', { error: result?.error ?? error?.message ?? t('settingsRest.remove.noAnswer') }), { detalle: result?.detalle });
  }
}

async function confirmDelete(user: UserRow, button: HTMLButtonElement): Promise<void> {
  if (input('buconf')?.value.trim().toUpperCase() !== t('settingsRest.remove.confirmWord')) {
    showError(t('settingsRest.remove.typeIt')); notices.toast(t('settingsRest.remove.typeItShort'), true); return;
  }
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<DeleteResult>('borrar_usuario_seguro', { p_id: user.id, p_con_actividad: Boolean(input('bucon')?.checked) });
  button.disabled = false;
  if (error || !result?.ok) { failed(result, error as { message?: string } | null); return; }
  dialog()?.close();
  notices.toast(t(String(result.acceso ?? '').startsWith('no_borrado') ? 'settingsRest.remove.doneNoAccess' : 'settingsRest.remove.done'));
  usersLegacy.reloadAdmin();
  // v2.272.0: the list, without that person
  if (currentScreen() === 'config' && usersLegacy.settingsKey() === 'usuarios') usersLegacy.repaintList();
}

export function deleteUser(user: UserRow): void {
  const body = dialogBody(); if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${escapeHtml(t('settingsRest.remove.title', { name: user.nombre || (user.email ?? '') }))}</h2><div class="sm">${escapeHtml(user.email ?? '')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <p>${t('settingsRest.remove.intro')}</p>
    <label class="chk" style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input type="checkbox" id="bucon" style="margin-top:3px">
      <span>${t('settingsRest.remove.activity', words())}<br><span class="sm">${t('settingsRest.remove.activityHint')}</span></span></label>
    <p class="sm">${t('settingsRest.remove.never')}</p>
    <label for="buconf">${t('settingsRest.remove.confirmLabel')}</label><input id="buconf" autocomplete="off">
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('settingsRest.remove.cancel')}</button><button class="btn dang" id="buok">${t('settingsRest.remove.ok')}</button></div>`;
  dialog()?.showModal();
  const ok = document.getElementById('buok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void confirmDelete(user, ok); };
}
