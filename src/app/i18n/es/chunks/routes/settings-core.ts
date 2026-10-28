/**
 * Spanish texts of the company settings core, the Configuración tree and the route plan card that only the chunk routes uses:
 * they arrive with it (min/chunks/routes.js, plan 7.3, cut F). The rest is in ../../settings-core.ts.
 */
export const settingsCore = {
  plan: {
    planFor: 'Plan para el {date}',
    today: 'Plan de hoy',
    summary: 'Salida de {start} a las {time} · {stops} · vuelta sobre las {back} ·',
    oneStop: '1 parada',
    stops: '{count} paradas',
    changeHours: '⚙ Cambiar horario',
    go: 'Ir',
    seeMap: 'Ver la ruta en el mapa',
    openInNavigator: 'Abrir la ruta en el navegador',
    saveToAgenda: 'Guardar en mi agenda',
    saving: 'Guardando…',
    start: '▶ Empezar ruta',
    close: 'Cerrar',
    saved: '{count} citas guardadas en tu agenda',
  },
  planHours: {
    title: 'Tiempos de {visit}',
    subtitle: 'Se guardan en tus preferencias. La hora de salida y la de vuelta se ponen en cada ruta.',
    perProfessional: 'Minutos por {professional}',
    perStop: 'Minutos fijos por parada',
    saved: 'Horario guardado',
  },
};
