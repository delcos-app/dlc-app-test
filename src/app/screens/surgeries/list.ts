/**
 * Intervenciones: pending replenishments, scheduled ones whose material was not recorded, upcoming ones and those done in the
 * last 30 days. Migrated from the legacy pintarCirugias (v2.407.0); pintarCirugias stays as an adapter.
 */
import { currentScreen, legacyDb, relatedLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { editSurgery } from './editor';
import { replenishmentPill, STATES, statePill, timeOf, type Surgery } from './model';

const DAYS_BACK = 30, DAYS_AHEAD = 120;

function surgeryRow(surgery: Surgery): string {
  const people = [surgery.cirujano, surgery.hospital, surgery.quirofano].filter(Boolean).join(' · ');
  const noOrder = surgery.estado === STATES.done && !surgery.pedido_id ? `<span class="pill p-warn">${t('surgeries.list.noOrder')}</span>` : '';
  return `<button type="button" class="item cirrow" data-cir="${surgery.id}"><span class="cirf"><b>${escapeHtml(formatShortDate(surgery.fecha))}</b><span class="sm">${escapeHtml(timeOf(surgery))}</span></span>
    <span class="tx"><b>${escapeHtml(orFallback(surgery.procedimiento, t('surgeries.surgery')))}</b><span class="sm">${escapeHtml(people)}${surgery.asistente ? escapeHtml(t('surgeries.list.assists', { name: surgery.asistente })) : ''}</span></span>
    <span class="cirest">${statePill(surgery)}${noOrder}${replenishmentPill(surgery)}</span></button>`;
}

const block = (title: string, list: readonly Surgery[], empty: string): string =>
  `<section class="card cirbloque"><h2>${title}</h2>${list.length ? `<div class="lista">${list.map(surgeryRow).join('')}</div>` : `<div class="vacio vlinea">${empty}</div>`}</section>`;

export async function paintSurgeries(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const today = todayIso();
  const { data, error } = await legacyDb().rpc<Surgery[]>('cirugias_lista', { p_desde: addDays(today, -DAYS_BACK), p_hasta: addDays(today, DAYS_AHEAD) });
  // Looked up after the answer: the page may have been painted again meanwhile
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'cirugias') return;
  if (error) { box.innerHTML = `<div class="vacio">${t('surgeries.list.couldNotLoad')}</div>`; return; }
  const list = data ?? [];
  const pending = list.filter(item => item.reposicion === 'vencida' || item.reposicion === 'pendiente');
  const scheduled = list.filter(item => item.estado === STATES.scheduled);
  const behind = scheduled.filter(item => item.fecha < today), upcoming = scheduled.filter(item => item.fecha >= today);
  const done = list.filter(item => item.estado !== STATES.scheduled && item.fecha <= today).reverse();
  box.innerHTML = `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="cirnueva">${t('surgeries.list.newSurgery')}</button></div>
    ${pending.length ? block(t('surgeries.list.replenishmentsPending'), pending, '') : ''}
    ${behind.length ? block(t('surgeries.list.usedNotRecorded'), behind, '') : ''}
    ${block(t('surgeries.list.upcoming'), upcoming, t('surgeries.list.noUpcoming'))}
    ${block(t('surgeries.list.doneLast30'), done, t('surgeries.list.noneDone'))}</div>`;
  const add = document.getElementById('cirnueva'); if (add) add.onclick = (): void => { void editSurgery(null); };
  box.querySelectorAll<HTMLElement>('[data-cir]').forEach(button => { button.onclick = (): void => { relatedLegacy.openSurgery(button.dataset.cir ?? ''); }; });
}
