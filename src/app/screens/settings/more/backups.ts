/**
 * Organización → Empresa → «Copias de seguridad»: when the last copy was made and the button to download a full one. Migrated from
 * the legacy pintarCopias (v2.415.0).
 */
import { callRpc, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { formatNumber } from '../../../services/format';
import { sum } from '../../../services/values';

const DAY_MS = 864e5, STALE_DAYS = 7, REPAINT_MS = 800;

function stateHtml(last: Date | null): string {
  const days = last ? Math.floor((Date.now() - last.getTime()) / DAY_MS) : null, stale = days === null || days > STALE_DAYS;
  const title = last ? t('settingsMore.backups.last', { date: last.toLocaleString(t('dates.locale'), { dateStyle: 'long', timeStyle: 'short' }) }) : t('settingsMore.backups.none');
  const hint = days === null ? t('settingsMore.backups.makeFirst') : days > STALE_DAYS ? t('settingsMore.backups.stale', { days }) : t('settingsMore.backups.upToDate');
  return `<div class="copiaest ${stale ? 'mal' : 'bien'}"><b>${title}</b>
      <span>${hint}</span></div>`;
}

function pageHtml(last: Date | null): string {
  return `<div class="card cfgpanel"><h2>${t('settingsMore.backups.title')}</h2>
    <p class="sm">${t('settingsMore.backups.intro', { professionals: term('medico', { number: 'p' }), visits: term('visita', { number: 'p' }) })}</p>
    ${stateHtml(last)}
    <div class="acts u-m-12-0-0"><button class="btn" id="copok">${t('settingsMore.backups.download')}</button></div>
    <h3 class="mansub">${t('settingsMore.backups.tips')}</h3><ul class="manlist">
      <li><span>📅</span><span>${t('settingsMore.backups.tipWeekly')}</span></li>
      <li><span>🔐</span><span>${t('settingsMore.backups.tipPrivate')}</span></li>
      <li><span>🤖</span><span>${t('settingsMore.backups.tipAutomatic')}</span></li></ul></div>`;
}

async function download(button: HTMLButtonElement): Promise<void> {
  button.disabled = true; button.textContent = t('settingsMore.backups.preparing');
  const { data, error } = await callRpc<{ tablas?: Record<string, unknown[]> }>('exportar_datos', {});
  button.disabled = false; button.textContent = t('settingsMore.backups.download');
  if (error || !data) { notices.toast(t('settingsMore.backups.couldNotCopy'), true); return; }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  link.download = `copia_${settingsMoreLegacy.appName().replace(/[^\p{L}\p{N}]+/gu, '_')}_${todayIso()}.json`; link.click();
  const records = sum(Object.values(data.tablas ?? {}).map(table => table.length));
  notices.toast(t('settingsMore.backups.downloaded', { count: formatNumber(records) })); setTimeout(() => { void paintBackups(); }, REPAINT_MS);
}

export async function paintBackups(): Promise<void> {
  const { data: audit } = await legacyDb().from<{ creado_en: string }[]>('auditoria').select('creado_en').eq('accion', 'Copia de seguridad')
    .order('creado_en', { ascending: false }).limit(1);
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const first = audit?.[0];
  box.innerHTML = pageHtml(first ? new Date(first.creado_en) : null);
  const button = document.getElementById('copok') as HTMLButtonElement | null;
  if (button) button.onclick = (): void => { void download(button); };
}
