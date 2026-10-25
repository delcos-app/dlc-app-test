/**
 * Password strength (0 very weak … 4 very strong) and the meter under a password field, with the check of the repeated password.
 * Migrated from the legacy seguridadClave and medidorClave (v2.414.0); medidorClave stays as an adapter (Configuración, legado 047).
 */
import { t, type MessageKey } from '../../i18n';

const MIN_LENGTH = 8, GOOD_LENGTH = 12, LONG_LENGTH = 16, MAX_LEVEL = 4;
const LEVELS: readonly MessageKey[] = ['access.strength.veryWeak', 'access.strength.weak', 'access.strength.fair', 'access.strength.strong', 'access.strength.veryStrong'];
const COLOURS = ['#C24141', '#D9480F', '#D97706', '#12805C', '#0F6E4C'];
const CHARACTER_KINDS = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];
const OBVIOUS = /^(1234|abcd|qwer|contrase|password|dlc)/i;

export interface Strength { readonly level: number; readonly text: string }

/** How safe a password is: level -1 when empty, 0 very weak … 4 very strong. */
export function passwordStrength(password: string): Strength {
  if (!password) return { level: -1, text: '' };
  let points = [MIN_LENGTH, GOOD_LENGTH, LONG_LENGTH].filter(length => password.length >= length).length;
  points += Math.max(0, CHARACTER_KINDS.filter(kind => kind.test(password)).length - 1);
  if (/^(.)\1+$/.test(password) || (OBVIOUS.test(password) && password.length < GOOD_LENGTH)) points = Math.min(points, 1);
  const level = password.length < MIN_LENGTH ? 0 : Math.min(MAX_LEVEL, Math.max(1, points - 1));
  return { level, text: t(LEVELS[level] ?? 'access.strength.veryWeak') };
}

const requirementsMet = (password: string): Readonly<Record<string, boolean>> => ({
  len: password.length >= MIN_LENGTH, may: /[a-z]/.test(password) && /[A-Z]/.test(password), num: /\d/.test(password), sim: /[^A-Za-z0-9]/.test(password),
});

const meterHtml = (): string => `<div class="clavemed"><div class="clavebar"><i></i><i></i><i></i><i></i></div><span class="clavetxt"></span>
    <ul class="clavereq"><li data-r="len">${t('access.strength.length')}</li><li data-r="may">${t('access.strength.cases')}</li><li data-r="num">${t('access.strength.number')}</li><li data-r="sim">${t('access.strength.symbol')}</li></ul></div>`;

function paintMeter(meter: Element, password: string): void {
  const strength = passwordStrength(password), colour = COLOURS[Math.max(0, strength.level)] ?? '';
  meter.querySelectorAll<HTMLElement>('.clavebar i').forEach((bar, index) => { bar.style.background = password && index < Math.max(1, strength.level) ? colour : ''; });
  const text = meter.querySelector<HTMLElement>('.clavetxt');
  if (text) { text.textContent = password ? strength.text : ''; text.style.color = colour; }
  const met = requirementsMet(password);
  meter.querySelectorAll<HTMLElement>('[data-r]').forEach(item => item.classList.toggle('ok', Boolean(met[item.dataset.r ?? ''])));
}

/** Whether the repetition matches (and its line under the field). */
function paintRepeat(repeat: HTMLInputElement, password: string): boolean {
  const line = repeat.nextElementSibling as HTMLElement | null, same = Boolean(repeat.value) && repeat.value === password;
  if (line) {
    line.textContent = !repeat.value ? '' : t(same ? 'access.strength.match' : 'access.strength.noMatch');
    line.style.color = same ? 'var(--ok)' : 'var(--dang)';
  }
  return same;
}

/** Adds the meter under a password field (and the check of its repetition, if any); `button` is enabled only when valid. */
export function addPasswordMeter(input: HTMLInputElement | null, repeat?: HTMLInputElement | null, button?: HTMLButtonElement | null): void {
  if (!input || input.dataset.medidor) return;
  input.dataset.medidor = '1';
  input.insertAdjacentHTML('afterend', meterHtml());
  const meter = input.nextElementSibling;
  if (repeat) repeat.insertAdjacentHTML('afterend', '<div class="clavecoin sm"></div>');
  const update = (): void => {
    const password = input.value;
    if (meter) paintMeter(meter, password);
    let valid = password.length >= MIN_LENGTH;
    if (repeat) valid = paintRepeat(repeat, password) && valid;
    if (button) button.disabled = !valid;
  };
  input.addEventListener('input', update); repeat?.addEventListener('input', update); update();
}
