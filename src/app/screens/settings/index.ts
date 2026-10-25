/**
 * Configuración, part 1 (v2.415.0): Preferencias, Clasificadores, Auditoría, the billing Registro, custom fields and the test
 * environment. The legacy names stay as adapters: the Configuración sections, Facturación, Pedidos, Productos, Clientes, the
 * account card, the Panel delcos and the tests call them by name.
 */
export { paintAudit, paintBillingLog } from './audit';
export { newClassifier, paintClassifiers } from './classifiers';
export { bindCustomFieldFilters, customFieldsHtml, insertCustomFields, loadCustomFields, paintCustomFieldsBlock, readCustomFields, saveCustomFields } from './custom-fields';
export { paintPreferences, paintProfile } from './preferences';
export { bringProduction, paintTestEnvironment, refreshStatus } from './test-environment';
