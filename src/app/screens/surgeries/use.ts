/**
 * «Registrar lo usado» in a scheduled surgery: the units used of each batch, a serial number per unit, and the case reference
 * (without health data). It creates the draft order to the centre and a replenishment with 48 hours. Migrated from the legacy
 * pintarUsoCirugia (v2.407.0).
 */
import { appLegacy, legacyDb, notices, relatedLegacy, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { range } from '../../services/values';
import { errorText, type Surgery } from './model';

const MAX_SERIALS = 30;

export interface StockLine { producto_id: string; lote_id?: string | null; nombre: string; numero_lote?: string | null; caducidad?: string | null; unidades: number }

function lineHtml(line: StockLine, index: number): string {
  const details = `${escapeHtml(line.numero_lote ?? t('surgeries.use.noBatch'))}${line.caducidad ? t('surgeries.use.expires', { date: formatShortDate(line.caducidad) }) : ''}${t('surgeries.use.available', { count: formatNumber(line.unidades) })}`;
  return `<div class="cirl" data-ci="${index}"><label><span>${escapeHtml(line.nombre)} <span class="sm">· ${details}</span></span>
      <input type="number" min="0" max="${line.unidades}" step="1" data-cu="${index}" placeholder="0" aria-label="${t('surgeries.use.usedOf', { name: escapeHtml(line.nombre) })}"></label><div class="cirser" data-cs="${index}"></div></div>`;
}

/** One serial number field per unit used (at most 30), keeping what was already written. */
function paintSerials(box: HTMLElement, input: HTMLInputElement): void {
  const key = input.dataset.cu ?? '', units = Math.min(Number(input.max), Math.max(0, Math.floor(Number(input.value) || 0)));
  const place = box.querySelector(`[data-cs="${key}"]`); if (!place) return;
  const written = [...place.querySelectorAll('input')].map(field => field.value);
  place.innerHTML = range(Math.min(units, MAX_SERIALS)).map(index => `<input data-cser="${key}" maxlength="120" value="${escapeHtml(written[index] ?? '')}" placeholder="${t('surgeries.use.serialOf', { index: index + 1 })}" aria-label="${t('surgeries.use.serialLabel', { index: index + 1 })}">`).join('');
}

async function saveUsed(surgery: Surgery, stock: readonly StockLine[], box: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const items = stock.map((line, index) => ({
    producto_id: line.producto_id, lote_id: line.lote_id, max: line.unidades,
    unidades: Math.max(0, Math.floor(Number(box.querySelector<HTMLInputElement>(`[data-cu="${index}"]`)?.value) || 0)),
    series: [...box.querySelectorAll<HTMLInputElement>(`[data-cser="${index}"]`)].map(field => field.value.trim()).filter(Boolean),
  })).filter(item => item.unidades > 0);
  if (!items.length) { notices.toast(t('surgeries.use.writeUsed'), true); return; }
  if (items.some(item => item.unidades > item.max)) { notices.toast(t('surgeries.use.tooMany'), true); return; }
  button.disabled = true;
  const reference = (document.getElementById('cirref2') as HTMLInputElement | null)?.value ?? '';
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; pedido_id?: string | null }>('cirugia_consumo', { p: {
    id: surgery.id, referencia_caso: reference, items: items.map(item => ({ producto_id: item.producto_id, lote_id: item.lote_id, unidades: item.unidades, series: item.series })),
  } });
  button.disabled = false;
  if (error || !result || result.ok === false) { notices.toast(error ? t('surgeries.editor.couldNotSave', { error: (error as { message?: string }).message ?? '' }) : errorText(result), true); return; }
  notices.toast(t('surgeries.use.saved')); appLegacy.forgetCache();
  relatedLegacy.openSurgery(surgery.id, `<div class="banda-ok depaviso">${t(result.pedido_id ? 'surgeries.use.savedWithOrder' : 'surgeries.use.savedWithoutOrder')}</div>`);
}

/** Paints «Registrar lo usado» (or the notice that there is no material to use). */
export function paintUse(surgery: Surgery, stock: readonly StockLine[]): void {
  const box = document.getElementById('cirusar'); if (!box) return;
  if (!stock.length) { box.innerHTML = `<div class="banda-aviso">${t(surgery.origen === 'deposito' ? 'surgeries.use.noMaterialDeposit' : 'surgeries.use.noMaterialPersonal')}</div>`; return; }
  box.innerHTML = `<details class="cirdet"><summary class="btn">${t('surgeries.use.record')}</summary><div class="depbox">
    <span class="sm">${t('surgeries.use.hint')}</span>
    <div class="cirlin">${stock.map(lineHtml).join('')}</div>
    <label for="cirref2">${t('surgeries.editor.caseReference', { patient: term('paciente', { article: 'del' }) })}</label><input id="cirref2" maxlength="60" value="${escapeHtml(surgery.referencia_caso ?? '')}" placeholder="${t('surgeries.editor.caseReferencePlaceholder')}">
    <div class="acts u-end"><button type="button" class="btn" id="cirusok">${t('surgeries.use.save')}</button></div></div></details>`;
  box.querySelectorAll<HTMLInputElement>('[data-cu]').forEach(input => { input.oninput = (): void => { paintSerials(box, input); }; });
  const save = document.getElementById('cirusok') as HTMLButtonElement | null; if (save) save.onclick = (): void => { void saveUsed(surgery, stock, box, save); };
}
