/**
 * Step 1 of the route wizard, «A quién vas a ver»: search with filters (my portfolio, urgent, attend that day, never visited), the
 * list to pick from and the map with the route and the accounts that can be added. Migrated from the legacy rnBuscar, rnPaso1,
 * rnToggle, rnLista1 and rnMapa1 (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { legacyDb, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { hasLocation, routeIcon, stepFooter, titleCase, weekdayName } from './model';
import { newMap, paintLayers } from './map';
import { bestOrderOf } from './step-order';
import { currentDraft, routeName, unfix, wizardHooks } from './state';

const SEARCH_LIMIT = 200, SHOWN = 120, SEARCH_WAIT_MS = 300;

async function search(draft: RouteDraft): Promise<void> {
  const filters = draft.fil, day = draft.rep?.dia;
  const { data } = await legacyDb().rpc<{ filas?: RouteMember[] }>('buscar_cuentas', {
    q: draft.q || null, f_provincia: null, f_municipio: null, f_estado: null, f_especialidad: null, f_area: null,
    f_urgentes: Boolean(filters.urg), f_mios: Boolean(filters.mios), f_sin_visitar: Boolean(filters.nunca), f_comercial: null, f_reporting: null, orden: null, lim: SEARCH_LIMIT, desplaz: 0,
  });
  let found = data?.filas ?? [];
  // Without a portfolio of their own (e.g. administration), «Mi cartera» turns itself off the first time
  if (filters.mios && !found.length && !draft.q && !draft.sinCartera) { draft.sinCartera = true; filters.mios = false; await search(draft); return; }
  if (filters.dia && day) found = found.filter(member => member.dias?.[day]);
  draft.res = found;
}

function attendText(member: RouteMember, day: string | undefined): string {
  if (!day || !member.dias) return '';
  const hours = member.dias[day];
  return hours ? t('routes.who.attends', { hours: escapeHtml(String(hours)) }) : t('routes.who.notAttending', { day: weekdayName(day) });
}

function optionHtml(member: RouteMember, chosen: boolean, day: string | undefined): string {
  return `<button type="button" class="rnopt ${chosen ? 'on' : ''}" data-rnm="${member.id}" aria-pressed="${String(chosen)}">
      <span class="ck">${chosen ? routeIcon('check') : ''}</span>
      <span class="tx"><b>${escapeHtml(member.nombre)}</b><span class="sm">${escapeHtml([member.centro_nombre, titleCase(member.municipio)].filter(Boolean).join(' · '))}${attendText(member, day)}</span></span>
      <span class="tag ${member.urgente ? 'u' : ''}">${member.urgente ? t('routes.who.urgentTag') : escapeHtml(member.estado_comercial ?? '')}</span></button>`;
}

/** The chosen ones that the search does not show first, then the search results. */
function paintList(): void {
  const box = document.getElementById('rnres'), draft = currentDraft(); if (!box || !draft) return;
  const chosen = new Set(draft.ms.map(member => member.id)), day = draft.rep?.dia;
  const list = [...draft.ms.filter(member => !draft.res.some(found => found.id === member.id)), ...draft.res];
  box.innerHTML = list.length ? list.slice(0, SHOWN).map(member => optionHtml(member, chosen.has(member.id), day)).join('')
    : `<div class="vacio">${t('routes.who.noneWithFilters', { professionals: term('medico', { number: 'p' }) })}</div>`;
  box.querySelectorAll<HTMLElement>('[data-rnm]').forEach(button => { button.onclick = (): void => { const member = list.find(item => item.id === button.dataset.rnm); if (member) toggle(member); }; });
}

async function mapReady(element: HTMLElement): Promise<void> {
  const current = routesLegacy.map();
  if (current && current.getContainer() === element) return;
  let pending = routesLegacy.pendingMap();
  if (pending?.el !== element) {
    pending = Object.assign(newMap(element).then(({ library, map }) => { map.__ml = library; }), { el: element });
    routesLegacy.setPendingMap(pending);
  }
  await pending;
}

