/**
 * The bar of Cuentas: «Crear nuevo» and the map icon in the header, «Filtros y columnas», the help of the bar next to the title,
 * and the map/list icon following the view. Migrated from the legacy ordenarCabeceraCuentas and barraCuentasBase–3/barraCuentas
 * (v2.419.0); barraCuentas stays as an adapter (legado 057 calls it when the directory changes).
 */
import { isMobile } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';

const LIST = 'lista', MAP = 'mapa';

function arrangeMapAndTools(): void {
  const map = document.getElementById('mapaBtn');
  if (map && !map.classList.contains('icobtn')) {
    map.classList.add('icobtn'); map.title = t('accountsEditor.bar.seeMap'); map.setAttribute('aria-label', t('accountsEditor.bar.seeMap'));
    map.innerHTML = accountsEditorLegacy.iconOf('map'); map.parentElement?.appendChild(map);
  }
  const tools = document.getElementById('dirtools');
  if (tools && !tools.dataset.v252) { tools.dataset.v252 = '1'; tools.innerHTML = `${accountsEditorLegacy.iconOf('sliders-horizontal')} ${t('accountsEditor.bar.filtersColumns')}`; tools.classList.remove('kebab'); }
}

/** «Crear nuevo» and «Ver en el mapa» in the header; the old «Guardar filtro» and «Duplicados» buttons hidden. */
export function arrangeHeader(): void {
  const actions = document.querySelector('#dircab .acts'), create = document.getElementById('nuevoBtn');
  // v2.268.0: on the phone the button is the round «+» (plSync): it is not moved to the header nor given a text
  if (actions && create && create.parentElement !== actions && !(create.dataset.plfab && isMobile())) {
    create.classList.remove('sec', 'fab'); create.innerHTML = `${accountsEditorLegacy.iconOf('plus')} ${t('accountsEditor.bar.createNew')}`; actions.appendChild(create);
  }
  arrangeMapAndTools();
  document.getElementById('guardarFiltro')?.classList.add('hide');
  document.getElementById('dupBtn')?.classList.add('hide');
}

function setMapIcon(button: HTMLElement, wanted: string): void {
  button.dataset.icono = wanted; button.innerHTML = accountsEditorLegacy.iconOf(wanted === LIST ? 'list' : 'map');
  button.title = t(wanted === LIST ? 'accountsEditor.bar.seeList' : 'accountsEditor.bar.seeMap'); button.setAttribute('aria-label', button.title);
}

function placeHelpAndTools(): void {
  const tools = document.getElementById('dirtools'), title = document.querySelector('#dircab h1');
  // Only the help of the bar (not the ones of the table), and once
  if (tools?.parentElement && title && !title.querySelector('.ai')) { const help = tools.parentElement.querySelector(':scope > .ai'); if (help) title.appendChild(help); }
  tools?.classList.add('aderecha');
}

/** If the map mode changes the button, the bar's copy follows it. */
function syncCopy(map: HTMLElement): void {
  const copy = document.querySelector<HTMLElement>('#v-directorio .plmapa'), mode = map.dataset.modo ?? '';
  if (!copy || copy.dataset.modo === mode) return;
  copy.dataset.modo = mode; copy.innerHTML = map.innerHTML; copy.title = map.title; copy.setAttribute('aria-label', map.title);
}

/** The bar after any change of the directory: help next to the title, the tools to the right and the map/list icon. */
export function refreshBar(): void {
  placeHelpAndTools();
  const map = document.getElementById('mapaBtn'); if (!map) return;
  if (!map.querySelector('svg')) {
    const list = /lista/i.test(map.textContent ?? '') || map.dataset.modo === 'true';
    map.dataset.modo = String(list); map.innerHTML = accountsEditorLegacy.iconOf(list ? 'list' : 'map');
    map.title = t(list ? 'accountsEditor.bar.seeList' : 'accountsEditor.bar.seeMap'); map.setAttribute('aria-label', map.title);
  }
  map.classList.add('icobtn');
  const showingMap = [...document.querySelectorAll<HTMLElement>('#v-directorio .leaflet-container, #v-directorio #mapa')].some(element => element.offsetParent);
  const wanted = showingMap ? LIST : MAP;
  if (map.dataset.icono !== wanted || !map.querySelector('svg')) setMapIcon(map, wanted);
  syncCopy(map);
}
