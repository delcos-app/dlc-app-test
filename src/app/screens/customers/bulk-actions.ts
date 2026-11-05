/**
 * Clientes: what can be done to several customers at once (D-048, v2.472.0): assign them to a professional (chosen once), take them
 * out (baja) and delete them. Each one calls the same function as the customer's card, once per customer; the database checks the
 * permission again and only deletes the ones without orders or invoices (the others are skipped: they can be taken out instead).
 */
import { legacyDb, term } from '../../legacy/bridge';
import { coreLegacy } from '../../legacy/core-bridge';
import { askWith } from '../../components/dialogs';
import { canSell, levelOf } from '../../core/permissions';
import { t } from '../../i18n';
import { formatNumber } from '../../services/format';
import { outcomeOf } from '../../components/list-bar/selection/outcome';
import type { Answer, BulkAction, Confirmation, SelectionConfig } from '../../components/list-bar/selection/types';
import { pickAccount } from '../accounts/account-picker';
import { listCustomers } from './list';

const ASSIGN_LEVEL = 2, DELETE_LEVEL = 3;

const customers = (): string => term('paciente', { number: 'p' });
const count = (value: number): string => formatNumber(value);

/** The professional to assign, chosen once with the same picker as the forms. */
function askProfessional(): Promise<Answer | null> {
  const professional = term('medico');
  return askWith<Answer>(t('customersBulk.assign.title', { professional }), t('customersBulk.assign.ask', { professional }), slot => {
    let chosen: Answer | null = null;
    pickAccount(slot, { placeholder: t('customersBulk.assign.pick', { professional }), alElegir: account => { chosen = account ? { value: account.id, label: account.nombre ?? '' } : null; } });
    setTimeout(() => { slot.querySelector('input')?.focus(); }, 0);
    return () => chosen;
  }, t('customersBulk.assign.next'));
}

const confirmOf = (key: 'off' | 'delete') => (total: number, skipped: string): Confirmation =>
  ({ titulo: t(`customersBulk.${key}.title`), texto: t(`customersBulk.${key}.text`, { count: count(total), customers: customers() }) + skipped, ok: t(`customersBulk.${key}.ok`, { count: count(total) }) });

function assignProfessional(): BulkAction {
  const professional = term('medico');
  return { id: 'assign', label: t('customersBulk.assign.label', { professional }), allowed: () => levelOf('V') >= ASSIGN_LEVEL, blocker: () => null, ask: askProfessional,
    confirm: (total, skipped, answer) => ({ titulo: t('customersBulk.assign.title', { professional }), texto: t('customersBulk.assign.text', { count: count(total), customers: customers(), name: answer?.label ?? '' }) + skipped, ok: t('customersBulk.assign.ok', { count: count(total) }) }),
    runOne: async (row, answer) => outcomeOf(await legacyDb().rpc('asignar_cuenta_cliente', { p_contacto: row.id, p_medico: answer?.value ?? null })),
    progress: t('customersBulk.assign.progress'), done: t('customersBulk.assign.done') };
}

function takeOut(): BulkAction {
  return { id: 'off', label: t('customersBulk.off.label'), allowed: canSell, blocker: () => null, confirm: confirmOf('off'),
    runOne: async row => outcomeOf(await legacyDb().rpc('baja_cliente', { p_id: row.id, p_baja: true })),
    progress: t('customersBulk.off.progress'), done: t('customersBulk.off.done') };
}

function deleteCustomers(): BulkAction {
  return { id: 'delete', label: t('customersBulk.delete.label'), danger: true, allowed: () => levelOf('V') >= DELETE_LEVEL, blocker: () => null, confirm: confirmOf('delete'),
    runOne: async row => outcomeOf(await legacyDb().rpc('eliminar_cliente', { p_id: row.id }), { historial: t('customersBulk.delete.history') }),
    progress: t('customersBulk.delete.progress'), done: t('customersBulk.delete.done') };
}

export const customerSelection = (): SelectionConfig => ({
  key: 'pacientes',
  shape: { table: '#paclista .dgrid', head: '#paclista .dgrid > .dh', rows: '#paclista .dgrid > .dr[data-pac]', idKey: 'pac' },
  what: () => customers(),
  one: () => term('paciente'),
  actions: () => [assignProfessional(), takeOut(), deleteCustomers()],
  reload: () => { coreLegacy.forgetReadCache(); void listCustomers(); },
});
