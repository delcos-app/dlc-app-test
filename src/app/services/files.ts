/**
 * Files: payment receipts (a photo reduced to 1600 px JPEG, or a PDF up to 3 MB), visit photos kept on the device without connection,
 * the file picker with the platform's design, and loading libraries only when used (Excel reader, QR). Migrated from the legacy
 * servicios/archivos.js and servicios/exportar.js (v2.425.0); every legacy name stays as an adapter.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';
import { wordFor } from '../core/vocabulary';

export const RECEIPT_MAX = 3000000;
export const VISIT_PHOTOS_MAX = 6;
const PHOTOS_DB = 'delcos-fotos', STORE = 'pend', RECEIPT_SIDE = 1600, RECEIPT_QUALITY = 0.82, NOTICE_DELAY_MS = 2600, THUMB_MAX = 120, KB = 1024;
// v2.437.0: 0.20.3 from SheetJS's own CDN (npm and cdnjs stopped at 0.18.5, which has CVE-2023-30533 and CVE-2024-22363)
const XLSX_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
const XLSX_HASH = 'sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT';

/** Downloads are off to protect the data. */
export function download(): void { coreLegacy.toast(t('core.files.downloadOff'), true); }

/** An image as a data URL (null if it cannot be read). */
export async function imageData(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise(resolve => { const reader = new FileReader(); reader.onload = (): void => { resolve(reader.result as string); }; reader.readAsDataURL(blob); });
  } catch { return null; }
}

function loadScript(source: string, extra: (script: HTMLScriptElement) => void = () => undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = source; extra(script);
    script.onload = (): void => { resolve(); }; script.onerror = (): void => { reject(new Error(source)); };
    document.head.appendChild(script);
  });
}

type WithLibraries = Window & { qrcode?: unknown; XLSX?: unknown };

/** The QR library (qrcode.js, next to the app). */
export async function loadQr(): Promise<unknown> {
  const host = window as WithLibraries;
  if (host.qrcode) return host.qrcode;
  await loadScript(new URL('qrcode.js', location.href).href);
  return host.qrcode;
}

/** The Excel and CSV reader, loaded only when used. */
export async function loadExcelReader(): Promise<unknown> {
  const host = window as WithLibraries;
  if (host.XLSX) return host.XLSX;
  await loadScript(XLSX_URL, script => { script.integrity = XLSX_HASH; script.crossOrigin = 'anonymous'; });
  return host.XLSX;
}

/** A file in base 64 (without the «data:…,» prefix). */
export const toBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (): void => { resolve(String(reader.result).split(',')[1] ?? ''); }; reader.onerror = (): void => { reject(reader.error ?? new Error('FileReader')); };
  reader.readAsDataURL(blob);
});

export interface Receipt { nombre: string; tipo: string; tamano: number; datos: string }

async function reducedPhoto(file: File): Promise<Receipt | null> {
  const url = URL.createObjectURL(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => { const item = new Image(); item.onload = (): void => { resolve(item); }; item.onerror = (): void => { reject(new Error('image')); }; item.src = url; });
  const scale = Math.min(1, RECEIPT_SIDE / Math.max(image.naturalWidth, image.naturalHeight)), canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url);
  const blob = await new Promise<Blob | null>(resolve => { canvas.toBlob(resolve, 'image/jpeg', RECEIPT_QUALITY); });
  if (!blob || blob.size > RECEIPT_MAX) { coreLegacy.toast(t('core.files.photoFailed'), true); return null; }
  return { nombre: `${file.name.replace(/\.[^.]+$/, '')}.jpg`, tipo: 'image/jpeg', tamano: blob.size, datos: await toBase64(blob) };
}

/** A payment receipt ready to upload: a PDF up to 3 MB, or a photo reduced to 1600 px. */
export async function readReceipt(file: File): Promise<Receipt | null> {
  try {
    if (file.type === 'application/pdf') {
      if (file.size > RECEIPT_MAX) { coreLegacy.toast(t('core.files.pdfTooBig'), true); return null; }
      return { nombre: file.name, tipo: file.type, tamano: file.size, datos: await toBase64(file) };
    }
    if (!file.type.startsWith('image/')) { coreLegacy.toast(t('core.files.photoOrPdf'), true); return null; }
    return await reducedPhoto(file);
  } catch { coreLegacy.toast(t('core.files.couldNotRead'), true); return null; }
}

