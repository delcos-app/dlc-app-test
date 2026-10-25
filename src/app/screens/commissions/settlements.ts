/**
 * Comisiones → «Liquidaciones»: the list by person and month with the total of what is shown, approving and paying, and
 * «Calcular el periodo» (only the drafts are recalculated). Migrated from the legacy pintarComisionesBase and
 * calcularLiquidaciones (v2.411.0).
 */
import { callRpc, legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatMonth } from '../../services/date-format';
import { escapeHtml, formatCurrency, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { monthEnd, schemes, SETTLEMENT } from './model';

export interface Settlement { usuario_id: string; nombre: string; periodo: string; unidades: number; importe: number; estado: string }

/** What the list shows (kept while the user moves around). */
export const settlementFilters = { person: '', month: '' };

const rowHtml = (item: Settlement): string => `<div class="item u-cursor-default" data-liqu="${item.usuario_id}" data-liqp="${item.periodo}">
      <span class="ic ${item.estado === SETTLEMENT.paid ? 'o' : ''}">${item.estado === SETTLEMENT.draft ? '○' : '✓'}</span>
      <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${t('commissions.page.settlementLine', { period: formatMonth(item.periodo), units: formatNumber(item.unidades), amount: formatCurrency(item.importe), state: escapeHtml(item.estado) })}</span></span>
      <span class="acts u-m-0">
        ${item.estado === SETTLEMENT.draft ? `<button class="btn sec" data-liq="${item.usuario_id}|${item.periodo}|${SETTLEMENT.approved}">${t('commissions.page.approve')}</button>` : ''}
        ${item.estado === SETTLEMENT.approved ? `<button class="btn sec" data-liq="${item.usuario_id}|${item.periodo}|${SETTLEMENT.paid}">${t('commissions.page.markPaid')}</button>` : ''}
      </span></div>`;

/** The filters, keeping only a person or month that still exists. */
export function filtersHtml(all: readonly Settlement[]): string {
  const people = [...new Map(all.map(item => [item.usuario_id, item.nombre])).entries()].sort((first, second) => String(first[1]).localeCompare(String(second[1]), 'es'));
  const months = [...new Set(all.map(item => item.periodo))].sort().reverse();
  if (settlementFilters.person && !people.some(([id]) => id === settlementFilters.person)) settlementFilters.person = '';
  if (settlementFilters.month && !months.includes(settlementFilters.month)) settlementFilters.month = '';
  return `<div class="liqfil" id="liqfil">
      <div><label for="liqfu">${t('commissions.page.person')}</label><select id="liqfu"><option value="">${t('commissions.page.all')}</option>${people.map(([id, name]) => `<option value="${id}" ${id === settlementFilters.person ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}</select></div>
      <div><label for="liqfp">${t('commissions.page.month')}</label><select id="liqfp"><option value="">${t('commissions.page.allMonths')}</option>${months.map(month => `<option value="${month}" ${month === settlementFilters.month ? 'selected' : ''}>${escapeHtml(formatMonth(month))}</option>`).join('')}</select></div>
      <p class="sm" id="liqres"></p></div>`;
}

function summary(shown: readonly Settlement[]): string {
  if (!shown.length) return '';
  const total = sum(shown.map(item => Number(item.importe) || 0)), units = sum(shown.map(item => Number(item.unidades) || 0));
  const unpaid = sum(shown.filter(item => item.estado !== SETTLEMENT.paid).map(item => Number(item.importe) || 0));
  const count = shown.length === 1 ? t('commissions.page.oneSettlement') : t('commissions.page.settlementsCount', { count: formatNumber(shown.length) });
  return t('commissions.page.summary', { settlements: count, units: formatNumber(units), amount: formatCurrency(total) })
    + (unpaid && unpaid !== total ? t('commissions.page.unpaid', { amount: formatCurrency(unpaid) }) : '');
}

async function settle(button: HTMLElement, repaint: () => void): Promise<void> {
  const [user = '', period = '', state = ''] = (button.dataset.liq ?? '').split('|'), approve = state === SETTLEMENT.approved;
  if (!await notices.confirm(t(approve ? 'commissions.page.approveText' : 'commissions.page.payText'),
    { titulo: t(approve ? 'commissions.page.approveTitle' : 'commissions.page.payTitle'), ok: t(approve ? 'commissions.page.approve' : 'commissions.page.markPaid') })) return;
  await legacyDb().rpc('liquidar', { p_usuario: user, p_periodo: period, p_estado: state });
  notices.toast(t('commissions.page.settled', { state: state.toLowerCase() })); repaint();
}

/** Paints the filtered list in `list` and binds the filters and its buttons (`repaint` repaints the whole page). */
export function paintSettlements(list: HTMLElement, all: readonly Settlement[], repaint: () => void): void {
  const paint = (): void => {
    const shown = all.filter(item => (!settlementFilters.person || item.usuario_id === settlementFilters.person) && (!settlementFilters.month || item.periodo === settlementFilters.month));
    const result = document.getElementById('liqres'); if (result) result.textContent = summary(shown);
    list.innerHTML = shown.map(rowHtml).join('') || `<div class="vacio">${t(all.length ? 'commissions.page.noneFiltered' : 'commissions.page.none')}</div>`;
    list.querySelectorAll<HTMLElement>('[data-liq]').forEach(button => { button.onclick = (): void => { void settle(button, repaint); }; });
  };
  const person = document.getElementById('liqfu') as HTMLSelectElement | null, month = document.getElementById('liqfp') as HTMLSelectElement | null;
  if (person) person.onchange = (): void => { settlementFilters.person = person.value; paint(); };
  if (month) month.onchange = (): void => { settlementFilters.month = month.value; paint(); };
  paint();
}

interface SchemeAssignment { usuario_id: string; esquema_id: string; desde?: string | null; hasta?: string | null }

function resultText(period: string, done: number, closed: number, failed: number): string {
  const doneText = done === 1 ? t('commissions.calculate.oneDone') : t('commissions.calculate.done', { count: done });
  const kept = closed ? (closed === 1 ? t('commissions.calculate.oneKept') : t('commissions.calculate.kept', { count: closed })) : '';
  return doneText + t('commissions.calculate.ofPeriod', { period: formatMonth(period) }) + kept + (failed ? t('commissions.calculate.failed', { count: failed }) : '');
}

/** Who had a scheme some day of the month, and whose settlement is already approved or paid. */
async function toCalculate(period: string): Promise<{ users: string[]; closed: Set<string> } | null> {
  const start = `${period}-01`, end = monthEnd(period), ids = new Set(schemes().map(scheme => scheme.id));
  const [{ data: assignments, error }, { data: existing }] = await Promise.all([
    legacyDb().from<SchemeAssignment[]>('asignaciones_comision').select('usuario_id,esquema_id,desde,hasta'),
    callRpc<Settlement[]>('liquidaciones_lista', { p_periodo: period })]);
  if (error) { notices.toast(t('commissions.calculate.couldNotRead', { error: (error as { message?: string }).message ?? '' }), true); return null; }
  const closed = new Set((existing ?? []).filter(item => item.estado !== SETTLEMENT.draft).map(item => item.usuario_id));
  const users = [...new Set((assignments ?? []).filter(item => ids.has(item.esquema_id) && (!item.desde || item.desde <= end) && (!item.hasta || item.hasta >= start)).map(item => item.usuario_id))];
  if (!users.length) { notices.toast(t('commissions.calculate.nobody', { period: formatMonth(period) }), true); return null; }
  return { users, closed };
}

/** «Calcular el periodo»: a draft settlement for each person of the chosen month. */
export async function calculateSettlements(repaint: () => void): Promise<void> {
  const period = (document.getElementById('liqper') as HTMLInputElement | null)?.value; if (!period) return;
  const found = await toCalculate(period); if (!found) return;
  const pending = found.users.filter(user => !found.closed.has(user));
  if (!pending.length) { notices.toast(t('commissions.calculate.allClosed', { period: formatMonth(period) })); return; }
  const button = document.getElementById('liqcalc') as HTMLButtonElement | null; if (button) button.disabled = true;
  let failed = 0;
  for (const user of pending) {
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('liquidar', { p_usuario: user, p_periodo: period, p_estado: SETTLEMENT.draft });
    if (error || result?.ok === false) failed++;
  }
  if (button) button.disabled = false;
  notices.toast(resultText(period, pending.length - failed, found.closed.size, failed), Boolean(failed));
  settlementFilters.month = period;
  repaint();
}
