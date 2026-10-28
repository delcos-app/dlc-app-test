/**
 * Spanish texts of the Rutas planner, today's map, the route bar and the Agenda traffic that only the chunk agenda uses: they
 * arrive with it (min/chunks/agenda.js, plan 7.3, cut F). The rest is in ../../routes-more.ts or in other chunks.
 */
export const routesMore = {
  agenda: {
    startRoute: '▶ Empezar ruta',
    startRouteTitle: 'Inicia la jornada y abre la navegación hacia la primera parada',
    fullRoute: 'Ruta completa',
    fullRouteTitle: 'Abre todas las paradas del día en el navegador, en orden',
  },
  traffic: {
    calculating: 'Calculando…',
    calculate: 'Calcular con tráfico',
    calculateTitle: 'Una petición al servicio de rutas: horas por las calles y con el tráfico de ahora',
    real: 'Con tráfico real',
    realTitle: 'Horas calculadas por las calles y con el tráfico de ahora (TomTom)',
    approximate: '{reason}: las horas siguen siendo aproximadas',
  },
};
