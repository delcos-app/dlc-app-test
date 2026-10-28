// Legacy globals of Acceso, the last Agenda pieces and the accounts map (only names no other legacy/*.d.ts declares).
interface LegacyAuthError { message: string; status?: number | string }
interface LegacyAuth {
  resend(options: { type: string; email: string; options?: { emailRedirectTo?: string } }): Promise<{ error: LegacyAuthError | null }>;
  resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ error: LegacyAuthError | null }>;
}
interface LegacyDb { readonly auth: LegacyAuth }
interface LeafletLayer { addTo(target: LeafletMap | LeafletLayer): LeafletLayer; remove(): void; bindPopup(html: string): LeafletLayer }
interface LeafletMap { setView(centre: [number, number], zoom: number): LeafletMap; fitBounds(points: [number, number][], options?: { padding?: [number, number] }): void; invalidateSize(): void }
interface Leaflet {
  map(element: string, options?: { preferCanvas?: boolean }): LeafletMap;
  tileLayer(url: string, options?: { maxZoom?: number; attribution?: string }): LeafletLayer;
  layerGroup(): LeafletLayer;
  circleMarker(point: [number, number], options: Record<string, unknown>): LeafletLayer;
}

declare const JKEY: () => string;
