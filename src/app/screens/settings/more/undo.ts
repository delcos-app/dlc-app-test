/**
 * Undoing changes from the audit log: one change («Deshacer» on a row) or everything a person changed since a date. Both ask the
 * database first what would be undone. Migrated from the legacy deshacerUno and cajaDeshacerPersona (v2.415.0).
 */
import { cardSectionsLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';

const REASONS = new Map<string, MessageKey>([
  ['permiso', 'settingsMore.undo.reasonPermission'], ['no_existe', 'settingsMore.undo.reasonNotInLog'], ['no_deshacible', 'settingsMore.undo.reasonNotUndoable'],
  ['ya_no_existe', 'settingsMore.undo.reasonGone'], ['ya_existe', 'settingsMore.undo.reasonRecovered'],
]);

interface UndoCheck { ok?: boolean; motivo?: string; campos?: string[] }

/** The reason in words (the database code itself if it is a new one), or `fallback` without a reason. */
const reasonText = (reason: string | undefined, fallback: string): string => {
  const key = REASONS.get(reason ?? ''); return key ? t(key) : orFallback(reason, fallback);
};

/** The data that would go back, or null (with a notice) when nothing can be undone. */
async function undoableFields(id: number): Promise<string[] | null> {
  const { data: check } = await legacyDb().rpc<UndoCheck>('deshacer_cambio', { p_id: id, p_simular: true });
  if (!check?.ok) { notices.toast(reasonText(check?.motivo, t('settingsMore.undo.cannot')), true); return null; }
  const fields = check.campos ?? [];
  if (!fields.length) { notices.toast(t('settingsMore.undo.nothingLeft'), true); return null; }
  return fields;
}

/** Undoes one change of the audit log (after showing which data go back) and calls `then`. */
export async function undoChange(id: number, then?: () => void): Promise<void> {
  const fields = await undoableFields(id); if (!fields) return;
  const fieldNames = fields.map(field => cardSectionsLegacy.fieldName(field)).join(', ');
  if (!await notices.confirm(t('settingsMore.undo.confirmOne', { fields: fieldNames }), { titulo: t('settingsMore.undo.titleOne'), ok: t('settingsMore.undo.undo') })) return;
  const { data: result, error } = await legacyDb().rpc<UndoCheck>('deshacer_cambio', { p_id: id, p_simular: false });
  if (error || !result?.ok) {
    notices.toast(t('settingsMore.undo.couldNot', { reason: reasonText(result?.motivo, orFallback((error as { message?: string } | null)?.message, '')) }), true); return;
  }
  notices.toast(t('settingsMore.undo.done')); then?.();
}

interface PersonCheck { ok?: boolean; cambios?: number; campos?: number; sin_deshacer?: number; por_entidad?: Record<string, number> }
interface PersonUndo { box: HTMLElement; user: string; from: string; name: string; then?: () => void }

const ENTITY_KEYS = new Map<string, MessageKey>([
  ['cuentas', 'settingsMore.undo.entityAccounts'], ['contactos', 'settingsMore.undo.entityCustomers'],
  ['productos', 'settingsMore.undo.entityProducts'], ['rutas', 'settingsMore.undo.entityRoutes'],
]);

const entityName = (entity: string): string => {
  if (entity === 'ubicaciones') return term('consulta', { number: 'p' });
  const key = ENTITY_KEYS.get(entity); return key ? t(key) : entity;
};

function summaryHtml(check: PersonCheck): string {
  const parts = Object.entries(check.por_entidad ?? {}).map(([entity, count]) => t('settingsMore.undo.inEntity', { count: formatNumber(count), entity: entityName(entity) })).join(', ');
  return `${t('settingsMore.undo.wouldUndo', { changes: formatNumber(check.cambios), fields: formatNumber(check.campos), parts })}
      ${check.sin_deshacer ? ` ${t('settingsMore.undo.notUndoable', { count: formatNumber(check.sin_deshacer) })}` : ''}
      <div class="acts" style="margin:8px 0 0"><button type="button" class="btn" id="audok">${t('settingsMore.undo.undoCount', { count: formatNumber(check.cambios) })}</button></div>`;
}

const personParams = (undo: PersonUndo, simulate: boolean): Record<string, unknown> => ({ p_usuario: undo.user, p_desde: `${undo.from}T00:00:00`, p_simular: simulate });

async function undoAll(undo: PersonUndo, check: PersonCheck, button: HTMLButtonElement): Promise<void> {
  const text = t('settingsMore.undo.confirmPerson', { count: formatNumber(check.cambios), name: undo.name.trim(), date: formatShortDate(undo.from) });
  if (!await notices.confirm(text, { titulo: t('settingsMore.undo.titlePerson'), ok: t('settingsMore.undo.undo') })) return;
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<PersonCheck>('deshacer_persona', personParams(undo, false));
  if (!result?.ok) { button.disabled = false; notices.toast(t('settingsMore.undo.couldNotPerson'), true); return; }
  notices.toast(t('settingsMore.undo.donePerson', { count: formatNumber(result.cambios) })); undo.then?.();
}

async function simulate(undo: PersonUndo, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { data: check } = await legacyDb().rpc<PersonCheck>('deshacer_persona', personParams(undo, true));
  button.disabled = false;
  if (!check?.ok) { notices.toast(t('settingsMore.undo.couldNotCalculate'), true); return; }
  const result = document.getElementById('audres'); if (!result) return;
  if (!check.cambios) { result.textContent = t('settingsMore.undo.nothingInPeriod'); return; }
  result.innerHTML = summaryHtml(check);
  const ok = document.getElementById('audok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void undoAll(undo, check, ok); };
}

/** The box to undo what a person changed since a date (empty without a person or a date). */
export function paintPersonUndo(undo: PersonUndo): void {
  if (!undo.user || !undo.from) { undo.box.innerHTML = ''; return; }
  undo.box.innerHTML = `<div class="card" id="audpersona" style="margin:0 16px 10px"><h3>${t('settingsMore.undo.personTitle', { name: escapeHtml(undo.name.trim()) })}</h3>
    <p class="sm">${t('settingsMore.undo.personHint', { places: term('consulta', { number: 'p' }), date: formatShortDate(undo.from) })}</p>
    <div class="acts" style="margin:6px 0 0"><button type="button" class="btn sec" id="audsim">${t('settingsMore.undo.preview')}</button></div><div id="audres" class="sm"></div></div>`;
  const button = document.getElementById('audsim') as HTMLButtonElement | null;
  if (button) button.onclick = (): void => { void simulate(undo, button); };
}
