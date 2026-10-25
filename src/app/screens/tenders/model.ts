/**
 * What a tender is (values stored in the database), its pill, when its contract ends and how many days it has left. Migrated from
 * the legacy CON_ESTADOS, conPill, conVence and conQuedan (v2.409.0); the account card uses them too.
 */
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';

export const STATES = { studying: 'En estudio', offerSent: 'Oferta enviada', awarded: 'Adjudicado', lost: 'Perdido', void: 'Desierto' } as const;
export const TENDER_STATES: readonly string[] = [STATES.studying, STATES.offerSent, STATES.awarded, STATES.lost, STATES.void];
export const LOT_STATES = { pending: 'Pendiente', won: 'Ganado', lost: 'Perdido' } as const;
export const LOT_STATE_LIST: readonly string[] = [LOT_STATES.pending, LOT_STATES.won, LOT_STATES.lost];

const DAY_MS = 864e5;

export interface TenderPrice { id: string; producto_id: string; precio: number; unidades?: number | null }
export interface TenderLot {
  id: string; numero?: string | null; descripcion?: string | null; importe_licitacion?: number | null; estado: string;
  adjudicatario?: string | null; importe_adjudicado?: number | null; creado_en?: string; concurso_precios?: TenderPrice[] | null;
}
export interface Tender {
  id: string; titulo: string; expediente?: string | null; organismo?: string | null; estado: string; publicado?: string | null; limite?: string | null;
  inicio?: string | null; fin?: string | null; prorroga_hasta?: string | null; importe_licitacion?: number | null; cuenta_id?: string;
  responsable_id?: string | null; nota?: string | null; cuentas?: { nombre?: string | null } | null; concurso_lotes?: TenderLot[] | null;
}

export const isClosed = (state: string): boolean => state === STATES.lost || state === STATES.void;

export function statePill(state: string): string {
  const kind = state === STATES.awarded ? 'p-est' : isClosed(state) ? 'p-anu' : state === STATES.offerSent ? 'p-per' : 'p-warn';
  return `<span class="pill ${kind}">${escapeHtml(state)}</span>`;
}

/** The day the contract ends: the extension if there is one, else its end. */
export const contractEnd = (tender: Pick<Tender, 'fin' | 'prorroga_hasta'>): string | null => [tender.prorroga_hasta, tender.fin].find(Boolean) ?? null;

/** Days until the contract ends (negative once it has ended), or null without an end date. */
export function daysLeft(tender: Pick<Tender, 'fin' | 'prorroga_hasta'>): number | null {
  const end = contractEnd(tender);
  return end ? Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${todayIso()}T12:00:00`).getTime()) / DAY_MS) : null;
}

/** «Hospital X · Diputación · Exp. 12/2026». */
export const tenderLine = (tender: Tender): string =>
  [tender.cuentas?.nombre, tender.organismo, tender.expediente ? t('tenders.file', { number: tender.expediente }) : ''].filter(Boolean).join(' · ');

/** The message of a failed write: a row-level policy means the user may not change it. */
export const writeFailure = (error: { message?: string }, noPermission: string): string =>
  (/row-level|policy/i.test(error.message ?? '') ? noPermission : t('tenders.sheet.couldNotSave', { error: error.message ?? '' }));
