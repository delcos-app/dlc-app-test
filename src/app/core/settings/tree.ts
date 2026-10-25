/**
 * The tree of Configuración sections that the index (core/layers/settings-tree) builds on: each group with its entries and the
 * painter of each one. It folds the ten legacy layers arbolConfigBase…arbolConfig into the tree they ended up giving (v2.428.0):
 * Inicio and Rutas in «Tu cuenta»; portfolio and commissions in «Equipo» (administration); classifiers, stock and material,
 * importing and the professional's portal in «Datos»; and the hidden «Empresa» opened from the user menu. Users, roles, security,
 * Mi perfil, notifications, billing and the organisation pieces live elsewhere now. Painters are wrapped to show the loader and,
 * on failure or after 20 seconds, the error with «Reintentar». The name arbolConfig stays as an adapter.
 */
import { icon, permissions, term } from '../../legacy/bridge';
import { settingsCoreLegacy, treePainters as paint } from '../../legacy/settings-core-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

type Painter = () => unknown;
type Sub = [string, string, Painter];
export interface TreeItem { k: string; ic: string; t: string; d: string; r?: Painter; mod?: string; sub?: Sub[] }
type Group = [string, TreeItem[]];

/** Group names: the index matches them as they are (they are not shown). */
const GROUP = { account: 'Tu cuenta', team: 'Equipo', data: 'Datos', hidden: '__oculto' } as const;
const SLOW_MS = 20000;

function showError(box: HTMLElement, error: unknown, retry: () => void): void {
  const message = error instanceof Error ? error.message : String(error);
  box.innerHTML = `<div class="card cfgpanel"><h2>${t('settingsCore.tree.couldNotLoad')}</h2><p class="sm">${escapeHtml(message)}</p>
        <div class="acts"><button class="btn sec" id="cfgreint">${icon('rotate-cw')} ${t('settingsCore.tree.retry')}</button></div></div>`;
  const button = document.getElementById('cfgreint'); if (button) button.onclick = retry;
}

/** The painter with the loader in its place and, if it fails or takes more than 20 seconds, the error and «Reintentar». */
function wrap(painter: Painter): Painter {
  const run = async (): Promise<void> => {
    const box = document.getElementById('cfgcuerpo'); if (!box) return;
    box.innerHTML = `<div class="cfgcarga"><span class="giro"></span> ${t('settingsCore.tree.loading')}</div>`;
    setTimeout(() => { if (box.isConnected && box.querySelector(':scope > .cfgcarga')) showError(box, new Error(t('settingsCore.tree.stillLoading')), () => { void run(); }); }, SLOW_MS);
    try { await painter(); } catch (error) { showError(box, error, () => { void run(); }); }
  };
  return run;
}

const words = (): Record<string, string> => ({ visit: term('visita'), visits: term('visita', { number: 'p' }) });

function accountGroup(): Group {
  return [GROUP.account, [
    { k: 'inicio', ic: 'house', t: t('settingsCore.tree.home'), d: t('settingsCore.tree.homeHint'), sub: [['kpis', t('settingsCore.tree.indicators'), wrap(() => paint.window(paint.indicators))]] },
    { k: 'rutas', ic: 'route', t: t('settingsCore.tree.routes'), d: t('settingsCore.tree.routesHint', words()), sub: [
      ['salida', t('settingsCore.tree.departure'), wrap(() => paint.preferencesPart('rutas'))],
      ['horario', t('settingsCore.tree.visitTimes', words()), wrap(() => paint.window(paint.planTimes))]] }]];
}

function teamItems(): TreeItem[] {
  return [
    { k: 'cartera', ic: 'compass', t: t('settingsCore.tree.portfolio', words()), d: t('settingsCore.tree.portfolioHint', words()), sub: [
      ['reglas', t('settingsCore.tree.portfolioRules'), wrap(() => paint.window(paint.portfolioRules))],
      ['frec', t('settingsCore.tree.visitFrequency', words()), wrap(() => paint.window(paint.visitFrequency))],
      ['ciclo', t('settingsCore.tree.cycle'), wrap(() => paint.window(paint.cycle))]] },
    { k: 'comis', ic: 'euro', t: t('settingsCore.tree.commissions'), d: t('settingsCore.tree.commissionsHint'), mod: 'ventas', r: wrap(() => paint.module('comisiones')) }];
}

function dataItems(admin: boolean): TreeItem[] {
  const items: TreeItem[] = [];
  if (settingsCoreLegacy.canEditCatalogs()) {
    items.push({ k: 'cat', ic: 'tag', t: t('settingsCore.tree.classifiers'), d: t('settingsCore.tree.classifiersHint'), r: wrap(() => {
      const box = document.getElementById('cfgcuerpo'); if (box) box.innerHTML = '';
      return paint.classifiers();
    }) });
  }
  if (admin || permissions.levelOf('P') >= 3) {
    items.push({ k: 'stock', ic: 'warehouse', t: t('settingsCore.tree.stock'), d: t('settingsCore.tree.stockHint', words()), mod: 'productos', sub: [
      ['alm', t('settingsCore.tree.stores'), wrap(paint.stores)], ['mues', t('settingsCore.tree.visitMaterial', words()), wrap(paint.visitMaterial)]] });
  }
  return items;
}

const hiddenCompany = (): Group => [GROUP.hidden, [{ k: '__empresa', ic: 'building', t: t('settingsCore.tree.company'), d: '', sub: [
  ['marca', t('settingsCore.tree.brand'), wrap(paint.brand)], ['correo', t('settingsCore.tree.email'), wrap(paint.email)], ['copias', t('settingsCore.tree.backups'), wrap(paint.backups)]] }]];

/** Adds an entry to «Datos», creating the group at the end if there was none. */
function addToData(groups: Group[], item: TreeItem): void {
  const data = groups.find(group => group[0] === GROUP.data);
  if (data) { if (!data[1].some(other => other.k === item.k)) data[1].push(item); } else groups.push([GROUP.data, [item]]);
}

export function settingsTree(): Group[] {
  const admin = settingsCoreLegacy.can('administrar');
  const groups: Group[] = [accountGroup()];
  if (admin) groups.push([GROUP.team, teamItems()]);
  const data = dataItems(admin);
  if (data.length) groups.push([GROUP.data, data]);
  groups.push(hiddenCompany());
  // v2.109.0: with the role's «Importar datos» permission
  if (settingsCoreLegacy.can('importar_datos')) {
    addToData(groups, { k: 'importar', ic: 'file-spreadsheet', t: t('settingsCore.tree.importData'), d: t('settingsCore.tree.importDataHint', { contacts: settingsCoreLegacy.contactsLabel().toLowerCase() }),
      sub: [['nueva', t('settingsCore.tree.newImport'), paint.newImport], ['historial', t('settingsCore.tree.imports'), paint.imports]] });
  }
  if (admin && settingsCoreLegacy.hasExtra('portal')) {
    addToData(groups, { k: 'portal', ic: 'stethoscope', t: t('settingsCore.tree.portal', { ofTheProfessional: term('medico', { article: 'del' }) }), d: t('settingsCore.tree.portalHint'), r: paint.portalSettings });
  }
  return groups;
}
