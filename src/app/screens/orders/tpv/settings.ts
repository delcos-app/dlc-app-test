/**
 * Configuración → Facturación → «Cobro con tarjeta y Bizum» (who sets up the company): merchant number, terminal, secret key,
 * test or real environment, «Probar» and the notice address for the bank. Migrated from the legacy pintarTpv (v2.417.0); pintarTpv
 * stays as an adapter (legado 147 adds the section).
 */
import { legacyDb, term } from '../../../legacy/bridge';
import { tpvLegacy } from '../../../legacy/orders2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { callTpv, tpvErrorText } from './model';

/** Public data of the Redsys test environment (nothing is charged). */
const TEST_DATA = { comercio: '999008881', terminal: '1', clave: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7' };

const SAVE_ERRORS = new Map<string, MessageKey>([
  ['comercio', 'ordersMore.tpvSettings.merchantDigits'], ['terminal', 'ordersMore.tpvSettings.terminalDigits'],
  ['clave', 'ordersMore.tpvSettings.secretMissing'], ['permiso', 'ordersMore.tpvSettings.noPermission'],
]);

const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const value = (id: string): string => field(id)?.value.trim() ?? '';

function pageHtml(settings: Record<string, unknown>): string {
  const text = (key: string): string => escapeHtml(String(settings[key] ?? ''));
  return `<div class="card tpvw">
    <p class="sm">${t('ordersMore.tpvSettings.intro', { thePatient: term('paciente', { article: 'el' }) })}</p>
    <label class="opt"><input type="checkbox" id="tpvact" ${settings.activo ? 'checked' : ''}> ${t('ordersMore.tpvSettings.active')}</label>
    <div class="g2"><div><label for="tpvcom">${t('ordersMore.tpvSettings.merchant')}</label><input id="tpvcom" inputmode="numeric" value="${text('comercio')}"></div>
      <div><label for="tpvter">${t('ordersMore.tpvSettings.terminal')}</label><input id="tpvter" inputmode="numeric" value="${text('terminal')}"></div></div>
    <div class="g2"><div><label for="tpvcla">${t('ordersMore.tpvSettings.secret')}</label><input id="tpvcla" type="password" autocomplete="new-password" placeholder="${settings.hay_clave ? t('ordersMore.tpvSettings.secretSaved') : ''}"></div>
      <div><label for="tpvent">${t('ordersMore.tpvSettings.environment')}</label><select id="tpvent"><option value="pruebas">${t('ordersMore.tpvSettings.test')}</option><option value="real" ${settings.entorno === 'real' ? 'selected' : ''}>${t('ordersMore.tpvSettings.real')}</option></select></div></div>
    <p class="sm">${t('ordersMore.tpvSettings.noticeAddress')} <b id="tpvurl">${escapeHtml(tpvLegacy.serverUrl())}/functions/v1/cobro_tpv</b></p>
    <div class="acts"><button type="button" class="btn sec" id="tpvdemo">${t('ordersMore.tpvSettings.useTestData')}</button>
      <button type="button" class="btn sec" id="tpvprobar">${t('ordersMore.tpvSettings.try')}</button><button type="button" class="btn" id="tpvok">${t('ordersMore.tpvSettings.save')}</button></div>
    <p class="sm" id="tpvmsg"></p></div>`;
}

function message(text: string, isError = false): void {
  const box = document.getElementById('tpvmsg'); if (box) box.innerHTML = `<b class="${isError ? 'tpverr' : 'tpvok'}">${text}</b>`;
}

function saveErrorText(code: string | undefined, error: { message?: string } | null): string {
  const known = SAVE_ERRORS.get(code ?? '');
  return known ? t(known) : t('ordersMore.tpvSettings.couldNotSave') + (error ? `: ${escapeHtml(error.message ?? '')}` : '');
}

async function save(): Promise<boolean> {
  const settings = { activo: Boolean(field('tpvact')?.checked), entorno: value('tpvent'), comercio: value('tpvcom'), terminal: value('tpvter') };
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; hay_clave?: boolean }>('guardar_cobro_tpv', { p: settings, p_clave: value('tpvcla') || null });
  if (error || !result?.ok) { message(saveErrorText(result?.error, error as { message?: string } | null), true); return false; }
  tpvLegacy.setSettings({ ...settings, hay_clave: result.hay_clave });
  const secret = field('tpvcla');
  if (secret) { secret.value = ''; if (result.hay_clave) secret.placeholder = t('ordersMore.tpvSettings.secretSaved'); }
  message(t('ordersMore.tpvSettings.saved'));
  return true;
}

async function tryIt(): Promise<void> {
  if (!await save()) return;
  const result = await callTpv({ accion: 'probar' });
  if (!result.ok) { message(escapeHtml(tpvErrorText(result)), true); return; }
  const box = document.getElementById('tpvmsg');
  if (box) box.innerHTML = `<b class="tpvok">${t('ordersMore.tpvSettings.bankAccepts')}</b> ${result.url ? `<a href="${escapeHtml(result.url)}" target="_blank" rel="noopener">${t('ordersMore.tpvSettings.testPage')}</a>` : ''}`;
}

function useTestData(): void {
  const set = (id: string, text: string): void => { const input = field(id); if (input) input.value = text; };
  set('tpvcom', TEST_DATA.comercio); set('tpvter', TEST_DATA.terminal); set('tpvcla', TEST_DATA.clave); set('tpvent', 'pruebas');
}

export function paintTpvSettings(): void {
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = pageHtml(tpvLegacy.settings());
  const on = (id: string, action: (button: HTMLElement) => void): void => { const button = document.getElementById(id); if (button) button.onclick = (): void => { action(button); }; };
  on('tpvdemo', useTestData);
  on('tpvok', button => { void tpvLegacy.whileWorking(button, t('ordersMore.tpvSettings.saving'), save); });
  on('tpvprobar', button => { void tpvLegacy.whileWorking(button, t('ordersMore.tpvSettings.trying'), tryIt); });
}
