/**
 * The Configuración index: sections and their entries, each person seeing what concerns them. It folds the nine legacy layers
 * arbolCfgUnicoBase…arbolCfgUnico (legado 081, 083, 105, 109, 115, 147, 148, 154 and 157) into one function (v2.424.0); the name
 * arbolCfgUnico stays as an adapter (the Configuración shell reads the tree through it).
 */
import { treeLegacy, type LegacyConfigItem } from '../../legacy/legado-d-bridge';
import type { SettingsItem, SettingsTree } from '../../legacy/shell-bridge';
import { t, type MessageKey } from '../../i18n';

type Group = [string, SettingsItem[]];

/** An entry without the fields the legacy item leaves empty (optional fields are left out, not undefined). */
const entry = (fields: Record<string, unknown>): SettingsItem => Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) as unknown as SettingsItem;

/** The name of the «Datos» group in the legacy arbolConfig (pantallas/configuracion.js), matched as it is written there. */
const LEGACY_DATA_GROUP = 'Datos';

const leavesOf = (item: LegacyConfigItem | undefined): SettingsItem[] => {
  if (!item) return [];
  if (!item.sub) return [entry({ k: item.k, t: item.t, ic: item.ic, d: item.d, r: item.r, mod: item.mod })];
  const [first] = item.sub;
  if (item.sub.length === 1 && first) {
    return [entry({ k: `${item.k}.${first[0]}`, t: item.k === 'inicio' ? t('legacyD.tree.homeIndicators') : item.t, ic: item.ic, d: item.d, r: first[2], mod: item.mod })];
  }
  return [entry({ k: item.k, t: item.t, ic: item.ic, d: item.d, mod: item.mod, hijos: item.sub.map(([key, title, paint]) => ({ k: `${item.k}.${key}`, t: title, r: paint })) })];
};

/** «Empresa» and «Facturación» entries from the Organización page tabs (only for who manages the organisation). */
function organisationEntries(): (key: string, icon: string, description: MessageKey, title?: MessageKey) => SettingsItem[] {
  const tabs = treeLegacy.canManageOrganisation() ? treeLegacy.pageTabs('organizacion') : [];
  const byKey = new Map(tabs.map(([key, title, paint]) => [key, { title, paint }]));
  return (key, icon, description, title) => {
    const tab = byKey.get(key);
    return tab ? [{ k: `o.${key}`, t: title ? t(title) : tab.title, ic: icon, d: t(description), r: tab.paint }] : [];
  };
}

function baseTree(): Group[] {
  const admin = treeLegacy.can('administrar'), config = treeLegacy.configTree(), all = config.flatMap(group => group[1]);
  const find = (key: string): LegacyConfigItem | undefined => all.find(item => item.k === key);
  const org = organisationEntries();
  const profileTabs = new Map(treeLegacy.pageTabs('perfil').map(([key, , paint]) => [key, paint]));
  const groups: Group[] = [
    [t('legacyD.tree.yourAccount'), [
      { k: 'datos', t: t('legacyD.tree.myData'), ic: 'user', d: t('legacyD.tree.myDataHint'), r: profileTabs.get('datos') ?? ((): unknown => treeLegacy.paintProfile()) },
      { k: 'notif', t: t('legacyD.tree.notifications'), ic: 'bell', d: t('legacyD.tree.notificationsHint'), r: (): unknown => treeLegacy.paintNotifications() },
      ...leavesOf(find('rutas')), ...leavesOf(find('inicio'))]],
    [t('legacyD.tree.team'), admin ? [
      { k: 'usuarios', t: t('legacyD.tree.users'), ic: 'users', d: t('legacyD.tree.usersHint'), r: (): unknown => treeLegacy.paintUsers() },
      { k: 'roles', t: t('legacyD.tree.roles'), ic: 'lock-keyhole', d: t('legacyD.tree.rolesHint'), r: (): unknown => treeLegacy.paintRoles() },
      ...leavesOf(find('cartera')), ...leavesOf(find('comis')), ...leavesOf(find('seguridad'))] : []],
    [t('legacyD.tree.company'), [...org('marca', 'palette', 'legacyD.tree.brandHint', 'legacyD.tree.brand'), ...org('correo', 'mail', 'legacyD.tree.emailHint'), ...org('zona', 'clock', 'timeZone.treeHint'),
      ...org('plan', 'credit-card', 'legacyD.tree.planHint'), ...org('copias', 'save', 'legacyD.tree.backupsHint'), ...org('orgs', 'building', 'legacyD.tree.orgsHint')]],
    [t('legacyD.tree.billing'), [...org('fiscal', 'receipt', 'legacyD.tree.fiscalHint'), ...org('series', 'receipt', 'legacyD.tree.seriesHint'),
      ...org('vf', 'receipt', 'legacyD.tree.verifactuHint'), ...org('pdf', 'receipt', 'legacyD.tree.pdfHint')]],
    [t('legacyD.tree.data'), (config.find(group => group[0] === LEGACY_DATA_GROUP)?.[1] ?? []).flatMap(leavesOf)],
  ];
  return groups.filter(group => group[1].length);
}

/** The group named `name`, created at the end if it is not there. */
function groupOf(tree: Group[], name: string): Group {
  let group = tree.find(item => item[0] === name);
  if (!group) { group = [name, []]; tree.push(group); }
  return group;
}

