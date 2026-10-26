/**
 * Facturación: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (FSEC, FAC_ULTIMA, PDF_EDITANDO…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface BillingStore {
  section: string;
  lastSection: string | null;
  pdfEditing: string | null;
  pdfChosen: string | null;
  chosenTemplates: Record<string, unknown>;
}

export const billingStore: BillingStore = {
  section: 'facturas',
  lastSection: 'empresa',
  pdfEditing: null,
  pdfChosen: null,
  chosenTemplates: { pago: null, factura: null },
};

exposeLegacyNames(billingStore, [
  ['FSEC', 'section'],
  ['FAC_ULTIMA', 'lastSection'],
  ['PDF_EDITANDO', 'pdfEditing'],
  ['PDF_ELEGIDO', 'pdfChosen'],
  ['PLANT_ELEGIDA', 'chosenTemplates'],
]);
