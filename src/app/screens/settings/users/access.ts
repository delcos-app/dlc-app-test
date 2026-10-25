/**
 * «Datos de acceso» of a user (administration, v2.279.0): the temporary password saved when the user was created, to copy and pass
 * on while they have not come in yet. Migrated from the legacy verAccesoTemporal (v2.420.0).
 */
import { callRpc, notices, term } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import type { UserRow } from '../../../legacy/settings4-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { resetPassword } from '../../access';
import { dialog, dialogBody } from './model';

interface TemporaryAccess { ok?: boolean; error?: string; nombre?: string; email?: string; pass?: string; rol?: string; cuenta?: string | null }

const appUrl = (): string => location.origin + location.pathname;

/** Window header with the user's name and email. */
export const headerHtml = (title: string, user: { nombre?: string; email?: string | null }): string =>
  `<div class="fh"><div><h2>${escapeHtml(title)}</h2><div class="sm">${escapeHtml(user.nombre ?? '')} · ${escapeHtml(user.email ?? '')}</div></div><button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;

/** The message to send a new user with their access data. */
export const welcomeText = (name: string, email: string, password: string): string =>
  t('settingsRest.newUser.message', { name: settingsExtraLegacy.firstName(name), app: settingsExtraLegacy.appName(), url: appUrl(), email, password });

/** Copies the access data (or says it could not). */
export async function copyText(text: string): Promise<void> {
  try { await navigator.clipboard.writeText(text); notices.toast(t('settingsRest.newUser.copied')); } catch { notices.toast(t('settingsRest.newUser.couldNotCopy'), true); }
}

/** The data box shown after creating a user and in «Datos de acceso». */
export function accessDataHtml(data: { nombre: string; rol: string; email: string; pass: string; vinculado?: string | null }): string {
  const linked = data.vinculado ? `<div><span>${term('medico', { capital: 'C', adjective: 'vinculado' })}</span><b>${escapeHtml(data.vinculado)}</b></div>` : '';
  return `<div class="usrok"><div><span>${t('settingsRest.newUser.name')}</span><b>${escapeHtml(data.nombre)}</b></div><div><span>${t('settingsRest.newUser.role2')}</span><b>${escapeHtml(data.rol)}</b></div>
      <div><span>${t('settingsRest.newUser.user')}</span><b>${escapeHtml(data.email)}</b></div><div><span>${t('settingsRest.newUser.password')}</span><b class="mono">${escapeHtml(data.pass)}</b></div>
      ${linked}<div><span>${t('settingsRest.newUser.address')}</span><b>${escapeHtml(appUrl())}</b></div></div>`;
}

const REASONS = new Map<string, MessageKey>([['ya_entro', 'settingsRest.access.alreadyIn'], ['sin_datos', 'settingsRest.access.noData']]);

function paintFailure(body: HTMLElement, user: UserRow, result: TemporaryAccess | null): void {
  const text = result ? t(REASONS.get(result.error ?? '') ?? 'settingsRest.access.noPermission') : t('settingsRest.access.unreadable');
  const canSend = result && result.error !== 'permiso';
  body.innerHTML = `${headerHtml(t('settingsRest.access.title'), user)}<p>${escapeHtml(text)}</p>
      <div class="acts u-end u-wrap">${canSend ? `<button class="btn sec" id="accpass">${t('settingsRest.access.sendPassword')}</button>` : ''}<button class="btn" data-cerrar>${t('settingsRest.access.close')}</button></div>`;
  const send = document.getElementById('accpass');
  if (send) send.onclick = (): void => { dialog()?.close(); void resetPassword(user); };
}

export async function showTemporaryAccess(user: UserRow): Promise<void> {
  const { data: result } = await callRpc<TemporaryAccess>('ver_acceso_temporal', { p_usuario: user.id });
  const body = dialogBody(); if (!body) return;
  if (!result?.ok) { paintFailure(body, user, result); return; }
  const data = { nombre: result.nombre ?? '', rol: result.rol ?? '', email: result.email ?? '', pass: result.pass ?? '', vinculado: result.cuenta ?? null };
  body.innerHTML = `${headerHtml(t('settingsRest.access.title'), user)}
    ${accessDataHtml(data)}
    <p class="sm">${t('settingsRest.access.notYet')}</p>
    <div class="acts u-end u-wrap"><button class="btn sec" id="acccop">${t('settingsRest.newUser.copy')}</button><button class="btn" data-cerrar>${t('settingsRest.newUser.done')}</button></div>`;
  const copy = document.getElementById('acccop'); if (copy) copy.onclick = (): void => { void copyText(welcomeText(data.nombre, data.email, data.pass)); };
}
