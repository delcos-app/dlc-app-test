/**
 * The window «Ciclo de visitas A/B/C» (administration): how long the cycle is and how many visits each class needs. Opened from
 * «Ajustar el ciclo» and from Configuración → Cartera y visitas. Migrated from the legacy editorCiclo (v2.408.0).
 */
import { rpc } from '../../api/client';
import { appLegacy, cycleLegacy, notices } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { classPill, CLASSES, words } from './model';

const MAX_VISITS = 31, DEFAULT_MONTHS = 3;
const DEFAULTS: Readonly<Record<string, number>> = { meses: DEFAULT_MONTHS, A: 3, B: 2, C: 1 };
const LENGTHS: readonly (readonly [number, MessageKey])[] = [
  [1, 'cycle.editor.oneMonth'], [2, 'cycle.editor.twoMonths'], [3, 'cycle.editor.quarter'],
  [4, 'cycle.editor.fourMonths'], [6, 'cycle.editor.half'], [12, 'cycle.editor.year'],
];

const visits = (value: unknown): number => Math.min(MAX_VISITS, Math.max(0, Math.floor(Number(value) || 0)));

function editorHtml(current: Readonly<Record<string, number>>): string {
  const months = LENGTHS.map(([value, key]) => `<option value="${value}" ${Number(current.meses) === value ? 'selected' : ''}>${t(key)}</option>`).join('');
  const goals = CLASSES.map(letter => `<label>${classPill(letter)}<span>${t('cycle.editor.perCycle', words())}</span><input type="number" min="0" max="${MAX_VISITS}" step="1" data-cobj="${letter}" value="${Math.max(0, Number(current[letter]) || 0)}" aria-label="${t('cycle.editor.ofClass', { ...words(), class: letter })}"></label>`).join('');
  return `<div class="fh"><div><h2>${t('cycle.editor.title', words())}</h2>
      <div class="sm">${t('cycle.editor.subtitle', words())}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="cicmeses">${t('cycle.editor.length')}</label><select id="cicmeses">${months}</select>
    <div class="cicobj">${goals}</div>
    <p class="sm">${t('cycle.editor.zeroHint', words())}</p>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="cicok">${t('common.save')}</button></div>`;
}

async function save(body: HTMLElement, box: HTMLDialogElement): Promise<void> {
  const value: Record<string, number> = { meses: Number((document.getElementById('cicmeses') as HTMLSelectElement | null)?.value) || DEFAULT_MONTHS };
  body.querySelectorAll<HTMLInputElement>('[data-cobj]').forEach(input => { value[input.dataset.cobj ?? ''] = visits(input.value); });
  const { data, error } = await rpc('guardar_ajuste', { p_clave: 'ciclo_visitas', p_valor: value }), result = data as { ok?: boolean } | null;
  if (error || result?.ok === false) { notices.toast(t('cycle.editor.couldNotSave'), true); return; }
  cycleLegacy.setSetting('ciclo_visitas', value);
  box.close(); notices.toast(t('cycle.editor.saved')); appLegacy.forgetCache();
}

export async function editCycle(): Promise<void> {
  await cycleLegacy.loadSettings();
  const current = { ...DEFAULTS, ...(cycleLegacy.setting('ciclo_visitas') as Record<string, number> | undefined) };
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(current);
  if (!box.open) box.showModal();
  const ok = document.getElementById('cicok'); if (ok) ok.onclick = (): void => { void save(body, box); };
}
