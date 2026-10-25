/**
 * Photos of a visit (shelf, display, material placed…): reduced to 1600 px in JPEG like the receipts and saved in actividad_fotos.
 * Without connection the visit is saved anyway and the photos are added later from its history. Migrated from the legacy
 * leerFotoVisita, pintarFotosVisita, subirFotosVisita and verFotosVisita (v2.412.0).
 */
import { accountCardLegacy, agendaActions, cardSectionsLegacy, icon, legacyDb, notices, salesTeam, term } from '../../legacy/bridge';
import { visitLegacy } from '../../legacy/visit-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

/** Reads a chosen file as a visit photo (only images). */
export async function readVisitPhoto(file: File): Promise<VisitPhoto | null> {
  if (!file.type.startsWith('image/')) { notices.toast(t('visit.photos.chooseImage'), true); return null; }
  return visitLegacy.readPhoto(file);
}

/** Paints the thumbnails; with `remove`, each one has its ✕. */
export function paintPhotos(box: HTMLElement | null, photos: readonly VisitPhoto[], remove?: (index: number) => void): void {
  if (!box) return;
  box.innerHTML = photos.map((photo, index) => `<span class="vfoto"><img alt="${t('visit.photos.photo', { number: index + 1 })}" src="data:${photo.tipo};base64,${photo.datos}">
    ${remove ? `<button type="button" class="vfquitar" data-vfq="${index}" aria-label="${t('visit.photos.remove')}">✕</button>` : ''}</span>`).join('');
  if (remove) box.querySelectorAll<HTMLElement>('[data-vfq]').forEach(button => { button.onclick = (): void => { remove(Number(button.dataset.vfq)); }; });
}

/** Uploads the photos of a saved visit; false (with a notice) if one fails. */
export async function uploadVisitPhotos(activityId: string, photos: readonly VisitPhoto[]): Promise<boolean> {
  for (const photo of photos) {
    const { error } = await legacyDb().from('actividad_fotos').insert({ actividad_id: activityId, nombre: photo.nombre, tipo: photo.tipo, tamano: photo.tamano, datos: photo.datos });
    if (error) { notices.toast(t('visit.photos.uploadFailed', { visit: term('visita', { capital: 'C', adjective: 'guardado' }) }), true); return false; }
  }
  return true;
}

interface StoredPhoto { id: string; nombre?: string | null; tipo: string; datos: string; creado_por?: string | null }

const photoCount = (count: number): string => (count ? (count === 1 ? t('visit.photos.one') : t('visit.photos.many', { count })) : t('visit.photos.none'));

function galleryHtml(photos: readonly StoredPhoto[]): string {
  const canDelete = (photo: StoredPhoto): boolean => photo.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can('administrar');
  return `<div class="fh"><div><h2>${t('visit.photos.title', { visit: term('visita', { article: 'el' }) })}</h2><div class="sm">${photoCount(photos.length)}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <div class="vfotos grande">${photos.map(photo => `<span class="vfoto"><img alt="${escapeHtml(orFallback(photo.nombre, t('visit.photos.photoAlt')))}" src="data:${escapeHtml(photo.tipo)};base64,${photo.datos}">
      ${canDelete(photo) ? `<button type="button" class="vfquitar" data-vfdel="${photo.id}" aria-label="${t('visit.photos.delete')}">✕</button>` : ''}</span>`).join('')}</div>
    <div class="acts u-end"><label class="btn sec u-inline-flex">${icon('camera')} ${t('visit.photos.add')}<input type="file" id="vfmas" accept="image/*" data-fp="1" hidden multiple></label>
      <button type="button" class="btn" data-cerrar2>${t('visit.photos.done')}</button></div>`;
}

/** After a change: the gallery again and, if its card is open, the card. */
function refresh(activityId: string, accountId: string): void {
  void showVisitPhotos(activityId, accountId);
  if (accountCardLegacy.shownId() === accountId) agendaActions.openAccount(accountId);
}

async function deletePhoto(id: string, activityId: string, accountId: string): Promise<void> {
  if (!await notices.confirm(t('visit.photos.deleteText', { visit: term('visita', { article: 'este' }) }), { titulo: t('visit.photos.deleteTitle'), ok: t('visit.photos.deleteOk'), peligro: true })) return;
  const { error } = await legacyDb().from('actividad_fotos').delete().eq('id', id);
  if (error) { notices.toast(t('visit.photos.couldNotDelete'), true); return; }
  notices.toast(t('visit.photos.deleted')); refresh(activityId, accountId);
}

async function addPhotos(input: HTMLInputElement, shown: number, activityId: string, accountId: string): Promise<void> {
  const files = [...(input.files ?? [])], room = Math.max(0, visitLegacy.photosMax() - shown), added: VisitPhoto[] = [];
  for (const file of files.slice(0, room)) { const photo = await readVisitPhoto(file); if (photo) added.push(photo); }
  if (files.length > visitLegacy.photosMax() - shown) notices.toast(t('visit.photos.atMost', { max: visitLegacy.photosMax(), visit: term('visita') }), true);
  if (!added.length) return;
  if (await uploadVisitPhotos(activityId, added)) { notices.toast(t(added.length === 1 ? 'visit.photos.added' : 'visit.photos.addedMany')); refresh(activityId, accountId); }
}

/** The photos of a saved visit: see, add and delete them (second window, over the card). */
export async function showVisitPhotos(activityId: string, accountId: string): Promise<void> {
  const { data, error } = await legacyDb().from<StoredPhoto[]>('actividad_fotos').select('id,nombre,tipo,datos,creado_por').eq('actividad_id', activityId).order('creado_en');
  if (error) { notices.toast(t('visit.photos.couldNotOpen'), true); return; }
  const photos = data ?? [], body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = galleryHtml(photos);
  body.querySelectorAll<HTMLElement>('[data-vfdel]').forEach(button => { button.onclick = (): void => { void deletePhoto(button.dataset.vfdel ?? '', activityId, accountId); }; });
  const input = document.getElementById('vfmas') as HTMLInputElement | null;
  if (input) input.onchange = (): void => { void addPhotos(input, photos.length, activityId, accountId); };
  if (!box.open) box.showModal();
}
