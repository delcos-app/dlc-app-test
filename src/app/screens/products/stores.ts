/**
 * Stores: the central store and a «case» per salesperson for their samples. The window of Productos → Stock → «Almacenes» and the
 * Configuración panel. Migrated from the legacy editorAlmacenes and pintarAlmacenes2 (v2.413.0); pintarAlmacenes2 stays as an
 * adapter (Configuración opens it by that name).
 */
import { cardSectionsLegacy, legacyDb, notices, purchasesLegacy, salesTeam, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { storeIcon, storeKind, type Store } from './model';

interface Member { id: string; nombre: string; rol?: string }

const stores = (): readonly Store[] => purchasesLegacy.stores() as readonly Store[];
const members = (): readonly Member[] => salesTeam.members() as readonly Member[];

async function load(): Promise<void> {
  await purchasesLegacy.loadStores();
  if (!salesTeam.members().length) await salesTeam.load();
}

/** Creates the case of a salesperson («Maletín Ana»). */
async function createCase(member: Member): Promise<boolean> {
  const { error } = await legacyDb().rpc('guardar_almacen', { p: { nombre: t('products.stores.caseName', { name: String(member.nombre).split(' ')[0] ?? '' }), tipo: 'maletin', usuario_id: member.id } });
  if (error) { notices.toast(t('products.stores.couldNotCreate'), true); return false; }
  notices.toast(t('products.stores.created')); return true;
}

const chosenMember = (): Member | undefined => members().find(member => member.id === (document.getElementById('almu') as HTMLSelectElement | null)?.value);

function windowHtml(): string {
  const list = stores().map(store => `<div class="item u-cursor-default"><span class="ic">${storeIcon(store)}</span>
        <span class="tx"><b>${escapeHtml(store.nombre)}</b><span class="sm">${storeKind(store)}${t('products.stores.unitsTail', { units: formatNumber(store.unidades) })}${store.activo ? '' : t('products.stores.inactive')}</span></span></div>`).join('');
  return `
      <div class="fh"><div><h2>${t('products.stores.title')}</h2><div class="sm">${t('products.stores.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <div class="lista">${list}</div>
      <h3 class="u-mt-14">${t('products.stores.newCase')}</h3>
      <div class="g2"><div><label for="almu">${t('products.stores.salesperson')}</label><select id="almu">${members().map(member => `<option value="${member.id}">${escapeHtml(member.nombre)}</option>`).join('')}</select></div>
        <div><label>&nbsp;</label><button class="btn" id="almok">${t('products.stores.createCase')}</button></div></div>
      <p class="sm">${t('products.stores.caseHint', { theVisit: term('visita', { article: 'el' }) })}</p>`;
}

function paintWindow(): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = windowHtml();
  const ok = document.getElementById('almok');
  if (ok) ok.onclick = async (): Promise<void> => {
    const member = chosenMember(); if (!member || !await createCase(member)) return;
    await purchasesLegacy.loadStores(); paintWindow();
  };
}

/** Productos → Stock → «Almacenes». */
export async function editStores(): Promise<void> {
  await load();
  paintWindow();
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}

function storeCard(store: Store): string {
  return `<div class="almc"><span class="ic">${storeIcon(store)}</span>
        <b>${escapeHtml(store.nombre)}</b><span class="sm">${storeKind(store)}${store.activo ? '' : t('products.stores.inactive')}</span>
        <span class="almu"><b>${formatNumber(store.unidades ?? 0)}</b> ${t('products.stores.units')}</span></div>`;
}

function withoutCaseHtml(withoutCase: readonly Member[]): string {
  if (!withoutCase.length) return '';
  const who = withoutCase.length === 1 ? t('products.stores.oneWithout', { name: escapeHtml(withoutCase[0]?.nombre ?? '') }) : t('products.stores.manyWithout', { count: withoutCase.length });
  return `<div class="avisoh u-mt-12"><span>${who}${t('products.stores.withoutCase')}</span></div>`;
}

/** Configuración → «Almacenes». */
export async function paintStores(): Promise<void> {
  await load();
  const body = document.getElementById('cfgcuerpo'); if (!body) return;
  const canHaveCase = members().filter(member => cardSectionsLegacy.roleCan(member.rol ?? '', 'almacen_propio'));
  const withoutCase = canHaveCase.filter(member => !stores().some(store => store.usuario_id === member.id));
  body.innerHTML = `
    <div class="card cfgpanel"><h2>${t('products.stores.title')}</h2>
      <p class="sm">${t('products.stores.pageIntro')}</p>
      <div class="mattipos"><div><b>${t('products.stores.centralTitle')}</b><span>${t('products.stores.centralText')}</span></div>
        <div><b>${t('products.stores.caseTitle')}</b><span>${t('products.stores.caseText', { visits: term('visita', { number: 'p' }) })}</span></div></div></div>
    <div class="card cfgpanel"><h2>${t('products.stores.yours')}</h2>
      <div class="almgrid">${stores().map(storeCard).join('')}</div>
      ${withoutCaseHtml(withoutCase)}
      <div class="matadd u-mt-12"><select id="almu">${canHaveCase.map(member => `<option value="${member.id}">${escapeHtml(member.nombre)}</option>`).join('')}</select>
        <button class="btn sec" id="almok">${t('products.stores.createCase')}</button></div>
      <p class="sm">${t('products.stores.transferHint')}</p></div>`;
  const ok = document.getElementById('almok');
  if (ok) ok.onclick = async (): Promise<void> => { const member = chosenMember(); if (member && await createCase(member)) void paintStores(); };
}
