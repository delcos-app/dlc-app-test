/**
 * The sheet of a surgery: its data, «Registrar lo usado» while scheduled, what was used with batch and serial number, the order to
 * the centre and «Reponer ahora». Migrated from the legacy verCirugia (v2.407.0); verCirugia stays as an adapter («‹ Volver»,
 * notices and the account card open it by that name).
 */
import { agendaActions, appLegacy, legacyDb, notices, relatedLegacy, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatLongDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { editSurgery } from './editor';
import { errorText, originLabel, replenishmentPill, STATES, statePill, timeOf, type Replenishment, type Surgery } from './model';
import { paintUse, type StockLine } from './use';

interface UsedLine { producto: string; numero_lote?: string | null; serie?: string | null; unidades: number }
interface SurgeryDetail { cirugia: Surgery; hospital: string; cirujano: string; especialidad?: string | null; asistente?: string | null; almacen?: string | null; puede?: boolean; stock?: StockLine[]; consumos?: UsedLine[] }

function replenishmentOf(surgery: Surgery): Replenishment {
  if (surgery.estado !== STATES.done) return null;
  if (surgery.repuesta_en) return 'repuesta';
  return new Date(surgery.reposicion_limite ?? '') < new Date() ? 'vencida' : 'pendiente';
}

function dataHtml(detail: SurgeryDetail, replenishment: Replenishment): string {
  const surgery = detail.cirugia;
  return `<div class="cirdat"><span>${t('surgeries.sheet.responsible')}</span><b><button type="button" class="lnk" data-cfi="${surgery.cirujano_id ?? ''}">${escapeHtml(detail.cirujano)}</button>${detail.especialidad ? ` <span class="sm">· ${escapeHtml(detail.especialidad)}</span>` : ''}</b>
      <span>${t('surgeries.sheet.centre')}</span><b><button type="button" class="lnk" data-cfi="${surgery.hospital_id ?? ''}">${escapeHtml(detail.hospital)}</button></b>
      <span>${t('surgeries.sheet.assists')}</span><b>${escapeHtml(orFallback(detail.asistente, '—'))}</b>
      <span>${t('surgeries.sheet.material')}</span><b>${escapeHtml(orFallback(detail.almacen, originLabel(surgery.origen ?? '')))}</b>
      ${surgery.referencia_caso ? `<span>${term('paciente', { capital: 'C' })}</span><b>${escapeHtml(t('surgeries.sheet.reference', { reference: surgery.referencia_caso }))}</b>` : ''}
      <span>${t('surgeries.sheet.state')}</span><b>${statePill(surgery)} ${replenishmentPill({ ...surgery, reposicion: replenishment })}</b></div>`;
}

function usedHtml(used: readonly UsedLine[]): string {
  if (!used.length) return '';
  return `<h3>${t('surgeries.sheet.used')}</h3><div class="deptab"><div class="deph cirh"><span>${t('surgeries.sheet.product')}</span><span>${t('surgeries.sheet.batch')}</span><span>${t('surgeries.sheet.serial')}</span><span>${t('surgeries.sheet.units')}</span></div>
      ${used.map(line => `<div class="depf cirh"><span>${escapeHtml(line.producto)}</span><span>${escapeHtml(orFallback(line.numero_lote, t('surgeries.sheet.noBatch')))}</span><span>${escapeHtml(orFallback(line.serie, '—'))}</span><b>${formatNumber(line.unidades)}</b></div>`).join('')}</div>`;
}

function sheetHtml(detail: SurgeryDetail, notice: string): string {
  const surgery = detail.cirugia, scheduled = surgery.estado === STATES.scheduled, replenishment = replenishmentOf(surgery), can = Boolean(detail.puede);
  return `<div class="fh"><div><h2>${escapeHtml(orFallback(surgery.procedimiento, t('surgeries.surgery')))}</h2>
      <div class="sm">${escapeHtml(formatLongDate(surgery.fecha))}${surgery.hora ? ` · ${escapeHtml(timeOf(surgery))}` : ''} · ${escapeHtml(detail.hospital)}${surgery.quirofano ? ` · ${escapeHtml(surgery.quirofano)}` : ''}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${notice}
    ${dataHtml(detail, replenishment)}
    ${surgery.nota ? `<p class="sm">${escapeHtml(surgery.nota)}</p>` : ''}
    ${surgery.estado === STATES.done && !surgery.pedido_id ? `<div class="banda-aviso cirsinped">${t('surgeries.sheet.noOrder')} <button type="button" class="btn sec" id="cirhacerped">${t('surgeries.sheet.createOrder')}</button></div>` : ''}
    ${scheduled && can ? '<div id="cirusar"></div>' : ''}
    ${usedHtml(detail.consumos ?? [])}
    ${actionsHtml(surgery, replenishment, can)}`;
}

function actionsHtml(surgery: Surgery, replenishment: Replenishment, can: boolean): string {
  const scheduled = surgery.estado === STATES.scheduled;
  return `<div class="acts u-end">${surgery.pedido_id ? `<button type="button" class="btn sec" id="cirped">${t('surgeries.sheet.seeOrder')}</button>` : ''}
      ${replenishment && replenishment !== 'repuesta' && can ? `<button type="button" class="btn" id="cirrepo">${t('surgeries.sheet.replenishNow')}</button>` : ''}
      ${scheduled && can ? `<button type="button" class="btn sec" id="cireditar">${t('surgeries.sheet.change')}</button>` : ''}<button type="button" class="btn sec" data-cerrar>${t('common.close')}</button></div>`;
}

async function createOrder(id: string, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('cirugia_pedido', { p_id: id });
  if (!result || result.ok === false) { button.disabled = false; notices.toast(result?.error === 'pedido' ? t('surgeries.sheet.noOrderPermission') : errorText(result), true); return; }
  notices.toast(t('surgeries.sheet.orderCreated')); relatedLegacy.openSurgery(id);
}

async function replenish(id: string, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string; a_tiempo?: boolean }>('cirugia_reponer', { p_id: id });
  if (!result || result.ok === false) { button.disabled = false; notices.toast(result?.error === 'sin_stock' ? t('surgeries.sheet.notEnoughStock') : errorText(result), true); return; }
  notices.toast(t(result.a_tiempo === false ? 'surgeries.sheet.replenishedLate' : 'surgeries.sheet.replenished')); relatedLegacy.openSurgery(id);
}

