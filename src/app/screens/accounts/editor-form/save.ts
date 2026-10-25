/**
 * Saving the account editor: checks (name, required custom fields, «APELLIDOS, NOMBRE» for a new person), the possible duplicates
 * before creating, guardar_cuenta, the custom fields, and then the card. A centre locates its address before saving and the
 * salesperson is assigned after it (hooks). Migrated from the save part of the legacy abrirEditorBase (v2.419.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { readCustomFields, saveCustomFields } from '../../settings/custom-fields';
import { openAccountCard } from '../card';
import { searchAccounts } from '../list/search';
import { readConsultations } from './consultation';

const MIN_NAME = 3, DUPLICATE_PERCENT = 70, CENTRE = 'Centro';

export interface EditedAccount {
  id?: string; tipo: string; nombre?: string | null; especialidad?: string | null; area?: string | null; telefono?: string | null; email?: string | null;
  contacto?: string | null; nota?: string | null; estado_comercial?: string | null; sin_reporting?: boolean | null; clasificadores?: Record<string, unknown> | null;
}

/** Steps other parts add: before the checks (a centre locates its address) and after saving (the salesperson). */
export interface SaveHooks { before: (() => Promise<void>)[]; after: ((id: string) => Promise<void>)[] }

interface Duplicate { nombre: string; pct: number; especialidad?: string | null; centro?: string | null; municipio?: string | null }

const value = (id: string): string => ((document.getElementById(id) as HTMLInputElement | null)?.value ?? '').trim();

function payload(id: string | null, account: EditedAccount): Record<string, unknown> & { nombre: string; tipo: string; consultas: Record<string, unknown>[] } {
  const isCentre = account.tipo === CENTRE, noReporting = document.getElementById('esr') as HTMLInputElement | null, list = document.getElementById('econs');
  return {
    id: id ?? null, tipo: account.tipo, nombre: value('en').toUpperCase(),
    especialidad: isCentre ? '' : value('ee'), area: isCentre ? '' : value('ea'),
    telefono: value('et'), email: value('em'), contacto: value('ect'), nota: value('eno'), estado_comercial: account.estado_comercial,
    consultas: list ? readConsultations(list) : [], sin_reporting: noReporting ? noReporting.checked : Boolean(account.sin_reporting),
  };
}

function problemOf(id: string | null, account: EditedAccount, name: string, missing: string | undefined): string | null {
  if (name.length < MIN_NAME) return t('accountsEditor.save.writeName');
  if (missing) return t('accountsEditor.save.fillField', { field: missing });
  if (!id && account.tipo !== CENTRE && !name.includes(',')) return t('accountsEditor.save.nameFormat');
  return null;
}

const duplicateRow = (item: Duplicate): string => `<div class="l"><span><b>${escapeHtml(item.nombre)}</b><br><span class="sm">${[item.especialidad, item.centro, item.municipio].filter(Boolean).map(escapeHtml).join(' · ')}</span></span>
            <span><b>${item.pct}%</b></span></div>`;

/** The first time a new account looks like an existing one, it shows them and the button says «Crear de todos modos». */
async function warnedOfDuplicates(data: ReturnType<typeof payload>): Promise<boolean> {
  const firstTown = (data.consultas[0]?.municipio as string | undefined) ?? null;
  const { data: found } = await legacyDb().rpc<Duplicate[]>('duplicados_de', { p_nombre: data.nombre, p_tipo: data.tipo, p_municipio: firstTown ? firstTown : null });
  const close = (found ?? []).filter(item => item.pct >= DUPLICATE_PERCENT);
  const box = document.getElementById('edup'), button = document.getElementById('eguardar');
  if (!close.length || !box || !button) return false;
  box.innerHTML = `<div class="dupbox"><b>${t('accountsEditor.save.mayExist')}</b>
          <div class="sm">${t('accountsEditor.save.mayExistHint')}</div>
          ${close.map(duplicateRow).join('')}</div>`;
  button.textContent = t('accountsEditor.save.createAnyway');
  return true;
}

interface SaveState { id: string | null; account: EditedAccount; hooks: SaveHooks; warned: boolean }

/** guardar_cuenta with the button showing «Guardando…»; the saved account, or null if it failed. */
async function store(state: SaveState, data: ReturnType<typeof payload>, button: HTMLButtonElement): Promise<{ medico?: { id: string } } | null> {
  button.disabled = true; button.textContent = t('accountsEditor.save.saving');
  const { data: result, error } = await legacyDb().rpc<{ medico?: { id: string } }>('guardar_cuenta', { p: data });
  button.disabled = false; button.textContent = t(state.id ? 'accountsEditor.editor.saveChanges' : 'accountsEditor.editor.create');
  if (error) { notices.toast(t('accountsEditor.save.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return null; }
  return result ?? {};
}

/** The checks before saving, and the duplicates warning the first time; true if it can be saved now. */
async function readyToSave(state: SaveState, data: ReturnType<typeof payload>, missing: string | undefined): Promise<boolean> {
  const problem = problemOf(state.id, state.account, data.nombre, missing);
  if (problem) { notices.toast(problem, true); return false; }
  if (!state.id && !state.warned && await warnedOfDuplicates(data)) { state.warned = true; return false; }
  return true;
}

/** After saving: close, notice, the list and Inicio again, and the card. */
function done(state: SaveState, savedId: string | undefined): void {
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t(state.id ? 'accountsEditor.save.saved' : 'accountsEditor.save.created'));
  void searchAccounts(true); miscLegacy.reloadHome();
  if (savedId) void openAccountCard(savedId);
}

async function save(state: SaveState, button: HTMLButtonElement): Promise<void> {
  for (const step of state.hooks.before) await step();
  const data = payload(state.id, state.account), fields = readCustomFields(document.getElementById('dbody'));
  if (!await readyToSave(state, data, fields?.falta[0])) return;
  const result = await store(state, data, button);
  if (!result) return;
  const savedId = result.medico?.id ?? state.id ?? '';
  if (fields && !(await saveCustomFields(fields, savedId))) return;
  for (const step of state.hooks.after) await step(savedId);
  done(state, result.medico?.id);
}

/** «Guardar cambios» / «Crear»; returns the hooks other parts of the editor add to. */
export function bindSave(id: string | null, account: EditedAccount): SaveHooks {
  const state: SaveState = { id, account, hooks: { before: [], after: [] }, warned: false };
  const button = document.getElementById('eguardar') as HTMLButtonElement | null;
  if (button) button.onclick = (): void => { void save(state, button); };
  return state.hooks;
}
