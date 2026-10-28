/**
 * Spanish texts of Comisiones the core uses (part of es.ts). The ones only the chunk commissions uses are in
 * chunks/commissions/commissions.ts and arrive with it (plan 7.3, cut F).
 */
export const commissions = {
  homeCard: {
    yourCommission: 'Tu comisión de {period}',
    yourActivity: 'Tu actividad de {period}',
    units: 'unidades atribuidas',
    accrued: 'comisión acumulada',
    perUnit: 'por unidad en tu tramo',
    nextTier: 'Te faltan <b>{missing}</b> unidades para el siguiente tramo',
    nextTierAmount: ', que pasaría a <b>{amount}</b> por unidad, aplicado a todo el periodo',
    noScheme: 'No tienes comisión asignada: estas unidades solo cuentan para las métricas.',
    topTier: 'Estás en el tramo más alto.',
  },
};
