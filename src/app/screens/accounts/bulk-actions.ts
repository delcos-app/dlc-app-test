/**
 * Profesionales y centros (Cuentas): what can be done to several accounts at once (D-048, v2.472.0): a sales rep in charge or a
 * portfolio (a user chosen once, administration), the A/B/C class, taking them out (baja) and deleting the ones without history.
 * Each one calls the same function as the card, the portfolio window or «Clasificar», once per account; the database checks the
 * permission again. «Cambiar estado» needs its own SQL (today the state is only saved with the whole card) and comes later.
 */
import { cardSectionsLegacy, legacyDb, term } from '../../legacy/bridge';
import { coreLegacy } from '../../legacy/core-bridge';
import { askWith, chooseOption } from '../../components/dialogs';
import { can, canEdit, levelOf } from '../../core/permissions';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { outcomeOf } from '../../components/list-bar/selection/outcome';
import type { Answer, BulkAction, Confirmation, SelectionConfig } from '../../components/list-bar/selection/types';
import { searchAccounts } from './lazy';

interface TeamUser { id: string; nombre: string; rol: string; activo: boolean }

const DELETE_LEVEL = 3, CLASSES = ['A', 'B', 'C'] as const, NO_CLASS = '-';

const accounts = (): string => term('medico', { number: 'p' });
const count = (value: number): string => formatNumber(value);
const isAdministration = (): boolean => can('administrar');

/** A user who can hold a portfolio, chosen once from a list. */
async function askUser(title: string): Promise<Answer | null> {
  const { data } = await legacyDb().rpc<TeamUser[]>('usuarios_lista');
  const users = (data ?? []).filter(user => user.activo && cardSectionsLegacy.roleCan(user.rol, 'cartera'));
  if (!users.length) { coreLegacy.toast(t('accountsBulk.noUsers'), true); return null; }
  return askWith<Answer>(title, t('accountsBulk.chooseUser'), slot => {
    slot.innerHTML = `<select id="msel" aria-label="${escapeHtml(t('accountsBulk.chooseUser'))}">${users.map(user => `<option value="${user.id}">${escapeHtml(user.nombre)} · ${escapeHtml(user.rol)}</option>`).join('')}</select>`;
    const select = slot.querySelector('select');
    return () => (select ? { value: select.value, label: select.options[select.selectedIndex]?.text.split(' · ')[0] ?? '' } : null);
  }, t('accountsBulk.userOk'));
}

async function askClass(): Promise<Answer | null> {
  const buttons = [...CLASSES.map(letter => ({ k: letter, t: letter })), { k: NO_CLASS, t: t('accountsBulk.classify.none'), cls: 'sec' }];
  const chosen = await chooseOption(t('accountsBulk.classify.title'), t('accountsBulk.classify.ask'), buttons);
  if (!chosen) return null;
  return chosen === NO_CLASS ? { value: null, label: t('accountsBulk.classify.none') } : { value: chosen, label: chosen };
}

const confirmWith = (key: 'owner' | 'portfolio' | 'classify') => (total: number, skipped: string, answer: Answer | null): Confirmation =>
  ({ titulo: t(`accountsBulk.${key}.title`), texto: t(`accountsBulk.${key}.text`, { count: count(total), accounts: accounts(), name: answer?.label ?? '' }) + skipped, ok: t(`accountsBulk.${key}.ok`, { count: count(total) }) });

const confirmOf = (key: 'off' | 'delete') => (total: number, skipped: string): Confirmation =>
  ({ titulo: t(`accountsBulk.${key}.title`), texto: t(`accountsBulk.${key}.text`, { count: count(total), accounts: accounts() }) + skipped, ok: t(`accountsBulk.${key}.ok`, { count: count(total) }) });

function assignOwner(): BulkAction {
  return { id: 'owner', label: t('accountsBulk.owner.label'), allowed: isAdministration, blocker: () => null, ask: () => askUser(t('accountsBulk.owner.title')), confirm: confirmWith('owner'),
    runOne: async (row, answer) => outcomeOf(await legacyDb().rpc('asignar_responsable_cuenta', { p_medico: row.id, p_usuario: answer?.value ?? null })),
    progress: t('accountsBulk.owner.progress'), done: t('accountsBulk.owner.done') };
}

function addToPortfolio(): BulkAction {
  return { id: 'portfolio', label: t('accountsBulk.portfolio.label'), allowed: isAdministration, blocker: () => null, ask: () => askUser(t('accountsBulk.portfolio.title')), confirm: confirmWith('portfolio'),
    runOne: async (row, answer) => outcomeOf(await legacyDb().rpc('asignar_cartera', { p: { usuario_id: answer?.value, medicos: [row.id], quitar: false } })),
    progress: t('accountsBulk.portfolio.progress'), done: t('accountsBulk.portfolio.done') };
}

function classify(): BulkAction {
  return { id: 'classify', label: t('accountsBulk.classify.label'), allowed: canEdit, blocker: () => null, ask: askClass, confirm: confirmWith('classify'),
    runOne: async (row, answer) => outcomeOf(await legacyDb().rpc('clasificar_cuentas', { p_ids: [row.id], p_clase: answer?.value ?? null })),
    progress: t('accountsBulk.classify.progress'), done: t('accountsBulk.classify.done') };
}

function takeOut(): BulkAction {
  return { id: 'off', label: t('accountsBulk.off.label'), allowed: canEdit, blocker: () => null, confirm: confirmOf('off'),
    runOne: async row => outcomeOf(await legacyDb().rpc('baja_cuenta', { p_id: row.id, p_baja: true })),
    progress: t('accountsBulk.off.progress'), done: t('accountsBulk.off.done') };
}

function deleteAccounts(): BulkAction {
  return { id: 'delete', label: t('accountsBulk.delete.label'), danger: true, allowed: () => levelOf('M') >= DELETE_LEVEL, blocker: () => null, confirm: confirmOf('delete'),
    runOne: async row => outcomeOf(await legacyDb().rpc('eliminar_cuenta', { p_id: row.id }), { historial: t('accountsBulk.delete.history') }),
    progress: t('accountsBulk.delete.progress'), done: t('accountsBulk.delete.done') };
}

export const accountSelection = (): SelectionConfig => ({
  key: 'directorio',
  shape: { table: '#tabla', head: '#thead', rows: '#lista > .trow[data-id]', idKey: 'id' },
  what: () => accounts(),
  one: () => term('medico'),
  actions: () => [assignOwner(), addToPortfolio(), classify(), takeOut(), deleteAccounts()],
  reload: () => { coreLegacy.forgetReadCache(); void searchAccounts(false); },
});
