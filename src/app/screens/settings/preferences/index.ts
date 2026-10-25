/** Configuración → Preferencias: the start and end points, the «Avisos» block and the person's card. Migrated from the legacy pintarPrefs (v2.415.0). */
import { paintNotice } from './notice';
import { paintPlaces } from './places';
import { paintProfile } from './profile';

export { paintProfile };

export async function paintPreferences(): Promise<void> {
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  paintPlaces(box, () => { void paintPreferences(); });
  paintNotice();
  await paintProfile();
}
