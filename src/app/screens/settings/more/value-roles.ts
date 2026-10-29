/**
 * Configuración → Clasificadores → one list: the role of each value (plan 12.2, v2.464.0). «Formas de pago» says how each one is
 * collected (PED-3; a new one gets the kind its name suggests); «Resultados de visita», which ones are a report for the account
 * (VIS-2); «Motivos de llamada» and «Origen», the follow-up reason and our own call (PED-5). The roles a list accepts come from the
 * database (catalogos_todos → papeles_valor, SQL 192): without them nothing is shown, so the window stays as before.
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import type { ClassifierData, ClassifierValue } from '../../../legacy/settings2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { PAYMENT_KINDS, paymentKindByName, type PaymentKind } from '../../../core/catalog-roles';

const KIND_TEXT: Readonly<Record<PaymentKind, MessageKey>> = {
  transferencia: 'settingsMore.valueRoles.transfer', entrega: 'settingsMore.valueRoles.onDelivery',
  tpv: 'settingsMore.valueRoles.cardTerminal', otra: 'settingsMore.valueRoles.other',
};
/** The roles a single value of its list has (a box each). */
const FLAG_TEXT: Readonly<Record<string, MessageKey>> = {
  informe: 'settingsMore.valueRoles.report', seguimiento: 'settingsMore.valueRoles.followUp', llamada_nuestra: 'settingsMore.valueRoles.ourCall',
};

const rolesOf = (classifier: ClassifierData): readonly string[] => classifier.papeles_valor ?? [];
const isPaymentList = (classifier: ClassifierData): boolean => rolesOf(classifier).includes('transferencia');
const flagOf = (classifier: ClassifierData): string | undefined => rolesOf(classifier).find(role => role in FLAG_TEXT);
const isKind = (role: string | null | undefined): role is PaymentKind => PAYMENT_KINDS.some(kind => kind === role);
const kindOf = (value: ClassifierValue): PaymentKind => (isKind(value.papel) ? value.papel : paymentKindByName(value.valor));
const flagText = (role: string): string => {
  const key = FLAG_TEXT[role];
  return key ? t(key, { theProfessional: term('medico', { article: 'el' }) }) : '';
};

const kindOptions = (selected: PaymentKind): string =>
  PAYMENT_KINDS.map(kind => `<option value="${kind}" ${kind === selected ? 'selected' : ''}>${t(KIND_TEXT[kind])}</option>`).join('');

/** Read only: the role of a value as a line under its name. */
export function valueRoleText(classifier: ClassifierData, value: ClassifierValue): string {
  if (isPaymentList(classifier)) return `<span class="sm">${t('settingsMore.valueRoles.paymentHow')}: ${t(KIND_TEXT[kindOf(value)])}</span>`;
  const flag = flagOf(classifier);
  return flag && value.papel === flag ? `<span class="sm">${flagText(flag)}</span>` : '';
}

/** Who can edit: a list for the payment kind, or a box for the role of the list (off when the value has another role, «muestras»). */
export function valueRoleControl(classifier: ClassifierData, value: ClassifierValue): string {
  const how = t('settingsMore.valueRoles.paymentHow');
  if (isPaymentList(classifier)) return `<select data-vpapel="${value.id}" title="${how}" aria-label="${how} · ${escapeHtml(value.valor)}">${kindOptions(kindOf(value))}</select>`;
  const flag = flagOf(classifier); if (!flag) return '';
  const on = value.papel === flag, taken = Boolean(value.papel) && !on;
  return `<label class="chk"><input type="checkbox" data-vpapel="${value.id}" data-papel="${flag}" ${on ? 'checked' : ''} ${taken ? 'disabled' : ''}><span>${flagText(flag)}</span></label>`;
}

/** «Cómo se cobra» next to «Nuevo valor» of the payment methods: proposed from the name until it is chosen by hand. */
export function newValueRole(classifier: ClassifierData): string {
  if (!isPaymentList(classifier)) return '';
  const how = t('settingsMore.valueRoles.paymentHow');
  return `<select id="cvpapel" title="${how}" aria-label="${how}">${kindOptions('otra')}</select>`;
}

async function saveRole(id: string, role: string | null): Promise<boolean> {
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_papel_valor', { p_id: id, p_papel: role });
  return !error && data?.ok === true;
}

/** After adding a value: its payment kind (a database without SQL 192 has no list, so nothing is asked). */
export async function saveNewValueRole(id: string | undefined): Promise<void> {
  const select = document.getElementById('cvpapel') as HTMLSelectElement | null;
  if (id && select && !await saveRole(id, select.value)) notices.toast(t('settingsMore.valueRoles.notSaved'), true);
}

/** Binds the role controls of the list and the proposal of «Cómo se cobra»; `refresh` paints the list again. */
export function bindValueRoles(body: HTMLElement, refresh: () => Promise<void>): void {
  body.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-vpapel]').forEach(control => {
    control.onchange = async (): Promise<void> => {
      const role = control instanceof HTMLInputElement ? (control.checked ? control.dataset.papel ?? null : null) : control.value;
      const saved = await saveRole(control.dataset.vpapel ?? '', role);
      notices.toast(t(saved ? 'settingsMore.valueRoles.saved' : 'settingsMore.valueRoles.notSaved'), !saved);
      await refresh();
    };
  });
  const name = document.getElementById('cvnew') as HTMLInputElement | null, kind = document.getElementById('cvpapel') as HTMLSelectElement | null;
  if (!name || !kind) return;
  kind.onchange = (): void => { kind.dataset.elegido = '1'; };
  name.addEventListener('input', () => { if (!kind.dataset.elegido) kind.value = paymentKindByName(name.value); });
}