/** Uploads the receipts of a saved order (if one fails, it says so; the order is not saved again). */
export async function uploadReceipts(order: string, list: readonly Receipt[]): Promise<boolean> {
  for (const receipt of list) {
    const { error } = await coreLegacy.db().from('pedidos_justificantes').insert({ pedido_id: order, nombre: receipt.nombre, tipo: receipt.tipo, tamano: receipt.tamano, datos: receipt.datos });
    if (error) { coreLegacy.toast(t('core.files.receiptFailed', { name: receipt.nombre }), true); return true; }
  }
  return true;
}

function photosDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTOS_DB, 1);
    request.onupgradeneeded = (): void => { request.result.createObjectStore(STORE); };
    request.onsuccess = (): void => { resolve(request.result); }; request.onerror = (): void => { reject(request.error ?? new Error('indexedDB')); };
  });
}

/** Photos of a visit saved without connection: on the device until the visit is sent. */
export async function keepPendingPhotos(operation: string, photos: readonly unknown[]): Promise<void> {
  if (!operation || !photos.length) return;
  try {
    const database = await photosDatabase();
    await new Promise((resolve, reject) => { const tx = database.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(photos, operation); tx.oncomplete = resolve; tx.onerror = (): void => { reject(tx.error ?? new Error('indexedDB')); }; });
    setTimeout(() => { coreLegacy.toast(t('core.files.photosKept', { visit: wordFor('visita', 's', { determiner: 'la' }) })); }, NOTICE_DELAY_MS);
  } catch { setTimeout(() => { coreLegacy.toast(t('core.files.photosNotKept'), true); }, NOTICE_DELAY_MS); }
}

/** Uploads the photos kept for a visit once it has its id, and forgets them. */
export async function sendPendingPhotos(operation: string, id: string): Promise<void> {
  try {
    const database = await photosDatabase();
    const photos = await new Promise<unknown[] | null>(resolve => {
      const request = database.transaction(STORE).objectStore(STORE).get(operation);
      request.onsuccess = (): void => { resolve(request.result as unknown[] | null); }; request.onerror = (): void => { resolve(null); };
    });
    if (!photos?.length) return;
    if (await coreLegacy.uploadVisitPhotos(id, photos)) {
      await new Promise(resolve => { const tx = database.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(operation); tx.oncomplete = resolve; tx.onerror = resolve; });
    }
  } catch { /* they stay for the next time */ }
}

function pickerHtml(image: boolean): string {
  return `<span class="fpmini">${coreLegacy.icon(image ? 'image' : 'file')}</span>
    <div class="fptx"><b>${t(image ? 'core.files.noImage' : 'core.files.noFile')}</b><span class="sm">${t(image ? 'core.files.imageHint' : 'core.files.fileHint')}</span></div>
    <button type="button" class="btn sec">${coreLegacy.icon('upload')} ${t(image ? 'core.files.chooseImage' : 'core.files.chooseFile')}</button>`;
}

function pickerBase(input: HTMLInputElement): void {
  if (input.dataset.fp || input.id === 'mkfile') return;
  input.dataset.fp = '1';
  const image = input.accept.includes('image'), wrapper = document.createElement('div');
  wrapper.className = 'filepick'; wrapper.innerHTML = pickerHtml(image);
  input.parentNode?.insertBefore(wrapper, input); input.classList.add('hide'); wrapper.appendChild(input);
  const button = wrapper.querySelector('button'); if (button) button.onclick = (): void => { input.click(); };
  input.addEventListener('change', () => {
    const file = input.files?.[0]; if (!file) return;
    const name = wrapper.querySelector('.fptx b'), size = wrapper.querySelector('.fptx .sm');
    if (name) name.textContent = file.name;
    if (size) size.textContent = `${Math.round(file.size / KB)} KB`;
    const thumb = wrapper.querySelector('.fpmini'); if (image && thumb) thumb.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`;
  });
}

/** A file input with the platform's design: button, file name and thumbnail; the old preview box next to it is hidden. */
export function filePicker(input: HTMLInputElement | null): void {
  if (!input) return;
  pickerBase(input);
  const wrapper = input.closest('.filepick'); if (!wrapper) return;
  const container = wrapper.parentElement, siblings = container?.parentElement ? [...container.parentElement.children] : [];
  const preview = siblings.find(item => item !== container && !item.contains(wrapper) && (item.querySelector('img') !== null || /foto|prev/i.test(item.className + item.id)) && item.getBoundingClientRect().width < THUMB_MAX);
  if (preview) {
    const image = preview.querySelector('img'), thumb = wrapper.querySelector('.fpmini');
    if (image?.src && thumb) thumb.innerHTML = `<img src="${image.src}" alt="">`;
    preview.classList.add('hide');
  }
  container?.querySelector(`label[for="${input.id}"]`)?.classList.add('hide');
}
