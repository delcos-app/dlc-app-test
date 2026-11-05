/**
 * Runs a bulk action (D-048): the rows that cannot take it are set aside, a question is asked once if the action needs one (the
 * reason, the user…), one confirmation says how many will be done and why the others will not, then the existing single-item
 * function runs row after row with the progress in the bar, and a summary says «8 de 10 hechos · No se podían (2): …» with the
 * reason of each one and «Dejar seleccionados los 2». The database checks the permission and the rule of every row again.
 */
import { chooseOption, confirmAction } from '../../dialogs';
import { t } from '../../../i18n';
import { formatNumber } from '../../../services/format';
import { clearSelection, setRows, type SelectionState } from './source';
import type { Answer, BulkAction, SelectableRow } from './types';

const LISTED_MAX = 6;

interface Failure { readonly row: SelectableRow; readonly reason: string }

/** «2 en Borrador, 1 con factura»: the skipped rows grouped by reason. */
export function groupedReasons(failures: readonly Failure[]): string {
  const counts = new Map<string, number>();
  failures.forEach(failure => { counts.set(failure.reason, (counts.get(failure.reason) ?? 0) + 1); });
  return [...counts].map(([reason, count]) => `${formatNumber(count)} ${reason}`).join(', ');
}

/** The rows that can take the action and the ones that cannot (with why). */
export function splitRows(action: BulkAction, rows: readonly SelectableRow[]): { ready: SelectableRow[]; skipped: Failure[] } {
  const ready: SelectableRow[] = [], skipped: Failure[] = [];
  rows.forEach(row => { const reason = action.blocker(row); if (reason) skipped.push({ row, reason }); else ready.push(row); });
  return { ready, skipped };
}

function summaryText(action: BulkAction, done: number, failures: readonly Failure[]): string {
  const head = t('listSelection.summary.done', { count: formatNumber(done), what: action.done });
  if (!failures.length) return head;
  const lines = failures.slice(0, LISTED_MAX).map(failure => `· ${failure.row.label}: ${failure.reason}`);
  if (failures.length > LISTED_MAX) lines.push(t('listSelection.summary.andMore', { count: formatNumber(failures.length - LISTED_MAX) }));
  return `${head}\n\n${t('listSelection.summary.couldNot', { count: formatNumber(failures.length) })}\n${lines.join('\n')}`;
}

/** The summary window; true when the user keeps the rows that could not be done selected. */
async function showSummary(action: BulkAction, total: number, done: number, failures: readonly Failure[]): Promise<boolean> {
  const title = t('listSelection.summary.title', { done: formatNumber(done), total: formatNumber(total) });
  const close = { k: 'ok', t: t('common.close') };
  const buttons = failures.length ? [{ k: 'keep', t: t('listSelection.summary.keepFailed', { count: formatNumber(failures.length) }), cls: 'sec' }, close] : [close];
  return await chooseOption(title, summaryText(action, done, failures), buttons) === 'keep';
}

const reasonOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** Row after row; `onProgress` gets «Marcando como preparados… 3 de 8». */
async function runRows(action: BulkAction, ready: readonly SelectableRow[], answer: Answer | null, onProgress: (text: string) => void): Promise<{ done: number; failures: Failure[] }> {
  const failures: Failure[] = [];
  let done = 0;
  for (const [index, row] of ready.entries()) {
    onProgress(t('listSelection.progress', { what: action.progress, index: formatNumber(index + 1), count: formatNumber(ready.length) }));
    // The rule of the row is checked again right before (and the database checks it and the permission once more)
    const blocked = action.blocker(row);
    const reason = blocked ?? await action.runOne(row, answer).catch(reasonOf);
    if (reason) failures.push({ row, reason }); else done += 1;
  }
  return { done, failures };
}

/** Asks, confirms, runs and summarises; false when nothing was run (nothing applicable, cancelled or not allowed). */
export async function runAction(state: SelectionState, action: BulkAction, onProgress: (text: string) => void): Promise<boolean> {
  if (!action.allowed()) return false;
  const rows = [...state.rows.values()], { ready, skipped } = splitRows(action, rows);
  if (!ready.length) return false;
  const answer = action.ask ? await action.ask() : null;
  if (action.ask && !answer) return false;
  const skippedText = skipped.length ? t('listSelection.confirm.skipped', { count: formatNumber(skipped.length), total: formatNumber(rows.length), reasons: groupedReasons(skipped) }) : '';
  const question = action.confirm(ready.length, skippedText, answer);
  if (!await confirmAction(question.texto, { titulo: question.titulo, ok: question.ok, peligro: action.danger })) return false;
  const { done, failures } = await runRows(action, ready, answer, onProgress);
  onProgress('');
  // What failed while running goes first (the skipped ones were already said in the confirmation)
  const all = [...failures, ...skipped];
  const keep = await showSummary(action, rows.length, done, all);
  clearSelection(state);
  if (keep) setRows(state, all.map(failure => failure.row), true);
  return true;
}
