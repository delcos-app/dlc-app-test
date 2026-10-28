/**
 * Panel delcos → Clientes → «+ Nueva organización»: a company is born with the platform's starting roles, catalogs, series and
 * settings, and its administrator is invited and signed up with a temporary password. Migrated from the legacy
 * pintarOrganizaciones (v2.413.0).
 */
import { accessLegacy, legacyDb, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { errorMessage } from './model';

const MIN_USERS = 3, TRIAL_DAYS = 30, MIN_PASSWORD = 6, DEFAULT_PLAN = 'empresa';
const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const CREATE_ERRORS = new Map<string, MessageKey>([['permiso', 'platform.orgs.noPermission'], ['nombre', 'platform.newOrg.noName'], ['email', 'platform.newOrg.badEmail'], ['email_existe', 'platform.newOrg.emailTaken']]);

function formHtml(): string {
  const plans = platformLegacy.plans().map(plan => `<option value="${plan.id}" ${plan.id === DEFAULT_PLAN ? 'selected' : ''}>${escapeHtml(plan.nombre)}</option>`).join('');
  return `<div class="fh"><div><h2>${t('platform.newOrg.title')}</h2><div class="sm">${t('platform.newOrg.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <div class="g2"><div><label for="onom">${t('platform.newOrg.name')}</label><input id="onom"></div>
        <div><label for="onif">${t('platform.newOrg.nif')}</label><input id="onif"></div>
        <div><label for="oplan">${t('platform.newOrg.plan')}</label><select id="oplan">${plans}</select></div>
        <div><label for="ousu">${t('platform.newOrg.users')}</label><input id="ousu" type="number" min="3" value="3"></div>
        <div><label for="opago">${t('platform.newOrg.payment')}</label><select id="opago"><option value="mensual">${t('platform.newOrg.monthly')}</option><option value="anual">${t('platform.newOrg.yearly')}</option></select></div>
        <div><label class="chk"><input type="checkbox" id="oprueba" checked> ${t('platform.newOrg.trial')}</label></div></div>
      <h3 class="u-mt-14">${t('platform.newOrg.admin')}</h3>
      <div class="g2"><div><label for="oanom">${t('platform.newOrg.adminName')}</label><input id="oanom"></div>
        <div><label for="oamail">${t('platform.newOrg.adminEmail')}</label><input id="oamail" type="email"></div>
        <div><label for="oapass">${t('platform.newOrg.password')}</label><input id="oapass" value="Tmp-${Math.random().toString(36).slice(2, 8)}"></div></div>
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="ocrear">${t('platform.newOrg.create')}</button></div>
      <div id="omsg" class="sm u-mt-10"></div>`;
}

const setMessage = (html: string): void => { const message = document.getElementById('omsg'); if (message) message.innerHTML = html; };
const busy = (button: HTMLButtonElement, on: boolean): void => { button.disabled = on; button.textContent = t(on ? 'platform.newOrg.creating' : 'platform.newOrg.create'); };

function newCompany(name: string, email: string): Record<string, unknown> {
  return {
    nombre: name, nif: value('onif').trim(), plan: value('oplan'), usuarios: Number(value('ousu')) || MIN_USERS, pago: value('opago'),
    prueba_dias: (document.getElementById('oprueba') as HTMLInputElement | null)?.checked ? TRIAL_DAYS : 0, email_admin: email,
  };
}

function createFailure(code: string | undefined, error: unknown): string {
  const key = CREATE_ERRORS.get(code ?? ''), reason = key ? t(key) : errorMessage(error);
  return `<span class="u-danger">${t('platform.newOrg.failed', { reason: escapeHtml(reason) })}</span>`;
}

async function create(button: HTMLButtonElement, repaint: () => Promise<void>): Promise<void> {
  const name = value('onom').trim(), email = value('oamail').trim(), password = value('oapass'), adminName = value('oanom').trim();
  if (!name || !email || !adminName || password.length < MIN_PASSWORD) { notices.toast(t('platform.newOrg.complete'), true); return; }
  busy(button, true);
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('crear_organizacion', { p: newCompany(name, email) });
  if (error || !result?.ok) { busy(button, false); setMessage(createFailure(result?.error, error)); return; }
  // Its administrator signs up: the invitation places them in the new company
  const failure = await accessLegacy.signUp(email, password, adminName);
  busy(button, false);
  setMessage(failure ? `<span class="u-danger">${t('platform.newOrg.noUser', { error: escapeHtml(failure.message ?? '') })}</span>`
    : t('platform.newOrg.created', { email: escapeHtml(email), password: escapeHtml(password) }));
  void repaint();
}

export function openNewOrganization(repaint: () => Promise<void>): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml();
  const ok = document.getElementById('ocrear') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void create(ok, repaint); };
  box.showModal();
}
