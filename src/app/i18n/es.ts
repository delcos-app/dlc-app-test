/**
 * Spanish texts (default language). Every user-facing text lives here, under a dotted key; code never writes texts inline.
 * Other languages (en.ts, ca.ts…) must define the same keys: the `Messages` type makes the compiler check it.
 * Business words (profesional, visita, cliente…) are written with {placeholders} and resolved per company by the vocabulary
 * (see i18n/index.ts), so each company sees its own words.
 */
import { accounts } from './es/accounts';
import { legacyTexts } from './es/legacy-texts';
import { settingsCore } from './es/settings-core';
import { leftovers } from './es/leftovers';
import { billingMore } from './es/billing-more';
import { productsMore } from './es/products-more';
import { navigationCore } from './es/navigation-core';
import { core } from './es/core';
import { legacyC } from './es/legacy-c';
import { legacyD } from './es/legacy-d';
import { legacyB } from './es/legacy-b';
import { legacyA } from './es/legacy-a';
import { settingsShell } from './es/settings-shell';
import { listBar } from './es/list-bar';
import { settingsRest } from './es/settings-rest';
import { panels } from './es/panels';
import { accountsEditor } from './es/accounts-editor';
import { routesMore } from './es/routes-more';
import { accountsMore } from './es/accounts-more';
import { homeMore } from './es/home-more';
import { settingsExtra } from './es/settings-extra';
import { ordersMore } from './es/orders-more';
import { listComponents } from './es/list-components';
import { components } from './es/components';
import { settingsMore } from './es/settings-more';
import { settings } from './es/settings';
import { access } from './es/access';
import { agendaMore } from './es/agenda-more';
import { accountsMap } from './es/accounts-map';
import { routes } from './es/routes';
import { orders } from './es/orders';
import { products } from './es/products';
import { billing } from './es/billing';
import { platform } from './es/platform';
import { portal } from './es/portal';
import { analytics } from './es/analytics';
import { visit } from './es/visit';
import { commissions } from './es/commissions';
import { customers } from './es/customers';
import { opportunities } from './es/opportunities';
import { quality } from './es/quality';
import { manual } from './es/manual';
import { importing } from './es/importing';
import { purchases } from './es/purchases';
import { tenders } from './es/tenders';
import { equipment } from './es/equipment';
import { agenda } from './es/agenda';
import { events } from './es/events';
import { surgeries } from './es/surgeries';
import { cycle } from './es/cycle';

