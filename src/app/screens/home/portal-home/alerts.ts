/**
 * The «Alertas» card of the professional portal home and the hidden alerts: the ones the user hid disappear from it, and «Ver
 * alertas ocultas» brings them back. Migrated from the legacy alert list of inicioResumenSemanaYVentas, filtrarAlertasInicio,
 * cargarOcultas and verOcultas (v2.417.0); the hidden list stays in the legacy ALERTAS_OCULTAS (legado 040 clears it).
 */
import { callRpc, currentScreen, legacyDb, notices } from '../../../legacy/bridge';
import { miscLegacy, type HiddenAlert } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback, sum } from '../../../services/values';

export interface Alert { tipo?: string; titulo: string; n: number; gravedad?: string | null; equipo?: boolean; items?: { id: string; nombre: string; quien?: string | null }[] }

const STOCK_ALERTS = ['stock_pedir', 'stock_minimo', 'caducidad', 'sin_lote'];

/** What pressing an alert item opens. */
function itemAttribute(alert: Alert, id: string): string {
  if (alert.tipo === 'pedido_sin_medico') return `data-iniped="${id}"`;
  if (alert.tipo === 'citas_sin_hacer') return '';
  if (STOCK_ALERTS.includes(alert.tipo ?? '')) return 'data-inistock="1"';
  return alert.tipo === 'compra_retrasada' ? `data-inicomp="${id}"` : `data-inificha="${id}"`;
}

function alertHtml(alert: Alert): string {
  const items = alert.items ?? [];
  const rows = items.map(item => `<button class="item" ${itemAttribute(alert, item.id)} style="padding:6px 8px">
          <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml(orFallback(item.quien, ''))}</span></span></button>`).join('');
  return `<details class="alerta2 ${orFallback(alert.gravedad, '')}">
        <summary><span class="an">${formatNumber(alert.n)}</span> ${escapeHtml(alert.titulo)}${alert.equipo ? ` <span class="pill p-per">${t('homeMore.week.team')}</span>` : ''}</summary>
        <div>${rows}
          ${alert.n > items.length ? `<div class="sm" style="padding:4px 8px">${t('homeMore.week.andMore', { count: formatNumber(alert.n - items.length) })}</div>` : ''}</div></details>`;
}

export const alertsHtml = (alerts: readonly Alert[]): string => `<div class="card"><h2>${t('homeMore.week.alerts')}<span class="n">${sum(alerts.map(alert => alert.n))}</span></h2>
      ${alerts.length ? `<div class="lista">${alerts.map(alertHtml).join('')}</div>` : `<div class="vacio">${t('homeMore.week.allFine')}</div>`}</div>`;

/** The hidden alerts (read once, or again with `fresh`). */
async function hiddenAlerts(fresh = false): Promise<HiddenAlert[]> {
  const known = miscLegacy.hiddenAlerts();
  if (known && !fresh) return known;
  const { data } = await callRpc<HiddenAlert[]>('mis_alertas_descartadas', {});
  miscLegacy.setHiddenAlerts(data ?? []);
  return data ?? [];
}

/** «Alertas · 3 vacunas»: the title of an alert without its count and the «equipo» pill. */
const alertTitle = (summary: Element): string => (summary.textContent ?? '').replace(/\s+/g, ' ').replace(/^\s*\d+\s*/, '').replace(/\bequipo\b\s*$/, '').trim();

const ITEMS = ':scope > div > .item, :scope .lista > .item';

/** Takes the hidden items out of the alerts (and the alerts left empty), and offers «Ver alertas ocultas». */
export async function filterHiddenAlerts(): Promise<void> {
  const box = document.getElementById('iniextra'); if (!box) return;
  const hidden = new Set((await hiddenAlerts()).map(item => item.clave));
  box.querySelectorAll('details.alerta2').forEach(alert => {
    const summary = alert.querySelector(':scope > summary'); if (!summary) return;
    const title = alertTitle(summary), items = [...alert.querySelectorAll(ITEMS)];
    items.forEach(item => { if (hidden.has(miscLegacy.alertKey(title, item))) item.remove(); });
    const left = alert.querySelectorAll(ITEMS).length;
    if (!left && items.length) { alert.remove(); return; }
    const count = [...summary.querySelectorAll('span, b')].find(element => /^\d+$/.test((element.textContent ?? '').trim()));
    if (count && items.length) count.textContent = String(left);
  });
  const card = box.querySelector('details.alerta2')?.closest('.card') ?? null;
  const total = card?.querySelector('h2 .n'); if (total && card) total.textContent = String(card.querySelectorAll('details.alerta2').length);
  const all = miscLegacy.hiddenAlerts() ?? [];
  if (all.length && card && !card.querySelector('.alocultas')) {
    card.insertAdjacentHTML('beforeend', `<button class="kcfg alocultas" style="margin:4px 16px 12px">${t('homeMore.hidden.seeHidden', { count: all.length })}</button>`);
    const button = card.querySelector<HTMLElement>('.alocultas'); if (button) button.onclick = (): void => { void showHiddenAlerts(); };
  }
}

const hiddenCard = (item: HiddenAlert): string => `<div class="alcard"><div class="alc1"><b>${escapeHtml(orFallback(item.detalle, item.clave))}</b>
      <span class="pill ${item.hasta ? 'p-per' : 'p-anu'}">${item.hasta ? t('homeMore.hidden.until', { date: formatShortDate(item.hasta) }) : t('homeMore.hidden.forever')}</span></div>
      <div class="sm">${escapeHtml(orFallback(item.titulo, ''))}</div><button class="btn sec chico" data-alrec="${escapeHtml(item.clave)}">${t('homeMore.hidden.recover')}</button></div>`;

/** «Alertas ocultas»: the hidden ones, each with «Recuperar». */
export async function showHiddenAlerts(): Promise<void> {
  const list = await hiddenAlerts(true);
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = `<div class="fh"><div><h2>${t('homeMore.hidden.title')}</h2><div class="sm">${t('homeMore.hidden.hint')}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="alcards">${list.map(hiddenCard).join('') || `<div class="vacio">${t('homeMore.hidden.none')}</div>`}</div>`;
  box.showModal();
  body.querySelectorAll<HTMLElement>('[data-alrec]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      await legacyDb().rpc('restaurar_alerta', { p_clave: button.dataset.alrec });
      button.closest('.alcard')?.remove(); miscLegacy.setHiddenAlerts(null); notices.toast(t('homeMore.hidden.recovered'));
      if (currentScreen() === 'inicio') miscLegacy.reloadHome();
    };
  });
}
