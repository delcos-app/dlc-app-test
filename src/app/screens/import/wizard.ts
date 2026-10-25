/**
 * The state of the import wizard (what is imported, the file, its columns and how they map) and the pieces every step shares:
 * the step bar, the page box and the moves between steps. Migrated from the legacy IMP and impPasos (v2.410.0).
 */
import { icon } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import type { Entity } from './fields';

export interface DataRow { readonly fila: number; readonly v: readonly string[] }

export interface Wizard {
  entity: Entity;
  fileName: string;
  book: SheetBook | null;
  headers: string[];
  rows: DataRow[];
  /** 'std:<field>', 'extra' (custom field) or 'no' for each column */
  mapping: string[];
  signature: string;
  remembered: boolean;
}

export const wizard: Wizard = { entity: 'clientes', fileName: '', book: null, headers: [], rows: [], mapping: [], signature: '', remembered: false };

/** The steps call each other through here (index.ts fills it), so their modules do not import each other in a circle. */
export const steps = {
  start: (): void => undefined,
  file: (): void => undefined,
  columns: (): void => undefined,
  review: (): void => undefined,
  history: (): void => undefined,
};

const STEP_NAMES: readonly MessageKey[] = ['importing.steps.what', 'importing.steps.file', 'importing.steps.columns', 'importing.steps.review'];

/** The step bar: done steps with a tick, the current one marked. */
export function stepsHtml(current: number): string {
  return `<div class="imppasos">${STEP_NAMES.map((key, index) => {
    const step = index + 1, state = step < current ? 'hecho' : step === current ? 'actual' : '';
    return `<span class="${state}"><b>${step < current ? icon('check') : step}</b>${t(key)}</span>`;
  }).join('')}</div>`;
}

/** The box of the Configuración page the wizard paints in. */
export const pageBox = (): HTMLElement | null => document.getElementById('cfgcuerpo');

/** Paints `html` in the page box and returns it. */
export function paint(html: string): HTMLElement | null {
  const box = pageBox();
  if (box) box.innerHTML = html;
  return box;
}

/** Runs `action` when the element with `id` is pressed. */
export function onClick(id: string, action: () => void): void {
  const element = document.getElementById(id);
  if (element) element.onclick = action;
}

/** «Fila 12 · El NIF no es válido» lines of the rows with errors. */
export const errorLines = (errors: readonly { fila: number; error: string }[]): string =>
  errors.slice(0, 200).map(item => `<div><b>${t('importing.review.row', { row: item.fila })}</b> · ${escapeHtml(item.error)}</div>`).join('');

/** Moves the progress bar of the page box. */
export function showProgress(done: number, total: number): void {
  const bar = pageBox()?.querySelector<HTMLElement>('.impbarra i');
  if (bar) bar.style.width = `${Math.round(done / total * 100)}%`;
}
