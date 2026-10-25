/**
 * Whether a number field is a VAT percentage (it then becomes the VAT list): by its id, its data-f and its label, never an amount.
 * Once decided it does not change, so the check and the conversion never contradict each other. Migrated from the legacy
 * esPorcentajeIva (v2.417.0); the name stays as an adapter (legado 058 converts the fields).
 */
import { amountFieldPattern } from '../../../legacy/orders2-bridge';

const AMOUNT_LABEL = /importe|precio|total|base|coste/i;
const VAT_LABEL = /^IVA(\s*\(%\)|\s+del servicio(\s*\(%\))?|\s+%)?$|tipo de iva/i;

/** The label of the field (it may already point at the VAT list, id + «_sel», if the field was converted before). */
function labelOf(input: HTMLInputElement): string {
  const byId = input.id ? document.querySelector(`label[for="${input.id}"]`) ?? document.querySelector(`label[for="${input.id}_sel"]`) : null;
  return (byId ?? input.closest('label'))?.textContent?.trim() ?? '';
}

export function isVatPercentField(input: HTMLInputElement): boolean {
  if (input.dataset.ivaok) return input.dataset.ivaok === '1';
  const label = labelOf(input), key = `${input.id} ${input.dataset.f ?? ''} ${input.name}`;
  const isAmount = amountFieldPattern().test(key) || AMOUNT_LABEL.test(label);
  const isVat = input.dataset.f === 'iva' || /(^|[_-])iva$/i.test(input.id) || /^[a-z]{0,3}iva$|^penvv$/i.test(input.id) || VAT_LABEL.test(label);
  const result = !isAmount && isVat;
  input.dataset.ivaok = result ? '1' : '0';
  return result;
}
