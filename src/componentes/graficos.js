// @ts-check
// componentes/graficos.js · los gráficos están en src/app/components/charts (v2.416.0); sus nombres se quedan como adaptadores
// (Analítica, Inicio, la ficha, el portal y Oportunidades los usan). Aquí siguen las reglas de los indicadores de Inicio.


const KPI_DEF = window.delcos.content.defaultIndicators();

// Las reglas de los indicadores de Inicio están en src/app/screens/home/indicator-rules.ts (v2.427.0)
const kpiConfig = () => window.delcos.leftovers.indicatorSettings();

const KPI_CATEGORIA = {
  citas: window.delcos.t('legacyTexts.indicatorGroups.agenda'), citas_7d: window.delcos.t('legacyTexts.indicatorGroups.agenda'), urgentes: window.delcos.t('legacyTexts.indicatorGroups.portfolio'), interesados: window.delcos.t('legacyTexts.indicatorGroups.portfolio'), sin_contactar: window.delcos.t('legacyTexts.indicatorGroups.portfolio'), cartera: window.delcos.t('legacyTexts.indicatorGroups.portfolio'),
  sin_visita_60: window.delcos.t('legacyTexts.indicatorGroups.portfolio'), sin_horario: window.delcos.t('legacyTexts.indicatorGroups.quality'), dups: window.delcos.t('legacyTexts.indicatorGroups.quality'), visitas_sem: window.delcos.t('legacyTexts.indicatorGroups.activity'), visitas_mes: window.delcos.t('legacyTexts.indicatorGroups.activity'),
  visitas_7d: window.delcos.t('legacyTexts.indicatorGroups.activity'), muestras_mes: window.delcos.t('legacyTexts.indicatorGroups.activity'), material_mes: window.delcos.t('legacyTexts.indicatorGroups.activity'), uds_mes: window.delcos.t('legacyTexts.indicatorGroups.salesUnits'), prescriptores: window.delcos.t('legacyTexts.indicatorGroups.salesUnits'),
  nuevos_presc: window.delcos.t('legacyTexts.indicatorGroups.salesUnits'), activos_90: window.delcos.t('legacyTexts.indicatorGroups.salesUnits'), conversion: window.delcos.t('legacyTexts.indicatorGroups.portfolio'), importe_mes: window.delcos.t('legacyTexts.indicatorGroups.salesAmounts'), borradores: window.delcos.t('legacyTexts.indicatorGroups.orders')
};

// Indicadores con icono, explicación breve y, cuando se puede, comparación
const KPI_ICO = { citas: '📅', urgentes: '⚠️', visitas_sem: '📝', visitas_mes: '🗓️', interesados: '✨', sin_contactar: '📇', cartera: '🩺', dups: '🧩',
  sin_visita_60: '⏳', sin_horario: '🕘', uds_mes: '📦', prescriptores: '👥', nuevos_presc: '🌱', activos_90: '🔁', conversion: '📈',
  importe_mes: '€', borradores: '✏️', muestras_mes: '🎁', material_mes: '📚', citas_7d: '📆', visitas_7d: '🧭' };

