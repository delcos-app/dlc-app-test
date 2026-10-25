/** Shared pieces of the visit windows: how a visit was (in person, phone, video) and the pressed buttons. */
import { t, type MessageKey } from '../../i18n';

/** Results with this extra are negative («No estaba»…): only one of them, and never with a positive one. */
export const NEGATIVE = 'neg';

export const MODES: readonly (readonly [string, MessageKey])[] = [['presencial', 'visit.modes.inPerson'], ['telefono', 'visit.modes.phone'], ['video', 'visit.modes.video']];

/** The «Cómo fue» buttons; `attribute` is the data attribute of each one (vmodo in a new visit, evmodo when editing). */
export const modeButtons = (attribute: string, chosen: string): string =>
  MODES.map(([mode, label]) => `<button type="button" data-${attribute}="${mode}" class="${mode === chosen ? 'on' : ''}" aria-pressed="${String(mode === chosen)}">${t(label)}</button>`).join('');

export const pressed = (button: Element): boolean => button.getAttribute('aria-pressed') === 'true';

export function togglePressed(button: Element): boolean {
  const on = !pressed(button);
  button.setAttribute('aria-pressed', String(on));
  return on;
}
