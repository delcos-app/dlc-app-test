/* ============================================================
   v2.302.0 · Alta y edición de un centro con su propio formulario (aviso de Eric: al crear un centro salía el de un
   profesional, con «consultas» y un selector de centro dentro). Para una ficha de tipo Centro: nombre, teléfono, email,
   contacto y nota, y debajo su dirección (calle, código postal, población, provincia), cómo llegar y su horario de atención.
   Sin consultas ni planta/sala. Se guarda como la ubicación principal de la ficha, situada en el mapa al guardar.
   ============================================================ */

// El formulario de un centro está en src/app/screens/accounts/editor-form/centre-account.ts (v2.419.0).
// v2.304.0: el filtro rápido «Tipo» de Cuentas
if ($('ftipo')) $('ftipo').addEventListener('change', e => { F.tipo = e.target.value; buscar(true); });
// La búsqueda de Cuentas está en src/app/screens/accounts/list (v2.405.0); estos nombres se quedan porque los llaman muchos archivos
function buscar(reiniciar) { return window.delcos.screens.accounts.searchAccounts(reiniciar); }
function cabeceraTabla() { window.delcos.screens.accounts.paintAccountsHeader(); }


