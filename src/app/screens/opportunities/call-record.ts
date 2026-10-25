/**
 * «Registro de llamada» inside the new client window (Clientes): the call is saved with the new client or, if the caller does not
 * buy, alone (without client) with what was noted about them in llamadas.datos, for the metrics. Migrated from the legacy
 * llamadaAltaHTML, llamadaAltaActivar, llamadaAltaLeer and llamadaAltaGuardar (v2.410.0); those names stay as adapters
 * (pantallas/clientes.js uses them).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { catalog, chipsHtml, dateIn, followUpButtons, loadCallCatalogs, INCOMING, ORDER_DONE, OUTGOING, toggleChip } from './model';

export interface CallState {
  id?: string | null; fecha?: string | null; motivo?: string; resultado?: string; direccion?: string; nota?: string;
  proxima_fecha?: string; proxima_accion?: string; cuenta_texto?: string; previa?: string | null;
}
export interface CallRecord { motivo: string; resultado: string; direccion: string; nota: string; proxima_fecha: string; proxima_accion: string }
export interface CallSubject {
  nombre?: string; telefono?: string; contacto_id?: string | null; medico?: { id: string } | null; resultado?: string; datos?: Record<string, unknown>;
}

/** The reason and result chosen in the open window. */
const chosen = { motivo: '', resultado: '' };

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const needsFollowUp = (result: string | undefined): boolean => Boolean(result) && result !== ORDER_DONE;

export function callRecordHtml(state: CallState | null | undefined): string {
  const call = state ?? {}, outgoing = call.direccion === OUTGOING;
  return `<details class="blk kollam" id="kollam" ${call.motivo !== undefined ? 'open' : ''}><summary>${t('opportunities.callRecord.title')}</summary>
    <div class="sm">${t('opportunities.callRecord.hint')}</div>
    <label>${t('opportunities.callRecord.reason')}</label><div class="chipsw" id="kolmot"></div>
    <label>${t('opportunities.callRecord.result')}</label><div class="chipsw" id="kolres"></div>
    <div id="kolseg" class="${needsFollowUp(call.resultado) ? '' : 'hide'}">
      <div class="sm" style="margin:8px 0 4px">${t('opportunities.callAgainWhen')}</div>
      <div class="chipsw">${followUpButtons('kold')}</div>
      <div class="g2 u-mt-6"><div><input id="kolpf" type="date" value="${escapeHtml(orFallback(call.proxima_fecha, ''))}" aria-label="${t('opportunities.callAgainOn')}"></div>
        <div><input id="kolpa" value="${escapeHtml(orFallback(call.proxima_accion, ''))}" placeholder="${t('opportunities.whatToDoPlaceholder')}" aria-label="${t('opportunities.whatToDo')}"></div></div></div>
    <div class="g2"><div><label for="kold">${t('opportunities.callRecord.type')}</label><select id="kold"><option value="${INCOMING}" ${outgoing ? '' : 'selected'}>${t('opportunities.callRecord.incoming')}</option><option value="${OUTGOING}" ${outgoing ? 'selected' : ''}>${t('opportunities.callRecord.outgoing')}</option></select></div>
      <div><label for="kolno">${t('opportunities.callRecord.note')}</label><input id="kolno" value="${escapeHtml(orFallback(call.nota, ''))}"></div></div>
    <div class="acts u-mt-8"><button type="button" class="btn sec" id="kosolo">${t('opportunities.callRecord.callOnly')}</button></div>
  </details>`;
}

function onClick(event: Event): void {
  const target = event.target as Element;
  const reason = target.closest<HTMLElement>('[data-kom]'), result = target.closest<HTMLElement>('[data-kor]'), days = target.closest<HTMLElement>('[data-kold]');
  const reasons = document.getElementById('kolmot'), results = document.getElementById('kolres');
  if (reason && reasons) chosen.motivo = toggleChip(reasons, 'data-kom', chosen.motivo, reason.dataset.kom ?? '');
  if (result && results) {
    chosen.resultado = toggleChip(results, 'data-kor', chosen.resultado, result.dataset.kor ?? '');
    document.getElementById('kolseg')?.classList.toggle('hide', !needsFollowUp(chosen.resultado));
  }
  if (days) {
    const date = document.getElementById('kolpf') as HTMLInputElement | null; if (date) date.value = dateIn(Number(days.dataset.kold));
    document.getElementById('kollam')?.querySelectorAll('[data-kold]').forEach(other => { other.classList.toggle('on', other === days); });
  }
}

/** Fills the chips (once the catalogs are loaded) and listens to the block. */
export function activateCallRecord(state: CallState | null | undefined): void {
  chosen.motivo = orFallback(state?.motivo, ''); chosen.resultado = orFallback(state?.resultado, '');
  void loadCallCatalogs().then(() => {
    const reasons = document.getElementById('kolmot'), results = document.getElementById('kolres');
    if (!reasons || !results) return;
    reasons.innerHTML = chipsHtml(catalog('motivo_llamada'), chosen.motivo, 'data-kom');
    results.innerHTML = chipsHtml(catalog('resultado_llamada'), chosen.resultado, 'data-kor');
  });
  const block = document.getElementById('kollam'); if (block) block.onclick = onClick;
}

/** What was noted in the block (null if the window has none). */
export function readCallRecord(): CallRecord | null {
  if (!document.getElementById('kollam')) return null;
  return { motivo: chosen.motivo, resultado: chosen.resultado, direccion: value('kold'), nota: value('kolno').trim(), proxima_fecha: value('kolpf'), proxima_accion: value('kolpa').trim() };
}

/** Who called: the new client or what was noted about them, and the professional of reference (or its name as text). */
function caller(subject: CallSubject, state: CallState): Record<string, unknown> {
  return {
    nombre: subject.nombre ?? '', telefono: subject.telefono ?? '', contacto_id: subject.contacto_id ?? null, cliente_nuevo: null,
    cuenta_id: subject.medico ? subject.medico.id : null, cuenta_texto: subject.medico ? '' : orFallback(state.cuenta_texto, ''),
    ...(subject.datos && Object.keys(subject.datos).length ? { datos: subject.datos } : {}),
  };
}

function payload(record: CallRecord, subject: CallSubject, state: CallState): Record<string, unknown> {
  const followUp = needsFollowUp(subject.resultado);
  return {
    id: state.id ?? null, fecha: state.fecha ?? null, direccion: record.direccion, ...caller(subject, state), motivo: record.motivo, resultado: orFallback(subject.resultado, ''),
    proxima_accion: followUp ? record.proxima_accion : '', proxima_fecha: followUp ? record.proxima_fecha : '', nota: record.nota,
    pedido_id: null, llamada_origen: state.previa ?? null,
  };
}

/** Saves the call; returns its id (null if it could not be saved). */
export async function saveCallRecord(record: CallRecord, subject: CallSubject, state: CallState | null | undefined): Promise<string | null> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; id?: string }>('guardar_llamada', { p: payload(record, subject, state ?? {}) });
  if (error || result?.ok === false) {
    notices.toast(error ? t('opportunities.callRecord.couldNotSaveError', { error: (error as { message?: string }).message ?? '' }) : t('opportunities.callRecord.couldNotSave'), true);
    return null;
  }
  return result?.id ?? null;
}
