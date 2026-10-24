// @ts-check
// servicios/permisos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function puedeVerComo(u) {
  return !!(PERFIL && u && (puede('administrar') || ((PERFIL.areas || {}).U || 0) >= 3) && !suplantando() && u.id !== PERFIL.id && u.activo
    && !rolPuede(u.rol, 'administrar') && (PLAN_ACTUAL.plan === 'medida' || esInvitado(u)));
}

const puede = c => !!(PERFIL && (PERFIL.capacidades || []).includes(c));

const puedeEditar = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).M || 0) >= 2);

const puedeEditarTipo = t => PERFIL && (puede('administrar') || ((PERFIL.areas || {})[t === 'Centro' ? 'C' : 'M'] || 0) >= 2);

const puedeCrearTipo = t => PERFIL && (puede('administrar') || ((PERFIL.areas || {})[t === 'Centro' ? 'C' : 'M'] || 0) >= 3);

const puedeCrear = () => puedeCrearTipo('Persona') || puedeCrearTipo('Centro');

const puedeRegistrar = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).S || 0) >= 2);

const NIVELES = ['Sin acceso', 'Ver', 'Editar', 'Completo'];

// v2.109.0: los clasificadores son un permiso del rol (antes, administrar o nivel 2 en Configuración)
const puedeCatalogos = () => PERFIL && puede('gestionar_clasificadores');

// Crear o cambiar pedidos y pacientes: administración y televenta (el comercial solo consulta lo suyo)
const puedeVentas = () => PERFIL && (puede('administrar') || (((PERFIL.areas || {}).V || 0) >= 2 && puede('televenta')));

const VE_TODO = () => puede('ver_todo');

const puedeMedicoLibre = () => puede('administrar') || nivelDe2('V') >= 2;   // v2.329.0

// v2.117.0: «Entrar como otro usuario» es del plan A medida
const puedeSuplantar = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).U || 0) >= 3) && !suplantando() && PLAN_ACTUAL.plan === 'medida';

const NIVEL_TXT = ['Sin acceso', 'Ver', 'Editar', 'Completo'];

const nivelDe = a => puede('administrar') ? 3 : ((PERFIL.areas || {})[a] || 0);

const puedeCompras = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 3);

const puedeFacturar = () => PERFIL && (puede('administrar') || (VE_TODO() && ((PERFIL.areas || {}).V || 0) >= 2));

const nivelDe2 = a => !PERFIL ? 0 : puede('administrar') ? 3 : +((PERFIL.areas || {})[a] || 0);

const puedeModulo = t => {
  if (!PERFIL) return false;
  if (t === 'facturacion' && !VE_TODO()) return false;
  const a = MODULO_AREA[t];
  return !a || nivelDe2(a) >= 1;
};

const puedeOrganizacion = () => puede('configurar_organizacion') || puede('gestionar_plataforma');

/* v2.212.0 · Decisiones de la auditoría (1).
   - Pedidos: la tarjeta «Pedidos sin atribuir» vuelve a la pestaña Ventas (la pantalla nueva ya no tenía su hueco) para quien
     puede atribuir (administración o nivel 2 en Pedidos, como atribuir_linea).
   - Editar usuario: «Qué ve esa persona» de la comisión sale aparte (usuarioComisionInfo ocultaba la fila entera con el esquema).
   - Duplicados: el botón de Calidad del dato y el indicador de Inicio, también para quien tiene nivel 3 en fichas (como la página). */
const puedeDuplicados = () => puede('administrar') || ((PERFIL && PERFIL.areas) || {}).M >= 3;

const puedeAtribuir = () => puede('administrar') || nivelDe2('V') >= 2;

/* v2.228.0 · Inicio de toda la empresa, en mosaico (decisión de Eric, 10/10/2026: variante «Mosaico» de https://claude.ai/artifact/5UMynF3SKQnJYBVkR6CCk7).
   - Fuera las listas que solo miraban la Agenda (rutas sugeridas, agenda, próximas acciones, urgentes, últimas visitas, Mi semana…). En su lugar,
     un mosaico con piezas de distintos tamaños: «Requiere tu atención» (grande: pagos por validar, facturas vencidas, urgentes, paquetes, stock,
     intervenciones por reponer, concursos que vencen, llamadas, duplicados…; cada línea lleva a su pantalla), Ventas del mes (frente al mes pasado y
     visitas de los últimos 14 días), Tu día (tus citas y tareas), Cobros, Ciclo, Stock, Cartera y Lo que viene (eventos, concursos, intervenciones
     y revisiones de equipos).
   - Cada persona ve solo las áreas de su plan y sus permisos (las mismas del menú) y los importes solo con permiso de importes.
   - Los indicadores de siempre siguen, plegados al final («Ver tus indicadores»), con su configuración.
   - Los números cuentan y las gráficas crecen al llegar, todo a la vez; sin animación con «reducir movimiento».
   - Datos: inicio_areas() (SQL 136) más panel_inicio, inicio_graficas, operativa_pendiente, alertas_stock, ciclo_cuentas y las citas de hoy. */
const verArea = t => { const b = document.querySelector(`nav.main [data-t="${t}"]`); return !!b && !b.classList.contains('hide') && !b.classList.contains('bloq'); };

/* ============================================================
   v2.323.0 · Eliminar productos sin romper el histórico (decisión de Eric; SQL 165). En el producto, «Eliminar producto»:
   si nunca se ha usado se borra; si tiene ventas, compras, lotes, muestras… deja de salir en todas partes pero se conserva
   para el histórico (pedidos, facturas y lotes siguen con su nombre); con stock disponible no deja. Se recupera desde
   Productos → «⋯» → «Productos eliminados».
   ============================================================ */
const puedeEliminarProducto = () => puede('administrar') || nivelDe2('P') >= 2;
