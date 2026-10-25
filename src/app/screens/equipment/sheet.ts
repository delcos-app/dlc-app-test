/**
 * The sheet of a piece of equipment: where it is, contract, warranty, reviews (record one, delete one) and «Programar en la
 * agenda». Migrated from the legacy verEquipo (v2.409.0); verEquipo stays as an adapter («‹ Volver», notices, the account card,
 * the list and the tests open it by that name).
 */
import { agendaActions, legacyDb, notices, relatedLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatLongDate, formatShortDate } from '../../services/date-format';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { editEquipment } from './editor';
import { expiryOf, expiryPill, failureText, REVIEW_TYPES, reviewPill, SALE, STATES, type Equipment } from './model';

const REVIEWS_SHOWN = 50;

interface Review { id: string; fecha: string; tipo: string; nota?: string | null }

function reviewsText(months: number | null | undefined): string {
  if (!months) return t('equipment.sheet.noReviews');
  return months === 1 ? t('equipment.sheet.everyMonth') : t('equipment.sheet.everyMonths', { count: months });
}

function dataHtml(item: Equipment): string {
  const account = escapeHtml(orFallback(item.cuentas?.nombre, '')), installed = item.estado === STATES.installed;
  const contractEnd = item.contrato !== SALE && item.contrato_fin ? t('equipment.sheet.until', { date: formatShortDate(item.contrato_fin) }) : '';
  const plain = installed && !item.proxima_revision && !expiryOf(item) ? `<span class="pill p-est">${t('equipment.pills.installed')}</span>` : '';
  return `<div class="cirdat"><span>${t('equipment.sheet.where')}</span><b><button type="button" class="lnk" data-cfi="${item.cuenta_id ?? ''}">${account}</button>${item.ubicacion ? ` · ${escapeHtml(item.ubicacion)}` : ''}</b>
      <span>${t('equipment.sheet.installed')}</span><b>${escapeHtml(formatLongDate(item.instalado ?? ''))}</b>
      <span>${t('equipment.sheet.contract')}</span><b>${escapeHtml(item.contrato ?? '')}${contractEnd}</b>
      ${item.garantia_hasta ? `<span>${t('equipment.sheet.warranty')}</span><b>${t('equipment.sheet.warrantyUntil', { date: formatShortDate(item.garantia_hasta) })}</b>` : ''}
      <span>${t('equipment.sheet.reviews')}</span><b>${reviewsText(item.revision_meses)}</b>
      <span>${t('equipment.sheet.state')}</span><b>${reviewPill(item)} ${expiryPill(item)}${plain}</b></div>`;
}

function reviewsHtml(reviews: readonly Review[]): string {
  if (!reviews.length) return `<div class="vacio vlinea">${t('equipment.sheet.noReviewsYet')}</div>`;
  return `<div class="lista">${reviews.map(review => `<div class="fmrow"><span><b>${formatShortDate(review.fecha)}</b> · ${escapeHtml(review.tipo)}${review.nota ? `<span class="sm"> · ${escapeHtml(review.nota)}</span>` : ''}</span><button type="button" class="x" data-rvq="${review.id}" aria-label="${t('equipment.sheet.deleteReviewLabel')}">✕</button></div>`).join('')}</div>`;
}

function sheetHtml(item: Equipment, reviews: readonly Review[]): string {
  const installed = item.estado === STATES.installed;
  return `<div class="fh"><div><h2>${escapeHtml(orFallback(item.productos?.nombre, t('equipment.equipment')))}</h2><div class="sm">${item.serie ? t('equipment.sheet.serial', { serial: escapeHtml(item.serie) }) : ''}${escapeHtml(orFallback(item.cuentas?.nombre, ''))}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${dataHtml(item)}
    ${item.nota ? `<p class="sm">${escapeHtml(item.nota)}</p>` : ''}
    <div class="evascab"><h3>${t('equipment.sheet.reviewsTitle', { count: reviews.length })}</h3>${installed ? `<button type="button" class="btn sec" id="eqrevmas">${t('equipment.sheet.addReview')}</button>` : ''}</div>
    <div id="eqrevf"></div>
    ${reviewsHtml(reviews)}
    <div class="acts u-end">${installed && item.revision_meses ? `<button type="button" class="btn sec" id="eqagenda">${t('equipment.sheet.schedule')}</button>` : ''}
      <button type="button" class="btn sec" id="eqeditar">${t('equipment.sheet.change')}</button><button type="button" class="btn" data-cerrar>${t('equipment.sheet.done')}</button></div>`;
}

