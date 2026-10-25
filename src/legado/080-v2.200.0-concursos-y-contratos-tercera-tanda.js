Object.assign(ICON_NOM, { gavel: '<path d="m14.5 12.5-8 8a2.12 2.12 0 1 1-3-3l8-8"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>' });
ICO_NAV.concursos = 'gavel'; ICO_MOD.concursos = svgIco(ICON_NOM.gavel);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (g && !g.items.includes('concursos')) g.items.splice(g.items.indexOf('ventas') + 1, 0, 'concursos'); })();
function aplicarPermisosMenuBase10(...a) { try { menuConcursos(); } catch (e) {} const r = aplicarPermisosMenuBase9.apply(this, a); try { menuConcursos(); } catch (e) {} return r; }
PAGINAS.concursos = { t: 'Concursos', permiso: () => !ES_MEDICO() && puedeModulo('ventas'),
  tabs: [['marcha', 'En marcha', () => pintarConcursos('marcha')], ['contratos', 'Contratos', () => pintarConcursos('contratos')], ['cerrados', 'Cerrados', () => pintarConcursos('cerrados')]] };
Object.defineProperty(PAGINAS.concursos, 'd', { get: () => 'Pliegos, lotes adjudicados y contratos con sus precios y vencimientos' });




$('dlg').addEventListener('close', () => { if (TAB === 'concursos' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'concursos') pintarConcursos(PAG_TAB.concursos || 'marcha'); }, 300); });


try { menuConcursos(); } catch (e) {}

/* v2.201.0 · Parque instalado (última pieza de la tercera tanda del estudio por sectores, SQL 127). Decisiones de Eric: los equipos se dan de
   alta a mano en la ficha o al servir un pedido de un producto «equipo», con su número de serie; los avisos de vencimiento usan los días de la empresa.
   - Producto: «Es un equipo» y «Revisión cada N meses».
   - Menú «Parque instalado» (en «Ventas»): revisiones que tocan en 30 días, contratos y garantías que vencen, y todos los equipos (buscador).
   - Ventana del equipo: datos, contrato o garantía, revisiones (con «Apuntar revisión» y «Programar en la agenda») y retirarlo.
   - Ficha: «Equipos instalados» con «+ Equipo». Pedido validado con productos «equipo»: «Dar de alta los equipos» con su número de serie.
   Además (decisión de Eric en Web delcos): Intervenciones, Material en depósito, Concursos y Parque instalado, en los planes Empresa y A medida. */
