/**
 * Cuentas screen, migrated piece by piece (strangler): the account card is an explicit list of sections (v2.401.0) with its base, timetable notice and units in TypeScript (v2.402.0); the list view (search, table, chips: v2.405.0) and the columns model,
 * the map, the editor and the centres are still legacy (src/pantallas/cuentas.js, clientes.js).
 */
export { openAccountCard } from './card';
export { refreshPortal } from './card/sections-portal';
export { searchAccounts } from './list/search';
export { paintHeader as paintAccountsHeader } from './list/table';
