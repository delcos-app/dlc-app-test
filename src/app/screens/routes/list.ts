/**
 * Rutas → «Mis rutas»: a card per saved route with its sketch, when it is done, its stops, km and hours, and «Pasar a mi agenda»,
 * «Editar», «Eliminar» or «Ver»; and «Nueva ruta». With a route open, the page is the wizard. Migrated from the legacy
 * cargarRutasBase (v2.414.0); cargarRutasBase stays as an adapter (the legacy cargarRutas chain paints it first).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { appLegacy, cardSectionsLegacy, legacyDb, notices, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatMinutes } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { hasLocation, nextDateOf, referenceDate, routeIcon, whenText } from './model';
import { hoursOf } from './schedule';
import { routeSketch } from './sketch';
import { copyToAgenda, routeMembers } from './to-agenda';
import { openRoute, paintWizard } from './wizard';

function routeFacts(card: RouteCard): { stops: string; hours: string } {
  const route = card.r, members = card.ms, repeat = route.repeticion ?? null;
  const hours = hoursOf(members, referenceDate(repeat, route.nombre), { start: route.salida, back: route.vuelta, fixed: route.fijas }), next = nextDateOf(repeat);
  const stops = new Set(members.filter(hasLocation).map(member => `${Number(member.lat).toFixed(5)},${Number(member.lon).toFixed(5)}`)).size;
  const who = `${formatNumber(members.length)} ${term('medico', { number: members.length === 1 ? 's' : 'p' })} · ${stops} ${t(stops === 1 ? 'routes.list.oneStop' : 'routes.list.stops')}${hours.km >= 1 ? t('routes.list.kilometres', { km: Math.round(hours.km) }) : ''}`;
  const when = members.length ? t('routes.list.fromTo', { start: route.salida ? String(route.salida).slice(0, 5) : '09:00', end: formatMinutes(hours.fin) }) : t('routes.list.nobodyYet');
  return { stops: who, hours: `${when}${next ? t('routes.list.next', { date: escapeHtml(formatShortDate(next)) }) : ''}${route.mia ? '' : t('routes.list.owner', { name: escapeHtml(route.duenyo ?? '') })}` };
}

function cardHtml(card: RouteCard, index: number): string {
  const route = card.r, facts = routeFacts(card), editable = Boolean(route.mia) || cardSectionsLegacy.can('administrar');
  const actions = editable ? `<button class="btn sec chico" type="button" data-rned="${index}">${routeIcon('pencil')} ${t('routes.list.edit')}</button>
          <button class="btn sec chico rnico" type="button" data-rnbor="${index}" aria-label="${t('routes.list.removeRoute', { name: escapeHtml(route.nombre) })}" title="${t('routes.list.remove')}">${routeIcon('bin')}</button>`
    : `<button class="btn sec chico" type="button" data-rnver="${index}">${t('routes.list.see')}</button>`;
  return `<article class="rncard" data-rni="${index}"><div class="rncro">${routeSketch(card.ms)}<span class="rndia">${escapeHtml(whenText(route.repeticion ?? null))}</span></div>
        <div class="rntx"><b>${escapeHtml(route.nombre)}</b>
          <span class="sm">${facts.stops}</span>
          <span class="sm">${facts.hours}</span></div>
        <div class="rnacts"><button class="btn chico" type="button" data-rnag="${index}">${t('routes.list.toAgenda')}</button>
          ${actions}</div></article>`;
}

function pageHtml(cards: readonly RouteCard[]): string {
  return `
    <div class="saludo"><div><h1>${t('routes.list.title')}</h1><div class="fecha">${t('routes.list.subtitle')}</div></div>
      <div class="acts u-m-0"><button class="btn" id="rnueva">${t('routes.list.newRoute')}</button></div></div>
    <div class="rngrid" id="rngrid">${cards.map(cardHtml).join('')}
      <button class="rnnueva" type="button" id="rnnueva2"><span><span class="mas">+</span><b>${t('routes.list.newRouteCard')}</b><span class="sm">${t(cards.length ? 'routes.list.newRouteHint' : 'routes.list.firstRouteHint')}</span></span></button></div>
    <div id="rcuerpo" hidden></div><div id="rplan"></div>`;
}

async function removeRoute(route: SavedRoute): Promise<void> {
  if (!await notices.confirm(t('routes.list.removeText', { name: route.nombre }), { titulo: t('routes.list.removeTitle'), ok: t('routes.list.remove'), peligro: true })) return;
  const { error } = await legacyDb().rpc('guardar_ruta', { p: { id: route.id, activa: false } });
  if (error) { notices.toast(t('routes.list.couldNotRemove'), true); return; }
  notices.toast(t('routes.list.removed')); appLegacy.forgetCache(); routesLegacy.reload();
}

function bind(view: HTMLElement, cards: readonly RouteCard[]): void {
  const each = (attribute: string, action: (card: RouteCard, button: HTMLButtonElement) => void): void => {
    view.querySelectorAll<HTMLButtonElement>(`[data-${attribute}]`).forEach(button => {
      button.onclick = (): void => { const card = cards[Number(button.getAttribute(`data-${attribute}`))]; if (card) action(card, button); };
    });
  };
  ['rnueva', 'rnnueva2'].forEach(id => { const button = document.getElementById(id); if (button) button.onclick = (): void => { openRoute(null); }; });
  each('rned', card => { openRoute(card, 3); });
  each('rnver', card => { openRoute(card, 3); });
  each('rnag', (card, button) => { void copyToAgenda(card, button); });
  each('rnbor', card => { void removeRoute(card.r); });
}

/** Paints «Mis rutas» (or the wizard, with a route open). */
export async function paintRoutes(): Promise<void> {
  const view = document.getElementById('v-rutas');
  if (routesLegacy.draft()) { paintWizard(); return; }
  const { data } = await legacyDb().rpc<SavedRoute[]>('rutas_visibles');
  const routes = data ?? []; routesLegacy.setRoutes(routes);
  const cards = await Promise.all(routes.map(async route => ({ r: route, ms: await routeMembers(route) })));
  routesLegacy.setCards(cards);
  if (!view) return;
  view.innerHTML = pageHtml(cards);
  bind(view, cards);
}
