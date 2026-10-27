/**
 * «Protección de datos» at the foot of the card of a professional or a customer (RGPD, plan 9.5, v2.446.0): export everything
 * about the person in a JSON file (rgpd_exportar) and anonymise them (rgpd_anonimizar), first simulating to show what changes and
 * what is kept. Only for whoever configures the company; the server checks it again.
 */
import { callRpc, notices } from '../../legacy/bridge';
import { confirmAction } from '../../components';
import { canManageOrganization } from '../../core/permissions';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatNumber } from '../../services/format';
import { sum } from '../../services/values';

/** Database kinds of person: an account (professional) or a contact (customer). */
export type PersonKind = 'cuenta' | 'contacto';

interface Simulation { cambios?: Record<string, number>; historial?: number; se_conservan?: Record<string, number> }
interface Exported { persona?: { nombre?: string | null }; tablas?: Record<string, unknown[]> }

const SECTION_ID = 'frgpd';
const ERRORS = ['permiso', 'es_centro', 'usuario_activo', 'tu_usuario', 'no_existe'] as const;

/** The server raises a code (e.g. «es_centro»): its text, or the general one. */
function errorText(error: unknown, fallback: MessageKey): string {
  const message = String((error as { message?: string } | null)?.message ?? '');
  const code = ERRORS.find(item => message.includes(item));
  return code ? t(`privacy.errors.${code}`) : t(fallback);
}

const tableName = (table: string): string => {
  const key = `privacy.tables.${table}` as MessageKey, text = t(key);
  return text === key ? table : text;
};

const countLines = (counts: Record<string, number> | undefined): string[] =>
  Object.entries(counts ?? {}).filter(([, count]) => count > 0).map(([table, count]) => `· ${tableName(table)}: ${formatNumber(count)}`);

function confirmText(simulation: Simulation): string {
  const changes = countLines(simulation.cambios), kept = countLines(simulation.se_conservan);
  if (simulation.historial) changes.push(`· ${t('privacy.confirmHistory', { count: formatNumber(simulation.historial) })}`);
  return [t('privacy.confirmIntro'), '',
    ...(changes.length ? [t('privacy.confirmChanges'), ...changes] : [t('privacy.confirmNothing')]),
    ...(kept.length ? ['', t('privacy.confirmKept'), ...kept] : [])].join('\n');
}

async function exportData(kind: PersonKind, id: string, button: HTMLButtonElement): Promise<void> {
  const label = button.textContent; button.disabled = true; button.textContent = t('privacy.exporting');
  const { data, error } = await callRpc<Exported>('rgpd_exportar', { p_tipo: kind, p_id: id });
  button.disabled = false; button.textContent = label;
  if (error || !data) { notices.toast(errorText(error, 'privacy.couldNotExport'), true); return; }
  const name = String(data.persona?.nombre ?? id).replace(/[^\p{L}\p{N}]+/gu, '_');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
  link.download = `rgpd_${kind}_${name}_${todayIso()}.json`; link.click();
  setTimeout(() => { URL.revokeObjectURL(link.href); }, 1000);
  notices.toast(t('privacy.exported', { count: formatNumber(1 + sum(Object.values(data.tablas ?? {}).map(rows => rows.length))) }));
}

async function anonymise(kind: PersonKind, id: string, button: HTMLButtonElement, reopen: () => void): Promise<void> {
  const label = button.textContent; button.disabled = true; button.textContent = t('privacy.simulating');
  const { data: simulation, error } = await callRpc<Simulation>('rgpd_anonimizar', { p_tipo: kind, p_id: id, p_simular: true });
  button.disabled = false; button.textContent = label;
  if (error || !simulation) { notices.toast(errorText(error, 'privacy.couldNotAnonymise'), true); return; }
  if (!await confirmAction(confirmText(simulation), { titulo: t('privacy.confirmTitle'), ok: t('privacy.confirmOk'), peligro: true })) return;
  const { error: failed } = await callRpc<Simulation>('rgpd_anonimizar', { p_tipo: kind, p_id: id, p_simular: false });
  if (failed) { notices.toast(errorText(failed, 'privacy.couldNotAnonymise'), true); return; }
  notices.toast(t('privacy.done')); reopen();
}

/**
 * Adds the «Protección de datos» block at the foot of the card body (#fbody), once, if the card still shows this person.
 * `reopen` paints the card again after anonymising.
 */
export function addPrivacySection(kind: PersonKind, id: string, isShown: () => boolean, reopen: () => void): void {
  const body = document.getElementById('fbody');
  if (!body || !isShown() || !canManageOrganization() || document.getElementById(SECTION_ID)) return;
  body.insertAdjacentHTML('beforeend', `<details class="blk" id="${SECTION_ID}"><summary>${t('privacy.title')}</summary>
      <p class="sm">${t('privacy.intro')}</p>
      <div class="acts"><button type="button" class="btn sec chico" data-rgpd="exportar">${t('privacy.export')}</button>
        <button type="button" class="btn sec dang chico" data-rgpd="anonimizar">${t('privacy.anonymise')}</button></div></details>`);
  const section = document.getElementById(SECTION_ID);
  section?.querySelectorAll<HTMLButtonElement>('[data-rgpd]').forEach(button => {
    button.onclick = (): void => {
      if (button.dataset.rgpd === 'exportar') void exportData(kind, id, button);
      else void anonymise(kind, id, button, reopen);
    };
  });
}
