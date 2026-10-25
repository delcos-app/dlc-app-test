/**
 * «Zona de trabajo» in the user editor (roles with a portfolio): the provinces by region with how many accounts each has; saving
 * assigns the free accounts of those provinces. Migrated from the legacy bloqueZonas and the zone part of usuarioComisionYZona
 * (v2.420.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { usersLegacy, type UserRow } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { sum } from '../../../services/values';
import { dialog, dialogBody, words } from './model';

interface Province { p: string; n: number }
interface ZoneResult { ok?: boolean; asignados?: number; en_otra_cartera?: number }

const PREFIX = 4;
const pretty = (province: string): string => province.charAt(0) + province.slice(1).toLowerCase();

/** The marked provinces, sorted (also what the editor's «Guardar» compares). */
export const markedZones = (): string[] =>
  [...(dialogBody()?.querySelectorAll<HTMLInputElement>('#uzonas [data-zp]:checked') ?? [])].map(box => box.dataset.zp ?? '').sort();

async function provinces(): Promise<Record<string, Province[]>> {
  const known = usersLegacy.provinces(); if (known) return known;
  const [{ data: regions }, { data: counts }] = await Promise.all([
    legacyDb().from<{ provincia: string; comunidad: string }[]>('provincias_ccaa').select('provincia,comunidad'),
    legacyDb().rpc<{ provincia: string; medicos: number }[]>('zonas_resumen')]);
  const byProvince = new Map((counts ?? []).map(item => [item.provincia, item.medicos]));
  const result: Record<string, Province[]> = {};
  (regions ?? []).forEach(item => { (result[item.comunidad] ??= []).push({ p: item.provincia, n: byProvince.get(item.provincia) ?? 0 }); });
  usersLegacy.setProvinces(result);
  return result;
}

/** Duplicated spellings of a province with no accounts are hidden (unless marked). */
const shownOf = (list: readonly Province[], marked: ReadonlySet<string>): Province[] =>
  list.filter((item, index, all) => all.findIndex(other => other.n === item.n && pretty(other.p).slice(0, PREFIX) === pretty(item.p).slice(0, PREFIX)) === index || item.n > 0 || marked.has(item.p));

function regionHtml(region: string, list: readonly Province[], marked: ReadonlySet<string>): string {
  const shown = shownOf(list, marked);
  return `<details ${shown.some(item => marked.has(item.p)) ? 'open' : ''}><summary><label onclick="event.stopPropagation()"><input type="checkbox" data-zcc="${escapeHtml(region)}" ${shown.every(item => marked.has(item.p)) ? 'checked' : ''}> ${escapeHtml(region)}</label>
        <span class="sm">${formatNumber(sum(shown.map(item => item.n)))} ${words().professionals}</span></summary>
        <div class="zprov">${shown.map(item => `<label><input type="checkbox" data-zp="${escapeHtml(item.p)}" data-zpc="${escapeHtml(region)}" ${marked.has(item.p) ? 'checked' : ''}> ${escapeHtml(pretty(item.p))} <span class="sm">${formatNumber(item.n)}</span></label>`).join('')}</div></details>`;
}

async function zonesHtml(user: UserRow): Promise<string> {
  const all = await provinces();
  const { data: me } = await legacyDb().from<{ zonas?: string[] | null }>('perfiles').select('zonas').eq('id', user.id).single();
  const marked = new Set(me?.zonas ?? []);
  return `<div class="blk" id="uzonas"><h3>${t('settingsRest.zones.title')}</h3>
    <p class="sm">${t('settingsRest.zones.hint', words())}</p>
    <div class="zonas">${Object.keys(all).sort().map(region => regionHtml(region, all[region] ?? [], marked)).join('')}</div>
    <div class="acts u-mt-8"><button class="btn sec" id="uzok">${t('settingsRest.zones.save', words())}</button></div></div>`;
}

async function saveZones(userId: string, button: HTMLButtonElement): Promise<void> {
  const zones = markedZones();
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<ZoneResult>('asignar_zona', { p_usuario: userId, p_zonas: zones });
  button.disabled = false;
  if (error || result?.ok === false) { notices.toast(t('settingsRest.zones.couldNotSave'), true); return; }
  const box = document.getElementById('uzonas'); if (box) box.dataset.orig = zones.join('|');
  const elsewhere = result?.en_otra_cartera ? t('settingsRest.zones.elsewhere', { count: formatNumber(result.en_otra_cartera) }) : '';
  notices.toast(t('settingsRest.zones.saved', { ...words(), count: formatNumber(result?.asignados) }) + elsewhere);
}

function bindZones(userId: string): void {
  const body = dialogBody(); if (!body) return;
  body.querySelectorAll<HTMLInputElement>('[data-zcc]').forEach(region => {
    region.onchange = (): void => { body.querySelectorAll<HTMLInputElement>(`[data-zpc="${CSS.escape(region.dataset.zcc ?? '')}"]`).forEach(box => { box.checked = region.checked; }); };
  });
  const save = document.getElementById('uzok') as HTMLButtonElement | null;
  if (save) save.onclick = (): void => { void saveZones(userId, save); };
}

/** Adds the zone block before the commission (once), if the chosen role has a portfolio. */
export async function paintZones(user: UserRow): Promise<void> {
  const role = (document.getElementById('ur') as HTMLSelectElement | null)?.value ?? user.rol;
  if (!usersLegacy.roleCan(role, 'cartera') || document.getElementById('uzonas')) return;
  const html = await zonesHtml(user);
  const place = document.getElementById('ucomzona') ?? dialogBody()?.querySelector('.acts:last-of-type');
  if (place && dialog()?.open && !document.getElementById('uzonas')) place.insertAdjacentHTML('beforebegin', html);
  const box = document.getElementById('uzonas'); if (box) box.dataset.orig = markedZones().join('|');
  bindZones(user.id);
}

/** v2.109.0: the zone follows the role chosen in the window (it appears for a role with a portfolio, or hides). */
export function followRole(user: UserRow): void {
  const select = document.getElementById('ur') as HTMLSelectElement | null;
  if (!select || select.dataset.zona) return;
  select.dataset.zona = '1';
  select.addEventListener('change', () => {
    const box = document.getElementById('uzonas');
    if (box) box.classList.toggle('hide', !usersLegacy.roleCan(select.value, 'cartera')); else void paintZones(user);
  });
}
