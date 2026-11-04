/**
 * Configuración → Ventas → Servicios con material → «Reposición» (VEN-3) and Facturación → «Impuestos» (FAC-1), plan 12.2 batch 3,
 * v2.466.0. Saved in the settings «servicios» and «impuestos»; SQL 193 reads them (cirugia_consumo, avisos_del_dia, guardar_pedido).
 */
import { cycleLegacy, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatNumber } from '../../../services/format';
import { generalVat, vatRates } from '../../../core/organisation';
import { DEFAULT_REPLENISH_HOURS, MAX_REPLENISH_HOURS, SETTING_SERVICES, SETTING_TAXES, defaultVat, replenishHours } from '../../../core/rules';
import { areaRowHtml, numberRowHtml, paintRuleCards, ruleCardHtml, saveRule, selectRowHtml, inputValue, wholeNumber, type Option } from './card';

const REPLENISH = 'rgrepo', TAXES = 'rgiva', MAX_RATE = 100;

function replenishHtml(): string {
  return ruleCardHtml({ id: REPLENISH, title: t('settingsRules.replenish.title'), info: t('settingsRules.replenish.info'), intro: t('settingsRules.replenish.intro'),
    rows: [numberRowHtml({ id: `${REPLENISH}h`, label: t('settingsRules.replenish.hours'), help: t('settingsRules.replenish.hoursHelp', { hours: DEFAULT_REPLENISH_HOURS }),
      value: replenishHours(), min: 1, max: MAX_REPLENISH_HOURS })] });
}

async function saveReplenish(): Promise<void> {
  const hours = wholeNumber(`${REPLENISH}h`, 1, MAX_REPLENISH_HOURS);
  if (hours === undefined) { notices.toast(t('settingsRules.wrongNumber', { field: t('settingsRules.replenish.hours'), min: 1, max: MAX_REPLENISH_HOURS }), true); return; }
  const current = (cycleLegacy.setting(SETTING_SERVICES) as Record<string, unknown> | undefined) ?? {};
  await saveRule(SETTING_SERVICES, { ...current, reposicion_horas: hours });
}

/** Paints Ventas → Servicios con material. */
export const paintServicesSettings = (): Promise<void> => paintRuleCards([{ id: REPLENISH, html: replenishHtml, save: saveReplenish }]);

// Impuestos

/** «21 General» lines of the company's rates (Spain's without the setting). */
function ratesText(): string {
  // The text of each rate is «General · 21 %» (or «21 %» without a name): the name is what comes before « · »
  return vatRates().map(([rate, text]) => `${formatNumber(rate)} ${text.includes(' · ') ? text.slice(0, text.lastIndexOf(' · ')) : ''}`.trim()).join('\n');
}

/** «21 General» → { tipo: 21, nombre: 'General' }; null when the line is not understood. */
export function parseRate(line: string): { tipo: number; nombre: string } | null {
  const match = /^(\d{1,3}(?:[.,]\d{1,2})?)\s*%?\s*(.*)$/.exec(line.trim());
  if (!match) return null;
  const rate = Number((match[1] ?? '').replace(',', '.'));
  return rate >= 0 && rate <= MAX_RATE ? { tipo: rate, nombre: (match[2] ?? '').trim() } : null;
}

const rateOptions = (): Option[] => vatRates().map(([rate, text]) => ({ value: String(rate), text }));

function taxesHtml(): string {
  const options = rateOptions(), row = (id: string, label: string, help: string, value: number): string =>
    selectRowHtml({ id: `${TAXES}${id}`, label: t(label as 'settingsRules.taxes.general'), help: t(help as 'settingsRules.taxes.generalHelp'), value: String(value), options });
  return ruleCardHtml({ id: TAXES, title: t('settingsRules.taxes.title'), info: t('settingsRules.taxes.info'), intro: t('settingsRules.taxes.intro'), rows: [
    areaRowHtml({ id: `${TAXES}t`, label: t('settingsRules.taxes.rates'), help: t('settingsRules.taxes.ratesHelp'), value: ratesText(), rows: 4, placeholder: t('settingsRules.taxes.ratesPlaceholder') }),
    row('g', 'settingsRules.taxes.general', 'settingsRules.taxes.generalHelp', generalVat()),
    row('p', 'settingsRules.taxes.products', 'settingsRules.taxes.productsHelp', defaultVat('productos')),
    row('s', 'settingsRules.taxes.services', 'settingsRules.taxes.servicesHelp', defaultVat('servicios')),
    row('e', 'settingsRules.taxes.shipping', 'settingsRules.taxes.shippingHelp', defaultVat('envios'))] });
}

async function saveTaxes(): Promise<void> {
  const lines = inputValue(`${TAXES}t`).split('\n').map(line => line.trim()).filter(Boolean);
  const rates = lines.map(parseRate), wrong = lines.find(line => !parseRate(line));
  if (wrong) { notices.toast(t('settingsRules.taxes.wrongRate', { line: wrong }), true); return; }
  const list = rates.filter((rate): rate is { tipo: number; nombre: string } => Boolean(rate));
  if (!list.length) { notices.toast(t('settingsRules.taxes.noRates'), true); return; }
  const pick = (id: string): number => { const value = Number(inputValue(`${TAXES}${id}`)); return list.some(rate => rate.tipo === value) ? value : (list[0]?.tipo ?? 0); };
  const current = (cycleLegacy.setting(SETTING_TAXES) as Record<string, unknown> | undefined) ?? {};
  if (await saveRule(SETTING_TAXES, { ...current, tipos: list, general: pick('g'), productos: pick('p'), servicios: pick('s'), envios: pick('e') })) void paintTaxesSettings();
}

/** Paints Facturación → Impuestos (who configures the organisation). */
export const paintTaxesSettings = (): Promise<void> => paintRuleCards([{ id: TAXES, html: taxesHtml, save: saveTaxes }]);
