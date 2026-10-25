/**
 * The window of a tender: its state, deadline and amount, the contract dates once awarded, and its lots with products and prices.
 * Migrated from the legacy verConcurso (v2.409.0); verConcurso stays as an adapter (notices, the account card, «‹ Volver»,
 * links and the tests open it by that name).
 */
import { legacyDb, notices, portalLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatLongDate } from '../../services/date-format';
import { escapeHtml, formatCurrency, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { editTender } from './editor';
import { bindLots, lotHtml, type LotContext } from './lots';
import { daysLeft, LOT_STATES, STATES, TENDER_STATES, tenderLine, writeFailure, type Tender, type TenderLot } from './model';

const DETAIL = '*,cuentas(nombre),concurso_lotes(id,numero,descripcion,importe_licitacion,estado,adjudicatario,importe_adjudicado,creado_en,concurso_precios(id,producto_id,precio,unidades))';
const CONTRACT_DATES = [['conini', 'inicio'], ['confin', 'fin'], ['conpro', 'prorroga_hasta']] as const;

const sortedLots = (tender: Tender): TenderLot[] => [...(tender.concurso_lotes ?? [])].sort((first, second) =>
  String(first.numero ?? '').localeCompare(String(second.numero ?? ''), 'es', { numeric: true }) || String(first.creado_en).localeCompare(String(second.creado_en)));

function dataHtml(tender: Tender): string {
  const states = TENDER_STATES.map(state => `<option ${state === tender.estado ? 'selected' : ''}>${state}</option>`).join('');
  return `<div class="cirdat"><span>${t('tenders.sheet.state')}</span><b><select id="conest" aria-label="${t('tenders.sheet.stateLabel')}">${states}</select></b>
      ${tender.limite ? `<span>${t('tenders.sheet.submitBy')}</span><b>${escapeHtml(formatLongDate(tender.limite))}</b>` : ''}
      ${tender.importe_licitacion ? `<span>${t('tenders.sheet.amount')}</span><b>${t('tenders.sheet.withoutVat', { amount: formatCurrency(tender.importe_licitacion) })}</b>` : ''}</div>
    <div class="cong3 ${tender.estado === STATES.awarded ? '' : 'hide'}" id="confechas"><div><label for="conini">${t('tenders.sheet.contractFrom')}</label><input id="conini" type="date" value="${escapeHtml(tender.inicio ?? '')}"></div>
      <div><label for="confin">${t('tenders.sheet.contractTo')}</label><input id="confin" type="date" value="${escapeHtml(tender.fin ?? '')}"></div>
      <div><label for="conpro">${t('tenders.sheet.extendedTo')}</label><input id="conpro" type="date" value="${escapeHtml(tender.prorroga_hasta ?? '')}"></div></div>`;
}

function leftText(left: number | null): string {
  if (left === null) return '';
  if (left < 0) return t('tenders.sheet.alreadyExpired');
  return left === 1 ? t('tenders.sheet.oneMoreDay') : t('tenders.sheet.moreDays', { count: formatNumber(left) });
}

function awardedHtml(tender: Tender, lots: readonly TenderLot[]): string {
  if (tender.estado !== STATES.awarded) return '';
  if (!lots.some(lot => lot.estado === LOT_STATES.won)) return `<div class="banda-aviso conok">${t('tenders.sheet.markWon')}</div>`;
  const account = escapeHtml(orFallback(tender.cuentas?.nombre, t('tenders.sheet.thisAccount')));
  return `<div class="banda-ok conok">${t('tenders.sheet.pricesApplied', { account, left: leftText(daysLeft(tender)) })}</div>`;
}

function sheetHtml(tender: Tender, lots: readonly TenderLot[], products: readonly CatalogProduct[]): string {
  return `<div class="fh"><div><h2>${escapeHtml(tender.titulo)}</h2><div class="sm">${escapeHtml(tenderLine(tender))}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${dataHtml(tender)}
    ${awardedHtml(tender, lots)}
    <div class="evascab"><h3>${t('tenders.sheet.lots', { count: lots.length })}</h3><button type="button" class="btn sec" id="conlmas">${t('tenders.sheet.addLot')}</button></div>
    <div id="conlotes">${lots.length ? lots.map(lot => lotHtml(lot, products)).join('') : `<div class="vacio vlinea">${t('tenders.sheet.noLots')}</div>`}</div>
    ${tender.nota ? `<p class="sm">${escapeHtml(tender.nota)}</p>` : ''}
    <div class="acts u-end"><button type="button" class="btn sec" id="coneditar">${t('tenders.sheet.change')}</button><button type="button" class="btn" data-cerrar>${t('tenders.sheet.done')}</button></div>`;
}

const fail = (error: { message?: string }): void => { notices.toast(writeFailure(error, t('tenders.sheet.noPermission')), true); };

function bindDates(id: string): void {
  CONTRACT_DATES.forEach(([elementId, column]) => {
    const input = document.getElementById(elementId) as HTMLInputElement | null; if (!input) return;
    input.onchange = async (): Promise<void> => {
      const { error } = await legacyDb().from('concursos').update({ [column]: input.value || null }).eq('id', id);
      if (error) { fail(error as { message?: string }); return; }
      notices.toast(t('tenders.sheet.datesSaved'));
    };
  });
}

function bind(tender: Tender, lots: readonly TenderLot[], context: LotContext): void {
  const id = tender.id;
  const change = document.getElementById('coneditar'); if (change) change.onclick = (): void => { void editTender(tender); };
  const state = document.getElementById('conest') as HTMLSelectElement | null;
  if (state) state.onchange = async (): Promise<void> => {
    const { error } = await legacyDb().from('concursos').update({ estado: state.value }).eq('id', id);
    if (error) { fail(error as { message?: string }); state.value = tender.estado; return; }
    context.reopen();
  };
  bindDates(id);
  const addLot = document.getElementById('conlmas');
  if (addLot) addLot.onclick = async (): Promise<void> => {
    const { error } = await legacyDb().from('concurso_lotes').insert({ concurso_id: id, numero: String(lots.length + 1) });
    if (error) { fail(error as { message?: string }); return; }
    context.reopen();
  };
  const list = document.getElementById('conlotes'); if (list) bindLots(list, context);
}

/** Opens the window of a tender. */
export async function showTender(id: string): Promise<void> {
  const { data: tender, error } = await legacyDb().from<Tender>('concursos').select(DETAIL).eq('id', id).maybeSingle();
  if (error || !tender) { notices.toast(t('tenders.sheet.notFound'), true); return; }
  const products = await portalLegacy.products(), lots = sortedLots(tender);
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = sheetHtml(tender, lots, products);
  if (!box.open) box.showModal();
  bind(tender, lots, { tenderId: id, products, reopen: () => { void showTender(id); }, fail });
}
