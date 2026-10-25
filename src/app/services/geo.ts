/** Places on the map: points as [latitude, longitude]. */

export type Point = readonly [latitude: number, longitude: number];

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km (haversine). */
export function distanceKm(from: Point, to: Point): number {
  const radians = Math.PI / 180;
  const latitudeDelta = (to[0] - from[0]) * radians, longitudeDelta = (to[1] - from[1]) * radians;
  const chord = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(from[0] * radians) * Math.cos(to[0] * radians) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(chord));
}
