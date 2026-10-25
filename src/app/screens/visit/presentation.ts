/**
 * Product presentations: images or PDF of a product shown full screen (arrows and keyboard), from «Registrar visita» (it marks
 * the product as presented) or from the product sheet. The material is downloaded when shown and kept in memory while the app is
 * open; without connection, only what was already seen. Migrated from the legacy pres* functions (v2.412.0).
 */
import { legacyDb } from '../../legacy/bridge';
import { visitLegacy } from '../../legacy/visit-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

const MATERIALS_FRESH_MS = 300000;

interface Showing { list: readonly PresentationMaterial[]; index: number; urls: string[] }
let showing: Showing | null = null;

/** The presentation material of every product (read again after 5 minutes or when `force`). */
export async function loadMaterials(force = false): Promise<readonly PresentationMaterial[]> {
  const cached = visitLegacy.materials();
  if (cached && !force && Date.now() - visitLegacy.materialsTime() < MATERIALS_FRESH_MS) return cached;
  if (!navigator.onLine) return cached ?? [];
  try {
    const { data, error } = await legacyDb().from<PresentationMaterial[]>('producto_materiales').select('id,producto_id,nombre,tipo,orden,para_portal').order('orden').order('creado_en');
    if (!error) visitLegacy.setMaterials(data ?? [], Date.now());
  } catch { /* the last list read stays */ }
  return visitLegacy.materials() ?? [];
}

const materialsOf = (productId: string): PresentationMaterial[] => (visitLegacy.materials() ?? []).filter(material => material.producto_id === productId);

function blobUrl(material: PresentationMaterial, data: string): string {
  const binary = atob(String(data).replace(/^data:[^,]*,/, '')), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: material.tipo }));
}

function close(): void {
  showing?.urls.forEach(url => { URL.revokeObjectURL(url); });
  showing = null;
  const box = document.getElementById('presenta') as HTMLDialogElement | null; if (box?.open) box.close();
}

async function fileOf(material: PresentationMaterial, box: HTMLElement, current: Showing): Promise<string | null> {
  const known = visitLegacy.materialFiles().get(material.id);
  if (known) return known;
  visitLegacy.loading(box, t('common.loading'));
  if (!navigator.onLine) { box.innerHTML = `<p class="vacio">${t('visit.presentation.offline')}</p>`; return null; }
  const { data, error } = await legacyDb().from<{ datos: string }>('producto_materiales').select('datos').eq('id', material.id).maybeSingle();
  if (showing !== current || current.list[current.index] !== material) return null;
  if (error || !data) { box.innerHTML = `<p class="vacio">${t('visit.presentation.couldNotLoad', { reason: escapeHtml((error as { message?: string } | null)?.message ?? t('visit.presentation.missing')) })}</p>`; return null; }
  visitLegacy.materialFiles().set(material.id, data.datos);
  return data.datos;
}

async function paint(): Promise<void> {
  const current = showing; if (!current) return;
  const material = current.list[current.index], box = document.getElementById('prescuerpo');
  if (!material || !box) return;
  const count = document.getElementById('presn'); if (count) count.textContent = current.list.length > 1 ? t('visit.presentation.position', { number: current.index + 1, total: current.list.length, name: material.nombre }) : material.nombre;
  const previous = document.getElementById('presant') as HTMLButtonElement | null, next = document.getElementById('pressig') as HTMLButtonElement | null;
  if (previous) previous.disabled = current.index === 0;
  if (next) next.disabled = current.index === current.list.length - 1;
  const data = await fileOf(material, box, current);
  if (!data || showing !== current || current.list[current.index] !== material) return;
  const url = blobUrl(material, data); current.urls.push(url);
  box.innerHTML = material.tipo === 'application/pdf'
    ? `<iframe class="prespdf" src="${url}" title="${escapeHtml(material.nombre)}"></iframe>`
    : `<img class="presimg" src="${url}" alt="${escapeHtml(material.nombre)}">`;
}

function move(step: number): void {
  if (!showing) return;
  const index = showing.index + step;
  if (index < 0 || index >= showing.list.length) return;
  showing.index = index; void paint();
}

function dialog(): HTMLDialogElement | null {
  if (!document.getElementById('presenta')) document.body.insertAdjacentHTML('beforeend', `<dialog id="presenta" class="presdlg" aria-label="${t('visit.presentation.label')}"></dialog>`);
  return document.getElementById('presenta') as HTMLDialogElement | null;
}

/** The full-screen window with `list`, starting at `index`. */
function open(title: string, list: readonly PresentationMaterial[], index: number): void {
  const box = dialog(); if (!box) return;
  box.innerHTML = `<div class="prescab"><b>${escapeHtml(title)}</b><span class="sm" id="presn"></span><button type="button" class="x" id="prescerrar" aria-label="${t('common.close')}">✕</button></div>
    <div class="prescuerpo" id="prescuerpo"></div>
    <button type="button" class="presnav ant" id="presant" aria-label="${t('visit.presentation.previous')}">‹</button><button type="button" class="presnav sig" id="pressig" aria-label="${t('visit.presentation.next')}">›</button>`;
  showing = { list, index, urls: [] };
  const on = (id: string, action: () => void): void => { const button = document.getElementById(id); if (button) button.onclick = action; };
  on('prescerrar', close); on('presant', () => { move(-1); }); on('pressig', () => { move(1); });
  box.oncancel = (event): void => { event.preventDefault(); close(); };
  box.onkeydown = (event): void => { if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowLeft') move(-1); };
  box.showModal();
  void paint();
}

/** From «Registrar visita»: showing it marks the product as presented. */
export function presentProduct(productId: string): void {
  const list = materialsOf(productId); if (!list.length) return;
  const chip = document.querySelector<HTMLElement>(`#vprods [data-vprod="${productId}"]`);
  if (chip && chip.getAttribute('aria-pressed') !== 'true') chip.click();
  open(chip?.textContent?.trim() ?? t('visit.presentation.label'), list, 0);
}

/** From the product sheet: one material, without marking anything as presented. */
export function presentOnly(product: { id: string; nombre?: string | null }, materialId: string): void {
  const list = materialsOf(product.id); if (!list.length) return;
  open(orFallback(product.nombre, t('visit.presentation.material')), list, Math.max(0, list.findIndex(material => material.id === materialId)));
}
