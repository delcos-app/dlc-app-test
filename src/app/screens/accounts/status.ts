/**
 * Changing an account: its commercial state from the card's select, and taking it out (baja) or back in. Migrated from the legacy
 * cambiarEstado (with the [data-estado] listener of legado 002) and bajaCuenta (v2.419.0).
 */
import { appLegacy, currentScreen, legacyDb, notices } from '../../legacy/bridge';
import { miscLegacy } from '../../legacy/misc-bridge';
import { t } from '../../i18n';
import { searchAccounts } from './list/search';

export async function changeState(id: string, state: string): Promise<void> {
  const { error } = await legacyDb().from('cuentas').update({ estado_comercial: state }).eq('id', id);
  if (error) { notices.toast(t('accountsEditor.status.couldNotChange', { error: (error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t('accountsEditor.status.changed', { state }));
  void searchAccounts(true); miscLegacy.reloadHome();
}

/** A commercial state chosen in any [data-estado] select. */
export function listenToStateSelects(): void {
  document.addEventListener('change', event => {
    const select = (event.target as Element | null)?.closest<HTMLSelectElement>('[data-estado]');
    if (select) void changeState(select.dataset.estado ?? '', select.value);
  });
}

interface Deactivated { ok?: boolean; error?: string; citas_quitadas?: number }

const removedText = (removed: number): string =>
  (removed ? t(removed === 1 ? 'accountsEditor.status.oneAppointmentRemoved' : 'accountsEditor.status.appointmentsRemoved', { count: removed }) : '');

const errorText = (error: unknown, result: Deactivated | null): string => (error as { message?: string } | null)?.message ?? result?.error ?? '';

/** Takes the account out (`out` true) or back in; the open appointments go out of the agenda. True if it was done. */
export async function setAccountOut(id: string, out: boolean): Promise<boolean> {
  const { data: result, error } = await legacyDb().rpc<Deactivated>('baja_cuenta', { p_id: id, p_baja: out });
  if (error || !result?.ok) { notices.toast(t('accountsEditor.status.couldNot', { error: errorText(error, result) }), true); return false; }
  try { appLegacy.forgetCache(); } catch { /* the cache is only a speed-up */ }
  notices.toast(out ? t('accountsEditor.status.out') + removedText(result.citas_quitadas ?? 0) : t('accountsEditor.status.backIn'));
  if (currentScreen() === 'directorio') void searchAccounts(true);
  return true;
}
