// @ts-check
// componentes/graficos.js · los gráficos están en src/app/components/charts (v2.416.0); sus nombres se quedan como adaptadores
// (Analítica, Inicio, la ficha, el portal y Oportunidades los usan). Aquí siguen las reglas de los indicadores de Inicio.

/** @param {string[]} meses @param {number[]} a @param {number[] | null | undefined} b @param {string[]} etiquetas */
function svgBarras(meses, a, b, etiquetas) { return window.delcos.components.monthBars(meses, a, b, etiquetas); }
/** @param {number[]} vals @param {[string, ...unknown[]][]} meses */
function anLinea(vals, meses) { return window.delcos.components.sixMonthLine(vals, meses); }
/** @param {any} u @param {string} k */
function sparkUnidades(u, k) { return window.delcos.components.unitsSparkline(u, k); }
/** @param {{ n: string, v: number }[]} items */
function svgDonut(items) { return window.delcos.components.donut(items); }
function graficoCanal() { return window.delcos.components.channelChart(); }
/** @param {string} t */
function vacioGrafico(t) { return window.delcos.components.emptyChart(t); }

const KPI_DEF = window.delcos.content.defaultIndicators();

// Las reglas de los indicadores de Inicio están en src/app/screens/home/indicator-rules.ts (v2.427.0)
const kpiConfig = () => window.delcos.leftovers.indicatorSettings();

const KPI_CATEGORIA = {
  citas: 'Agenda', citas_7d: 'Agenda', urgentes: 'Cartera', interesados: 'Cartera', sin_contactar: 'Cartera', cartera: 'Cartera',
  sin_visita_60: 'Cartera', sin_horario: 'Calidad del dato', dups: 'Calidad del dato', visitas_sem: 'Actividad', visitas_mes: 'Actividad',
  visitas_7d: 'Actividad', muestras_mes: 'Actividad', material_mes: 'Actividad', uds_mes: 'Ventas (unidades)', prescriptores: 'Ventas (unidades)',
  nuevos_presc: 'Ventas (unidades)', activos_90: 'Ventas (unidades)', conversion: 'Cartera', importe_mes: 'Ventas (importes)', borradores: 'Pedidos'
};

// Indicadores con icono, explicación breve y, cuando se puede, comparación
const KPI_ICO = { citas: '📅', urgentes: '⚠️', visitas_sem: '📝', visitas_mes: '🗓️', interesados: '✨', sin_contactar: '📇', cartera: '🩺', dups: '🧩',
  sin_visita_60: '⏳', sin_horario: '🕘', uds_mes: '📦', prescriptores: '👥', nuevos_presc: '🌱', activos_90: '🔁', conversion: '📈',
  importe_mes: '€', borradores: '✏️', muestras_mes: '🎁', material_mes: '📚', citas_7d: '📆', visitas_7d: '🧭' };

function kpiPermitido(c) { return window.delcos.leftovers.indicatorAllowed(c); }
