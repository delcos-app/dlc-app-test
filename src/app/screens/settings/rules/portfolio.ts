/**
 * Configuración → Equipo → Cartera y visitas, parts «Ficha completa» (CAL-1) and «Eventos» (EVE-1), plan 12.2 batch 3, v2.466.0.
 * Saved in the settings «ficha_completa» (calidad_datos reads it, SQL 193) and «eventos» (the Eventos screens read it).
 */
import { notices, term } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { COMPLETE_FIELDS, EVENT_CONCEPTS, SETTING_COMPLETE, SETTING_EVENTS, completeFields, eventRules, type CompleteField } from '../../../core/rules';
import { areaRowHtml, inputValue, isChecked, numberRowHtml, paintRuleCards, ruleCardHtml, saveRule, switchRowHtml, wholeNumber } from './card';

const COMPLETE = 'rgfc', EVENTS = 'rgev', MAX_LIMIT = 100000;

const words = (): Record<string, string> => ({
  professionals: term('medico', { number: 'p' }), speciality: term('especialidad'), Speciality: term('especialidad', { capital: 'C' }),
});

const FIELD_TEXTS: Readonly<Record<CompleteField, readonly [MessageKey, MessageKey]>> = {
  ubicacion: ['settingsRules.complete.location', 'settingsRules.complete.locationHelp'], horario: ['settingsRules.complete.timetable', 'settingsRules.complete.timetableHelp'],
  especialidad: ['settingsRules.complete.speciality', 'settingsRules.complete.specialityHelp'], contacto: ['settingsRules.complete.contact', 'settingsRules.complete.contactHelp'],
  provincia: ['settingsRules.complete.province', 'settingsRules.complete.provinceHelp'], obligatorios: ['settingsRules.complete.required', 'settingsRules.complete.requiredHelp'],
};

/** The name of each requirement, for «Una ficha completa tiene…» in Calidad del dato. */
export const completeFieldName = (field: CompleteField): string => t(FIELD_TEXTS[field][0], words()).toLowerCase();

function completeHtml(): string {
  const chosen = completeFields();
  return ruleCardHtml({ id: COMPLETE, title: t('settingsRules.complete.title'), info: t('settingsRules.complete.info', words()), intro: t('settingsRules.complete.intro'),
    rows: COMPLETE_FIELDS.map(field => switchRowHtml({ id: `${COMPLETE}${field}`, label: t(FIELD_TEXTS[field][0], words()), help: t(FIELD_TEXTS[field][1], words()), checked: chosen.includes(field) })) });
}

async function saveComplete(): Promise<void> {
  const campos = COMPLETE_FIELDS.filter(field => isChecked(`${COMPLETE}${field}`));
  if (!campos.length) { notices.toast(t('settingsRules.complete.noneChosen'), true); return; }
  await saveRule(SETTING_COMPLETE, { campos });
}

/** Paints Cartera y visitas → Ficha completa. */
export const paintCompleteSettings = (): Promise<void> => paintRuleCards([{ id: COMPLETE, html: completeHtml, save: saveComplete }]);

const conceptName = (concept: string): string => t(`events.concepts.${concept}` as MessageKey).toLowerCase();

function eventsHtml(): string {
  const rules = eventRules();
  return ruleCardHtml({ id: EVENTS, title: t('settingsRules.events.title'), info: t('settingsRules.events.info'), intro: t('settingsRules.events.intro'), rows: [
    areaRowHtml({ id: `${EVENTS}t`, label: t('settingsRules.events.types'), help: t('settingsRules.events.typesHelp'), value: rules.types.join('\n'), rows: 4 }),
    ...EVENT_CONCEPTS.map(concept => numberRowHtml({ id: `${EVENTS}${concept}`, label: t('settingsRules.events.limit', { concept: conceptName(concept) }), help: t('settingsRules.events.limitHelp'),
      value: rules.limits[concept] ?? null, min: 1, max: MAX_LIMIT })),
    areaRowHtml({ id: `${EVENTS}n`, label: t('settingsRules.events.note'), help: t('settingsRules.events.noteHelp'), value: rules.note ?? t('events.reportNote', { professional: term('medico') }), rows: 3 })] });
}

async function saveEvents(): Promise<void> {
  const types = [...new Set(inputValue(`${EVENTS}t`).split('\n').map(line => line.trim()).filter(Boolean))];
  if (!types.length) { notices.toast(t('settingsRules.events.noTypes'), true); return; }
  const limites: Record<string, number> = {};
  for (const concept of EVENT_CONCEPTS) {
    const limit = wholeNumber(`${EVENTS}${concept}`, 1, MAX_LIMIT);
    if (limit === undefined) { notices.toast(t('settingsRules.wrongNumber', { field: t('settingsRules.events.limit', { concept: conceptName(concept) }), min: 1, max: MAX_LIMIT }), true); return; }
    if (limit !== null) limites[concept] = limit;
  }
  await saveRule(SETTING_EVENTS, { tipos: types, limites, nota: inputValue(`${EVENTS}n`) });
}

/** Paints Cartera y visitas → Eventos. */
export const paintEventSettings = (): Promise<void> => paintRuleCards([{ id: EVENTS, html: eventsHtml, save: saveEvents }]);
