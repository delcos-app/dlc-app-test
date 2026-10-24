// @ts-check
// servicios/planes.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

const verImportes = () => nivelDe2('E') >= 1;

// Qué permiso abre cada módulo
const MODULO_AREA = { inicio: 'H', agenda: 'G', rutas: 'R', directorio: 'M', pacientes: 'L', productos: 'P', seguimiento: 'Q',
  ventas: 'V', analitica: 'A', facturacion: 'F' };

let PLAN_ACTUAL = { plan: 'medida' };   // v2.117.0: hasta que llega el de la base, el completo

const planDe = id => PLANES.find(p => p.id === id) || PLANES[3];

// v2.165.0: sin Facturación en el plan pero con facturas, se entra en solo consulta (facConsulta, al final)
const planIncluye = mod => !(mod in MODULO_AREA) || planDe(PLAN_ACTUAL.plan).modulos.includes(mod) || (mod === 'facturacion' && facConsulta());

const planMinimo = mod => PLANES.find(p => p.modulos.includes(mod));

const tiposDeMiRol = () => TIPOS_NOTIF.filter(t => puede('aviso_' + t[0]));

// Filas de la comparativa: [nombre, detalle, planes que lo incluyen]
const PLAN_FILAS = () => {
  const T = ['campo', 'comercial', 'empresa', 'medida'], C = ['comercial', 'empresa', 'medida'], E = ['empresa', 'medida'], M = ['medida'];
  const med = TT('medico', 'p', '', 'l', 'l'), vis = TT('visita', 'p', '', 'l', 'l'), pac = TT('paciente', 'p', '', 'l', 'l');
  return [
    ['Campo', null],
    [`Cartera de ${med} y centros`, 'Fichas con su historial, horarios, estado comercial y tus campos', T],
    [`Agenda, «Tu día» y registro de ${vis}`, 'Tu día, tu semana y tu mes en una pantalla, con sugerencias', T],
    ['Rutas y planificación semanal', 'Rutas propuestas cada mañana, a tu agenda con un clic', T],
    [`Ciclo de ${vis} A/B/C`, `Cada ficha en A, B o C con sus ${vis} por ciclo, y a quién le faltan`, T],   // v2.199.0
    ['Muestras y material', `Lo que entregas en cada ${TT('visita', 's', '', 'l', 'l')}, por almacén`, T],
    ['Calidad del dato y duplicados', 'Qué le falta a cada ficha y fichas repetidas, para unirlas', T],
    ['Notificaciones', 'Por día y con su acción; cada persona elige qué y cuándo', T],
    ['Usuarios, roles y permisos', 'Cada persona ve lo suyo y ordena su propio menú', T],
    ['Importar datos', 'Desde Excel o CSV, con vista previa', T],
    ['Venta', null],
    ['Pedidos, televenta y clientes', `Nueva venta: llamada y pedido en un paso; ${pac} y empresas con su historial`, C],
    ['Pedidos web y pagos', 'Lo que entra por tu web, con referencia y justificante del pago', C],
    ['Oportunidades', 'Cada venta, se cierre o no, con sus métricas', C],   // v2.158.0: incluida desde Comercial
    ['Cobertura de cada producto por ciclo', `Qué productos han oído tus ${med} de A, B y C en sus ${vis}`, C],   // v2.199.0
    ['Eventos e informe de gastos', 'Talleres, cursos y congresos con sus asistentes y el informe anual', C],   // v2.199.0
    ['Productos y stock por lotes', 'Catálogo, lotes, caducidades y almacenes', C],
    ['Analítica', 'Indicadores por áreas comparados con el periodo anterior, y explorar tus datos', C],
    ['Comisiones por tramos', 'Esquemas y liquidaciones de cada mes', C],
    ['Oficina', null],
    ['Facturación con VeriFactu y cobros', 'Series, rectificativas y el registro de cada factura', E],
    ['Compras, proveedores y trazabilidad', 'Lo enviado, lo que está en camino y lo recibido', E],
    ['Material en depósito', 'Lo que tienes en cada centro, lo usado y su reposición', E],   // v2.201.0
    ['Intervenciones con lote y número de serie', 'Programación, lo usado por unidad, pedido y reposición en 48 horas', E],   // v2.201.0
    ['Concursos y contratos', 'Pliegos, lotes adjudicados y precios de contrato en los pedidos', E],   // v2.201.0
    ['Parque instalado', 'Equipos con su número de serie, contrato, garantía y revisiones', E],   // v2.201.0
    ['Zonas, supervisión del equipo y auditoría', 'Historial de cambios de cada ficha, con deshacer', E],
    ['Servicio', null],
    ['Migración de tus datos', 'Y conexión con tu programa de gestión', M],
    ['Soporte prioritario', null, M]
  ];
};

/* v2.158.0 · Oportunidades y el portal entran en los planes (decisión de Eric, 3/10/2026; los precios no cambian). Oportunidades en
   Comercial, Empresa y A medida; el portal del profesional y del centro en Empresa (hasta 50) y A medida (sin límite). El plan los
   activa y el botón «Extras» del panel delcos queda para excepciones (tiene_extra, SQL 99, hace lo mismo en la base). */
const PLAN_EXTRAS = { oportunidades: ['comercial', 'empresa', 'medida'], portal: ['empresa', 'medida'] };

/* v2.163.0 · Compras y Proveedores son del plan Empresa (y A medida): en Campo y Comercial salen con candado y explican cómo
   conseguirlos, igual que Facturación. Con el plan A medida no se contrata ni se cambia en línea (presupuesto: lo lleva delcos). */
const PLAN_SECCIONES = { compras: ['empresa', 'medida'], proveedores: ['empresa', 'medida'] };

const planIncluyeSeccion = t => !(t in PLAN_SECCIONES) || PLAN_SECCIONES[t].includes(PLAN_ACTUAL.plan);

const PLAN_NOMBRE = () => { try { return planDe(PLAN_ACTUAL.plan).nombre; } catch (e) { return ''; } };

const rangoPlan = k => ['campo', 'comercial', 'empresa', 'medida'].indexOf(k);

// Igual que la función «pagos»: plan menor, menos usuarios o de anual a mensual
const esBajada = (de, a) => rangoPlan(a.plan) < rangoPlan(de.plan)
  || (rangoPlan(a.plan) === rangoPlan(de.plan) && (+a.usuarios < +de.usuarios || (de.pago === 'anual' && a.pago === 'mensual')));
