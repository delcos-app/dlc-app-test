/**
 * The route cards of the professional's old home: «Rutas sugeridas» (who attends today, urgent, interested without a visit, never
 * visited; pressing one plans it) and «Pendientes de rutas anteriores». Migrated from the legacy tarjetasRuta (v2.418.0); the name
 * stays as an adapter (pantallas/inicio.js paints it). Plan 7.3 (cut C): it stays in the core, painted with Inicio; planning from
 * a card goes through the screen (the planner is in the Rutas chunk).
 */
import { goTo, legacyDb, term } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { planFromList } from '.';
import type { PlanMember } from './planner/plan';

const LIMIT = 40, MOUNT_MS = 60, SHOWN_PENDING = 5;

type Proposals = Record<string, PlanMember[] | string | undefined> & { dia?: string; pendientes?: (PlanMember & { especialidad?: string | null })[] };

const DAY_KEYS = new Map<string, MessageKey>([['L', 'routesMore.suggestions.monday'], ['M', 'routesMore.suggestions.tuesday'], ['X', 'routesMore.suggestions.wednesday'], ['J', 'routesMore.suggestions.thursday'], ['V', 'routesMore.suggestions.friday']]);

const listOf = (data: Readonly<Record<string, unknown>>, key: string): PlanMember[] => { const value = data[key]; return Array.isArray(value) ? value as PlanMember[] : []; };

function blocks(data: Proposals): [string, string, string][] {
  const day = t(DAY_KEYS.get(data.dia ?? '') ?? 'routesMore.suggestions.today');
  const all: [string, string, string][] = [
    ['hoy', '📅', t('routesMore.suggestions.attend', { day })],
    ['urgentes', '❗', t('routesMore.suggestions.urgent')],
    ['interesados', '🔥', t('routesMore.suggestions.interested', { interested: term('medico', { number: 'p', capital: 'C', adjective: 'interesado' }), visit: term('visita') })],
    ['sin_visitar', '🆕', t('routesMore.suggestions.neverVisited')],
  ];
  return all.filter(([key]) => listOf(data, key).length);
}

function suggestedHtml(data: Proposals): string {
  const found = blocks(data); if (!found.length) return '';
  return `<h2>${t('routesMore.suggestions.title')}</h2>
    <p class="sm">${t('routesMore.suggestions.hint')}</p>
    <div class="lista">${found.map(([key, symbol, title]) => `<button class="item" data-recruta="${key}">
      <span class="ic">${symbol}</span><span class="tx"><b>${title}</b>
        <span class="sm">${t('routesMore.suggestions.located', { count: formatNumber(listOf(data, key).length), professionals: term('medico', { number: 'p' }) })}</span></span>
      <span class="rn">${formatNumber(listOf(data, key).length)}</span></button>`).join('')}</div>
    <button class="verlo" data-ir-rutas>${t('routesMore.suggestions.allRoutes')}</button>`;
}

function pendingHtml(pending: NonNullable<Proposals['pendientes']>): string {
  if (!pending.length) return '';
  return `<h2><span class="u-warn">${t('routesMore.suggestions.pendingTitle')}</span>
      <span class="n">${pending.length}</span></h2>
    <p class="sm">${t('routesMore.suggestions.pendingHint')}</p>
    <div class="lista">${pending.slice(0, SHOWN_PENDING).map(item => `<button class="item" data-id="${item.id}">
      <span class="ic w">!</span><span class="tx"><b>${escapeHtml(item.nombre)}</b>
        <span class="sm">${escapeHtml(item.especialidad ?? '')} · ${escapeHtml(item.centro_nombre ?? item.municipio ?? '')}</span></span></button>`).join('')}</div>
    <button class="verlo" data-ir-agenda>${t('routesMore.suggestions.seeInAgenda', { count: pending.length })}</button>`;
}

export async function paintRouteCards(): Promise<void> {
  const suggested = document.getElementById('c-recom'), pendingBox = document.getElementById('c-pend');
  if (!suggested) return;
  const { data } = await legacyDb().rpc<Proposals>('propuestas_rutas', { lim: LIMIT });
  if (!data) { suggested.innerHTML = ''; return; }
  routes2Legacy.setProposals(data);
  suggested.innerHTML = suggestedHtml(data);
  suggested.querySelectorAll<HTMLElement>('[data-recruta]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      const key = button.dataset.recruta ?? '';
      goTo('rutas');
      // Wait for the Rutas screen to exist
      await new Promise(resolve => setTimeout(resolve, MOUNT_MS));
      await planFromList(listOf(routes2Legacy.proposals() ?? {}, key), key, button);
    };
  });
  const all = suggested.querySelector<HTMLElement>('[data-ir-rutas]'); if (all) all.onclick = (): void => { goTo('rutas'); };
  if (!pendingBox) return;
  pendingBox.innerHTML = pendingHtml(data.pendientes ?? []);
  const agenda = pendingBox.querySelector<HTMLElement>('[data-ir-agenda]'); if (agenda) agenda.onclick = (): void => { goTo('agenda'); };
}