/** v2.233.0 «Textos personalizados», after «Marca y logo». */
function addCustomTexts(tree: Group[]): void {
  if (!treeLegacy.canManageOrganisation()) return;
  const company = tree.find(group => group[0] === t('legacyD.tree.company'));
  if (!company || company[1].some(item => item.k === 'o.textos')) return;
  const index = company[1].findIndex(item => item.k === 'o.marca');
  company[1].splice(index + 1, 0, { k: 'o.textos', t: t('legacyD.tree.texts'), ic: 'file-text', d: t('legacyD.tree.textsHint'), r: (): unknown => treeLegacy.paintTexts() });
}

/** v2.260.0 «Distribuidores» and v2.264.0 «Estados comerciales» (after «Clasificadores»), in «Datos». */
function addDataEntries(tree: Group[]): void {
  if (treeLegacy.can('administrar') && treeLegacy.canUseModule('ventas')) {
    const data = groupOf(tree, t('legacyD.tree.data'));
    if (!data[1].some(item => item.k === 'distribuidores')) data[1].push({ k: 'distribuidores', t: t('legacyD.tree.distributors'), ic: 'package', d: t('legacyD.tree.distributorsHint'), r: (): unknown => treeLegacy.paintDistributors() });
  }
  if (!(treeLegacy.canEditCatalogs() || treeLegacy.can('administrar'))) return;
  const data = groupOf(tree, t('legacyD.tree.data'));
  if (data[1].some(item => item.k === 'estados')) return;
  const index = data[1].findIndex(item => item.k === 'cat');
  data[1].splice(index < 0 ? 0 : index + 1, 0, { k: 'estados', t: t('legacyD.tree.states'), ic: 'target', d: t('legacyD.tree.statesHint'), r: (): unknown => treeLegacy.paintStateRoles() });
}

/** v2.271.0 The professional's portal: only «Mis datos» (with its own description) and «Notificaciones». */
function onlyProfessionalEntries(tree: Group[]): Group[] {
  if (!treeLegacy.isProfessionalPortal()) return tree;
  return tree.map(([title, items]): Group => [title, items.filter(item => item.k === 'datos' || item.k === 'notif')
    .map(item => (item.k === 'datos' ? { ...item, d: t('legacyD.tree.myDataProfessional') } : item))]).filter(([, items]) => items.length);
}

/** v2.331.0 card payment (Facturación) and v2.332.0 the test environment (Empresa, only in apptest). */
function addPaymentAndTests(tree: Group[]): void {
  if (treeLegacy.cardPaymentVisible() && treeLegacy.canManageOrganisation() && treeLegacy.canUseModule('ventas')) {
    const billing = groupOf(tree, t('legacyD.tree.billing'));
    if (!billing[1].some(item => item.k === 'tpv')) billing[1].push({ k: 'tpv', t: t('legacyD.tree.cardPayment'), ic: 'credit-card', d: t('legacyD.tree.cardPaymentHint'), r: (): unknown => treeLegacy.paintCardPayment() });
  }
  if (!treeLegacy.inTestEnvironment() || !treeLegacy.can('administrar')) return;
  const company = groupOf(tree, t('legacyD.tree.company'));
  if (!company[1].some(item => item.k === 'o.pruebas')) company[1].push({ k: 'o.pruebas', t: t('legacyD.tree.testEnvironment'), ic: 'refresh-cw', d: t('legacyD.tree.testEnvironmentHint'), r: (): unknown => treeLegacy.paintTestEnvironment() });
}

const noPaint = (): unknown => undefined;

/** v2.340.0 «Estados comerciales» as a part of «Clasificadores». */
function joinStates(tree: Group[]): void {
  const data = tree.find(group => group[0] === t('legacyD.tree.data'));
  const catalogs = data?.[1].find(item => item.k === 'cat'), states = data?.[1].find(item => item.k === 'estados');
  if (data && catalogs && states && !catalogs.hijos) {
    data[1] = data[1].filter(item => item !== states).map(item => (item === catalogs ? { ...catalogs, hijos: [{ k: 'cat', t: t('legacyD.tree.valueLists'), r: catalogs.r ?? noPaint }, { k: 'estados', t: states.t, r: states.r ?? noPaint }] } : item));
  }
}

/** v2.344.0 «Datos fiscales» and «Series» together. */
function joinFiscal(tree: Group[]): void {
  const billing = tree.find(group => group[0] === t('legacyD.tree.billing'));
  const fiscal = billing?.[1].find(item => item.k === 'o.fiscal'), series = billing?.[1].find(item => item.k === 'o.series');
  if (billing && fiscal && series && !fiscal.hijos) {
    billing[1] = billing[1].filter(item => item !== series).map(item => (item === fiscal ? { ...fiscal, d: t('legacyD.tree.fiscalWithSeries'),
      hijos: [{ k: 'o.fiscal', t: fiscal.t, r: fiscal.r ?? noPaint }, { k: 'o.series', t: series.t, r: series.r ?? noPaint }] } : item));
  }
}

/** The whole index, in the order the legacy layers built it. */
export function settingsTree(): SettingsTree {
  const tree = baseTree();
  addCustomTexts(tree);
  addDataEntries(tree);
  const shown = onlyProfessionalEntries(tree);
  addPaymentAndTests(shown);
  joinStates(shown);
  joinFiscal(shown);
  return shown;
}

/** Search words of the entries added here (Configuración's index search). */
export function installSettingsSearchWords(): void {
  treeLegacy.setSearchWords({
    'o.textos': t('legacyD.tree.textsWords'), distribuidores: t('legacyD.tree.distributorsWords'), estados: t('legacyD.tree.statesWords'),
    tpv: t('legacyD.tree.cardPaymentWords'), 'o.pruebas': t('legacyD.tree.testEnvironmentWords'),
  });
}
