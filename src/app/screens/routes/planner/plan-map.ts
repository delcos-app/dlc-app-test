/**
 * The map of the plan (Leaflet, OpenStreetMap): the start, each stop numbered with its hours and professionals, and the dashed line
 * that joins them. Migrated from the legacy mapaDelPlan (v2.418.0); the name stays as an adapter (pintarPlan uses it).
 */
import { restLegacy } from '../../../legacy/rest-bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { formatMinutes } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import type { Point } from './visits';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', MAX_ZOOM = 19, ZOOM = 10, PIN_SIZE = 24, PADDING = 30, RESIZE_MS = 60;
const START_COLOUR = '#0E6B4C', STOP_COLOUR = '#17457A';

export function showPlanMap(): void {
  const plan = routes2Legacy.plan(), leaflet = restLegacy.leaflet(), box = document.getElementById('planmapa');
  if (!plan || !leaflet || !box || box.dataset.on) return;
  box.dataset.on = '1'; box.style.height = 'min(55vh,460px)';
  const withStart = plan.salida.lat !== null && plan.salida.lat !== undefined, start = [plan.salida.lat, plan.salida.lon] as unknown as Point;
  const map = leaflet.map('planmapa').setView(withStart ? start : plan.paradas[0]?.xy ?? [0, 0], ZOOM);
  leaflet.tileLayer(TILES, { maxZoom: MAX_ZOOM, attribution: '© OpenStreetMap' }).addTo(map);
  const pin = (point: Point, text: string, colour: string): LeafletLayer => leaflet.marker(point, {
    icon: leaflet.divIcon({ className: 'mpin', html: `<span style="background:${colour}">${text}</span>`, iconSize: [PIN_SIZE, PIN_SIZE], iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2] }),
  }).addTo(map);
  if (withStart) pin(start, 'S', START_COLOUR).bindPopup(t('routesMore.planView.start', { place: escapeHtml(plan.salida.nombre ?? '') }));
  plan.paradas.forEach((stop, index) => pin(stop.xy, String(index + 1), STOP_COLOUR)
    .bindPopup(`<b>${index + 1}. ${escapeHtml(stop.centro)}</b><br>${formatMinutes(stop.llegada)}–${formatMinutes(stop.fin)}<br>${stop.medicos.map(member => escapeHtml(member.nombre)).join('<br>')}`));
  const line = withStart ? [start, ...plan.paradas.map(stop => stop.xy), start] : plan.paradas.map(stop => stop.xy);
  leaflet.polyline(line, { color: STOP_COLOUR, weight: 3, dashArray: '6 6' }).addTo(map);
  map.fitBounds(line, { padding: [PADDING, PADDING] });
  setTimeout(() => { map.invalidateSize(); }, RESIZE_MS);
}
