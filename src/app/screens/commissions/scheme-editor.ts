/**
 * The window of a commission scheme: name, how it counts, calculation (tier reached, marginal tiers or a fixed amount per unit),
 * channel, the tiers and who is paid with it. Migrated from the legacy editorEsquema (v2.411.0); editorEsquema stays as an adapter.
 */
import { legacyDb, notices, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { nonZeroOr } from '../../services/values';
import { schemes, type Scheme, type Tier } from './model';
import { paintSchemePeople } from './scheme-people';

const FIXED = 'fijo', DEFAULT_CALCULATION = 'tramo_alcanzado';

const option = (value: string, label: string, chosen: string | null | undefined): string => `<option value="${value}" ${chosen === value ? 'selected' : ''}>${label}</option>`;
const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;

class SchemeEditor {
  private tiers: Tier[];
  private calculation: string;
  private fixedValue: number | string;

  constructor(private readonly id: string | null, private readonly scheme: Scheme | null, private readonly onSaved: () => void) {
    this.tiers = scheme?.tramos?.length ? scheme.tramos.slice() : [{ desde_u: 0, hasta_u: 100, valor: 1 }];
    this.calculation = scheme?.calculo ?? DEFAULT_CALCULATION;
    this.fixedValue = nonZeroOr(scheme?.valor_fijo, 1);
  }

  private get fixed(): boolean { return this.calculation === FIXED; }

  private tiersHtml(): string {
    if (this.fixed) return '';
    return `<label>${t('commissions.editor.tiers')} <span class="sm">${t('commissions.editor.tiersHint')}</span></label>
      <div class="trcab" aria-hidden="true"><span>${t('commissions.editor.from')}</span><span>${t('commissions.editor.to')}</span><span>${t('commissions.editor.perUnit')}</span></div>
      <div id="etramos">${this.tiers.map((tier, index) => `<div class="g2" style="margin-bottom:8px">
        <input data-td="${index}" type="number" min="0" value="${tier.desde_u}" placeholder="${t('commissions.editor.fromPlaceholder')}">
        <input data-th="${index}" type="number" min="0" value="${tier.hasta_u ?? ''}" placeholder="${t('commissions.editor.toPlaceholder')}">
        <input data-tv="${index}" type="number" step="0.01" min="0" value="${tier.valor}" placeholder="${t('commissions.editor.perUnitPlaceholder')}">
        ${this.tiers.length > 1 ? `<button type="button" class="btn sec" data-tx="${index}">✕</button>` : ''}</div>`).join('')}</div>
      <div class="acts"><button type="button" class="btn sec" id="etmas">${t('commissions.editor.addTier')}</button></div>`;
  }

  private html(): string {
    const scheme = this.scheme;
    return `
      <div class="fh"><div><h2>${t(this.id ? 'commissions.editor.editTitle' : 'commissions.editor.newTitle')}</h2>
        <div class="sm">${t('commissions.editor.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <label for="enom">${t('commissions.editor.name')}</label><input id="enom" value="${escapeHtml(scheme ? scheme.nombre : '')}" placeholder="${t('commissions.editor.namePlaceholder')}">
      <div class="g2">
        <div><label for="eatr">${t('commissions.editor.countedBy')}</label><select id="eatr">
          ${option('comercial', t('commissions.editor.portfolio'), scheme?.atribucion)}
          ${option('cierra', t('commissions.editor.closes'), scheme?.atribucion)}</select></div>
        <div><label for="ecalc">${t('commissions.editor.calculation')}</label><select id="ecalc">
          ${option(DEFAULT_CALCULATION, t('commissions.editor.tierReached'), this.calculation)}
          ${option('marginal', t('commissions.editor.marginal'), this.calculation)}
          ${option(FIXED, t('commissions.editor.fixed'), this.calculation)}</select></div>
      </div>
      <div class="g2">
        <div><label for="ecan">${t('commissions.editor.channel')}</label><select id="ecan">
          <option value="">${t('commissions.editor.allChannels')}</option>
          ${option('paciente', t('commissions.editor.patientOnly', { toThePatient: term('paciente', { article: 'al' }) }), scheme?.canal)}
          ${option('centro', t('commissions.editor.centreOnly'), scheme?.canal)}</select></div>
        ${this.fixed ? `<div><label for="efijo">${t('commissions.editor.eurosPerUnit')}</label><input id="efijo" type="number" step="0.01" min="0" value="${this.fixedValue}"></div>` : '<div></div>'}
      </div>
      ${this.tiersHtml()}
      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t('commissions.editor.cancel')}</button>
        <button class="btn" id="eguardaresq">${t(this.id ? 'commissions.editor.save' : 'commissions.editor.create')}</button></div>`;
  }

  /** Reads the tiers as they are written. */
  private read(): void {
    const box = document.getElementById('etramos'); if (this.fixed || !box) return;
    this.tiers = [...box.children].map((row, index) => {
      const value = (attribute: string): string => row.querySelector<HTMLInputElement>(`[data-${attribute}="${index}"]`)?.value ?? '';
      return { desde_u: Number(value('td')) || 0, hasta_u: value('th') === '' ? null : Number(value('th')), valor: Number(value('tv')) || 0 };
    });
  }

  paint(): void {
    const body = document.getElementById('dbody'); if (!body) return;
    body.innerHTML = this.html();
    const calculation = document.getElementById('ecalc') as HTMLSelectElement | null;
    if (calculation) calculation.onchange = (): void => { this.read(); const fixed = input('efijo'); if (fixed) this.fixedValue = fixed.value; this.calculation = calculation.value; this.paint(); };
    const add = document.getElementById('etmas');
    if (add) add.onclick = (): void => { this.read(); this.addTier(); this.paint(); };
    body.querySelectorAll<HTMLElement>('[data-tx]').forEach(button => { button.onclick = (): void => { this.read(); this.tiers.splice(Number(button.dataset.tx), 1); this.paint(); }; });
    void paintSchemePeople(this.id);
    const save = document.getElementById('eguardaresq') as HTMLButtonElement | null;
    if (save) save.onclick = (): void => { void this.save(save); };
  }

  private addTier(): void {
    const last = this.tiers[this.tiers.length - 1] ?? { desde_u: 0, hasta_u: null, valor: 0 };
    this.tiers.push({ desde_u: nonZeroOr(last.hasta_u, last.desde_u) + 1, hasta_u: null, valor: last.valor });
  }

  /** What guardar_esquema receives. */
  private payload(name: string): Record<string, unknown> {
    const select = (id: string): string => (document.getElementById(id) as HTMLSelectElement | null)?.value ?? '';
    return {
      id: this.id, nombre: name, atribucion: select('eatr'), calculo: this.calculation, canal: select('ecan') || null,
      valor_fijo: this.fixed ? input('efijo')?.value : null, ...(this.fixed ? {} : { tramos: this.tiers }),
    };
  }

  private async save(button: HTMLButtonElement): Promise<void> {
    this.read();
    const name = input('enom')?.value.trim() ?? '';
    if (!name) { notices.toast(t('commissions.editor.giveName'), true); return; }
    button.disabled = true; button.textContent = t('commissions.editor.saving');
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_esquema', { p: this.payload(name) });
    button.disabled = false; button.textContent = t(this.id ? 'commissions.editor.save' : 'commissions.editor.create');
    if (error || result?.ok === false) { notices.toast(t('commissions.editor.couldNotSave'), true); return; }
    (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('commissions.editor.saved')); this.onSaved();
  }
}

/** Opens the scheme `id` (or a new one); `onSaved` repaints the page. */
export function editScheme(id: string | null, onSaved: () => void): void {
  const scheme = id ? schemes().find(item => item.id === id) ?? null : null;
  new SchemeEditor(id, scheme, onSaved).paint();
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}