function bind(id: string, detail: SurgeryDetail): void {
  const surgery = detail.cirugia, on = (elementId: string, action: (button: HTMLButtonElement) => void): void => {
    const button = document.getElementById(elementId) as HTMLButtonElement | null; if (button) button.onclick = (): void => { action(button); };
  };
  document.querySelectorAll<HTMLElement>('#dbody [data-cfi]').forEach(button => {
    button.onclick = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); agendaActions.openAccount(button.dataset.cfi ?? ''); };
  });
  on('cirped', () => { appLegacy.openOrder(surgery.pedido_id ?? ''); });
  on('cirhacerped', button => { void createOrder(id, button); });
  on('cireditar', () => { void editSurgery({ ...surgery, hospital: detail.hospital, cirujano: detail.cirujano, especialidad: detail.especialidad ?? null }); });
  on('cirrepo', button => { void replenish(id, button); });
}

/** Opens the sheet of a surgery, optionally with a notice on top. */
export async function showSurgery(id: string, notice = ''): Promise<void> {
  const { data: detail, error } = await legacyDb().rpc<SurgeryDetail>('cirugia_detalle', { p_id: id });
  if (error || !detail) { notices.toast(t('surgeries.sheet.notFound'), true); return; }
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = sheetHtml(detail, notice);
  if (!box.open) box.showModal();
  bind(id, detail);
  if (document.getElementById('cirusar')) paintUse(detail.cirugia, detail.stock ?? []);
}
