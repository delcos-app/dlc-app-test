/**
 * «Packs para los centros»: the centres order the product only by packs from their portal (the gift goes as a line at 100 %
 * discount), and the reference retail price shows them their margin. Part of the legacy editorProductoBase8 (v2.427.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatNumber } from '../../../services/format';
import { errorMessage } from '../model';
import type { Pack, ProductExtras } from './blocks';

const byId = (id: string): HTMLElement | null => document.getElementById(id);

function read(): Pack[] {
  return [...(byId('prpkl')?.querySelectorAll('.prpkf') ?? [])].map(row => ({
    compra: row.querySelector<HTMLInputElement>('[data-pkc]')?.value ?? '', regalo: row.querySelector<HTMLInputElement>('[data-pkg]')?.value ?? '',
  }));
}

function problemOf(packs: readonly { compra: number; regalo: number }[], price: number | null): string {
  const bad = packs.some(pack => !Number.isInteger(pack.compra) || pack.compra < 1 || !Number.isInteger(pack.regalo) || pack.regalo < 0);
  if (bad) return t('productsMore.packs.badPack');
  if (packs.some((pack, index) => packs.findIndex(other => other.compra === pack.compra && other.regalo === pack.regalo) !== index)) return t('productsMore.packs.repeated');
  return price !== null && !(price >= 0) ? t('productsMore.packs.badPrice') : '';
}

export function bindPacks(productId: string, extras: ProductExtras): void {
  let packs: Pack[] = (Array.isArray(extras.packs) ? extras.packs : []).map(pack => ({ compra: Number(pack.compra) || 0, regalo: Number(pack.regalo) || 0 }));
  const paint = (): void => {
    const list = byId('prpkl'); if (!list) return;
    list.innerHTML = packs.length ? packs.map((pack, index) => `<div class="prpkf"><label>${t('productsMore.packs.buy')} <input type="number" step="1" data-pkc value="${pack.compra || ''}"></label>
          <label>${t('productsMore.packs.free')} <input type="number" step="1" data-pkg value="${pack.regalo || 0}"></label><button type="button" class="pmhx" data-pkx="${index}" aria-label="${t('productsMore.packs.removePack')}">✕</button></div>`).join('')
      : `<p class="sm">${t('productsMore.packs.none')}</p>`;
    list.querySelectorAll<HTMLElement>('[data-pkx]').forEach(button => { button.onclick = (): void => { packs = read(); packs.splice(Number(button.dataset.pkx), 1); paint(); }; });
  };
  paint();
  const add = byId('prpkmas'); if (add) add.onclick = (): void => { packs = read(); packs.push({ compra: '', regalo: 0 }); paint(); };
  const ok = byId('prpkok') as HTMLButtonElement | null;
  if (ok) ok.onclick = async (): Promise<void> => {
    const list = read().map(pack => ({ compra: Number(pack.compra), regalo: Number(pack.regalo || 0) })), error = byId('prpkerr');
    const priceText = (byId('prpkpvp') as HTMLInputElement | null)?.value ?? '', price = priceText === '' ? null : Number(priceText);
    const problem = problemOf(list, price);
    if (error) { error.hidden = !problem; error.textContent = problem; }
    if (problem) return;
    ok.disabled = true;
    const { error: failed } = await legacyDb().from('productos').update({ packs: list.length ? list.sort((first, second) => first.compra - second.compra) : null, pvp_recomendado: price }).eq('id', productId);
    ok.disabled = false;
    if (failed) { notices.toast(t('productsMore.packs.couldNotSave', { error: errorMessage(failed) }), true); return; }
    packs = list; paint();
    notices.toast(list.length ? t('productsMore.packs.saved', { count: formatNumber(list.length) }) : t('productsMore.packs.noPacks'));
  };
}
