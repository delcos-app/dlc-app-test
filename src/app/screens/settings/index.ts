/**
 * Configuración, part 1 (v2.415.0): Preferencias, Clasificadores, Auditoría, the billing Registro, custom fields and the test
 * environment. The legacy names stay as adapters: the Configuración sections, Facturación, Pedidos, Productos, Clientes, the
 * account card, the Panel delcos and the tests call them by name.
 * Plan 7.3 (cut D3): the sections are loaded on first use (lazy.ts); the custom fields stay in the core (forms of other screens).
 */
export {
  bringProduction, newClassifier, paintAudit, paintBillingLog, paintClassifiers, paintPreferences, paintProfile, paintTestEnvironment, refreshStatus,
} from './lazy';
export { bindCustomFieldFilters, customFieldsHtml, insertCustomFields, loadCustomFields, paintCustomFieldsBlock, readCustomFields, saveCustomFields } from './custom-fields';
