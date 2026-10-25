/** Sections of the visit history in the account card: photos of each visit and the products presented. */
import { cardSectionsLegacy, icon, legacyDb, relatedLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { historyRows, stillShown } from './card-tools';

/** How many photos each visit has, and the button to see, add or delete them. */
export async function visitPhotos(id: string): Promise<void> {
  const rows = historyRows(); if (!rows.length) return;
  const { data } = await legacyDb().from<{ actividad_id: string }[]>('actividad_fotos').select('actividad_id').in('actividad_id', rows.map(row => row.dataset.vrow));
  const counts = new Map<string, number>();
  (data ?? []).forEach(photo => { counts.set(photo.actividad_id, (counts.get(photo.actividad_id) ?? 0) + 1); });
  rows.forEach(row => {
    if (row.querySelector('[data-vfotos]')) return;
    const count = counts.get(row.dataset.vrow ?? '') ?? 0, place = row.querySelector('span');
    if (!place || (!count && !row.querySelector('[data-editv]'))) return;
    const label = count ? (count === 1 ? t('accounts.card.photo') : t('accounts.card.photos', { count })) : t('accounts.card.addPhotos');
    place.insertAdjacentHTML('beforeend', `<div><button type="button" class="lnk vfotoslnk" data-vfotos="${row.dataset.vrow ?? ''}">${icon('camera')} ${label}</button></div>`);
  });
  document.querySelectorAll<HTMLElement>('#fbody [data-vfotos]').forEach(button => { button.onclick = (): void => { relatedLegacy.openVisitPhotos(button.dataset.vfotos ?? '', id); }; });
}

/** Which products were presented in each visit. */
export async function presentedProducts(id: string): Promise<void> {
  const rows = historyRows();
  if (!rows.length || document.querySelector('#fbody .vprodtx')) return;
  const { data } = await legacyDb().from<{ id: string; productos?: string[] | null }[]>('actividades').select('id,productos').in('id', rows.map(row => row.dataset.vrow));
  const ids = [...new Set((data ?? []).flatMap(visit => visit.productos ?? []))];
  if (!ids.length || !stillShown(id)) return;
  const { data: products } = await legacyDb().from<{ id: string; nombre: string }[]>('productos').select('id,nombre').in('id', ids);
  const names = new Map((products ?? []).map(product => [product.id, product.nombre]));
  (data ?? []).forEach(visit => {
    const row = document.querySelector(`#fbody [data-vrow="${visit.id}"]`), place = row?.querySelector('span');
    const presented = (visit.productos ?? []).map(product => names.get(product)).filter((name): name is string => Boolean(name));
    if (place && presented.length && !row?.querySelector('.vprodtx')) place.insertAdjacentHTML('beforeend', `<div class="sm vprodtx">${t('accounts.card.presented', { list: presented.map(escapeHtml).join(', ') })}</div>`);
  });
}

/** The material and data recorded in each visit, under it (from the visit data of its «Editar» button). */
export function visitMaterial(id: string): Promise<void> {
  if (!stillShown(id)) return Promise.resolve();
  document.querySelectorAll<HTMLElement>('#fbody [data-editv]').forEach(button => {
    let visit: object;
    try { visit = JSON.parse(button.dataset.editv ?? '') as object; } catch { return; }
    const text = cardSectionsLegacy.visitDetails(visit); if (!text) return;
    const place = button.parentElement?.querySelector(':scope > span');
    if (place && !place.querySelector('.vdet')) place.insertAdjacentHTML('beforeend', `<div class="sm vdet">📎 ${escapeHtml(text)}</div>`);
  });
  return Promise.resolve();
}
