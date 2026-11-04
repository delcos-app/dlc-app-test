/**
 * Configuración → Portal del profesional, cards «Informes» (PPR-1), «Formatos» (PPR-2) and «Recurrencia» (PPR-3), plan 12.2 batch 3,
 * v2.466.0: which orders the account sees (all the completed ones or only the marked ones), from how many units the portal groups the
 * orders («4 o más unidades») and the months, days and minimum of «Continuidad». Saved inside the setting «portal» (pedidos,
 * agrupar_desde, recurrencia), keeping the rest of it; informe_cuenta and constancia_pacientes read them (SQL 193).
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { DEFAULT_GROUP_FROM, DEFAULT_RECURRENCE, MIN_RECURRENCE } from '../../../core/rules';
import { bindSave, inputValue, numberRowHtml, ruleCardHtml, saveRule, selectRowHtml, wholeNumber } from './card';

const REPORTS = 'rginf', FORMATS = 'rgfmt', RECURRENCE = 'rgrec', ALL = 'todos', MARKED = 'marcados';
/** The portal page repaints after saving, so its own cards keep the setting as it is now. */
let repaint = (): void => undefined;
const LIMITS = { group: [2, 99], meses: [1, 36], dias: [7, 365], minimo: [MIN_RECURRENCE, 100] } as const;

type PortalSetting = Record<string, unknown> & { pedidos?: unknown; agrupar_desde?: unknown; recurrencia?: Record<string, unknown> };

const words = (): Record<string, string> => ({
  order: term('pauta'), orders: term('pauta', { number: 'p' }), Orders: term('pauta', { number: 'p', capital: 'C' }),
  theProfessional: term('medico', { article: 'el' }),
});

async function portalSetting(): Promise<PortalSetting> {
  const { data } = await legacyDb().from<{ valor?: PortalSetting } | null>('ajustes').select('valor').eq('clave', 'portal').maybeSingle();
  return data?.valor ?? {};
}

const numberOr = (value: unknown, fallback: number): number => (typeof value === 'number' ? value : fallback);

function reportsHtml(setting: PortalSetting): string {
  return ruleCardHtml({ id: REPORTS, title: t('settingsRules.portalReports.title'), info: t('settingsRules.portalReports.info', words()), intro: t('settingsRules.portalReports.intro', words()),
    rows: [selectRowHtml({ id: `${REPORTS}p`, label: t('settingsRules.portalReports.orders', words()), help: t('settingsRules.portalReports.ordersHelp'),
      value: setting.pedidos === ALL ? ALL : MARKED,
      options: [{ value: ALL, text: t('settingsRules.portalReports.all') }, { value: MARKED, text: t('settingsRules.portalReports.marked') }] })] });
}

function formatsHtml(setting: PortalSetting): string {
  return ruleCardHtml({ id: FORMATS, title: t('settingsRules.portalFormats.title'), info: t('settingsRules.portalFormats.info', words()), intro: t('settingsRules.portalFormats.intro', words()),
    rows: [numberRowHtml({ id: `${FORMATS}n`, label: t('settingsRules.portalFormats.groupFrom'), help: t('settingsRules.portalFormats.groupFromHelp', { count: DEFAULT_GROUP_FROM }),
      value: numberOr(setting.agrupar_desde, DEFAULT_GROUP_FROM), min: LIMITS.group[0], max: LIMITS.group[1] })] });
}

function recurrenceHtml(setting: PortalSetting): string {
  const own = setting.recurrencia ?? {};
  const row = (key: 'meses' | 'dias' | 'minimo', label: string, help: string): string => numberRowHtml({ id: `${RECURRENCE}${key}`,
    label: t(label as 'settingsRules.portalRecurrence.months', words()), help: t(help as 'settingsRules.portalRecurrence.monthsHelp', { ...words(), count: DEFAULT_RECURRENCE[key], min: MIN_RECURRENCE }),
    value: numberOr(own[key], DEFAULT_RECURRENCE[key]), min: LIMITS[key][0], max: LIMITS[key][1] });
  return ruleCardHtml({ id: RECURRENCE, title: t('settingsRules.portalRecurrence.title'), info: t('settingsRules.portalRecurrence.info', words()), intro: t('settingsRules.portalRecurrence.intro'),
    rows: [row('meses', 'settingsRules.portalRecurrence.months', 'settingsRules.portalRecurrence.monthsHelp'), row('dias', 'settingsRules.portalRecurrence.days', 'settingsRules.portalRecurrence.daysHelp'),
      row('minimo', 'settingsRules.portalRecurrence.minimum', 'settingsRules.portalRecurrence.minimumHelp')] });
}

function wrong(label: string, [min, max]: readonly [number, number]): void {
  notices.toast(t('settingsRules.wrongNumber', { field: t(label as 'settingsRules.portalFormats.groupFrom', words()), min, max }), true);
}

async function saveReports(): Promise<void> {
  const value = inputValue(`${REPORTS}p`) === ALL ? ALL : MARKED;
  if (await saveRule('portal', { ...await portalSetting(), pedidos: value })) repaint();
}

async function saveFormats(): Promise<void> {
  const value = wholeNumber(`${FORMATS}n`, LIMITS.group[0], LIMITS.group[1]);
  if (typeof value !== 'number') { wrong('settingsRules.portalFormats.groupFrom', LIMITS.group); return; }
  if (await saveRule('portal', { ...await portalSetting(), agrupar_desde: value })) repaint();
}

async function saveRecurrence(): Promise<void> {
  const value: Record<string, number> = {};
  const labels = { meses: 'settingsRules.portalRecurrence.months', dias: 'settingsRules.portalRecurrence.days', minimo: 'settingsRules.portalRecurrence.minimum' } as const;
  for (const key of ['meses', 'dias', 'minimo'] as const) {
    const number = wholeNumber(`${RECURRENCE}${key}`, LIMITS[key][0], LIMITS[key][1]);
    if (typeof number !== 'number') { wrong(labels[key], LIMITS[key]); return; }
    value[key] = number;
  }
  if (await saveRule('portal', { ...await portalSetting(), recurrencia: value })) repaint();
}

/** The three cards, after the portal's own (the portal page calls it with its setting already read). */
export const portalRulesHtml = (setting: PortalSetting): string => reportsHtml(setting) + formatsHtml(setting) + recurrenceHtml(setting);

export function bindPortalRules(repaintPage: () => void): void {
  repaint = repaintPage;
  bindSave(REPORTS, saveReports); bindSave(FORMATS, saveFormats); bindSave(RECURRENCE, saveRecurrence);
}
