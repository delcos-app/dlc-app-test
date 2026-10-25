/**
 * «Material para presentar» of a product: images or PDF (up to 8 MB) shown full screen when recording a visit, «Para los centros»,
 * «Ver» and «Quitar», and adding several files at once. Part of the legacy editorProductoBase7 (v2.427.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { readReceipt, toBase64 } from '../../../services/files';
import { escapeHtml } from '../../../services/format';
import { loadMaterials, presentOnly } from '../../visit/presentation';
import { errorMessage } from '../model';

const PDF = 'application/pdf';
interface Product { id: string; nombre?: string | null }
interface Upload { nombre: string; tipo: string; tamano: number; datos: string }

const listOf = async (productId: string): Promise<readonly PresentationMaterial[]> => (await loadMaterials(true)).filter(item => item.producto_id === productId);

const rowHtml = (item: PresentationMaterial): string => `<div class="prmati"><span>${item.tipo === PDF ? t('productsMore.material.pdf') : t('productsMore.material.image')} · ${escapeHtml(item.nombre)}</span><label class="prmatpp"><input type="checkbox" data-prmatpp="${item.id}" ${item.para_portal ? 'checked' : ''}> ${t('productsMore.material.forCentres')}</label>
          <button type="button" class="lnk" data-prmatver="${item.id}">${t('productsMore.material.see')}</button><button type="button" class="lnk" data-prmatdel="${item.id}" aria-label="${t('productsMore.material.removeLabel', { name: escapeHtml(item.nombre) })}">${t('productsMore.material.remove')}</button></div>`;

async function remove(product: Product, item: PresentationMaterial): Promise<void> {
  if (!await notices.confirm(t('productsMore.material.removeText', { name: item.nombre }), { titulo: t('productsMore.material.removeTitle'), ok: t('productsMore.material.remove'), peligro: true })) return;
  const { error } = await legacyDb().from('producto_materiales').delete().eq('id', item.id);
  if (error) { notices.toast(t('productsMore.material.couldNotRemove', { error: errorMessage(error) }), true); return; }
  billing2Legacy.presentationFiles().delete(item.id);
  paintMaterials(product, await listOf(product.id)); notices.toast(t('productsMore.material.removed'));
}

export function paintMaterials(product: Product, list: readonly PresentationMaterial[]): void {
  const box = document.getElementById('prmatl'); if (!box) return;
  box.innerHTML = list.length ? list.map(rowHtml).join('') : `<p class="sm">${t('productsMore.material.none')}</p>`;
  box.querySelectorAll<HTMLElement>('[data-prmatver]').forEach(button => {
    button.onclick = async (): Promise<void> => { await loadMaterials(); presentOnly({ id: product.id, nombre: product.nombre ?? null }, button.dataset.prmatver ?? ''); };
  });
  box.querySelectorAll<HTMLElement>('[data-prmatdel]').forEach(button => {
    button.onclick = (): void => { const item = list.find(other => other.id === button.dataset.prmatdel); if (item) void remove(product, item); };
  });
}

async function uploadOf(file: File): Promise<Upload | null> {
  if (file.type === PDF) {
    if (file.size > billing2Legacy.presentationMax()) { notices.toast(t('productsMore.material.tooBig', { name: file.name }), true); return null; }
    return { nombre: file.name, tipo: file.type, tamano: file.size, datos: await toBase64(file) };
  }
  if (file.type.startsWith('image/')) return readReceipt(file);
  notices.toast(t('productsMore.material.notAllowed', { name: file.name }), true);
  return null;
}

async function addFiles(product: Product, files: readonly File[], start: number): Promise<void> {
  let added = 0, order = start;
  for (const file of files) {
    const upload = await uploadOf(file); if (!upload) continue;
    const { error } = await legacyDb().from('producto_materiales').insert({ producto_id: product.id, nombre: upload.nombre, tipo: upload.tipo, tamano: upload.tamano, datos: upload.datos, orden: order++ });
    if (error) { notices.toast(t('productsMore.material.couldNotUpload', { name: file.name, error: errorMessage(error) }), true); continue; }
    added++;
  }
  if (added) notices.toast(added === 1 ? t('productsMore.material.oneAdded') : t('productsMore.material.added', { count: added }));
  if (document.getElementById('prmatl')) paintMaterials(product, await listOf(product.id));
}

/** Paints the list and binds «+ Añadir imagen o PDF». */
export function bindMaterials(product: Product, list: readonly PresentationMaterial[]): void {
  paintMaterials(product, list);
  const picker = document.getElementById('prmatf') as HTMLInputElement | null; if (!picker) return;
  picker.onchange = (): void => { const files = [...picker.files ?? []]; picker.value = ''; void addFiles(product, files, list.length); };
}

export { listOf as materialsOf };
