/**
 * Configuración → «Estados comerciales»: the role of each commercial state (initial, in progress, interested, customer, lost), from
 * which the alerts and the home indicators come. Migrated from the legacy pintarEstadosPapel (v2.415.0).
 */
import { appLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const INITIAL = 'inicial';

interface StateValue { id: string; valor: string; orden?: number; activo?: boolean | null; papel?: string | null }

const ERRORS = new Map<string, MessageKey>([
  ['permiso', 'settingsMore.states.noPermission'], ['sin_inicial', 'settingsMore.states.markOtherInitial'], ['papel', 'settingsMore.states.noSuchRole'],
]);

function roleHint(value: StateValue): string {
  return settingsMoreLegacy.stateRoles().find(role => role[0] === value.papel)?.[2] ?? t('settingsMore.states.noRoleHint');
}

function rowHtml(value: StateValue): string {
  const options = settingsMoreLegacy.stateRoles().map(([key, label]) => `<option value="${key}" ${value.papel === key ? 'selected' : ''}>${label}</option>`).join('');
  const title = value.papel === INITIAL ? `title="${t('settingsMore.states.initialTitle')}"` : '';
  return `<div class="ajfila estfila" data-estid="${value.id}"><div><b>${escapeHtml(value.valor)}</b>
          <span class="sm">${escapeHtml(roleHint(value))}</span></div>
        <div class="ajctl"><select data-estpapel="${value.id}" aria-label="${t('settingsMore.states.roleOf', { name: escapeHtml(value.valor) })}" ${title}>${value.papel ? '' : `<option value="" selected>${t('settingsMore.states.noRole')}</option>`}${options}</select></div></div>`;
}

function pageHtml(states: readonly StateValue[]): string {
  return `<div class="card estw">
      <p class="sm">${t('settingsMore.states.intro', { aVisit: escapeHtml(term('visita', { article: 'una' })) })}</p>
      ${states.length ? states.map(rowHtml).join('') : `<p class="vacio">${t('settingsMore.states.none')}</p>`}</div>`;
}

async function readStates(): Promise<{ states: StateValue[]; error: { message?: string } | null }> {
  const { data: classifier } = await legacyDb().from<{ id: string }[]>('clasificadores').select('id').eq('papel', 'estado_comercial').limit(1);
  const first = classifier?.[0];
  if (!first) return { states: [], error: null };
  const { data, error } = await legacyDb().from<StateValue[]>('valores_clasificador').select('id,valor,orden,activo,papel').eq('clasificador_id', first.id).order('orden');
  return { states: data ?? [], error: error as { message?: string } | null };
}

async function confirmInitial(states: readonly StateValue[], value: StateValue): Promise<boolean> {
  const previous = states.find(state => state.papel === INITIAL && state.id !== value.id);
  if (!previous) return true;
  return notices.confirm(t('settingsMore.states.confirmInitial', { name: value.valor, previous: previous.valor }), { titulo: t('settingsMore.states.confirmInitialTitle'), ok: t('settingsMore.states.change') });
}

/** Whether the change can go ahead (the initial state is only changed by marking another one, and after asking). */
async function canChange(states: readonly StateValue[], value: StateValue, select: HTMLSelectElement): Promise<boolean> {
  if (value.papel === INITIAL) { select.value = value.papel; notices.toast(t('settingsMore.states.markOtherInitial'), true); return false; }
  if (select.value === INITIAL && !await confirmInitial(states, value)) { select.value = value.papel ?? ''; return false; }
  return true;
}

function failureText(result: { error?: string } | null, error: unknown): string {
  const known = ERRORS.get(result?.error ?? '');
  if (known) return t(known);
  return t('settingsMore.states.couldNotChange') + (error ? `: ${(error as { message?: string }).message ?? ''}` : '');
}

async function changeRole(states: readonly StateValue[], select: HTMLSelectElement): Promise<void> {
  const value = states.find(state => state.id === select.dataset.estpapel), chosen = select.value;
  if (!value || !chosen || chosen === value.papel || !await canChange(states, value, select)) return;
  select.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('guardar_papel_estado', { p_id: value.id, p_papel: chosen });
  if (error || !result?.ok) {
    select.disabled = false; select.value = value.papel ?? '';
    notices.toast(failureText(result, error), true);
    return;
  }
  notices.toast(t('settingsMore.states.changed'));
  appLegacy.forgetCache(); try { await settingsMoreLegacy.reloadCatalogs(); } catch { /* the catalogs reload next time */ }
  void paintCommercialStates();
}

export async function paintCommercialStates(): Promise<void> {
  // The page is painted in the box that was there when it started (Configuración may move the id meanwhile), as before
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  settingsMoreLegacy.loading(box, t('settingsMore.states.loading'));
  const { states, error } = await readStates();
  if (!document.getElementById('cfgcuerpo') || settingsMoreLegacy.settingsKey() !== 'estados') return;
  if (error) { box.innerHTML = `<div class="card"><p class="sm">${t('settingsMore.states.couldNotRead', { error: escapeHtml(error.message ?? '') })}</p></div>`; return; }
  const active = states.filter(state => state.activo !== false);
  box.innerHTML = pageHtml(active);
  box.querySelectorAll<HTMLSelectElement>('[data-estpapel]').forEach(select => { select.onchange = (): void => { void changeRole(active, select); }; });
}
