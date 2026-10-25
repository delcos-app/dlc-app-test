/**
 * The strip of the test environment (legado 023, v2.424.0): «ENTORNO DE PRUEBAS», when the starting data was saved and, for
 * administration, «↺ Volver a los datos de partida». pintarFranjaPruebas stays as an adapter (legado 018, 035, 040… call it).
 */
import { notices, term } from '../../legacy/bridge';
import { testStripLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';

const TEST_COLOUR = '#B45309', TITLE_PREFIX = '[PRUEBAS] ', RESET_WORD = 'VOLVER', RELOAD_MS = 600;

function stripHtml(admin: boolean): string {
  return `<span><b>${t('legacyA.testStrip.title')}</b> · ${t('legacyA.testStrip.subtitle')}
      <button class="ai" data-ayuda="pruebas" aria-label="${t('legacyA.testStrip.whatIs')}">i</button>
      <span class="prpunto" id="prpunto"></span></span>
    ${admin ? `<span class="acts u-m-0">
      <button class="btn chico" id="prreset" title="${t('legacyA.testStrip.resetHint')}">${t('legacyA.testStrip.reset')}</button></span>` : ''}`;
}

/** When the starting point was saved (a copy of production). */
async function paintStartingPoint(): Promise<void> {
  const { data } = await testStripLegacy.environment();
  const element = document.getElementById('prpunto'); if (!element) return;
  const saved = data?.maestro_guardado_en;
  const format = (value: string): string => new Date(value).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  element.textContent = saved ? t('legacyA.testStrip.startingData', { date: format(saved) }) : t('legacyA.testStrip.missingData');
  if (!saved) element.classList.add('falta');
}

/** Why the reset failed. */
function resetFailure(error: unknown, result: { error?: string } | null): string {
  if (result?.error === 'sin_maestro') return t('legacyA.testStrip.noMaster');
  return t('legacyA.testStrip.couldNot', { error: (error as { message?: string } | null)?.message ?? result?.error ?? '' });
}

async function reset(): Promise<void> {
  const text = await testStripLegacy.askText(t('legacyA.testStrip.resetText', { visits: term('visita', { number: 'p' }), patients: term('paciente', { number: 'p' }) }), '',
    { titulo: t('legacyA.testStrip.resetTitle'), ok: t('legacyA.testStrip.resetOk') });
  if (text === null) return;
  if (text.trim().toUpperCase() !== RESET_WORD) { notices.toast(t('legacyA.testStrip.wordMismatch'), true); return; }
  notices.toast(t('legacyA.testStrip.resetting'));
  const { data: result, error } = await testStripLegacy.reset();
  if (error || !result?.ok) {
    notices.toast(resetFailure(error, result), true);
    return;
  }
  try { Object.keys(localStorage).filter(key => key.startsWith('dlc-rc-') || key.startsWith('dlc-jornada-')).forEach(key => { localStorage.removeItem(key); }); } catch { /* no storage */ }
  notices.toast(t('legacyA.testStrip.done')); setTimeout(() => { location.reload(); }, RELOAD_MS);
}

/** Paints the strip (only in the test environment). */
export function paintTestStrip(): void {
  if (!testStripLegacy.inTests()) return;
  document.title = TITLE_PREFIX + document.title.replace(/^\[PRUEBAS\] /, '');
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]'); if (meta) meta.content = TEST_COLOUR;
  let strip = document.getElementById('franjapruebas');
  if (!strip) {
    document.body.insertAdjacentHTML('afterbegin', '<div id="franjapruebas"></div>');
    document.body.classList.add('enpruebas');
    strip = document.getElementById('franjapruebas');
  }
  if (!strip) return;
  if (testStripLegacy.notConfigured()) { strip.innerHTML = t('legacyA.testStrip.notConfigured'); return; }
  const admin = testStripLegacy.isAdmin();
  strip.innerHTML = stripHtml(admin);
  void paintStartingPoint();
  if (!admin) return;
  const button = document.getElementById('prreset'); if (button) button.onclick = (): void => { void reset(); };
}
