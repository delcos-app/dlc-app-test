/**
 * The customer picker of an order: search by name, phone or tax id, or «+ Nuevo»; once chosen, its card with «✕». Migrated from
 * the legacy selectorPaciente (v2.411.0); selectorPaciente stays as an adapter (Pedidos uses it).
 */
import { legacyDb } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { customerCard, phoneOf, words, type Customer } from './model';

const MIN_LETTERS = 2, WAIT_MS = 250, SHOWN = 8;

interface Found extends Customer { medico?: string | null }

export interface PickerOptions { valor?: Customer | null; alElegir?: (customer: Customer | null) => void }

const foundRow = (item: Found, index: number): string => `<button type="button" data-pc="${index}"><span class="gic">🧑</span>
          <span><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml([phoneOf(item), item.nif, item.municipio, item.medico].filter(Boolean).join(' · '))}</span></span></button>`;

class CustomerPicker {
  private value: Customer | null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private asked = 0;

  constructor(private readonly element: HTMLElement, private readonly options: PickerOptions) {
    this.value = options.valor ?? null;
  }

  private choose(customer: Customer | null): void {
    this.value = customer; this.paint(); this.options.alElegir?.(customer);
  }

  paint(): void {
    if (this.value) {
      this.element.innerHTML = customerCard(this.value);
      const remove = this.element.querySelector<HTMLElement>('.sx'); if (remove) remove.onclick = (): void => { this.choose(null); };
      return;
    }
    this.element.innerHTML = `<div class="u-flex u-gap-8"><div class="picker u-flex-1">
        <input type="search" autocomplete="off" placeholder="${t('customers.picker.placeholder')}"><div class="gsug hide"></div></div>
      <button type="button" class="btn sec" data-pnuevo>${t('customers.picker.newOne')}</button></div>`;
    const input = this.element.querySelector('input');
    if (input) input.oninput = (): void => { this.search(input.value.trim()); };
    const add = this.element.querySelector<HTMLElement>('[data-pnuevo]');
    if (add) add.onclick = (): void => { customersLegacy.editCustomer({ nombre: input?.value.trim() ?? '' }, customer => { this.choose({ ...customer }); }); };
  }

  private search(text: string): void {
    const box = this.element.querySelector('.picker'), list = box?.querySelector('.gsug');
    if (!box || !list) return;
    clearTimeout(this.timer);
    if (text.length < MIN_LETTERS) { list.classList.add('hide'); box.classList.remove('buscando'); return; }
    box.classList.add('buscando');
    list.innerHTML = `<div class="gload"><span class="spin"></span>${t('customers.picker.searching', words())}</div>`; list.classList.remove('hide');
    const turn = ++this.asked;
    this.timer = setTimeout(() => { void this.showFound(text, turn, box, list); }, WAIT_MS);
  }

  private async showFound(text: string, turn: number, box: Element, list: Element): Promise<void> {
    const { data } = await legacyDb().rpc<Found[]>('contactos_lista', { q: text, lim: SHOWN });
    if (turn !== this.asked) return;
    box.classList.remove('buscando');
    const found = data ?? [];
    list.innerHTML = `<div class="gsh">${words().Patients}</div>${found.map(foundRow).join('') || `<div class="gload">${t('customers.picker.noMatches')}</div>`}`;
    list.querySelectorAll<HTMLElement>('[data-pc]').forEach(button => { button.onclick = (): void => { this.choose(found[Number(button.dataset.pc)] ?? null); }; });
  }
}

/** Paints the picker in `element`. */
export function pickCustomer(element: HTMLElement, options: PickerOptions): void {
  new CustomerPicker(element, options).paint();
}
