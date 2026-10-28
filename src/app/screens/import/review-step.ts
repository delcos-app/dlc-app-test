/**
 * Step 4 of «Nueva importación»: every row is checked without saving (new ones, existing ones, rows with errors), the user chooses
 * whether existing ones are updated, and imports. Migrated from the legacy impRevisar (v2.410.0).
 */
import { notices } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { rowsToImport, sendInBatches, type BatchResult } from './rows';
import { runImport } from './run-step';
import { errorLines, onClick, paint, showProgress, steps, stepsHtml, wizard } from './wizard';

interface Counts { readonly created: number; readonly existing: number; readonly skipped: number; readonly unit: string }

const MATCHED_BY = new Map<string, MessageKey>([['clientes', 'importing.review.byCustomer'], ['productos', 'importing.review.byProduct']]);
const OPEN_ERRORS = 10;

function countsOf(check: BatchResult): Counts {
  const count = (action: string): number => check.filas.filter(row => row.accion === action).length;
  return { created: count('nuevo'), existing: count('actualizado'), skipped: count('omitido'), unit: t(wizard.entity === 'ventas' ? 'importing.review.orders' : 'importing.review.records') };
}

function summaryHtml(counts: Counts, errors: number): string {
  return `<div class="impres"><div class="ok"><b>${formatNumber(counts.created)}</b><span>${t('importing.review.newOnes', { unit: counts.unit })}</span></div>
      <div><b>${formatNumber(counts.existing + counts.skipped)}</b><span>${t('importing.review.existing')}${wizard.entity === 'ventas' ? t('importing.review.untouched') : ''}</span></div>
      <div class="${errors ? 'mal' : ''}"><b>${formatNumber(errors)}</b><span>${t('importing.review.withErrors')}</span></div></div>`;
}

function modeHtml(counts: Counts): string {
  if (!counts.existing || wizard.entity === 'ventas') return '';
  return `<label>${t('importing.review.existingLabel')}</label><div class="segs" id="impmodo"><button type="button" data-v="actualizar" class="on">${t('importing.review.update')}</button><button type="button" data-v="omitir">${t('importing.review.keep')}</button></div>
      <p class="sm">${t('importing.review.matchedBy', { keys: t(MATCHED_BY.get(wizard.entity) ?? 'importing.review.byName') })}</p>`;
}

function pageHtml(check: BatchResult, counts: Counts): string {
  const custom = wizard.mapping.map((value, index) => (value === 'extra' ? wizard.headers[index] ?? '' : '')).filter(Boolean);
  const errors = check.errores;
  return `<div class="card cfgpanel impcaja">${stepsHtml(4)}
    <h2 class="u-p-0-0-4">${t('importing.review.title', { name: escapeHtml(wizard.fileName) })}</h2>
    ${summaryHtml(counts, errors.length)}
    ${modeHtml(counts)}
    ${custom.length ? `<p class="sm">${t('importing.review.customFields', { fields: custom.map(escapeHtml).join(', ') })}</p>` : ''}
    ${errors.length ? `<details class="imperr" ${errors.length <= OPEN_ERRORS ? 'open' : ''}><summary>${t('importing.review.seeErrors')}</summary><div>${errorLines(errors)}</div></details>` : ''}
    <div class="acts u-between"><button class="btn sec" type="button" id="impvolver">${t('importing.review.backToColumns')}</button>
      <button class="btn" type="button" id="impok" ${counts.created + counts.existing ? '' : 'disabled'}>${t('importing.review.run', { count: formatNumber(counts.created + counts.existing), unit: counts.unit })}</button></div></div>`;
}

function bind(rows: readonly Record<string, unknown>[], counts: Counts): void {
  let mode = 'actualizar';
  const modes = document.getElementById('impmodo'), run = document.getElementById('impok');
  modes?.querySelectorAll<HTMLElement>('button').forEach(button => {
    button.onclick = (): void => {
      mode = button.dataset.v ?? 'actualizar';
      modes.querySelectorAll('button').forEach(other => { other.classList.toggle('on', other === button); });
      if (run) run.textContent = t('importing.review.run', { count: formatNumber(counts.created + (mode === 'actualizar' ? counts.existing : 0)), unit: counts.unit });
    };
  });
  onClick('impvolver', steps.columns);
  if (run) run.onclick = (): void => { void runImport(rows, wizard.entity === 'ventas' ? 'omitir' : mode); };
}

export async function paintReviewStep(): Promise<void> {
  const rows = rowsToImport();
  paint(`<div class="card cfgpanel impcaja">${stepsHtml(4)}<h2 class="u-p-0-0-4">${t('importing.review.checking')}</h2><p class="sm">${t('importing.review.checkingText')}</p><div class="impbarra"><i style="width:0"></i></div></div>`);
  let check: BatchResult;
  try {
    check = await sendInBatches(rows, { entity: wizard.entity, mode: 'actualizar', simulate: true, importId: null }, showProgress);
  } catch (error) {
    notices.toast(t('importing.review.couldNotCheck', { error: error instanceof Error ? error.message : String(error) }), true);
    steps.columns();
    return;
  }
  const counts = countsOf(check);
  paint(pageHtml(check, counts));
  bind(rows, counts);
}
