/**
 * The flat look of «Tu día en el mapa» on top of the OpenFreeMap style (the colours of delcos, without points of interest, 3D
 * buildings or rail) and the layers of the route: the whole route and the part already done. Migrated from the legacy
 * pintarRutasMapa (v2.418.0).
 */
import { PALETTE } from './service';

const HALO_WIDTH = 1.4, PARK_OPACITY = 0.8, ZONE_OPACITY = 0.6, ROUTE_EDGE_WIDTH = 8, ROUTE_WIDTH = 5, DONE_WIDTH = 6;

interface StyleLayer { id: string; type: string }

function setter(map: RouteMap, id: string): { set: (key: string, value: unknown) => void; hide: () => void } {
  return {
    set: (key, value): void => { try { map.setPaintProperty(id, key, value); } catch { /* not in this layer */ } },
    hide: (): void => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch { /* not in this layer */ } },
  };
}

function styleFill(id: string, set: (key: string, value: unknown) => void): void {
  if (/water/i.test(id)) { set('fill-color', PALETTE.agua); return; }
  if (/building/i.test(id)) { set('fill-color', PALETTE.edif); set('fill-outline-color', PALETTE.borde); return; }
  if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) { set('fill-color', PALETTE.parque); set('fill-opacity', PARK_OPACITY); return; }
  set('fill-color', PALETTE.zona); set('fill-opacity', ZONE_OPACITY);
}

function styleLine(id: string, set: (key: string, value: unknown) => void, hide: () => void): void {
  if (/water|river|stream|canal/i.test(id)) { set('line-color', PALETTE.agua); return; }
  if (/rail|ferry|aeroway|boundary|admin/i.test(id)) { hide(); return; }
  const big = /motorway|trunk|primary/i.test(id);
  set('line-color', /casing/i.test(id) ? (big ? PALETTE.viaBorde : PALETTE.borde) : (big ? PALETTE.via : PALETTE.calle));
}

function styleLayer(map: RouteMap, layer: StyleLayer): void {
  const { set, hide } = setter(map, layer.id), id = layer.id;
  if (layer.type === 'fill-extrusion') { hide(); return; }
  if (layer.type === 'background') { set('background-color', PALETTE.tierra); return; }
  if (layer.type === 'symbol') {
    if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) { hide(); return; }
    set('text-color', PALETTE.texto); set('text-halo-color', '#FFFFFF'); set('text-halo-width', HALO_WIDTH); return;
  }
  if (layer.type === 'fill') styleFill(id, set);
  else if (layer.type === 'line') styleLine(id, set, hide);
}

/** Restyles the map and adds the route (dashed when it is a straight line) and the part done. */
export function styleDayMap(map: RouteMap, route: unknown, streets: boolean): void {
  for (const layer of map.getStyle().layers ?? []) styleLayer(map, layer);
  const layout = { 'line-cap': 'round', 'line-join': 'round' };
  map.addSource('rm-ruta', { type: 'geojson', data: route });
  map.addSource('rm-hecho', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
  map.addLayer({ id: 'rm-ruta-borde', type: 'line', source: 'rm-ruta', paint: { 'line-color': PALETTE.rutaBorde, 'line-width': ROUTE_EDGE_WIDTH }, layout });
  map.addLayer({ id: 'rm-ruta', type: 'line', source: 'rm-ruta', paint: { 'line-color': PALETTE.ruta, 'line-width': ROUTE_WIDTH, ...(streets ? {} : { 'line-dasharray': [1.5, 1.5] }) }, layout });
  map.addLayer({ id: 'rm-hecho', type: 'line', source: 'rm-hecho', paint: { 'line-color': PALETTE.hecho, 'line-width': DONE_WIDTH }, layout });
}
