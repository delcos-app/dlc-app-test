/**
 * «Cerca de mí» in the account list: the accounts with a location less than 10 km from the user, nearest first, with pages.
 * Migrated from the legacy cercaDeMi and pintarCerca (v2.417.0); the result stays in the legacy CERCA (legado 096 clears it when
 * the search changes).
 */
import { accountListLegacy, legacyDb, notices, term } from '../../legacy/bridge';
import { miscLegacy, type NearbyAccount } from '../../legacy/misc-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { searchAccounts } from './list/search';

const RADIUS_KM = 10, LIMIT = 100, TIMEOUT_MS = 15000;

function rowHtml(item: NearbyAccount): string {
  const urgent = item.urgente ? `<span class="pill p-urg">${t('accountsMore.nearby.urgent')}</span> ` : '';
  const noReporting = item.sin_reporting ? `<span class="pill p-sr" title="${t('accountsMore.nearby.noReportingTitle', { visit: term('visita') })}">${t('accountsMore.nearby.noReporting')}</span> ` : '';
  return `<button class="trow" data-id="${item.id}" style="padding:10px 14px;gap:12px">
      <span class="tcell cercakm"><b style="color:var(--navy)">${String(item.km).replace('.', ',')} km</b></span>
      <span class="tcell" style="flex:1;width:auto">
        <span class="nm">${urgent}${noReporting}${escapeHtml(item.nombre)}</span>
        <span class="sm">${escapeHtml(orFallback(item.especialidad, ''))} · ${escapeHtml(orFallback(item.centro_nombre, ''))} ${escapeHtml(orFallback(item.municipio, ''))}</span></span>
      <span class="tcell cercaest"><span class="pill p-est">${escapeHtml(orFallback(item.estado_comercial, ''))}</span></span>
    </button>`;
}

/** Paints the current page of the nearby accounts in the account list. */
export function paintNearby(): void {
  const nearby = miscLegacy.nearby(); if (!nearby) return;
  const list = nearby.lista, size = accountListLegacy.pageSize(), page = nearby.pagina ?? 0;
  const shown = list.slice(page * size, page * size + size);
  const head = document.getElementById('thead'), count = document.getElementById('cuenta'), rows = document.getElementById('lista'), pages = document.getElementById('dirpag');
  if (head) head.innerHTML = '';
  if (count) count.innerHTML = `${t('accountsMore.nearby.count', { count: formatNumber(list.length), professionals: term('medico', { number: list.length === 1 ? 's' : 'p' }) })}
    <button class="kcfg" id="cercacerrar" style="margin-left:10px">${t('accountsMore.nearby.back')}</button>`;
  if (rows) rows.innerHTML = shown.length ? shown.map(rowHtml).join('') : `<div class="vacio">${t('accountsMore.nearby.none', { professionals: term('medico', { number: 'p' }) })}</div>`;
  pages?.classList.remove('hide');
  accountListLegacy.paginate({ element: pages, total: list.length, page,
    onPage: next => { nearby.pagina = next; paintNearby(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    onSize: () => { nearby.pagina = 0; paintNearby(); } });
  const close = document.getElementById('cercacerrar');
  if (close) close.onclick = (): void => { miscLegacy.setNearby(null); void searchAccounts(true); };
}

function reset(button: HTMLButtonElement): void { button.disabled = false; button.textContent = t('accountsMore.nearby.button'); }

async function search(button: HTMLButtonElement, position: GeolocationPosition): Promise<void> {
  const { latitude, longitude } = position.coords;
  const { data, error } = await legacyDb().rpc<NearbyAccount[]>('cuentas_cerca', { p_lat: latitude, p_lon: longitude, p_km: RADIUS_KM, lim: LIMIT });
  reset(button);
  if (error) { notices.toast(t('accountsMore.nearby.couldNotSearch', { error: orFallback((error as { message?: string }).message, '') }), true); return; }
  miscLegacy.setNearby({ lista: data ?? [], pos: [latitude, longitude] });
  paintNearby();
}

/** «Cerca de mí»: asks for the location and lists the nearby accounts. */
export function searchNearby(button: HTMLButtonElement): void {
  if (!('geolocation' in navigator)) { notices.toast(t('accountsMore.nearby.noLocation'), true); return; }
  button.disabled = true; button.textContent = t('accountsMore.nearby.locating');
  navigator.geolocation.getCurrentPosition(position => { void search(button, position); }, () => {
    reset(button); notices.toast(t('accountsMore.nearby.noPosition'), true);
  }, { enableHighAccuracy: true, timeout: TIMEOUT_MS });
}
