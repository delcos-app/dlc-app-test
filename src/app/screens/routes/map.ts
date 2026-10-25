/**
 * The map of the wizard (MapLibre with the colours of delcos): the numbered stops, the line of the route, the start point and, in
 * step 1, the accounts that can be added. Only one map lives at a time (the legacy RM_MAPA, shared with today's map). Migrated
 * from the legacy rnMapaBase, rnRestilo, rnPintarCapas and rnFC (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { icon } from '../../legacy/bridge';
import { hasLocation } from './model';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const ROUTE_COLOUR = '#17457A', URGENT_COLOUR = '#E08A00', OTHER_COLOUR = '#9FB6CE';

type LngLat = [number, number];

export interface MapLayers {
  members: readonly RouteMember[]; others?: readonly RouteMember[] | null; line: LngLat[]; fit?: boolean;
  /** Pressing a stop or an account to add (step 1). */
  onPick?: (member: RouteMember) => void;
}

/** Hides what distracts (shops, transport, 3D) and paints the rest with the delcos palette. */
function paintLayer(map: RouteMap, layer: { id: string; type: string }, palette: Readonly<Record<string, string>>): void {
  const id = layer.id, set = (key: string, value: unknown): void => { try { map.setPaintProperty(id, key, value); } catch { /* not in this layer */ } };
  const hide = (): void => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch { /* not in this layer */ } };
  if (layer.type === 'fill-extrusion') { hide(); return; }
  if (layer.type === 'background') { set('background-color', palette.tierra); return; }
  if (layer.type === 'symbol') {
    if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) { hide(); return; }
    set('text-color', palette.texto); set('text-halo-color', '#FFFFFF'); set('text-halo-width', 1.4); return;
  }
  if (layer.type === 'fill') { paintFill(id, set, palette); return; }
  if (layer.type === 'line') paintLine(id, { set, hide }, palette);
}

function paintFill(id: string, set: (key: string, value: unknown) => void, palette: Readonly<Record<string, string>>): void {
  if (/water/i.test(id)) { set('fill-color', palette.agua); return; }
  if (/building/i.test(id)) { set('fill-color', palette.edif); return; }
  if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) { set('fill-color', palette.parque); set('fill-opacity', 0.8); return; }
  set('fill-color', palette.zona); set('fill-opacity', 0.6);
}

function paintLine(id: string, paint: { set: (key: string, value: unknown) => void; hide: () => void }, palette: Readonly<Record<string, string>>): void {
  if (/water|river|stream|canal/i.test(id)) { paint.set('line-color', palette.agua); return; }
  if (/rail|ferry|aeroway|boundary|admin/i.test(id)) { paint.hide(); return; }
  const main = /motorway|trunk|primary/i.test(id);
  paint.set('line-color', /casing/i.test(id) ? (main ? palette.viaBorde : palette.borde) : (main ? palette.via : palette.calle));
}

function restyle(map: RouteMap): void {
  const palette = routesLegacy.palette();
  (map.getStyle().layers ?? []).forEach(layer => { if (!layer.id.startsWith('rn-')) paintLayer(map, layer, palette); });
}

