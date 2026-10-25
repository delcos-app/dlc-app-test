/**
 * «Eliminar producto» in the editor's buttons row: without sales it is deleted with its stock, batches and purchases; with history it
 * leaves every list but stays for the record and can be recovered. Part of the legacy editorProducto (v2.323.0/v2.324.0, v2.427.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { formatNumber } from '../../../services/format';

interface RemoveResult { ok?: boolean; error?: string; unidades?: number; modo?: string; detalle?: Record<string, number> | null }

function failureText(error: unknown, result: RemoveResult | null): string {
  if (result?.error === 'stock') return t('productsMore.remove.stock', { units: formatNumber(result.unidades) });
  if (result?.error === 'permiso') return t('productsMore.remove.noPermission');
  return t('productsMore.remove.couldNotRemove', { error: (error as { message?: string } | null)?.message ?? result?.error ?? '' });
}

function doneText(result: RemoveResult): string {
  const detail = result.detalle ?? {};
  if (result.modo === 'borrado') return Number(detail.unidades) ? t('productsMore.remove.removedWithStock', { units: formatNumber(detail.unidades) }) : t('productsMore.remove.removed');
  const uses = billing2Legacy.productUses();
  return t('productsMore.remove.kept', { uses: Object.entries(detail).map(([key, count]) => `${formatNumber(count)} ${uses[key] ?? key}`).join(', ') });
}

async function remove(product: { id: string; nombre?: string | null }): Promise<void> {
  if (!await notices.confirm(t('productsMore.remove.text'), { titulo: t('productsMore.remove.title', { name: product.nombre ?? '' }), ok: t('productsMore.remove.ok'), peligro: true })) return;
  const { data: result, error } = await legacyDb().rpc<RemoveResult>('eliminar_producto', { p_id: product.id });
  if (error || !result?.ok) { notices.toast(failureText(error, result), true); return; }
  const box = document.getElementById('dlg') as HTMLDialogElement | null; if (box?.open) box.close();
  notices.toast(doneText(result));
  billing2Legacy.refreshProducts();
}

/** Adds the button at the start of the buttons row (a block at the end would confuse whoever looks for .acts:last-of-type). */
export function addRemoveButton(product: { id: string; nombre?: string | null }): void {
  const save = document.getElementById('prok'), row = save?.closest('.acts');
  if (!row || document.getElementById('prelim')) return;
  row.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec dang prelimb" id="prelim">${t('productsMore.remove.button')}</button>`);
  const button = document.getElementById('prelim'); if (button) button.onclick = (): void => { void remove(product); };
}
