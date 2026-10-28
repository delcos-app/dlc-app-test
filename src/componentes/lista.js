// @ts-check
// componentes/lista.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Las columnas de Cuentas están en src/app/screens/accounts/list (v2.406.0); estos nombres los usan los campos personalizados y la lista
const colsGuardar = c => window.delcos.screens.accounts.saveColumns(c);

// Tablas que se ordenan en la base: qué clave usa cada columna (por su posición o su nombre)
const ORD_SRV = {
  peds2: (i, n) => i === 2 ? 'profesional' : ({ Fecha: 'fecha', Cliente: 'cliente', Comercial: 'comercial', 'Uds.': 'unidades', Base: 'base', Total: 'total', Estado: 'estado' })[n] || null,
  pacs: (i, n) => i === 6 ? 'profesional' : ({ Cliente: 'nombre', Tipo: 'tipo', 'DNI / CIF': 'nif', Email: 'email', 'Población': 'municipio', Comercial: 'comercial', Pedidos: 'pedidos', 'Uds.': 'unidades', 'Último pedido': 'ultimo' })[n] || null
};

const ORD_DIR = { nombre: 'nombre', especialidad: 'especialidad', centro_nombre: 'lugar', municipio: 'municipio', ultima_visita: 'reciente', estado_comercial: 'estado' };

/* ============================================================
   v2.237.0 · Inicio y Agenda aparecen de una vez (aviso de Eric): al abrir la app la primera pantalla se enseñaba
   sin esperar (salían los indicadores antiguos y luego el mosaico) y la Agenda se daba por lista antes de tener la
   cinta y «Tu semana». Inicio enseña desde el principio el esqueleto del mosaico; la Agenda sigue con el cargador hasta tener
   la cinta y «Tu semana» (como mucho 10 s).
   ============================================================ */
// Tope de espera por pantalla: en el móvil con mala cobertura la Agenda encadena varias consultas
const LISTA_ESPERA = { agenda: 10000 };

const LISTA_PARA = {
  // Inicio: el mosaico ya pintado (si la persona no tiene mosaico, basta con que no queden esqueletos)
  inicio: s => !!s.querySelector('#inimos > *') || (!s.classList.contains('conmos') && !s.querySelector('.ksk, .skel') && performance.now() - (s.__t0 || 0) > 1500),
  // Agenda en vista de día: la cinta y «Tu semana» con sus días (o, si no llega, un respiro de 0,8 s tras la cinta)
  // v2.248.0: la vista del día avisa cuando está pintada entera (dataset.listo)
  agenda: s => (typeof AG_MODO !== 'undefined' && AG_MODO !== 'dia') || s.dataset.listo === '1'
};

/* ============================================================
   v2.262.0 · Facturas y Oportunidades ordenadas de verdad (punto 3 del plan del 11/10/2026). Las dos listas traen ya todo el periodo
   elegido (la base filtra por fechas, búsqueda y estado) y se paginaban en la pantalla, pero al pulsar una columna solo se ordenaban
   las filas de la página que se veía. Ahora el orden se aplica a toda la lista del periodo antes de paginar y se vuelve a la primera
   página: es lo más eficiente (los datos ya están en el móvil; no hace falta otra consulta ni cambiar la base). Si algún día una
   empresa tiene miles de facturas en un mismo periodo, se pasaría la paginación a la base.
   ============================================================ */
const ORD_MEM = {
  facts: { fn: 'facturas_lista', campos: ['numero', 'fecha', 'cliente', 'nif', 'base', 'cuota_iva', 'total', 'vencimiento', 'estado_cobro'] },
  llam: { fn: 'llamadas_lista', campos: ['fecha', x => x.cliente || x.nombre, 'importe_estimado', x => x.medico || x.cuenta_texto, x => x.resultado || (x.pedido_id ? window.delcos.t('legacyTexts.lists.orderDone') : ''), 'proxima_fecha', 'usuario'] }
};

// El motor de la barra de listas está en src/app/components/list-bar (v2.421.0). PL, PL_SECC y BLQ son sus mismos objetos (las pruebas
// y el código antiguo leen y cambian sus miembros); estos nombres se quedan: la navegación, el menú, los puentes y las pruebas los usan.
const PL = window.delcos.components.listBar.configs;
const PL_SECC = window.delcos.components.listBar.sections;
const BLQ = window.delcos.components.listBar.blocks;
const TAMANOS = window.delcos.components.listBar.PAGE_SIZES;

// Las piezas comunes de las listas están en src/app/components/list (v2.416.0). Estos nombres se quedan: el motor de la barra
// de listas (PL, plSync), el panel «Filtros y columnas», otras pantallas antiguas y las pruebas los usan.
