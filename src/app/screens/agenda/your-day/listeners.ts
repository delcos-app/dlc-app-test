/**
 * The listeners of «Tu día» (one for the whole app each), installed at start-up: the compact toggle, the «i» of a warning and the
 * buttons of the cards and tasks. Plan 7.3 (cut C): they stay in the core and say which button was pressed; what the buttons of the
 * cards do is in the Agenda chunk (card-buttons.ts), called through the screen (already here whenever «Tu día» is painted).
 */
import { yourDayLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { answerCardClick } from '..';
import { applyCompact, compact, rememberCompact, setCompactButton } from './compact';

/** The kinds of buttons of «Tu día» (card-buttons.ts answers each). */
export type CardClick = 'order' | 'arrow' | 'newTask' | 'task' | 'card';

/** The compact toggle and the «i» of a warning (one listener each for the whole app); the compact mode applies on start. */
export function listenToYourDay(): void {
  applyCompact();
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('#tdcompactar') : null; if (!button) return;
    const value = !compact();
    rememberCompact(value);
    applyCompact(); setCompactButton(button, value);
  });
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-tdavi]') : null; if (!button) return;
    event.stopPropagation();
    const info = yourDayLegacy.stopInfo()[button.dataset.tdavi ?? '']; if (!info) return;
    yourDayLegacy.showDialog(t('agenda.yourDay.whyWarning'), yourDayLegacy.explainWarning(info), t('agenda.yourDay.understood'));
  }, true);
}

/** Which button of «Tu día» this is, in the same order as before: «Ordenar por cercanía», a task arrow, «+ Tarea», a task, a card. */
function cardClickOf(target: Element): CardClick | null {
  if (target.closest('#tdordenar, #tdnocord')) return 'order';
  if (target.closest('[data-tamov]')) return 'arrow';
  if (target.closest('#tdtarea')) return 'newTask';
  if (target.closest('#tdtareas .tdtarea')) return 'task';
  return target.closest('[data-td]') ? 'card' : null;
}

/** The buttons of «Tu día» (data-td, data-tamov, the tasks and «Ordenar por cercanía»): one listener for the whole app. */
export function listenToCards(): void {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const kind = target ? cardClickOf(target) : null;
    if (!target || !kind) return;
    // A card button does not reach the listeners of the page (as before)
    if (kind === 'card') event.stopPropagation();
    void answerCardClick(kind, target);
  });
}
