/**
 * Configuración → Datos → Stock y material → «Entregas controladas» (VIS-1, plan 12.2 batch 3, v2.466.0): the rule of the products
 * given with a cap per professional and period (today, medicine samples). Saved in the setting «entregas»; registrar_muestras and
 * muestras_de_cuenta read it (SQL 193). Without the setting, today's rule; a company created from v2.466.0 starts without one.
 */
import { notices, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { SETTING_DELIVERIES, deliveryRule } from '../../../core/rules';
import { areaRowHtml, inputValue, isChecked, numberRowHtml, paintRuleCards, ruleCardHtml, saveRule, selectRowHtml, switchRowHtml, textRowHtml, wholeNumber } from './card';

const CARD = 'rgent', MAX_CAP = 1000, MAX_MONTHS = 240;

const words = (): Record<string, string> => ({ professional: term('medico'), aVisit: term('visita', { article: 'un' }), visits: term('visita', { number: 'p' }) });

function cardHtml(): string {
  const rule = deliveryRule(), field = (key: string): string => t(`settingsRules.deliveries.${key}` as 'settingsRules.deliveries.name', words());
  return ruleCardHtml({ id: CARD, title: field('title'), info: field('info'), intro: field('intro'), rows: [
    switchRowHtml({ id: `${CARD}a`, label: field('active'), help: field('activeHelp'), checked: rule.active }),
    textRowHtml({ id: `${CARD}n`, label: field('name'), help: field('nameHelp'), value: rule.name ?? t('visit.samples.title') }),
    numberRowHtml({ id: `${CARD}t`, label: field('cap'), help: field('capHelp'), value: rule.cap, min: 1, max: MAX_CAP }),
    selectRowHtml({ id: `${CARD}p`, label: field('period'), help: field('periodHelp'), value: rule.period,
      options: [{ value: 'anio', text: field('year') }, { value: 'trimestre', text: field('quarter') }, { value: 'mes', text: field('month') }] }),
    numberRowHtml({ id: `${CARD}m`, label: field('months'), help: field('monthsHelp'), value: rule.months, min: 0, max: MAX_MONTHS }),
    switchRowHtml({ id: `${CARD}f`, label: field('signature'), help: field('signatureHelp'), checked: rule.signature }),
    selectRowHtml({ id: `${CARD}r`, label: field('recipients'), help: field('recipientsHelp'), value: rule.recipients,
      options: [{ value: 'personas', text: field('people') }, { value: 'todas', text: field('everyone') }] }),
    areaRowHtml({ id: `${CARD}l`, label: field('legal'), help: field('legalHelp'), value: rule.legal ?? t('productsMore.samples.law'), rows: 3 })] });
}

async function save(): Promise<void> {
  const cap = wholeNumber(`${CARD}t`, 1, MAX_CAP), months = wholeNumber(`${CARD}m`, 0, MAX_MONTHS);
  if (typeof cap !== 'number') { notices.toast(t('settingsRules.wrongNumber', { field: t('settingsRules.deliveries.cap', words()), min: 1, max: MAX_CAP }), true); return; }
  if (typeof months !== 'number') { notices.toast(t('settingsRules.wrongNumber', { field: t('settingsRules.deliveries.months'), min: 0, max: MAX_MONTHS }), true); return; }
  await saveRule(SETTING_DELIVERIES, {
    activa: isChecked(`${CARD}a`), nombre: inputValue(`${CARD}n`) || t('settingsRules.deliveries.defaultName'), tope: cap, periodo: inputValue(`${CARD}p`),
    meses: months, firma: isChecked(`${CARD}f`), receptores: inputValue(`${CARD}r`), texto_legal: inputValue(`${CARD}l`),
  });
}

/** Paints Stock y material → Entregas controladas. */
export const paintDeliverySettings = (): Promise<void> => paintRuleCards([{ id: CARD, html: cardHtml, save }]);
