/**
 * The level of each screen, tab and Configuración entry on the phone (v2.473.0, docs/movil_alcance.md, Eric's answers of 5/11/2026).
 * This module is pure data and lookups (no DOM, no texts): the build also reads it to write src/generated/mobile-levels.json, which
 * the battery uses to know which screens only show the «Solo ordenador» notice on the phone.
 *
 * - full: the same as on the computer.
 * - essential: the screen paints; the actions marked `data-desktop-only` do not show on the phone.
 * - read: it is seen, not edited (no main button, no floating «+», no «Editar»: those actions are marked `data-desktop-only`).
 * - desktop: the screen is not painted on the phone (nor its data asked for): the «Solo ordenador» notice is (aviso-ordenador, D-050).
 */

/** How a screen, tab or settings entry behaves on the phone. */
export type MobileLevel = 'full' | 'essential' | 'read' | 'desktop';

/** The menu screens and own pages; a screen not listed is `full`. */
export const SCREEN_MOBILE: Readonly<Record<string, MobileLevel>> = {
  inicio: 'full', agenda: 'full', rutas: 'full', manual: 'full', informe: 'full', config: 'full',
  ciclo: 'read', cirugias: 'essential',
  directorio: 'essential', pacientes: 'essential', seguimiento: 'essential', eventos: 'essential', duplicados: 'desktop',
  // M7 B: Pedidos complete on the phone (bulk selection stays on the computer, M11 A)
  ventas: 'full', oportunidades: 'essential', compras: 'essential', proveedores: 'read', concursos: 'read', parque: 'essential',
  productos: 'read', deposito: 'essential',
  facturacion: 'essential',
  // M10 A: only «Resumen», read only
  analitica: 'read',
  // M4 A: the whole Panel delcos is «Solo ordenador»
  delcos: 'desktop',
};

/** The tabs of a screen (PAGES tabs and the screen's own sections); a tab not listed has its screen's level. */
export const TAB_MOBILE: Readonly<Record<string, Readonly<Record<string, MobileLevel>>>> = {
  ciclo: { ciclo: 'read', cobertura: 'read', clasificar: 'desktop', equipo: 'read' },
  eventos: { lista: 'essential', transparencia: 'desktop' },
  concursos: { marcha: 'read', contratos: 'read', cerrados: 'read' },
  productos: { productos: 'read', servicios: 'read', stock: 'essential' },
  facturacion: { facturas: 'essential', series: 'desktop', empresa: 'desktop', verifactu: 'desktop', registro: 'desktop' },
  analitica: { resumen: 'read', explorar: 'desktop' },
};

/**
 * Configuración (the index entries and their parts). Unlike screens, an entry not listed is `desktop`: a new settings section is
 * born «Solo ordenador» unless it says otherwise. M1 A: an administrator sees these seven on the phone.
 */
export const SETTINGS_MOBILE: Readonly<Record<string, MobileLevel>> = {
  datos: 'full', notif: 'full', rutas: 'full', 'rutas.salida': 'full', 'rutas.horario': 'full', 'inicio.kpis': 'essential',
  // M9 A: see the team, a temporary password, resend the activation; new user, role, areas and impersonating on the computer
  usuarios: 'essential',
  'o.plan': 'read',
};

/** Windows that only open on the computer (their buttons are not on the phone; reached anyway, they show the notice). */
export const WINDOW_MOBILE: Readonly<Record<string, MobileLevel>> = {
  productEditor: 'desktop', userEditor: 'desktop', rectifyInvoice: 'desktop', roleEditor: 'desktop',
};

/** The one-line reason of each «Solo ordenador» place (a key of mobile.desktopOnly.reasons); the rest says the generic one. */
export const DESKTOP_REASON: Readonly<Record<string, string>> = {
  duplicados: 'duplicates', delcos: 'platform', 'ciclo/clasificar': 'classify', 'eventos/transparencia': 'expenseReport',
  'facturacion/registro': 'invoiceLog', 'facturacion/series': 'fiscal', 'facturacion/empresa': 'fiscal', 'facturacion/verifactu': 'verifactu',
  'analitica/explorar': 'explore',
  importar: 'import', roles: 'roles', cartera: 'portfolio', comis: 'commissions', seguridad: 'security',
  'o.marca': 'brand', 'o.textos': 'texts', 'o.correo': 'email', 'o.copias': 'backups', 'o.pruebas': 'internal', 'o.zona': 'company', 'o.orgs': 'platform',
  'o.fiscal': 'fiscal', 'o.series': 'fiscal', 'o.vf': 'verifactu', 'o.pdf': 'pdf', tpv: 'cardPayment', impuestos: 'companyRules',
  cat: 'classifiers', estados: 'classifiers', stock: 'stores', portal: 'portal', distribuidores: 'distributors',
  servicios: 'companyRules', contratos: 'companyRules',
  productEditor: 'productEditor', userEditor: 'userEditor', rectifyInvoice: 'rectify', roleEditor: 'roles',
};

/** The level of a screen, or of one of its tabs. */
export function mobileLevel(screen: string, tab?: string | null): MobileLevel {
  const own = tab ? TAB_MOBILE[screen]?.[tab] : undefined;
  return own ?? SCREEN_MOBILE[screen] ?? 'full';
}

/** The level of a Configuración entry («rutas») or part («rutas.salida»): a part without its own takes its entry's. */
export function settingsLevel(key: string): MobileLevel {
  return SETTINGS_MOBILE[key] ?? SETTINGS_MOBILE[key.split('.')[0] ?? ''] ?? 'desktop';
}

/** The reason key of a place: «screen/tab» or its screen; a settings part («importar.nueva») or its entry; a window. */
export function desktopReason(place: string): string {
  return DESKTOP_REASON[place] ?? DESKTOP_REASON[place.split('/')[0] ?? ''] ?? DESKTOP_REASON[place.split('.')[0] ?? ''] ?? 'generic';
}

/** Everything above in one object: what the build writes to src/generated/mobile-levels.json. */
export function mobileLevelsTable(): Record<string, unknown> {
  return { screens: SCREEN_MOBILE, tabs: TAB_MOBILE, settings: SETTINGS_MOBILE, settingsDefault: 'desktop', windows: WINDOW_MOBILE, reasons: DESKTOP_REASON };
}
