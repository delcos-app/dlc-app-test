/**
 * Custom fields shown in a card (account, customer, order, product) and the custom field filters of the lists. Migrated from the
 * legacy bloqueCampos and camposFiltrosActivar (v2.415.0).
 */
import { legacyDb } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

/** «tipo_de_centro» → «Tipo de centro», for values whose field no longer exists. */
const keyName = (key: string): string => key.replace(/_/g, ' ').toLowerCase().replace(/^./, letter => letter.toUpperCase());

const blockHtml = (cells: string): string => `<div class="campospers"><h3>${t('settings.customFields.title')}</h3><div class="cpgrid">${cells}</div></div>`;

function knownHtml(definitions: readonly CustomField[], values: Record<string, unknown>, keys: readonly string[]): string {
  const ordered = [...definitions.filter(field => keys.includes(field.clave)),
    ...keys.filter(key => !definitions.some(field => field.clave === key)).map(key => ({ clave: key, nombre: keyName(key) }))];
  return blockHtml(ordered.map(field => `<div><span class="sm">${escapeHtml(field.nombre)}</span><b>${escapeHtml(settingsLegacy.fieldText(field, values[field.clave]))}</b></div>`).join(''));
}

const rawText = (value: unknown): string => (typeof value === 'object' ? JSON.stringify(value) : String(value));

/** Adds the «Campos personalizados» block with the filled values of record `id` of `table` at the end of `container` (once). */
export async function paintCustomFieldsBlock(table: string, id: string | null | undefined, container: Element | null | undefined): Promise<void> {
  if (!container || !id || container.querySelector('.campospers')) return;
  const { data } = await legacyDb().from<{ clasificadores?: Record<string, unknown> | null }>(table).select('clasificadores').eq('id', id).maybeSingle();
  const values = data?.clasificadores ?? {}, keys = Object.keys(values).filter(key => values[key] !== '' && values[key] !== null && values[key] !== undefined);
  const area = settingsLegacy.areaOfTable(table), definitions = area ? settingsLegacy.fields()[area] ?? [] : [];
  if (!keys.length || container.querySelector('.campospers')) return;
  container.insertAdjacentHTML('beforeend', definitions.length
    ? knownHtml(definitions, values, keys)
    : blockHtml(keys.map(key => `<div><span class="sm">${escapeHtml(keyName(key))}</span><b>${escapeHtml(rawText(values[key]))}</b></div>`).join('')));
}

/** The custom field filters of a list bar: each select changes `state` and calls `onChange`. */
export function bindCustomFieldFilters(zone: Element, state: Record<string, unknown>, onChange: () => void): void {
  zone.querySelectorAll<HTMLSelectElement>('[data-fcp]').forEach(select => {
    select.onchange = (): void => {
      const key = select.dataset.fcp ?? '';
      if (!select.value) Reflect.deleteProperty(state, key); else state[key] = select.dataset.fcpt === 'si_no' ? select.value === 'true' : select.value;
      onChange();
    };
  });
}
