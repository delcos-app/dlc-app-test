// El filtro rápido «Tipo» de Cuentas: en src/app/core/layers/list-glue.ts (v2.424.0).
window.delcos.layers.installAccountTypeFilter();
// La búsqueda de Cuentas está en src/app/screens/accounts/list (v2.405.0); estos nombres se quedan porque los llaman muchos archivos
function buscar(reiniciar) { return window.delcos.screens.accounts.searchAccounts(reiniciar); }