Object.assign(PLAN_SECCIONES, { cirugias: ['empresa', 'medida'], deposito: ['empresa', 'medida'], concursos: ['empresa', 'medida'], parque: ['empresa', 'medida'] });
['cirugias', 'concursos'].forEach(k => { const o = PAGINAS[k].permiso; PAGINAS[k].permiso = () => o() && planIncluyeSeccion(k); });
Object.assign(ICON_NOM, { monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' });
ICO_NAV.parque = 'monitor'; ICO_MOD.parque = svgIco(ICON_NOM.monitor);
(() => { const g = MENU_GRUPOS.find(x => x.id === 'ventas'); if (g && !g.items.includes('parque')) g.items.splice(g.items.indexOf('concursos') + 1, 0, 'parque'); })();
function aplicarPermisosMenuBase11(...a) { try { menuParque(); } catch (e) {} const r = aplicarPermisosMenuBase10.apply(this, a); try { menuParque(); } catch (e) {} return r; }
PAGINAS.parque = { t: 'Parque instalado', permiso: () => !ES_MEDICO() && puedeModulo('ventas') && planIncluyeSeccion('parque'), tabs: [['lista', 'Equipos', () => pintarParque()]] };
Object.defineProperty(PAGINAS.parque, 'd', { get: () => 'Equipos instalados con su número de serie, contrato, garantía y revisiones' });



$('dlg').addEventListener('close', () => { if (TAB === 'parque' && $('cfgcuerpo')) setTimeout(() => { if (!$('dlg').open && TAB === 'parque') pintarParque(); }, 300); });




try { menuParque(); candadoSecciones(); } catch (e) {}
/* v2.203.0 · Arreglos de la auditoría del manual (SQL 128). Lo que encontró la revisión de cada pantalla:
   - Notificaciones: los avisos de intervenciones, contratos y equipos se pueden elegir (al momento, en el resumen o nada) como los demás.
   - Los avisos de la suscripción y del plan abren «Plan y suscripción»; los de la plataforma, el Panel delcos.
   - Usuarios y roles: tras guardar o borrar un usuario se repinta esta página (antes, la antigua de Administración).
   - Editar una visita: también cómo fue (presencial, teléfono, videollamada) y los productos presentados.
   - El buscador de arriba usa el vocabulario de la empresa.
   Además, arreglos en su sitio: «Guardar filtro» en el panel de filtros, textos que mandaban a menús que ya no existen, «Portal del centro» en el
   origen de Pedidos, anular un pedido facturado, «Configuración» de Facturación solo para administración, trazabilidad legible, «Ventas del mes»
   solo con ventas, «Planificar» una sola vez, métricas de la Agenda con el vocabulario, muestras solo en fichas de persona y los errores
   de intervenciones con su texto. */
TIPOS_NOTIF.push(
  ['reposicion_cirugia', '🔄', 'Reposiciones de intervención', 'Cuando pasan 48 horas de una intervención sin reponer lo usado'],
  ['vence_contrato', '📜', 'Contratos que vencen', 'Antes de que venza un contrato de concurso, con los días que elige la empresa'],
  ['vence_equipo', '⏳', 'Equipos: contrato o garantía', 'Antes de que venza el contrato o la garantía de un equipo instalado'],
  ['revision_equipo', '📆', 'Revisiones de equipos', 'Cuando toca revisar un equipo en los próximos 7 días o ya ha pasado la fecha']
);
(() => {
  const a = NOTIF_AREAS.find(x => x[0] === 'cobros'); if (a) a[2].push('reposicion_cirugia', 'vence_contrato', 'vence_equipo', 'revision_equipo');
  NOTIF_DIARIOS.push('reposicion_cirugia', 'vence_contrato', 'vence_equipo', 'revision_equipo');
  Object.assign(EXPLICA_NOTIF, {
    reposicion_cirugia: ['Una intervención hecha lleva más de 48 horas sin reponer lo que se usó en su almacén (depósito del centro o el de quien asistió).', 'Abre la intervención y pulsa «Reponer ahora».'],
    vence_contrato: ['Un contrato adjudicado de un concurso vence pronto. Avisa una vez por cada plazo que elige la administración (de partida, 90 y 30 días).', 'Prepara la renovación o pide la prórroga.'],
    vence_equipo: ['Vence el contrato (alquiler o cesión) o la garantía de un equipo instalado.', 'Habla con el centro para renovarlo o retirarlo.'],
    revision_equipo: ['A un equipo instalado le toca la revisión periódica en los próximos 7 días, o ya ha pasado la fecha.', 'Programa la revisión en la agenda y apúntala al hacerla.']
  });
})();


async function cargarAdmin(...a) {
  if (TAB === 'usuarios' && PAGINAS.usuarios) { cargarPagina('usuarios'); return; }
  if (TAB === 'config' && ['usuarios', 'roles'].includes(CFG_KEY)) { cargarConfig(); return; }
  if (!$('v-admin')) return;
  return cargarAdminBase.apply(this, a);
}


// El buscador de arriba, con el vocabulario de la empresa
function aplicarPermisosMenu(...a) {
  const r = aplicarPermisosMenuBase11.apply(this, a);
  try { const q = $('q'); if (q && /^Buscar /.test(q.placeholder)) q.placeholder = `Buscar ${TT('medico', 's', '', 'l', 'l')}, centro o municipio`; } catch (e) {}
  return r;
}
// v2.242.0: aquí iba la primera versión de abrirManual (se redefine entera más abajo)
document.addEventListener('click', e => {
  const b = e.target.closest('#manbtn'); if (!b || ES_MEDICO()) return;
  e.stopImmediatePropagation(); e.preventDefault();
  document.querySelectorAll('.umenu, #umenu').forEach(m => m.classList.add('hide'));
  abrirManual(MANUAL_ANCLA[TAB] || '');
}, true);

/* v2.205.0 · Manual: capítulo «La visita y lo común». El «?» de Ciclo de visitas y de Intervenciones lleva a su sección del capítulo
   (MANUAL_ANCLA, editado en su sitio), y el material de cada visita ya no repite los resultados sin dato (detTxt, editado en su sitio). */

/* v2.206.0 · Manual: capítulo «Cartera». El «?» del directorio, Calidad del dato, Duplicados y Eventos lleva a su sección
   (MANUAL_ANCLA, editado en su sitio). */

/* v2.207.0 · Manual: capítulo «Ventas». El «?» de Pedidos (y Oportunidades, Compras y Proveedores), Clientes, Concursos y Parque instalado
   lleva a su sección (MANUAL_ANCLA, editado en su sitio). */

/* v2.208.0 · Manual: capítulo «Oficina y resultados». El «?» de Productos, Facturación y Analítica lleva a su sección
   (MANUAL_ANCLA, editado en su sitio). */

/* v2.209.0 · Manual: capítulo «Configuración y cuenta» (el último). El «?» de Configuración, Mi perfil, Organización y Usuarios y roles
   lleva a su sección (MANUAL_ANCLA, editado en su sitio). */

/* v2.210.0 · Detalles vistos al grabar el manual.
   - El título del directorio usa siempre el nombre del módulo (antes salía «Médicos» si la cabecera se pintaba después de aplicarEtiqueta, editada en su sitio).
   - «Cerca de mí»: la distancia entera y el vocabulario de la empresa (pintarCerca, editada en su sitio); cobertura por producto y «Rectificar» en el estilo. */

