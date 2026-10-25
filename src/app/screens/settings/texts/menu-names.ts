/**
 * Organización → Empresa → «Textos personalizados»: a table with each module of the menu, its name of always and the one the company
 * wants (blank, the one of always). The one of the cards (directorio) is the brand label. Migrated from the legacy pintarTextos
 * (v2.417.0); the old list version (TX, txPintar, txGuardar) was no longer reachable and is removed.
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const CONTACTS = 'directorio', HIDDEN = ['config', 'delcos', 'manual'];
const MAX_LENGTH = 30;

interface MenuRow { module: string; byDefault: string; value: string }
interface Brand { etiqueta?: string; [key: string]: unknown }

const brand = (): Brand => (settingsExtraLegacy.setting('marca') ?? {}) as Brand;
const contactsDefault = (): string => term('medico', { number: 'p', capital: 'C' });
/** The label saved only counts when it differs from the default one. */
const contactsLabel = (): string => ((brand().etiqueta ?? '') !== contactsDefault() ? brand().etiqueta ?? '' : '');

function menuRows(): MenuRow[] {
  const names = settingsExtraLegacy.menuNames(), seen = new Set<string>(), excluded = settingsExtraLegacy.menuExcluded();
  return [...document.querySelectorAll<HTMLElement>('nav.main [data-t]')].filter(button => {
    const module = button.dataset.t ?? '';
    if (seen.has(module) || excluded.includes(module) || HIDDEN.includes(module) || button.classList.contains('hide')) return false;
    seen.add(module); return true;
  }).map(button => {
    const module = button.dataset.t ?? '', current = settingsExtraLegacy.menuText(button)?.get();
    const byDefault = module === CONTACTS ? contactsDefault() : orFallback(button.dataset.txdef, orFallback(current, module));
    return { module, byDefault, value: module === CONTACTS ? contactsLabel() : names[module] ?? '' };
  });
}

function rowHtml(row: MenuRow): string {
  return `<div class="txmf" role="row"><span class="txmico" role="cell">${settingsExtraLegacy.moduleIcon(row.module) ?? '•'}</span><span role="cell" class="txmdef">${escapeHtml(row.byDefault)}</span>
      <span role="cell"><input data-txm="${row.module}" value="${escapeHtml(row.value)}" placeholder="${escapeHtml(row.byDefault)}" maxlength="${MAX_LENGTH}" aria-label="${escapeHtml(t('settingsExtra.menuNames.nameOf', { name: row.byDefault }))}"></span></div>`;
}

async function saveContactsLabel(label: string): Promise<void> {
  const value = { ...brand(), etiqueta: label || contactsDefault() };
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'marca', p_valor: value });
  if (!error && data?.ok !== false) { settingsExtraLegacy.setSetting('marca', value); settingsExtraLegacy.applyLabel(); }
}

async function save(): Promise<void> {
  // Read where the page is now (Configuración may have moved the panel since it was painted)
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const names: Record<string, string> = {}, read: { contacts: string | null } = { contacts: null };
  box.querySelectorAll<HTMLInputElement>('[data-txm]').forEach(input => {
    const value = input.value.trim(), module = input.dataset.txm ?? '';
    if (module === CONTACTS) read.contacts = value; else if (value) names[module] = value;
  });
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'menu_nombres', p_valor: names });
  if (error || data?.ok === false) { notices.toast(t('settingsExtra.menuNames.couldNotSave'), true); return; }
  settingsExtraLegacy.setSetting('menu_nombres', names);
  if (read.contacts !== null && read.contacts !== contactsLabel()) await saveContactsLabel(read.contacts);
  settingsExtraLegacy.applyMenuNames();
  notices.toast(t('settingsExtra.menuNames.saved'));
}

export async function paintMenuNames(): Promise<void> {
  await settingsExtraLegacy.loadSettings();
  const rows = menuRows(), box = document.getElementById('cfgcuerpo'); if (!box) return;
  const help = settingsExtraLegacy.helpButton(t('settingsExtra.menuNames.title'), t('settingsExtra.menuNames.help'));
  box.innerHTML = `<div class="card cfgpanel txmenu"><h2>${t('settingsExtra.menuNames.title')} ${help}</h2>
    <div class="txmtab" role="table"><div class="txmf txmcab" role="row"><span></span><span role="columnheader">${t('settingsExtra.menuNames.module')}</span><span role="columnheader">${t('settingsExtra.menuNames.companyName')}</span></div>
    ${rows.map(rowHtml).join('')}</div>
    <div class="acts"><button type="button" class="btn" id="txmok">${t('settingsExtra.menuNames.save')}</button></div></div>`;
  const ok = document.getElementById('txmok');
  if (ok) ok.onclick = (): void => { void settingsExtraLegacy.withButtonLoading(ok, t('settingsExtra.menuNames.saving'), () => save()); };
}