/** The map of step 1: the chosen ones numbered with the line from the start point, and the others to add. */
async function paintMap(): Promise<void> {
  const element = document.getElementById('rnmc'); if (!element || !currentDraft()) return;
  await mapReady(element);
  const map = routesLegacy.map(), draft = currentDraft();
  if (!draft || !map?.__ml || map.getContainer() !== document.getElementById('rnmc')) return;
  const chosen = new Set(draft.ms.map(member => member.id)), home = routesLegacy.start();
  const line: [number, number][] = [...(home.lat !== null && home.lat !== undefined && draft.ms.length ? [[Number(home.lon), Number(home.lat)] as [number, number]] : []),
    ...draft.ms.filter(hasLocation).map(member => [Number(member.lon), Number(member.lat)] as [number, number])];
  paintLayers(map, map.__ml, { members: draft.ms, others: draft.res.filter(member => !chosen.has(member.id)), line, fit: !map.__ya, onPick: toggle });
}

/** Adds or removes an account from the route (the order goes back to automatic). */
function toggle(member: RouteMember): void {
  const draft = currentDraft(); if (!draft) return;
  const index = draft.ms.findIndex(item => item.id === member.id);
  if (index >= 0) { draft.ms.splice(index, 1); unfix(draft, member.id); } else draft.ms.push(member);
  draft.ordenManual = false;
  const count = document.getElementById('rnn'); if (count) count.textContent = String(draft.ms.length);
  const next = document.getElementById('rnsig1') as HTMLButtonElement | null; if (next) next.disabled = !draft.ms.length;
  const name = document.getElementById('rnnom') as HTMLInputElement | null; if (draft.auto && name) name.value = routeName(draft);
  document.querySelectorAll<HTMLButtonElement>('[data-rnp="2"], [data-rnp="3"]').forEach(button => { button.disabled = !draft.ms.length; });
  paintList(); void paintMap();
}

function stepHtml(draft: RouteDraft): string {
  const day = draft.rep?.dia, filter = (key: string, label: string, id = ''): string => `<button type="button" data-rnf="${key}" class="${draft.fil[key] ? 'on' : ''}"${id ? ` id="${id}"` : ''}>${label}</button>`;
  return `<div class="rnb1"><div class="rnsel">
      <div class="rnbus">${routeIcon('search')}<input id="rnq" placeholder="${t('routes.who.search')}" value="${escapeHtml(draft.q)}" autocomplete="off"></div>
      <div class="rnfil" role="group" aria-label="${t('routes.who.filters')}">
        ${filter('mios', t('routes.who.mine'), 'rnfmios')}${filter('urg', t('routes.who.urgent'))}
        ${day ? filter('dia', t('routes.who.attendDay', { day: weekdayName(day) })) : ''}${filter('nunca', t('routes.who.neverVisited'))}</div>
      <div class="rnres" id="rnres"><div class="sm" style="padding:10px 4px">${t('routes.who.searching')}</div></div></div>
    <div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnley"><span><i style="background:#17457A"></i>${t('routes.who.inRoute')}</span><span><i style="background:#9FB6CE"></i>${t('routes.who.toAdd')}</span><span><i style="background:#E08A00"></i>${t('routes.who.urgentLegend')}</span></div></div></div>
    ${stepFooter(t('routes.who.chosen', { count: draft.ms.length }), `<button class="btn" type="button" id="rnsig1" ${draft.ms.length ? '' : 'disabled'}>${t('routes.who.nextStep')}</button>`)}`;
}

const refresh = async (draft: RouteDraft): Promise<void> => { await search(draft); paintList(); void paintMap(); };

function bind(box: HTMLElement, draft: RouteDraft): void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const query = document.getElementById('rnq') as HTMLInputElement | null;
  if (query) query.oninput = (): void => { draft.q = query.value; clearTimeout(timer); timer = setTimeout(() => { void refresh(draft); }, SEARCH_WAIT_MS); };
  box.querySelectorAll<HTMLElement>('[data-rnf]').forEach(button => { button.onclick = (): void => {
    const key = button.dataset.rnf ?? ''; draft.fil[key] = !draft.fil[key]; button.classList.toggle('on'); void refresh(draft);
  }; });
  const next = document.getElementById('rnsig1'); if (next) next.onclick = (): void => { draft.paso = 2; if (!draft.ordenManual) bestOrderOf(draft); wizardHooks.repaint(); };
}

/** Paints step 1 and searches with the current filters. */
export async function paintWho(): Promise<void> {
  const box = document.getElementById('rnpaso'), draft = currentDraft(); if (!box || !draft) return;
  box.innerHTML = stepHtml(draft);
  bind(box, draft);
  await search(draft); if (!document.getElementById('rnres')) return;
  document.getElementById('rnfmios')?.classList.toggle('on', Boolean(draft.fil.mios));
  paintList(); void paintMap();
}
