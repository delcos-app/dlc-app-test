/**
 * The test environment strip, «Volver a los datos de partida»: only the person responsible for the environment sees the button
 * (if the project has that setting), and it asks for confirmation before resetting. Folded from the two layers of legado 035
 * and 040, whose second one always replaced the first one's button action (v2.424.0).
 */
import { notices } from '../../legacy/bridge';
import { legacyBActions, legacyBState } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';
import { currentStripPainter, setStripPainter, type StripPainter } from '../legacy-a/test-strip';

const SETTLE_MS = 50, CONFIRMATION = 'RESTABLECER';
const missingFunction = /pruebas_resetear_responsable|PGRST202|not find/i;

interface ResetResult { ok?: boolean; error?: string }

async function reset(): Promise<void> {
  const confirmed = await legacyBActions.ask(t('legacyB.testEnvironment.resetText'), {
    titulo: t('legacyB.testEnvironment.resetTitle'), ok: t('legacyB.testEnvironment.resetOk'), cancelar: t('legacyB.testEnvironment.resetCancel'), peligro: true,
  });
  if (!confirmed) return;
  legacyBActions.showLoadingScreen(t('legacyB.testEnvironment.resetting'));
  let { data: result, error } = await legacyBActions.rpcOriginal<ResetResult>('pruebas_resetear_responsable', { p_confirmacion: CONFIRMATION });
  if (error && missingFunction.test(error.message ?? '')) ({ data: result, error } = await legacyBActions.rpcOriginal<ResetResult>('pruebas_resetear', { p_confirmacion: CONFIRMATION }));
  if (error || !result?.ok) { failed(result, error); return; }
  legacyBActions.clearLocalData(); location.reload();
}

function failed(result: ResetResult | null | undefined, error: { message?: string } | null | undefined): void {
  legacyBActions.hideLoadingScreen();
  notices.toast(result?.error === 'permiso' ? t('legacyB.testEnvironment.onlyResponsible') : t('legacyB.testEnvironment.couldNot', { error: error?.message ?? result?.error ?? '' }), true);
}

async function paintStrip(original: StripPainter): Promise<void> {
  void original();
  const button = document.getElementById('prreset'); if (!button) return;
  const { data: allowed, error } = await legacyBActions.rpcOriginal<boolean>('pruebas_puede_restablecer', {});
  // Without the setting in the project, the button stays as it was
  if (!error && !allowed) { button.remove(); return; }
  await new Promise(resolve => { setTimeout(resolve, SETTLE_MS); });
  const current = document.getElementById('prreset'); if (!current) return;
  current.onclick = (): void => { void reset(); };
}

/** Wraps the strip painter in use (in the test environment only) and repaints the strip if it is already shown. */
export function guardTestReset(): void {
  if (!legacyBState.inTests()) return;
  const original = currentStripPainter();
  setStripPainter(() => paintStrip(original));
  if (document.getElementById('prreset')) void currentStripPainter()();
}