/** A new map in `element` (the previous one is removed). */
export async function newMap(element: HTMLElement): Promise<{ library: MapLibrary; map: RouteMap }> {
  const library = await routesLegacy.mapLibrary(), previous = routesLegacy.map();
  if (previous) { routesLegacy.setMap(null); setTimeout(() => { try { previous.remove(); } catch { /* already gone */ } }, 0); }
  const map = new library.Map({ container: element, style: MAP_STYLE, maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  routesLegacy.setMap(map); map.touchZoomRotate.disableRotation();
  map.addControl(new library.NavigationControl({ showCompass: false }), 'top-right');
  map.__mk = [];
  map.on('load', () => { if (!map.style) return; restyle(map); map.__listo = true; });
  return { library, map };
}

const featureCollection = (features: unknown[]): Record<string, unknown> => ({ type: 'FeatureCollection', features });

function addRouteLayers(map: RouteMap, onPick?: (member: RouteMember) => void): void {
  const palette = routesLegacy.palette(), lineLayout = { 'line-cap': 'round', 'line-join': 'round' };
  map.addLayer({ id: 'rn-linea-b', type: 'line', source: 'rn-linea', paint: { 'line-color': palette.rutaBorde, 'line-width': 7 }, layout: lineLayout });
  map.addLayer({ id: 'rn-linea', type: 'line', source: 'rn-linea', paint: { 'line-color': palette.ruta, 'line-width': 4.5 }, layout: lineLayout });
  map.addLayer({ id: 'rn-otros', type: 'circle', source: 'rn-otros', paint: { 'circle-radius': 7, 'circle-color': ['case', ['==', ['get', 'u'], 1], URGENT_COLOUR, OTHER_COLOUR], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
  map.on('click', 'rn-otros', event => {
    const id = event.features?.[0]?.properties.id, member = (routesLegacy.draft()?.res ?? []).find(item => item.id === id);
    if (member && onPick) onPick(member);
  });
  map.on('mouseenter', 'rn-otros', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'rn-otros', () => { map.getCanvas().style.cursor = ''; });
}

/** The line and the accounts to add, as map sources (once the map style has loaded). */
function paintSources(map: RouteMap, layers: MapLayers): void {
  if (!map.style || !map.getContainer().isConnected) return;
  const source = (id: string, data: unknown): void => { const found = map.getSource(id); if (found) found.setData(data); else map.addSource(id, { type: 'geojson', data }); };
  source('rn-otros', featureCollection((layers.others ?? []).filter(hasLocation).map(member => ({ type: 'Feature', properties: { id: member.id, u: member.urgente ? 1 : 0 }, geometry: { type: 'Point', coordinates: [Number(member.lon), Number(member.lat)] } }))));
  source('rn-linea', { type: 'Feature', geometry: { type: 'LineString', coordinates: layers.line } });
  if (!map.getLayer('rn-linea-b')) addRouteLayers(map, layers.onPick);
}

/** One numbered marker per place (members at the same place share it: «2·3», «2–5»). */
function paintMarkers(map: RouteMap, library: MapLibrary, layers: MapLayers): void {
  const groups: { lat: number; lon: number; numbers: number[]; member: RouteMember }[] = [];
  layers.members.forEach((member, index) => {
    if (!hasLocation(member)) return;
    const last = groups[groups.length - 1], lat = Number(member.lat), lon = Number(member.lon);
    if (last && last.lat === lat && last.lon === lon) last.numbers.push(index + 1); else groups.push({ lat, lon, numbers: [index + 1], member });
  });
  groups.forEach(group => {
    const marker = document.createElement('button'); marker.type = 'button'; marker.className = `rmmk${group.numbers.length > 1 ? ' multi' : ''}`; marker.style.setProperty('--c', ROUTE_COLOUR);
    marker.innerHTML = `<span>${group.numbers.length > 2 ? `${group.numbers[0] ?? ''}–${group.numbers[group.numbers.length - 1] ?? ''}` : group.numbers.join('·')}</span>`; marker.title = group.member.nombre;
    const pick = layers.onPick; if (pick) marker.onclick = (event): void => { event.stopPropagation(); pick(group.member); };
    map.__mk.push(new library.Marker({ element: marker, anchor: 'bottom' }).setLngLat([group.lon, group.lat]).addTo(map));
  });
}

function fitAll(map: RouteMap, layers: MapLayers, home: PlanStart): void {
  const points: LngLat[] = [...layers.members, ...(layers.others ?? [])].filter(hasLocation).map(member => [Number(member.lon), Number(member.lat)]);
  if (home.lat !== null && home.lat !== undefined && layers.members.length) points.push([Number(home.lon), Number(home.lat)]);
  if (!points.length) return;
  const bounds = points.reduce<[LngLat, LngLat]>((box, point) => [[Math.min(box[0][0], point[0]), Math.min(box[0][1], point[1])], [Math.max(box[1][0], point[0]), Math.max(box[1][1], point[1])]], [[180, 90], [-180, -90]]);
  map.fitBounds(bounds, { padding: 50, duration: map.__ya ? 500 : 0, maxZoom: 14 }); map.__ya = true;
}

/** Paints the route on `map`: sources, markers, the start point and (unless `fit` is false) the view of everything. */
export function paintLayers(map: RouteMap | null, library: MapLibrary | undefined, layers: MapLayers): void {
  if (!map || !library || !map.getContainer().isConnected) return;
  if (map.__listo) paintSources(map, layers); else map.once('load', () => { setTimeout(() => { paintSources(map, layers); }, 0); });
  map.__mk.forEach(marker => { marker.remove(); }); map.__mk = [];
  const home = routesLegacy.start();
  if (home.lat !== null && home.lat !== undefined) {
    const house = document.createElement('div'); house.className = 'rmcasa'; house.innerHTML = icon('house');
    map.__mk.push(new library.Marker({ element: house }).setLngLat([Number(home.lon), Number(home.lat)]).addTo(map));
  }
  paintMarkers(map, library, layers);
  if (layers.fit !== false) fitAll(map, layers, home);
}