const reviewFormHtml = (): string => `<div class="depbox"><div class="cong3"><div><label for="eqrf">${t('equipment.sheet.date')}</label><input id="eqrf" type="date" value="${todayIso()}"></div>
        <div><label for="eqrt">${t('equipment.sheet.type')}</label><select id="eqrt">${REVIEW_TYPES.map(kind => `<option>${kind}</option>`).join('')}</select></div>
        <div><label for="eqrn">${t('equipment.sheet.note')}</label><input id="eqrn" maxlength="300" placeholder="${t('equipment.sheet.notePlaceholder')}"></div></div>
      <div class="acts u-end"><button type="button" class="btn sec" id="eqrcanc">${t('equipment.sheet.cancel')}</button><button type="button" class="btn" id="eqrok">${t('equipment.sheet.record')}</button></div></div>`;

const inputValue = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

async function recordReview(id: string, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { error } = await legacyDb().from('equipo_revisiones').insert({ equipo_id: id, fecha: inputValue('eqrf') || todayIso(), tipo: inputValue('eqrt'), nota: inputValue('eqrn').trim() || null });
  button.disabled = false;
  if (error) { notices.toast(failureText(error), true); return; }
  notices.toast(t('equipment.sheet.reviewRecorded')); relatedLegacy.openEquipment(id);
}

function openReviewForm(id: string): void {
  const place = document.getElementById('eqrevf'); if (!place) return;
  place.innerHTML = reviewFormHtml();
  const cancel = document.getElementById('eqrcanc'); if (cancel) cancel.onclick = (): void => { place.innerHTML = ''; };
  const ok = document.getElementById('eqrok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void recordReview(id, ok); };
}

async function deleteReview(id: string, reviewId: string): Promise<void> {
  if (!await notices.confirm(t('equipment.sheet.deleteReviewText'), { titulo: t('equipment.sheet.deleteReviewTitle'), ok: t('equipment.sheet.delete'), peligro: true })) return;
  const { error } = await legacyDb().from('equipo_revisiones').delete().eq('id', reviewId);
  if (error) { notices.toast(failureText(error), true); return; }
  relatedLegacy.openEquipment(id);
}

function bind(id: string, item: Equipment): void {
  const body = document.getElementById('dbody'); if (!body) return;
  const on = (elementId: string, action: () => void): void => { const button = document.getElementById(elementId); if (button) button.onclick = action; };
  body.querySelectorAll<HTMLElement>('[data-cfi]').forEach(button => {
    button.onclick = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); agendaActions.openAccount(button.dataset.cfi ?? ''); };
  });
  on('eqeditar', () => { void editEquipment(item); });
  on('eqagenda', () => {
    const today = todayIso(), next = item.proxima_revision;
    agendaActions.newAppointment(item.cuenta_id ?? '', next && next > today ? next : today);
  });
  on('eqrevmas', () => { openReviewForm(id); });
  body.querySelectorAll<HTMLElement>('[data-rvq]').forEach(button => { button.onclick = (): void => { void deleteReview(id, button.dataset.rvq ?? ''); }; });
}

/** Opens the sheet of a piece of equipment. */
export async function showEquipment(id: string): Promise<void> {
  const [{ data: item, error }, { data: reviews }] = await Promise.all([
    legacyDb().from<Equipment>('equipos').select('*,cuentas(nombre),productos(nombre)').eq('id', id).maybeSingle(),
    legacyDb().from<Review[]>('equipo_revisiones').select('id,fecha,tipo,nota,hecha_por').eq('equipo_id', id).order('fecha', { ascending: false }).limit(REVIEWS_SHOWN),
  ]);
  if (error || !item) { notices.toast(t('equipment.sheet.notFound'), true); return; }
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = sheetHtml(item, reviews ?? []);
  if (!box.open) box.showModal();
  bind(id, item);
}
