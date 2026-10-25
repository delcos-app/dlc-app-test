/**
 * The route wizard: create or edit a route in three steps (who, order and hours, preview and when), with its name proposed from the
 * day and the towns until the user writes one. Migrated from the legacy rnAbrir, rnCerrar and rnPintar (v2.414.0); rnAbrir stays
 * as an adapter (the tests open the wizard by that name).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { currentScreen, goTo } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { fromIsoDate } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { routeIcon, WEEKDAYS } from './model';
import { currentDraft, routeName, wizardHooks } from './state';
import { paintOrder } from './step-order';
import { paintWhen } from './step-when';
import { paintWho } from './step-who';

const STEPS: readonly MessageKey[] = ['routes.wizard.stepWho', 'routes.wizard.stepOrder', 'routes.wizard.stepWhen'];

const searchState = (): Pick<RouteDraft, 'q' | 'fil' | 'res' | 'mapa'> => ({ q: '', fil: { mios: true, urg: false, dia: false, nunca: false }, res: [], mapa: null });

/** A new route: every week on the next working day, from that day. */
function freshDraft(step: number): RouteDraft {
  const nextDay = routesLegacy.nextWorkingDay(), day = WEEKDAYS[Math.max(0, fromIsoDate(nextDay).getDay() - 1)] ?? 'L';
  return { id: null, nombre: '', auto: true, ms: [], rep: { tipo: 'semanal', dia: day, desde: nextDay }, salida: '09:00', vuelta: '', fijas: {}, ordenManual: false, paso: step, centros: [], ...searchState() };
}

function draftOf(card: RouteCard, step: number): RouteDraft {
  const route = card.r;
  return {
    id: route.id, nombre: route.nombre, auto: false, ms: card.ms.slice(), rep: route.repeticion ?? null,
    salida: route.salida ? String(route.salida).slice(0, 5) : '09:00', vuelta: route.vuelta ? String(route.vuelta).slice(0, 5) : '',
    fijas: { ...(route.fijas ?? {}) }, ordenManual: true, paso: step, centros: route.centros ?? [], ...searchState(),
  };
}

const newDraft = (card: RouteCard | null, step: number): RouteDraft => (card ? draftOf(card, step) : freshDraft(step));

/** Opens the wizard on `card` (a saved route with its members) or on a new route. */
export function openRoute(card: RouteCard | null, step = 1): void {
  routesLegacy.setDraft(newDraft(card, step));
  if (currentScreen() !== 'rutas') goTo('rutas'); else paintWizard();
}

/** Back to «Mis rutas»: the draft and its map go. */
function closeRoute(): void {
  routesLegacy.setDraft(null);
  const map = routesLegacy.map();
  if (map) { try { map.remove(); } catch { /* already gone */ } routesLegacy.setMap(null); }
  routesLegacy.reload();
}

function stepsHtml(draft: RouteDraft): string {
  return STEPS.map((key, index) => {
    const step = index + 1, state = step === draft.paso ? 'on' : step < draft.paso ? 'ok' : '';
    return `<button type="button" role="tab" data-rnp="${step}" class="${state}" aria-selected="${String(step === draft.paso)}" ${step > 1 && !draft.ms.length ? 'disabled' : ''}><i>${step < draft.paso ? '✓' : step}</i><span>${t(key)}</span></button>`;
  }).join('');
}

/** Paints the wizard on the current step. */
export function paintWizard(): void {
  const view = document.getElementById('v-rutas'), draft = currentDraft(); if (!view || !draft) return;
  view.innerHTML = `<div class="rnroot">
    <div><button class="rnvol" type="button" id="rnvol">${t('routes.wizard.back')}</button>
      <div class="rntit"><input id="rnnom" value="${escapeHtml(routeName(draft))}" aria-label="${t('routes.wizard.nameLabel')}" maxlength="80"><span class="rnlap">${routeIcon('pencil')}</span></div>
      <div class="sm rnnomsm">${t(draft.auto ? 'routes.wizard.autoNameHint' : 'routes.wizard.nameHint')}</div></div>
    <div class="rnpasos" role="tablist">${stepsHtml(draft)}</div>
    <div id="rnpaso"></div></div>`;
  const back = document.getElementById('rnvol'); if (back) back.onclick = closeRoute;
  const name = document.getElementById('rnnom') as HTMLInputElement | null;
  if (name) name.oninput = (): void => { draft.nombre = name.value; draft.auto = !name.value.trim(); };
  view.querySelectorAll<HTMLButtonElement>('[data-rnp]').forEach(button => { button.onclick = (): void => { if (button.disabled) return; draft.paso = Number(button.dataset.rnp); paintWizard(); }; });
  if (draft.paso === 1) void paintWho(); else if (draft.paso === 2) paintOrder(); else void paintWhen();
}

wizardHooks.repaint = paintWizard;
