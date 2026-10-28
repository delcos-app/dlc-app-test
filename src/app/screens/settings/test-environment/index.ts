/**
 * Configuración → Entorno de pruebas: when the starting data was copied from production and last reset, bringing today's production
 * data (it reloads the app when the copy ends) and going back to the starting data. Migrated from the legacy pintarCfgPruebas,
 * traerProduccion and estadoRefresco (v2.415.0).
 */
import { callRpc, cardSectionsLegacy, notices } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';

const WATCH_MS = 20000, RELOAD_MS = 800, ADMINISTER = 'administrar';
const REQUESTED = 'pedido', COPYING = 'copiando', FAILED = 'error', DONE = 'ok';

export interface TestEnvironment { refresco_estado?: string | null; refresco_error?: string | null; maestro_guardado_en?: string | null; ultimo_reset?: string | null }

let watcher: ReturnType<typeof setInterval> | null = null;

const running = (environment: TestEnvironment): boolean => [REQUESTED, COPYING].includes(environment.refresco_estado ?? '');

function statusText(environment: TestEnvironment): string {
  if (running(environment)) return t(environment.refresco_estado === REQUESTED ? 'settings.testEnvironment.copyingStarting' : 'settings.testEnvironment.copyingRunning');
  if (environment.refresco_estado === FAILED) return t('settings.testEnvironment.copyFailed') + (environment.refresco_error ? `: ${environment.refresco_error}` : '');
  return environment.refresco_error ? `· ${environment.refresco_error}` : '';
}

function watch(): void {
  watcher = setInterval(() => {
    void refreshStatus().then(environment => {
      if (!environment || running(environment)) return;
      if (watcher) clearInterval(watcher);
      watcher = null;
      if (environment.refresco_estado === DONE) {
        notices.toast(t('settings.testEnvironment.copied')); settingsLegacy.clearLocalData();
        setTimeout(() => { location.reload(); }, RELOAD_MS);
      } else notices.toast(t('settings.testEnvironment.copyFailedToast'), true);
    });
  }, WATCH_MS);
}

/** Shows how the copy from production goes and, while it runs, checks it every 20 seconds. */
export async function refreshStatus(): Promise<TestEnvironment | null> {
  const { data: environment } = await settingsLegacy.testEnvironment<TestEnvironment>().select('*').eq('id', 1).single();
  const line = document.getElementById('prrefresco'); if (!line || !environment) return null;
  line.textContent = statusText(environment);
  line.classList.toggle('falta', environment.refresco_estado === FAILED);
  const bring = document.getElementById('prtraer') as HTMLButtonElement | null; if (bring) bring.disabled = running(environment);
  if (running(environment) && !watcher) watch();
  return environment;
}

async function startCopy(): Promise<{ result: { ok?: boolean; motivo?: string } | null; failed: boolean }> {
  const { data, error } = await settingsLegacy.edgeFunctions().invoke('refrescar-pruebas', { body: {} });
  let result = data as { ok?: boolean; motivo?: string } | null;
  const answer = error?.context?.json;
  if (answer) { try { result = await answer() as { ok?: boolean; motivo?: string } | null; } catch { /* keep the first answer */ } }
  return { result, failed: Boolean(error) };
}

/** «Traer los datos de producción», after asking. */
export async function bringProduction(button: HTMLButtonElement | null): Promise<void> {
  if (!await notices.confirm(t('settings.testEnvironment.askText'), { titulo: t('settings.testEnvironment.askTitle'), ok: t('settings.testEnvironment.askOk'), peligro: true })) return;
  if (button) button.disabled = true;
  const { result, failed } = await startCopy();
  if (!result?.ok) {
    if (button) button.disabled = false;
    const reason = result?.motivo ? settingsLegacy.refreshReason(result.motivo) : undefined;
    notices.toast(reason ?? t('settings.testEnvironment.couldNotStart') + (failed && !result ? t('settings.testEnvironment.missingFunction') : ''), true);
    return;
  }
  notices.toast(t('settings.testEnvironment.started'));
  void refreshStatus();
}

const when = (date: string | null | undefined): string =>
  (date ? new Date(date).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

function pageHtml(environment: TestEnvironment | null, allowed: boolean): string {
  const actions = allowed ? `<div class="acts u-start u-wrap">
        <button type="button" class="btn" id="prtraer">${t('settings.testEnvironment.bring')}</button>
        <button type="button" class="btn sec" id="prreset">${t('settings.testEnvironment.reset')}</button></div>
      <p class="leer">${t('settings.testEnvironment.explain')}</p>`
    : `<p class="sm" style="padding:0 16px">${t('settings.testEnvironment.onlyResponsible')}</p>`;
  return `<div class="card" id="cfpruebas"><div class="fh"><div><h2>${t('settings.testEnvironment.title')}</h2>
      <div class="sm">${t('settings.testEnvironment.subtitle')}</div></div></div>
    <div class="minis">
      <div><b>${when(environment?.maestro_guardado_en)}</b><span>${t('settings.testEnvironment.startData')}</span></div>
      <div><b>${when(environment?.ultimo_reset)}</b><span>${t('settings.testEnvironment.lastReset')}</span></div></div>
    <div class="sm" id="prrefresco" style="padding:0 16px"></div>
    ${actions}</div>`;
}

export async function paintTestEnvironment(): Promise<void> {
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = `<div class="card">${settingsLegacy.skeletonCard(t('settings.testEnvironment.loading'))}</div>`;
  const [{ data: environment }, { data: canReset, error }] = await Promise.all([
    settingsLegacy.testEnvironment<TestEnvironment>().select('*').eq('id', 1).maybeSingle(), callRpc<boolean>('pruebas_puede_restablecer', {})]);
  if (!document.getElementById('cfgcuerpo')) return;
  // Without the function in the database, administration decides
  const allowed = cardSectionsLegacy.can(ADMINISTER) && (error ? true : canReset === true);
  box.innerHTML = pageHtml(environment, allowed);
  const bring = document.getElementById('prtraer') as HTMLButtonElement | null; if (bring) bring.onclick = (): void => { void bringProduction(bring); };
  const reset = document.getElementById('prreset'); if (reset) reset.onclick = (): void => { settingsLegacy.resetTestData(); };
  void refreshStatus();
}
