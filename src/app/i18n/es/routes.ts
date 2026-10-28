/**
 * Spanish texts of Rutas: «Mis rutas» and the route wizard the core uses (part of es.ts). The ones only the chunk routes uses are
 * in chunks/routes/routes.ts and arrive with it (plan 7.3, cut F).
 */
export const routes = {
  when: {
    none: 'Sin fecha fija',
    oneDay: 'Un día concreto',
    weekly: 'Cada {day}',
    fortnightly: 'Cada 15 días, los {day}',
    monthly: 'El {ordinal} {day} de cada mes',
    /** «El primer lunes de cada mes»… (5 = the last one) */
    ordinals: 'primer,segundo,tercer,cuarto,último',
  },
  name: {
    newRoute: 'Nueva ruta',
    joiner: ' y ',
    andMore: ' y más',
    withDay: '{day} · {zone}',
  },
};
