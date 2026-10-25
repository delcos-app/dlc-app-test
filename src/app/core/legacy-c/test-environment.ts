/**
 * The test environment: the strip got «Traer los datos de producción» (v2.13x) and was then replaced by a «Pruebas» marker next to the
 * logo that opens Organización → Entorno de pruebas (v2.13x). Folded from legado 073 (v2.425.0), in the same two steps.
 */
import { t } from '../../i18n';
import { byId } from './dom';

const STRIP_DELAY_MS = 120;
type Painter = () => unknown;
const globals = (): { pintarFranjaPruebas: Painter } => window as unknown as { pintarFranjaPruebas: Painter };

interface RefreshAnswer { ok?: boolean; motivo?: string }

function failureText(answer: RefreshAnswer | null, failed: boolean): string {
  const reason = answer ? (MOTIVO_REFRESCO as Record<string, string | undefined>)[answer.motivo ?? ''] : undefined;
  return reason ?? t('legacyC.testEnvironment.couldNotStart') + (failed && !answer ? t('legacyC.testEnvironment.missingFunction') : '');
}

async function bringProduction(button: HTMLButtonElement): Promise<void> {
  if (!await preguntar(t('legacyC.testEnvironment.bringText'), { titulo: t('legacyC.testEnvironment.bringTitle'), ok: t('legacyC.testEnvironment.bringOk'), peligro: true })) return;
  button.disabled = true;
  const functions = (db as unknown as { functions: { invoke: (name: string, options: object) => Promise<{ data: RefreshAnswer | null; error: { context?: { json?: () => Promise<RefreshAnswer> } } | null }> } }).functions;
  const { data, error } = await functions.invoke('refrescar-pruebas', { body: {} });
  let answer = data;
  if (error?.context?.json) { try { answer = await error.context.json(); } catch { /* the answer stays */ } }
  if (!answer?.ok) { button.disabled = false; toast(failureText(answer, Boolean(error)), true); return; }
  toast(t('legacyC.testEnvironment.started'));
  estadoRefresco();
}

/** The strip with «Traer los datos de producción» (it runs once if the strip is on screen; the marker replaces it right after). */
function addBringButton(): void {
  const previous = globals().pintarFranjaPruebas;
  globals().pintarFranjaPruebas = async (): Promise<void> => {
    await previous();
    await new Promise(resolve => { setTimeout(resolve, STRIP_DELAY_MS); });
    const reset = byId('prreset'); if (!reset || byId('prtraer')) return;   // without «Volver…» (not responsible) it cannot bring data either
    reset.insertAdjacentHTML('beforebegin', `<button class="btn sec" id="prtraer" title="${t('legacyC.testEnvironment.bringHint')}">${t('legacyC.testEnvironment.bring')}</button>`);
    const point = byId('prpunto'); if (point && !byId('prrefresco')) point.insertAdjacentHTML('afterend', ' <span class="prpunto" id="prrefresco"></span>');
    estadoRefresco();
    const bring = byId<HTMLButtonElement>('prtraer'); if (bring) bring.onclick = (): void => { void bringProduction(bring); };
  };
  if (byId('prreset')) void globals().pintarFranjaPruebas();
}

/** The «Pruebas» marker next to the logo. */
function paintMarker(): void {
  byId('franjapruebas')?.remove();
  const logo = document.querySelector('.top .logo');
  if (!logo || byId('indpruebas')) return;
  logo.insertAdjacentHTML('afterend', `<button type="button" id="indpruebas" class="indpruebas" title="${t('legacyC.testEnvironment.markerHint')}">${t('legacyC.testEnvironment.marker')}</button>`);
  const marker = byId('indpruebas');
  if (marker) marker.onclick = (): void => {
    if (puedeOrganizacion()) { PAG_TAB.organizacion = 'pruebas'; ir('organizacion'); } else toast(t('legacyC.testEnvironment.markerHint'));
  };
}

export function stripWithBringButton(): void { if (EN_PRUEBAS) addBringButton(); }

export function markerInsteadOfStrip(): void {
  if (!EN_PRUEBAS) return;
  globals().pintarFranjaPruebas = paintMarker;
  paintMarker();
}
