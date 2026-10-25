/**
 * Concursos → «En marcha» (in study or with the offer sent, by deadline), «Contratos» (awarded, with what they have left) and
 * «Cerrados». Migrated from the legacy pintarConcursos (v2.409.0); pintarConcursos stays as an adapter (page tabs and the
 * dialog-close listener of legado 080).
 */
import { cardSectionsLegacy, currentScreen, legacyDb, relatedLegacy, tendersLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatCurrency, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { editTender } from './editor';
import { contractEnd, daysLeft, isClosed, LOT_STATES, STATES, statePill, tenderLine, type Tender } from './model';
import { editWarnings } from './warnings';

const LIMIT = 300, URGENT_DAYS = 7, NO_DATE = '9999';
export type TenderView = 'marcha' | 'contratos' | 'cerrados';

const byDate = (date: (tender: Tender) => string | null | undefined) => (first: Tender, second: Tender): number =>
  orFallback(date(first), NO_DATE).localeCompare(orFallback(date(second), NO_DATE));

function shown(list: readonly Tender[], view: TenderView): Tender[] {
  if (view === 'contratos') return list.filter(item => item.estado === STATES.awarded).sort(byDate(contractEnd));
  if (view === 'cerrados') return list.filter(item => isClosed(item.estado));
  return list.filter(item => item.estado === STATES.studying || item.estado === STATES.offerSent).sort(byDate(item => item.limite));
}

function contractPill(tender: Tender, warnDays: number): string {
  const left = daysLeft(tender);
  if (left === null) return `<span class="pill p-warn">${t('tenders.list.noEndDate')}</span>`;
  if (left < 0) return `<span class="pill p-anu">${t('tenders.list.expired')}</span>`;
  const text = left === 0 ? t('tenders.list.expiresToday') : left === 1 ? t('tenders.list.expiresInOneDay') : t('tenders.list.expiresInDays', { count: formatNumber(left) });
  return `<span class="pill ${left <= warnDays ? 'p-urg' : 'p-est'}">${text}</span>`;
}

function deadlinePill(tender: Tender): string {
  if (!tender.limite) return '';
  const today = todayIso(), studying = tender.estado === STATES.studying;
  const kind = studying && tender.limite < today ? 'p-anu' : studying && tender.limite <= addDays(today, URGENT_DAYS) ? 'p-urg' : 'p-per';
  return `<span class="pill ${kind}">${t('tenders.list.submitBy', { date: formatShortDate(tender.limite) })}</span>`;
}

function lotsText(tender: Tender): string {
  const lots = tender.concurso_lotes ?? [], won = lots.filter(lot => lot.estado === LOT_STATES.won).length;
  if (!lots.length) return '';
  const wonText = won ? (won === 1 ? t('tenders.list.oneWon') : t('tenders.list.won', { count: won })) : '';
  return ` · ${lots.length === 1 ? t('tenders.list.oneLot') : t('tenders.list.lots', { count: lots.length })}${wonText}`;
}

function rowHtml(tender: Tender, view: TenderView, warnDays: number): string {
  const extra = view === 'contratos' ? contractPill(tender, warnDays) : view === 'marcha' ? deadlinePill(tender) : '';
  return `<button type="button" class="item conrow" data-con="${tender.id}"><span class="tx"><b>${escapeHtml(tender.titulo)}</b>
      <span class="sm">${escapeHtml(tenderLine(tender))}${lotsText(tender)}${tender.importe_licitacion ? ` · ${formatCurrency(tender.importe_licitacion)}` : ''}</span></span>
      <span class="cirest">${statePill(tender.estado)}${extra}</span></button>`;
}

function contractsHint(days: readonly number[]): string {
  const when = days.length ? t('tenders.list.warnDays', { days: [...days].sort((first, second) => second - first).join(t('tenders.list.and')) }) : t('tenders.list.warnNever');
  return `<p class="sm">${t('tenders.list.contractsHint', { when })}</p>`;
}

function pageHtml(list: readonly Tender[], view: TenderView): string {
  const days = tendersLegacy.warningDays(), warnDays = Math.max(...days, 0);
  const empty = t(view === 'contratos' ? 'tenders.list.noContracts' : view === 'cerrados' ? 'tenders.list.noClosed' : 'tenders.list.noOpen');
  return `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="connuevo">${t('tenders.list.newTender')}</button>
      ${cardSectionsLegacy.can('administrar') ? `<button type="button" class="btn sec" id="conavisos">${t('tenders.list.warnings')}</button>` : ''}</div>
    ${view === 'contratos' ? contractsHint(days) : ''}
    <section class="card cirbloque">${list.length ? `<div class="lista">${list.map(item => rowHtml(item, view, warnDays)).join('')}</div>`
      : `<div class="vacio vlinea">${empty}</div>`}</section></div>`;
}

export async function paintTenders(view: TenderView): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const [{ data, error }, { data: setting }] = await Promise.all([
    legacyDb().from<Tender[]>('concursos').select('id,titulo,expediente,organismo,estado,limite,inicio,fin,prorroga_hasta,importe_licitacion,cuenta_id,cuentas(nombre),concurso_lotes(estado)')
      .order('creado_en', { ascending: false }).limit(LIMIT),
    legacyDb().from<{ valor?: { dias?: unknown } | null }>('ajustes').select('valor').eq('clave', 'avisos_vencimiento').maybeSingle()]);
  // Looked up after the answer: the page may have been painted again meanwhile
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'concursos') return;
  if (error) { box.innerHTML = `<div class="vacio">${t('tenders.list.couldNotLoad')}</div>`; return; }
  const days = setting?.valor?.dias;
  if (Array.isArray(days)) tendersLegacy.setWarningDays(days.map(Number).filter(day => day > 0));
  box.innerHTML = pageHtml(shown(data ?? [], view), view);
  const add = document.getElementById('connuevo'); if (add) add.onclick = (): void => { void editTender(null); };
  const warnings = document.getElementById('conavisos'); if (warnings) warnings.onclick = (): void => { editWarnings(); };
  box.querySelectorAll<HTMLElement>('[data-con]').forEach(button => { button.onclick = (): void => { relatedLegacy.openTender(button.dataset.con ?? ''); }; });
}
