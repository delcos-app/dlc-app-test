/**
 * Spanish texts of Cuentas the core uses (part of es.ts). The ones only the chunk accounts uses are in
 * chunks/accounts/accounts.ts and arrive with it (plan 7.3, cut F).
 */
export const accounts = {
  columns: {
    centre: 'Centro',
    town: 'Municipio',
    address: 'Dirección',
    phone: 'Teléfono',
    days: 'Días',
    state: 'Estado',
    salesReps: 'Comerciales',
    access: 'Acceso a la plataforma',
  },
  // v2.474.0 (D-051): the portal icon next to a professional (Pedidos) and its bubble
  portalStatus: {
    title: 'Portal',
    label: 'Portal de {name}: {state}',
    active: 'Activo',
    disabled: 'Desactivado',
    lastConnection: 'Última conexión: {when} ({date})',
    today: 'hoy',
    yesterday: 'ayer',
    daysAgo: 'hace {days} días',
    never: 'Nunca se ha conectado',
  },
} as const;
