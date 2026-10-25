/** The opportunity window, step 2: the products and units the client wants, and the professional or centre of reference. */
import { opportunitiesLegacy, portalLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { range, sum } from '../../../services/values';
import { lineAmount, type SaleProduct } from '../model';
import type { Draft } from './draft';

const HIDDEN_STATES = ['En pausa', 'Descatalogado'];

const totalInterest = (draft: Draft): number => sum(draft.lines.map(line => lineAmount(line.producto_id, line.unidades)));

/** «Sin pedido se quedan sin vender …» under the no-sale reasons. */
export function paintLoss(draft: Draft): void {
  const loss = document.getElementById('nvperd');
  if (loss) loss.innerHTML = totalInterest(draft) ? t('opportunities.editor.unsold', { amount: portalLegacy.euros(totalInterest(draft)) }) : '';
}

function lineHtml(draft: Draft, products: readonly SaleProduct[], index: number): string {
  const line = draft.lines[index] ?? { producto_id: '', unidades: 0 };
  const options = products.map(product => `<option value="${product.id}" ${product.id === line.producto_id ? 'selected' : ''}>${escapeHtml(product.nombre)}</option>`).join('')
    || `<option value="">${t('opportunities.editor.noProducts')}</option>`;
  return `<div class="nvlin" data-nvi="${index}">
        <select data-nvf="producto_id" aria-label="${t('opportunities.editor.product')}">${options}</select>
        <input data-nvf="unidades" type="number" min="1" step="1" value="${escapeHtml(String(line.unidades))}" aria-label="${t('opportunities.editor.units')}">
        <span class="nvimp">${portalLegacy.euros(lineAmount(line.producto_id, line.unidades))}</span>
        ${draft.lines.length > 1 ? `<button type="button" class="btn sec" data-nvx="${index}" aria-label="${t('opportunities.editor.remove')}">✕</button>` : '<span></span>'}</div>`;
}

function bindLine(draft: Draft, row: HTMLElement): void {
  const index = Number(row.dataset.nvi), line = draft.lines[index];
  if (!line) return;
  row.querySelectorAll<HTMLInputElement>('[data-nvf]').forEach(input => {
    input.oninput = input.onchange = (): void => {
      if (input.dataset.nvf === 'unidades') line.unidades = Math.max(0, Number(input.value) || 0); else line.producto_id = input.value;
      const amount = row.querySelector('.nvimp'); if (amount) amount.textContent = portalLegacy.euros(lineAmount(line.producto_id, line.unidades));
      const total = document.getElementById('nvtotv'); if (total) total.textContent = portalLegacy.euros(totalInterest(draft));
      paintLoss(draft);
    };
  });
}

/** Paints the lines of interest, with «+ Otro producto» and the total. */
export function paintInterest(draft: Draft): void {
  const box = document.getElementById('nvint'); if (!box) return;
  const products = opportunitiesLegacy.products().filter(product => product.tipo !== 'servicio' && !HIDDEN_STATES.includes(product.estado ?? ''));
  box.innerHTML = range(draft.lines.length).map(index => lineHtml(draft, products, index)).join('')
    + `<div class="nvtot"><button type="button" class="lnk" id="nvmas">${t('opportunities.editor.otherProduct')}</button><span>${t('opportunities.editor.wouldBuy', { amount: portalLegacy.euros(totalInterest(draft)) })}</span></div>`;
  box.querySelectorAll<HTMLElement>('[data-nvi]').forEach(row => { bindLine(draft, row); });
  box.querySelectorAll<HTMLElement>('[data-nvx]').forEach(button => { button.onclick = (): void => { draft.lines.splice(Number(button.dataset.nvx), 1); paintInterest(draft); }; });
  const more = document.getElementById('nvmas');
  if (more) more.onclick = (): void => { draft.lines.push({ producto_id: opportunitiesLegacy.defaultProduct(), unidades: 1 }); paintInterest(draft); };
  paintLoss(draft);
}

/** The professional or centre of reference (free text is kept when it is not in the base). */
export function paintReference(draft: Draft): void {
  const box = document.getElementById('nvmed'); if (!box) return;
  box.innerHTML = '';
  opportunitiesLegacy.pickReference({
    element: box, value: draft.reference, freeText: draft.reference ? '' : draft.source.cuenta_texto ?? '', placeholder: t('opportunities.editor.referencePlaceholder'),
    onPick: account => { draft.reference = account; },
  });
}
