/**
 * The sketch of a saved route in its card: its stops in order joined by a line, without loading a map per card. Migrated from the
 * legacy rnCroquis (v2.414.0).
 */
import { t } from '../../i18n';
import { hasLocation } from './model';

const WIDTH = 400, HEIGHT = 140, PADDING = 22, PADDING_TOP = 44;

const fixed = (value: number): string => value.toFixed(1);

/** The different places of the members, in order. */
function placesOf(members: readonly RouteMember[]): { lat: number; lon: number }[] {
  const places: { lat: number; lon: number }[] = [];
  members.filter(hasLocation).forEach(member => {
    const lat = Number(member.lat), lon = Number(member.lon);
    if (!places.some(place => place.lat === lat && place.lon === lon)) places.push({ lat, lon });
  });
  return places;
}

export function routeSketch(members: readonly RouteMember[]): string {
  const places = placesOf(members);
  if (!places.length) return `<div class="rnsin">${t('routes.sketch.noLocations')}</div>`;
  const lats = places.map(place => place.lat), lons = places.map(place => place.lon);
  const south = Math.min(...lats), north = Math.max(...lats), west = Math.min(...lons), east = Math.max(...lons), squeeze = Math.cos(south * Math.PI / 180);
  const scale = Math.min((WIDTH - 2 * PADDING) / Math.max(1e-6, (east - west) * squeeze), (HEIGHT - PADDING - PADDING_TOP) / Math.max(1e-6, north - south));
  const left = (WIDTH - (east - west) * squeeze * scale) / 2, top = (HEIGHT - PADDING_TOP - PADDING - (north - south) * scale) / 2 + PADDING;
  const points = places.map(place => [left + (place.lon - west) * squeeze * scale, HEIGHT - top - (place.lat - south) * scale] as const);
  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><polyline points="${points.map(point => point.map(fixed).join(',')).join(' ')}" fill="none" stroke="#3F82C0" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((point, index) => `<circle cx="${fixed(point[0])}" cy="${fixed(point[1])}" r="10.5" fill="#17457A" stroke="#fff" stroke-width="2.5"/><text x="${fixed(point[0])}" y="${fixed(point[1] + 4)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Manrope, sans-serif">${index + 1}</text>`).join('')}</svg>`;
}