export const es = {
  equipment,
  tenders,
  purchases,
  importing,
  manual,
  quality,
  opportunities,
  customers,
  commissions,
  visit,
  analytics,
  portal,
  platform,
  billing,
  products,
  orders,
  routes,
  access,
  agendaMore,
  accountsMap,
  settings,
  settingsMore,
  components,
  listComponents,
  ordersMore,
  settingsExtra,
  accountsMore,
  homeMore,
  routesMore,
  accountsEditor,
  panels,
  settingsRest,
  listBar,
  settingsShell,
  legacyA,
  legacyB,
  legacyD,
  legacyC,
  core,
  navigationCore,
  billingMore,
  productsMore,
  leftovers,
  settingsCore,
  legacyTexts,
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    back: 'Volver',
    loading: 'Cargando…',
    retry: 'Reintentar',
  },
  navigation: {
    notInPlan: 'No está incluido en tu plan',
    notAllowed: 'No tienes permiso para entrar aquí',
    unknownScreen: 'Esa pantalla no existe',
  },
  errors: {
    network: 'Sin conexión: se guardará al volver la red',
    generic: 'Algo ha fallado. Inténtalo de nuevo',
  },
  dates: {
    monthsShort: 'ene,feb,mar,abr,may,jun,jul,ago,sep,oct,nov,dic',
    weekdaysShort: 'dom,lun,mar,mié,jue,vie,sáb',
    /** Locale for the browser date and number formats (Intl) */
    locale: 'es-ES',
    monthsLong: 'enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre',
    /** Weekday initials from Monday */
    weekdayLetters: 'L,M,X,J,V,S,D',
    weekdaysLong: 'lunes,martes,miércoles,jueves,viernes,sábado,domingo',
  },
  agenda,
  accounts,
  events,
  surgeries,
  cycle,
  home: {
    showIndicators: 'Ver tus indicadores',
    hideIndicators: 'Ocultar tus indicadores',
    indicators: {
      offline: 'Sin conexión y sin copia guardada todavía.',
      whatIsIt: 'Qué es',
      savedFilter: 'Filtro guardado',
      filterHelp: '{help} Filtro: {filter}.',
      nextAppointment: 'Siguiente <b>{time}</b> · {name}',
      allClosed: 'Todas cerradas',
      noAppointmentsToday: 'Sin citas hoy',
      urgentPending: '{count} por atender',
      noneUrgent: 'Ninguno pendiente',
      allUpToDate: 'Todo al día',
      busiestDay: 'El {weekday}, el día más lleno (<b>{count}</b>)',
      freeWeek: 'Semana libre',
      fourWeekAverage: 'Media <b>{average}</b> al día las 4 semanas anteriores',
      aboveLastMonth: '<b>+{difference}</b> sobre el mismo día del mes pasado',
      belowLastMonth: '<b>{difference}</b> frente al mismo día del mes pasado',
      unitsVersusLastMonth: '{sign}{percent} % frente al mismo día del mes pasado',
      alreadyIn: '<b>{count}</b> ya en «{state}»',
      nextStep: 'Siguiente paso: «{state}»',
      shareOfPortfolio: '{percent} % de tu cartera',
      noVisitIn60Days: 'Sin {visit} en 60 días',
      theRest: 'El resto',
      today: 'hoy',
    },
    attention: {
      title: 'Requiere tu atención',
      allClearTitle: 'Todo al día',
      allClearText: 'No hay nada pendiente en ninguna área.',
      overdueInvoices: 'Facturas vencidas',
      overdueInvoicesDetail: '{amount} por cobrar',
      pendingPayment: 'Pendientes de cobro',
      pendingPaymentDetail: 'Pedidos confirmados que aún no están cobrados',
      urgentUnvisited: '{professionals} sin visitar',
      urgentUnvisitedDetail: 'Marcados como urgentes en su ficha',
      surgeryRestock: 'Material de {surgeries} por reponer',
      surgeryRestockDetail: 'Reposición en 48 horas',
      packagesToPrepare: 'Paquetes por preparar',
      packagesToPrepareDetail: 'Pedidos confirmados sin enviar',
      callBackToday: 'Volver a llamar hoy',
      callBackLate: 'Algunas llamadas van con retraso',
      callBackOnTime: 'Clientes a los que quedaste en llamar',
      contractsExpiring: 'Contratos que vencen en 90 días',
      contractsExpiringDetail: 'Concursos por renovar',
      emailsToSend: 'Correos por enviar',
      emailsToSendDetail: 'Facturas y avisos de pago sin enviar al cliente',
      duplicates: 'Fichas duplicadas por revisar',
      duplicatesDetail: 'Posibles duplicados',
    },
    sales: {
      title: 'Ventas del mes',
      units: 'uds.',
      percent: '{percent} %',
      versusLastMonth: ' frente al mismo día del mes pasado · ',
      orders: 'pedidos',
      chartLabel: '{visits} por día en los últimos 14 días',
      chartLegend: '{visits} de los últimos 14 días',
    },
    today: {
      title: 'Tu día',
      appointmentOne: 'cita',
      appointmentOther: 'citas',
      done: 'hechas',
      taskOne: 'tarea pendiente',
      taskOther: 'tareas pendientes',
      dayComplete: 'Día completado',
      planYourDay: 'Planifica tu día',
    },
    collections: {
      title: 'Cobros',
      pendingIn: 'pendiente en',
      invoiceOne: 'factura',
      invoiceOther: 'facturas',
      overdue: 'Vencido',
      invoicedThisMonth: 'Facturado este mes',
    },
    cycle: {
      title: 'Ciclo de {visits}',
      progress: ' de {target} · quedan {days} días',
    },
    stock: {
      title: 'Stock',
      alertOne: 'aviso',
      alertOther: 'avisos',
      allGood: 'Todo en orden',
    },
    portfolio: {
      title: 'Cartera',
      soldThisMonth: 'Han vendido este mes',
      notContacted: 'Sin contactar',
      noVisitIn60Days: 'Sin {visit} en 60 días',
    },
    upcoming: {
      title: 'Lo que viene',
    },
  },
} as const;

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Shape every language file must have (same keys as Spanish, any text). */
export type Messages = Widen<typeof es>;
