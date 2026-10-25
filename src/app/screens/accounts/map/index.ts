/**
 * Cuentas → «Ver mapa»: the accounts found with the list filters, coloured by commercial state (urgent ones not visited in red),
 * with their legend. Migrated from the legacy pintarMapa (v2.414.0); pintarMapa stays as an adapter (the «Ver mapa» button of
 * legado 006 calls it).
 */
import { accountListLegacy, commercialStates, legacyDb } from '../../../legacy/bridge';
import { restLegacy } from '../../../legacy/rest-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';

const URGENT = '#B42318', NO_STATE = '#6B7F95', START: [number, number] = [41.6, 1.9], START_ZOOM = 9, MAX_ZOOM = 19, RESIZE_MS = 60;
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

interface MapPoint { id: string; nombre: string; lat: number; lon: number; estado: string; urgente?: boolean; ultima_visita?: string | null; especialidad?: string | null; centro?: string | null; municipio?: string | null }

let map: LeafletMap | null = null;
let layer: LeafletLayer | null = null;

const colourOf = (point: MapPoint): string => (point.urgente && !point.ultima_visita ? URGENT : restLegacy.stateColour(point.estado) || NO_STATE);

function popupHtml(point: MapPoint, colour: string): string {
  return `<b>${escapeHtml(point.nombre)}</b><br>${escapeHtml(point.especialidad ?? '')}<br>${escapeHtml(point.centro ?? '')} ${escapeHtml(point.municipio ?? '')}<br>
       <span style="color:${colour};font-weight:700">${escapeHtml(point.estado)}</span><br>
       <a href="#" data-mapficha="${escapeHtml(point.id)}">${t('accountsMap.openCard')}</a>`;
}

function legendHtml(found: number, total: number): string {
  const states = commercialStates.all().map(state => `<span><i style="background:${restLegacy.stateColour(state.valor) || NO_STATE}"></i>${escapeHtml(state.valor)}</span>`).join('');
  return `<span><i style="background:${URGENT}"></i>${t('accountsMap.urgent')}</span>${states}<span style="margin-left:auto">${t('accountsMap.found', { shown: `<b>${formatNumber(found)}</b>`, total: formatNumber(total) })}</span>`;
}

function readyMap(leaflet: Leaflet): { map: LeafletMap; layer: LeafletLayer } {
  if (!map) {
    map = leaflet.map('mapa', { preferCanvas: true }).setView(START, START_ZOOM);
    leaflet.tileLayer(TILES, { maxZoom: MAX_ZOOM, attribution: '© OpenStreetMap' }).addTo(map);
  }
  layer?.remove();
  layer = leaflet.layerGroup().addTo(map);
  return { map, layer };
}

/** Paints the points of the current list filters. */
export async function paintMap(): Promise<void> {
  const legend = document.getElementById('mapleg'), leaflet = restLegacy.leaflet();
  if (!legend) return;
  if (!leaflet) { legend.textContent = t('accountsMap.needsConnection'); return; }
  legend.textContent = t('accountsMap.loading');
  const filters = accountListLegacy.filters();
  const { data, error } = await legacyDb().rpc<MapPoint[]>('mapa_cuentas', {
    q: filters.q || null, f_provincia: filters.prov || null, f_municipio: filters.muni || null,
    f_estado: filters.est || null, f_especialidad: filters.esp || null, f_urgentes: Boolean(filters.urg),
  });
  if (error) { legend.textContent = t('accountsMap.couldNotLoad', { error: (error as { message?: string }).message ?? '' }); return; }
  const points = data ?? [], ready = readyMap(leaflet);
  points.forEach(point => {
    const colour = colourOf(point);
    leaflet.circleMarker([point.lat, point.lon], { radius: point.urgente ? 7 : 5, color: '#fff', weight: 1.5, fillColor: colour, fillOpacity: 0.92 })
      .addTo(ready.layer).bindPopup(popupHtml(point, colour));
  });
  if (points.length) ready.map.fitBounds(points.map(point => [point.lat, point.lon]), { padding: [30, 30] });
  setTimeout(() => { ready.map.invalidateSize(); }, RESIZE_MS);
  legend.innerHTML = legendHtml(points.length, filters.total);
}

/** «Abrir ficha» inside a point's popup. */
export function listenToMapCards(open: (id: string) => void): void {
  document.addEventListener('click', event => {
    const link = (event.target as Element | null)?.closest<HTMLElement>('[data-mapficha]');
    if (!link) return;
    event.preventDefault(); open(link.dataset.mapficha ?? '');
  });
}
