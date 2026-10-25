// pantallas/concursos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.



/* v2.200.0 · Concursos y contratos (tercera tanda del estudio por sectores, SQL 126). Decisiones de Eric: al ganar un lote, sus precios se
   aplican solos en los pedidos de esa ficha mientras el contrato está en vigor; los días de aviso antes de que venza los elige cada empresa.
   - Menú «Concursos» (en «Ventas»): «En marcha» (en estudio y con la oferta enviada, por fecha límite), «Contratos» (adjudicados, con lo que les queda)
     y «Cerrados»; «+ Nuevo concurso» y, para la administración, «Avisos de vencimiento».
   - Ventana del concurso: datos, estado, fechas del contrato y sus lotes (estado, importes, adjudicatario si se pierde) con los productos
     y precios de cada lote.
   - Pedidos: si la ficha tiene un contrato en vigor, el precio de sus productos es el adjudicado («Precio de concurso»).
   - Ficha: sus concursos. Los avisos de vencimiento abren el concurso. */
let CON_AVISOS = [90, 30];

const conPrecioContrato = p => { const x = p && p.id && PED_PRECIOS.precios[p.id]; return x ? Object.assign({}, p, { precio: +x.precio, contrato: x.concurso }) : p; };

const EQ_CONTRATOS = ['Venta', 'Alquiler', 'Cesión'];

// Concursos está en src/app/screens/tenders (v2.409.0). Estos nombres se quedan: las pestañas y la escucha del cierre de la
// ventana (legado 080), los avisos y enlaces (nucleo/navegacion.js), la ficha, «‹ Volver» y las pruebas los usan.
function pintarConcursos(vista) { return window.delcos.screens.tenders.paintTenders(vista); }
function verConcurso(id) { return window.delcos.screens.tenders.showTender(id); }
