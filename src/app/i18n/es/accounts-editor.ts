/**
 * Spanish texts of the account editor, the saved filters, the portfolio and the bar of Cuentas the core uses (part of es.ts). The
 * ones only the chunk accounts uses are in chunks/accounts/accounts-editor.ts and arrive with it (plan 7.3, cut F).
 */
export const accountsEditor = {
  account: 'Cuenta',
  newAccount: 'Nueva cuenta',
  picker: {
    code: 'Código {code}',
    remove: 'Quitar',
    placeholder: 'Busca por nombre, centro o municipio',
    searchingAccounts: 'Buscando {professionals}…',
    searching: 'Buscando…',
    back: '← Volver a los resultados',
    shown: ' (se muestran {count})',
    noAccounts: 'Sin {professionals}.',
    couldNotSearch: 'No se ha podido buscar. Revisa la conexión.',
    noResults: 'Sin resultados para «{query}».',
    towns: 'Municipios',
    centres: 'Centros',
    seeList: '{count} {professionals} · ver la lista',
  },
  filters: {
    urgent: 'urgentes',
    mine: 'de mi cartera',
    notVisited: 'sin visitar',
    noSalesperson: 'sin comercial',
    of: 'de {name}',
    aSalesperson: 'un comercial',
    all: 'Todos {all}',
    allProvinces: 'Todas las provincias',
    allStates: 'Todos los estados',
    allTowns: 'Todos los municipios',
  },
  bar: {
    createNew: 'Crear nuevo',
    seeMap: 'Ver en el mapa',
    seeList: 'Ver la lista',
    filtersColumns: 'Filtros y columnas',
  },
};
