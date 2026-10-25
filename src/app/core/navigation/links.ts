/**
 * Where a link of a notice goes («ficha:id», «pedido:id», «agenda»…), the screen to go back to after reloading (F5), the name of a
 * screen, the page bar of server-paged lists, going back to the test data and to one's own session. Migrated from the legacy irEnlace
 * and irEnlaceBase…Base6, volverTrasF5, pantallaTrasF5, nombrePantalla, paginador and paginadorBase, volverDatosPartida, volverAMiSesion
 * and volverAMiSesionBase (v2.426.0); the names stay as adapters.
 */
import { t } from '../../i18n';
import { navLegacy } from '../../legacy/nav-bridge';
import { orFallback } from '../../services/values';
import { PAGES } from './pages';

const RELOAD_WINDOW_MS = 60000;
const OWN_PAGES = ['config', 'perfil', 'empresa', 'plan'];

type LinkHandler = (id: string | undefined) => unknown;

const toToday = (): unknown => { AG_MODO = 'dia'; AG_FECHA = hoyISO(); return ir('agenda'); };
const toOrders = (section: string): unknown => { PEDSEC = section; return ir('ventas'); };

const LINKS = new Map<string, LinkHandler>([
  ['plan', (): unknown => ir('plan')],
  ['equipo', (id): unknown => (id ? verEquipo(id) : undefined)],
  ['concurso', (id): unknown => (id ? verConcurso(id) : undefined)],
  ['cirugia', (id): unknown => (id ? verCirugia(id) : undefined)],
  ['cliente', (id): unknown => (id ? nuevaVenta({ contacto_id: id }) : undefined)],
  ['cita', toToday], ['agenda', toToday],
  ['llamadas', (): unknown => toOrders('llamadas')], ['ventas', (): unknown => toOrders('ventas')],
  ['stock', (): unknown => { PSEC = 'stock'; return ir('productos'); }],
  ['facturacion', (): unknown => ir('facturacion')], ['duplicados', (): unknown => ir('duplicados')],
  ['ficha', (id): unknown => (id ? abrirFicha(id) : undefined)], ['pedido', (id): unknown => (id ? verPedido(id) : undefined)],
  ['informe', (): unknown => ir('informe')], ['directorio', (): unknown => ir('directorio')],
]);

/** Follows the link of a notice. Links with an id that arrive without it do nothing (as before). */
export function followLink(link: string | null | undefined): unknown {
  const [kind = '', id] = String(link ?? '').split(':');
  if (kind === 'delcos') return puede('gestionar_plataforma') ? ir('delcos') : undefined;
  return LINKS.get(kind)?.(id);
}

interface ReloadPoint { t?: string; h?: number; c?: string; s?: string; p?: Record<string, string> }

/** The screen saved when F5 was pressed (only if it was pressed less than a minute ago; it is used once). */
export function screenAfterReload(): ReloadPoint | null {
  let point: ReloadPoint | null = null;
  try { point = JSON.parse(sessionStorage.getItem('dlc-f5') ?? 'null') as ReloadPoint | null; sessionStorage.removeItem('dlc-f5'); } catch { point = null; }
  // Only if it was just pressed (a reload hours later, or from the browser's button, starts at Inicio)
  return point?.t && Date.now() - (point.h ?? 0) < RELOAD_WINDOW_MS ? point : null;
}

/** Goes back to that screen (with its Configuración section and page tabs). */
export function returnAfterReload(point: ReloadPoint): void {
  if (point.c) CFG_SEC = point.c;
  if (point.s) CFG_SUB = point.s;
  if (point.p) Object.assign(PAG_TAB, point.p);
  if (point.t && (OWN_PAGES.includes(point.t) || puedeModulo(point.t))) ir(point.t);
}

/** The name of a screen as the menu shows it. */
export function screenName(screen: string): string {
  const button = document.querySelector(`nav.main [data-t="${screen}"]`);
  const name = orFallback(button?.textContent?.trim(), orFallback(PAGES[screen]?.t, screen === 'config' ? t('navigationCore.pages.settings') : ''));
  return orFallback(name, t('navigationCore.pages.whereYouWere'));
}

interface PagerHandlers { onPage: (page: number) => void; onSize: () => void }

/** Page bar of a list paged by the server. Before painting it, an old bar with the same id is removed (v2.250.0). */
export function pager(element: HTMLElement | null, position: { total: number; page: number }, handlers: PagerHandlers): void {
  if (!element) return;
  const { total, page } = position, { onPage, onSize } = handlers;
  if (element.id) document.querySelectorAll(`#${element.id}`).forEach(other => { if (other !== element) other.remove(); });
  const size = tamPagina();
  if (total <= (TAMANOS[0] ?? 0)) { element.innerHTML = ''; return; }
  element.innerHTML = pagHTML(total, page, size);
  element.querySelectorAll<HTMLElement>('[data-pg]').forEach(button => { button.onclick = (): void => { onPage(Number(button.dataset.pg)); }; });
  const sizeSelect = element.querySelector<HTMLSelectElement>('[data-pgtam]');
  if (sizeSelect) sizeSelect.onchange = (): void => { fijarTam(Number(sizeSelect.value)); onSize(); };
}

const resetFailure = (result: { ok?: boolean; error?: string } | null, error: { message?: string } | null): string => {
  if (result?.error === 'permiso') return t('navigationCore.testData.onlyOwner');
  if (result?.error === 'sin_maestro') return t('navigationCore.testData.noMaster');
  return t('navigationCore.testData.failed', { error: orFallback(error?.message, orFallback(result?.error, '')) });
};

/** v2.137.0: the test environment goes back to the data as it was copied from production. */
export async function backToTestData(): Promise<void> {
  if (!await preguntar(t('navigationCore.testData.question'), { titulo: t('navigationCore.testData.title'), ok: t('navigationCore.testData.ok'), peligro: true })) return;
  pantallaCarga(t('navigationCore.testData.loading'));
  type Reset = { ok?: boolean; error?: string } | null;
  let { data: result, error } = await RPC_ORIG<Reset>('pruebas_resetear_responsable', { p_confirmacion: 'RESTABLECER' });
  if (error && /pruebas_resetear_responsable|PGRST202|not find/i.test((error as { message?: string }).message ?? '')) {
    ({ data: result, error } = await RPC_ORIG<Reset>('pruebas_resetear', { p_confirmacion: 'RESTABLECER' }));
  }
  if (error || !result?.ok) { quitarCarga(); toast(resetFailure(result ?? null, error as { message?: string } | null), true); return; }
  limpiarDatosLocales(); location.reload();
}

/** Back to one's own session after impersonating someone. */
export async function backToMySession(): Promise<void> {
  const impersonated = suplantando();
  pantallaCarga(t('navigationCore.session.backToMine', { name: impersonated ? `, ${nombrePila(impersonated.nombre)}` : '' }));
  if (!impersonated) return;
  const { error } = await navLegacy.auth().setSession({ access_token: impersonated.access_token, refresh_token: impersonated.refresh_token });
  localStorage.removeItem(SKEY);
  limpiarDatosLocales();
  if (error) { await db.auth.signOut(); toast(t('navigationCore.session.expired'), true); }
  location.reload();
}
