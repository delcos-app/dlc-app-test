/**
 * Configuración → Clasificadores → one list: the role of each value (plan 12.2, v2.464.0). «Formas de pago» says how each one is
 * collected (PED-3; a new one gets the kind its name suggests); «Resultados de visita», which ones are a report for the account
 * (VIS-2); «Motivos de llamada» and «Origen», the follow-up reason and our own call (PED-5). The roles a list accepts come from the
 * database (catalogos_todos → papeles_valor, SQL 192): without them nothing is shown, so the window stays as before.
 * A value can also have a fixed role of another rule («muestras» of a visit result): it is shown as «Uso fijo» and not changed here.
 * The row shows the role as a line under the name; the value editor (value-editor.ts) has its field.
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import type { ClassifierData, ClassifierValue } from '../../../legacy/settings2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { PAYMENT_KINDS, paymentKindByName, type PaymentKind } from '../../../core/catalog-roles';

const KIND_TEXT: Readonly<Record<PaymentKind, MessageKey>> = {
  transferencia: 'settingsMore.valueRoles.transfer', entrega: 'settingsMore.valueRoles.onDelivery',
  tpv: 'settingsMore.valueRoles.cardTerminal', otra: 'settingsMore.valueRoles.other',
};
/** The roles a single value of its list has: the box of the editor, the line of the row and the help. */
const FLAG_TEXT: Readonly<Record<string, readonly [MessageKey, MessageKey, MessageKey]>> = {
  informe: ['settingsMore.valueRoles.report', 'settingsMore.valueList.reportShort', 'settingsMore.valueEditor.reportHelp'],
  seguimiento: ['settingsMore.valueRoles.followUp', 'settingsMore.valueList.followUpShort', 'settingsMore.valueEditor.followUpHelp'],
  llamada_nuestra: ['settingsMore.valueRoles.ourCall', 'settingsMore.valueList.ourCallShort', 'settingsMore.valueEditor.ourCallHelp'],
};
/** What a fixed role is for (a role of another rule, not chosen in this window). */
const FIXED_TEXT: Readonly<Record<string, MessageKey>> = { muestras: 'settingsMore.valueList.fixedSamples' };

const rolesOf = (classifier: ClassifierData): readonly string[] => classifier.papeles_valor ?? [];
export const isPaymentList = (classifier: ClassifierData): boolean => rolesOf(classifier).includes('transferencia');
export const flagOf = (classifier: ClassifierData): string | undefined => rolesOf(classifier).find(role => role in FLAG_TEXT);
const isKind = (role: string | null | undefined): role is PaymentKind => PAYMENT_KINDS.some(kind => kind === role);
const kindOf = (value: ClassifierValue): PaymentKind => (isKind(value.papel) ? value.papel : paymentKindByName(value.valor));
const words = { theProfessional: (): string => term('medico', { article: 'el' }), theVisit: (): string => term('visita', { article: 'el' }) };
const flagText = (role: string, which: 0 | 1 | 2): string => {
  const key = FLAG_TEXT[role]?.[which];
  return key ? t(key, { theProfessional: words.theProfessional(), theVisit: words.theVisit() }) : '';
};

/** A role of another rule («muestras»): the value keeps it and this window does not change it. */
export const fixedRole = (classifier: ClassifierData, value: ClassifierValue): string | null =>
  (value.papel && !rolesOf(classifier).includes(value.papel) ? value.papel : null);
const fixedWhat = (role: string): string => t(FIXED_TEXT[role] ?? 'settingsMore.valueList.fixedOther');

/** The role a row shows under the name («Cómo se cobra: A la entrega», «Motivo de seguimiento», «Uso fijo: …»), or ''. */
export function valueRoleText(classifier: ClassifierData, value: ClassifierValue): string {
  const fixed = fixedRole(classifier, value);
  if (fixed) return t('settingsMore.valueList.fixedLine', { what: fixedWhat(fixed) });
  if (isPaymentList(classifier)) return t('settingsMore.valueList.paymentShort', { kind: t(KIND_TEXT[kindOf(value)]) });
  const flag = flagOf(classifier);
  return flag && value.papel === flag ? flagText(flag, 1) : '';
}

/** The role the row says in its data (the tests and the editor read it): the payment kind, the role or ''. */
export const valueRoleKey = (classifier: ClassifierData, value: ClassifierValue): string =>
  (isPaymentList(classifier) ? kindOf(value) : value.papel ?? '');

const kindOptions = (selected: PaymentKind): string =>
  PAYMENT_KINDS.map(kind => `<option value="${kind}" ${kind === selected ? 'selected' : ''}>${t(KIND_TEXT[kind])}</option>`).join('');

const help = (text: string): string => `<span class="sm vhelp">${text}</span>`;

/** The role field of the editor: a list for the payment kind, a box for the role of the list, or the fixed role as a line. */
export function roleFieldHtml(classifier: ClassifierData, value: ClassifierValue | null): string {
  const fixed = value ? fixedRole(classifier, value) : null;
  if (fixed) return `<div class="vfield"><span class="vlabel">${t('settingsMore.valueEditor.role')}</span>${help(t('settingsMore.valueEditor.fixedHelp', { what: fixedWhat(fixed) }))}</div>`;
  if (isPaymentList(classifier)) {
    const id = value ? 'verole' : 'cvpapel', how = t('settingsMore.valueRoles.paymentHow');
    return `<div class="vfield"><label for="${id}">${how}</label><select id="${id}">${kindOptions(value ? kindOf(value) : 'otra')}</select>${help(t('settingsMore.valueEditor.paymentHelp'))}</div>`;
  }
  const flag = flagOf(classifier); if (!flag || !value) return '';
  return `<div class="vfield"><label class="vcheck"><input type="checkbox" id="verole" data-papel="${flag}" ${value.papel === flag ? 'checked' : ''}><span>${flagText(flag, 0)}</span></label>${help(flagText(flag, 2))}</div>`;
}

/** The role chosen in the editor, or undefined when it did not change (or the list has no role field). */
export function chosenRole(value: ClassifierValue): string | null | undefined {
  const control = document.getElementById('verole') as HTMLInputElement | HTMLSelectElement | null; if (!control) return undefined;
  const role = control instanceof HTMLInputElement ? (control.checked ? control.dataset.papel ?? null : null) : control.value;
  const before = control instanceof HTMLInputElement ? value.papel ?? null : String(control.dataset.antes ?? '');
  return role === before ? undefined : role;
}

export async function saveRole(id: string, role: string | null): Promise<boolean> {
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_papel_valor', { p_id: id, p_papel: role });
  return !error && data?.ok === true;
}

/** After adding a value: its payment kind (a database without SQL 192 has no list, so nothing is asked). */
export async function saveNewValueRole(id: string | undefined): Promise<void> {
  const select = document.getElementById('cvpapel') as HTMLSelectElement | null;
  if (id && select && !await saveRole(id, select.value)) notices.toast(t('settingsMore.valueRoles.notSaved'), true);
}

/** In the editor: remembers the payment kind it opened with, and proposes «Cómo se cobra» from the name until it is chosen by hand. */
export function bindRoleField(): void {
  const current = document.getElementById('verole') as HTMLSelectElement | null;
  if (current instanceof HTMLSelectElement) current.dataset.antes = current.value;
  const name = document.getElementById('cvnew') as HTMLInputElement | null, kind = document.getElementById('cvpapel') as HTMLSelectElement | null;
  if (!name || !kind) return;
  kind.onchange = (): void => { kind.dataset.elegido = '1'; };
  name.addEventListener('input', () => { if (!kind.dataset.elegido) kind.value = paymentKindByName(name.value); });
}

