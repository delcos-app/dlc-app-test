/**
 * The sector modules in Configuración (plan 12.2, CFG-1, v2.469.0): each module's section starts with a card that says whether the
 * company uses it. Without it, the empty state «Todavía no usas… · Crear el primero» opens what creates the first one (a surgery, a
 * tender, a consignment at a centre, a product installed with a serial number); once created, the module appears in the menu, Inicio
 * and the account card. Ventas → Servicios con material and Ventas → Contratos, Stock y material → Material en depósito and
 * Activos instalados.
 */
import { callRpc, cycleLegacy, editorLegacy, goTo, notices } from '../../../legacy/bridge';
import { shellLegacy } from '../../../legacy/shell-bridge';
import { t, type MessageKey } from '../../../i18n';
import { SETTING_IN_USE, moduleInUse, type SectorModule } from '../../../core/modules-in-use';
import { editSurgery } from '../../surgeries';
import { editTender } from '../../tenders';
import { showDeposit } from '../../products';
import { paintRuleCards } from './card';

/** What each module's card says and does. `create` opens what makes the first one; `open` is its page, when it has one. */
interface ModuleCard { key: SectorModule; texts: string; create: () => unknown; open?: string }

const CARDS: Readonly<Record<SectorModule, ModuleCard>> = {
  cirugias: { key: 'cirugias', texts: 'surgeries', create: () => editSurgery(null), open: 'cirugias' },
  concursos: { key: 'concursos', texts: 'tenders', create: () => editTender(null), open: 'concursos' },
  deposito: { key: 'deposito', texts: 'deposit', create: () => { chooseDepositCentre(); }, open: 'deposito' },
  parque: { key: 'parque', texts: 'equipment', create: () => { goTo('productos'); }, open: 'parque' },
};

const text = (card: ModuleCard, part: string): string => t(`settingsRules.modules.${card.texts}.${part}` as MessageKey);

/** The card of the module: in use (with the way to its page) or its empty state. */
export function moduleCardHtml(key: SectorModule): string {
  const card = CARDS[key], id = `mu${key}`;
  if (moduleInUse(key)) {
    return `<div class="card cfgpanel" id="${id}" data-en-uso="1"><h2>${text(card, 'title')}</h2>
      <p class="sm"><span class="pill p-est">${t('settingsRules.modules.inUse')}</span> ${text(card, 'used')}</p>
      ${card.open ? `<div class="acts u-start"><button type="button" class="btn sec" id="${id}ir">${text(card, 'open')}</button></div>` : ''}</div>`;
  }
  return `<div class="card cfgpanel" id="${id}" data-en-uso="0"><h2>${text(card, 'title')}</h2>
    <div class="vacio vguia"><b>${text(card, 'none')}</b><span>${text(card, 'hint')}</span>
      <button type="button" class="btn" id="${id}crear">${text(card, 'create')}</button></div></div>`;
}

/** Reads again which modules are in use; when something changed, the menu and the open card follow. */
export async function refreshModulesInUse(): Promise<void> {
  const { data, error } = await callRpc<Record<string, boolean>>('modulos_en_uso');
  if (error || !data || typeof data !== 'object') return;
  const before = JSON.stringify(cycleLegacy.setting(SETTING_IN_USE) ?? null);
  cycleLegacy.setSetting(SETTING_IN_USE, data);
  if (before === JSON.stringify(data)) return;
  shellLegacy.applyMenuPermissions();
  for (const key of Object.keys(CARDS) as SectorModule[]) {
    const shown = document.getElementById(`mu${key}`);
    if (shown) { shown.outerHTML = moduleCardHtml(key); bindModuleCard(key); }
  }
}

/** After the window that creates the first one closes, the module may be in use. */
function refreshWhenClosed(): void {
  const dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  dialog?.addEventListener('close', () => { void refreshModulesInUse(); }, { once: true });
}

export function bindModuleCard(key: SectorModule): void {
  const card = CARDS[key], create = document.getElementById(`mu${key}crear`), open = document.getElementById(`mu${key}ir`);
  if (create) create.onclick = async (): Promise<void> => { await card.create(); refreshWhenClosed(); };
  if (open && card.open) { const page = card.open; open.onclick = (): void => { goTo(page); }; }
}

/** Depósito: the material is left at a centre, chosen here; its window opens to leave it (also the main button of «Depósitos»). */
export function chooseDepositCentre(): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = `<div class="fh"><div><h2>${t('settingsRules.modules.deposit.chooseTitle')}</h2><div class="sm">${t('settingsRules.modules.deposit.chooseHint')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label>${t('settingsRules.modules.deposit.centre')}</label><div id="mudepcta"></div>
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar>${t('common.cancel')}</button></div>`;
  if (!box.open) box.showModal();
  editorLegacy.pickAccount(document.getElementById('mudepcta'), null, async account => {
    if (!account.id) { notices.toast(t('settingsRules.modules.deposit.noCentre'), true); return; }
    await showDeposit(account.id, account.nombre ?? '', '');
    refreshWhenClosed();
  }, t('settingsRules.modules.deposit.centrePlaceholder'));
}

/** The cards of a section: the module first, then the section's own cards (if any), all painted at once. */
export async function paintWithModule(key: SectorModule, cards: Parameters<typeof paintRuleCards>[0] = []): Promise<void> {
  await paintRuleCards([{ id: `mu${key}`, html: () => moduleCardHtml(key), save: () => Promise.resolve() }, ...cards]);
  bindModuleCard(key);
}

/** Ventas → Contratos, Stock y material → Material en depósito and Activos instalados: only the module's card. */
export const paintContractsSettings = (): Promise<void> => paintWithModule('concursos');
export const paintConsignmentSettings = (): Promise<void> => paintWithModule('deposito');
export const paintInstalledSettings = (): Promise<void> => paintWithModule('parque');
