/**
 * The professional portal home, first part: the duplicates notice and the four cards (today's agenda, next actions, urgent
 * without visit, last visits), with the commission and route cards. Migrated from the legacy pintarInicioBase (v2.417.0).
 */
import { addHelpButtons, cachedRpc, cardSectionsLegacy, legacyDb, term, timingMark } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { todayIso } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { nonZeroOr, orFallback } from '../../../services/values';
import { paintIndicators, type PanelResult } from '../indicators';

interface PortalPanel {
  kpis: { urgentes: number; pendientes_unificar?: number };
  agenda_hoy: { cuenta_id: string; hora?: string | null; estado: string; nombre: string; centro_nombre?: string | null }[];
  acciones: { cuenta_id: string; proxima_fecha: string; proxima_accion?: string | null; nombre: string }[];
  urgentes: { cuenta_id: string; nombre: string; especialidad?: string | null; centro_nombre?: string | null; municipio?: string | null }[];
  ultimas_visitas: { cuenta_id: string; nombre: string; fecha: string; resultados?: string[] | null }[];
}

const VISITED = 'Visitada', SIMILAR_CAP = 200, SHOWN_URGENT = 6;

interface Card { title: string; count: number | null; items: string[]; footer: string; empty: string }

function paintCard(element: HTMLElement | null, card: Card): void {
  if (!element) return;
  element.innerHTML = `<h2>${card.title}${card.count !== null ? `<span class="n">${formatNumber(card.count)}</span>` : ''}</h2>`
    + (card.items.length ? `<div class="lista">${card.items.join('')}</div>` : `<div class="vacio">${card.empty}</div>`)
    + (card.footer && card.items.length ? card.footer : '');
}

/** «2 fichas pendientes de unificar y 5 posibles duplicados por nombre». */
function duplicatesText(pending: number, similar: number): string {
  return [
    pending ? `${t(pending === 1 ? 'homeMore.duplicates.onePending' : 'homeMore.duplicates.pending', { count: formatNumber(pending) })}${t('homeMore.duplicates.toUnify')}` : '',
    similar ? `${formatNumber(similar)}${similar >= SIMILAR_CAP ? '+' : ''} ${t(similar === 1 ? 'homeMore.duplicates.oneSimilar' : 'homeMore.duplicates.similar')}${t('homeMore.duplicates.byName')}` : '',
  ].filter(Boolean).join(t('homeMore.duplicates.and'));
}

function duplicatesNotice(isAdmin: boolean, pendingFromPanel: number): void {
  const box = document.getElementById('inialerta'); if (!box) return;
  const summary = miscLegacy.duplicatesSummary(), pending = nonZeroOr(summary?.pendientes, pendingFromPanel), similar = summary?.parecidos ?? 0;
  if (!isAdmin || !(pending || similar)) { box.innerHTML = ''; return; }
  box.innerHTML = `<div class="alerta">
        <span>⚠ ${duplicatesText(pending, similar)}</span>
        <button class="btn chico" data-k="dups">${t('homeMore.duplicates.review')}</button></div>`;
}

function paintCards(data: PortalPanel): void {
  const today = todayIso(), item = miscLegacy.item, element = (id: string): HTMLElement | null => document.getElementById(id);
  paintCard(element('c-agenda'), { title: t('homeMore.cards.agendaTitle'), count: data.agenda_hoy.length, footer: '', empty: t('homeMore.cards.noAppointments'),
    items: data.agenda_hoy.map(entry => item(entry.cuenta_id, { icon: entry.hora ? escapeHtml(entry.hora).slice(0, 5) : '·', kind: entry.estado === VISITED ? 'o' : '' }, entry.nombre,
      `${escapeHtml(orFallback(entry.centro_nombre, ''))} · <b style="color:${entry.estado === VISITED ? 'var(--ok)' : 'var(--navy)'}">${escapeHtml(entry.estado)}</b>`)) });
  paintCard(element('c-acciones'), { title: t('homeMore.cards.actionsTitle'), count: data.acciones.length, footer: '', empty: t('homeMore.cards.noActions'),
    items: data.acciones.map(action => item(action.cuenta_id, { icon: '↻', kind: action.proxima_fecha < today ? 'w' : '' }, action.nombre,
      `<b style="color:${action.proxima_fecha < today ? 'var(--warn)' : 'var(--navy)'}">${formatShortDate(action.proxima_fecha)}</b> · ${escapeHtml(orFallback(action.proxima_accion, t('homeMore.cards.followUp')))}`)) });
  paintCard(element('c-urgentes'), { title: t('homeMore.cards.urgentTitle'), count: data.kpis.urgentes, empty: t('homeMore.cards.allUrgentVisited'),
    footer: data.kpis.urgentes > SHOWN_URGENT ? `<button class="verlo" data-k="urgentes">${t('homeMore.cards.seeUrgent', { count: formatNumber(data.kpis.urgentes) })}</button>` : '',
    items: data.urgentes.map(urgent => item(urgent.cuenta_id, { icon: '!', kind: 'w' }, urgent.nombre, `${escapeHtml(orFallback(urgent.especialidad, ''))} · ${escapeHtml(orFallback(urgent.centro_nombre, orFallback(urgent.municipio, '')))}`)) });
  paintCard(element('c-ultimas'), { title: term('visita', { number: 'p', article: 'ultimo', articleCapital: 'C' }), count: null, footer: '',
    empty: t('homeMore.cards.noVisits', { visits: term('visita', { number: 'p', adjective: 'registrado' }) }),
    items: data.ultimas_visitas.map(visit => item(visit.cuenta_id, { icon: '✓', kind: 'o' }, visit.nombre,
      `${formatShortDate(visit.fecha)} · ${escapeHtml((visit.resultados ?? []).join(' + ') || t('homeMore.cards.noResult'))}`)) });
}

/** Paints the duplicates notice, the indicators and the four cards; then waits for the commission and route cards. */
export async function paintPortalCards(): Promise<void> {
  const view = document.getElementById('v-inicio'); if (!view) return;
  view.classList.remove('ini-cargando');
  if (!document.getElementById('inialerta')) view.querySelector('.saludo')?.insertAdjacentHTML('afterend', '<div id="inialerta"></div>');
  const isAdmin = cardSectionsLegacy.can('administrar');
  // Each block is painted when its data arrives; meanwhile its skeleton shows
  const commission = miscLegacy.commissionCard().catch(() => undefined), routes = miscLegacy.routeCards().catch(() => undefined);
  const result = await cachedRpc<PortalPanel>('panel_inicio', { lim: 6 }, 'inicio');
  timingMark('datos de Inicio recibidos');
  const data = result.data;
  if (!data) { const agenda = document.getElementById('c-agenda'); if (agenda) agenda.innerHTML = `<h2>${t('homeMore.cards.agendaTitle')}</h2><div class="vacio">${t('homeMore.cards.offline')}</div>`; return; }
  const pendingFromPanel = data.kpis.pendientes_unificar ?? 0;
  duplicatesNotice(isAdmin, pendingFromPanel);
  if (isAdmin) {
    legacyDb().rpc<{ pendientes?: number; parecidos?: number }>('resumen_duplicados').then(answer => { miscLegacy.setDuplicatesSummary(answer.data ?? null); duplicatesNotice(isAdmin, pendingFromPanel); }, () => undefined);
  }
  paintIndicators(result as unknown as PanelResult);
  paintCards(data);
  addHelpButtons();
  await Promise.all([commission, routes]);
  timingMark('Inicio completo');
}
