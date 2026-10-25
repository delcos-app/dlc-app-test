/**
 * Productos → «Material promocional»: for each material, whether the visit asks how many were given, whether the professional
 * portal can ask for it (and how many at most), and whether it is shown. Migrated from the legacy matMejorar (v2.415.0).
 */
import { callRpc, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const DEFAULT_MAX = 20, MAX_LIMIT = 1000, NUMBER = 'numero';

interface Material { id: string; valor: string; activo?: boolean; dato_tipo?: string | null }
interface Allowed { valor: string; max: number }
interface PortalSettings { material?: Allowed[] }
interface Context { list: HTMLElement; withPortal: boolean; portal: PortalSettings | null }

function portalHtml(allowed: Allowed | undefined): string {
  return `<label class="opt mtpor"><input type="checkbox" data-mpp ${allowed ? 'checked' : ''}> ${t('settingsMore.material.portal')}</label>
      <label class="mtcampo mtmax"><span class="sm">${t('settingsMore.material.max')}</span><input type="number" step="1" data-mpx value="${allowed ? allowed.max : DEFAULT_MAX}" ${allowed ? '' : 'disabled'}></label>`;
}

function rowHtml(material: Material, allowed: Allowed | undefined, withPortal: boolean): string {
  const counted = material.dato_tipo === NUMBER;
  return `<div class="matfila2 ${material.activo ? '' : 'off'}" data-mv="${material.id}" data-mvv="${escapeHtml(material.valor)}" data-mdt0="${counted ? NUMBER : ''}">
      <b class="mtnom">${escapeHtml(material.valor)}</b>
      <label class="mtcampo"><span class="sm">${t('settingsMore.material.onVisit', { theVisit: term('visita', { article: 'la' }) })}</span><select class="chico" data-mdt>
        <option value="numero" ${counted ? 'selected' : ''}>${t('settingsMore.material.count')}</option>
        <option value="" ${counted ? '' : 'selected'}>${t('settingsMore.material.mark')}</option></select></label>
      ${withPortal ? portalHtml(allowed) : ''}
      <label class="vfswitch mini"><input type="checkbox" data-mact2="${material.id}" ${material.activo ? 'checked' : ''}><span class="sw"></span><span class="sm">${t(material.activo ? 'settingsMore.material.active' : 'settingsMore.material.hidden')}</span></label>
      <span class="mterr sm" hidden></span></div>`;
}

/** The maximum per request when it is a whole number from 1 to 1.000, else null. */
function validMax(text: string): number | null {
  const count = Number(text);
  return text && Number.isInteger(count) && count >= 1 && count <= MAX_LIMIT ? count : null;
}

/** The portal limits of the rows, or null when one is wrong (marked in red). */
function readLimits(rows: readonly HTMLElement[]): Allowed[] | null {
  let wrong = false; const material: Allowed[] = [];
  for (const row of rows) {
    const error = row.querySelector<HTMLElement>('.mterr'); if (error) { error.hidden = true; error.textContent = ''; }
    const allowed = row.querySelector<HTMLInputElement>('[data-mpp]'), max = row.querySelector<HTMLInputElement>('[data-mpx]');
    if (!allowed?.checked || !max) continue;
    const count = validMax(max.value);
    if (count === null) {
      if (error) { error.hidden = false; error.textContent = t('settingsMore.material.maxError'); }
      wrong = true; continue;
    }
    material.push({ valor: row.dataset.mvv ?? '', max: count });
  }
  return wrong ? null : material;
}

/** Saves the «how many» choice of the rows that changed; false if one failed. */
async function saveCounts(rows: readonly HTMLElement[]): Promise<boolean> {
  for (const row of rows) {
    const select = row.querySelector<HTMLSelectElement>('[data-mdt]');
    if (!select || select.value === row.dataset.mdt0) continue;
    const { error } = await legacyDb().rpc('guardar_valor', { p: { id: row.dataset.mv, dato_tipo: select.value, dato_etiqueta: select.value ? 'Unidades' : '' } });
    if (error) { notices.toast(t('settingsMore.material.couldNotSaveOne', { name: row.dataset.mvv ?? '', error: (error as { message?: string }).message ?? '' }), true); return false; }
    row.dataset.mdt0 = select.value;
  }
  return true;
}

async function save(context: Context, button: HTMLButtonElement): Promise<void> {
  const rows = [...context.list.querySelectorAll<HTMLElement>('.matfila2')];
  const material = readLimits(rows);
  if (!material) { notices.toast(t('settingsMore.material.checkRed'), true); return; }
  button.disabled = true;
  try {
    if (!await saveCounts(rows)) return;
    if (context.withPortal) {
      const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'portal', p_valor: { ...context.portal, material } });
      if (error) { notices.toast(t('settingsMore.material.couldNotSavePortal', { error: (error as { message?: string }).message ?? '' }), true); return; }
    }
    notices.toast(t('settingsMore.material.saved')); void settingsMoreLegacy.reloadCatalogs();
  } finally { button.disabled = false; }
}

async function toggle(input: HTMLInputElement): Promise<void> {
  await legacyDb().rpc('guardar_valor', { p: { id: input.dataset.mact2, activo: input.checked } });
  input.closest('.matfila2')?.classList.toggle('off', !input.checked);
  const label = input.parentElement?.querySelector('.sm'); if (label) label.textContent = t(input.checked ? 'settingsMore.material.active' : 'settingsMore.material.hidden');
  notices.toast(t(input.checked ? 'settingsMore.material.shown' : 'settingsMore.material.hiddenOnVisit')); void settingsMoreLegacy.reloadCatalogs();
}

function bind(context: Context): void {
  const { list } = context;
  list.querySelectorAll<HTMLInputElement>('[data-mpp]').forEach(check => {
    check.onchange = (): void => { const max = check.closest('.matfila2')?.querySelector<HTMLInputElement>('[data-mpx]'); if (max) max.disabled = !check.checked; };
  });
  list.querySelectorAll<HTMLInputElement>('[data-mact2]').forEach(input => { input.onchange = (): void => { void toggle(input); }; });
  const button = document.getElementById('matguardar') as HTMLButtonElement | null;
  if (button) button.onclick = (): void => { void save(context, button); };
}

async function readData(classifierId: string, withPortal: boolean): Promise<{ values: Material[]; allowed: Allowed[]; portal: PortalSettings | null }> {
  const [{ data: values }, allowed, settings] = await Promise.all([
    legacyDb().from<Material[]>('valores_clasificador').select('id,valor,activo,dato_tipo').eq('clasificador_id', classifierId).order('orden'),
    withPortal ? callRpc<Allowed[]>('portal_material_permitido', {}) : Promise.resolve({ data: [] }),
    withPortal ? legacyDb().from<{ valor?: PortalSettings | null }>('ajustes').select('valor').eq('clave', 'portal').maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const portal = (settings.data as { valor?: PortalSettings | null } | null)?.valor ?? null;
  return { values: values ?? [], allowed: Array.isArray(allowed.data) ? allowed.data : [], portal };
}

/** Rewrites the material list of Productos with these options (the list is painted first by Productos). */
export async function improveMaterial(): Promise<void> {
  if (!document.querySelector('#cfgcuerpo .matlista')) return;
  const { data: classifier } = await legacyDb().from<{ id: string } | null>('clasificadores').select('id').eq('papel', 'material_visita').maybeSingle();
  if (!classifier) return;
  const withPortal = settingsMoreLegacy.hasPortal();
  const { values, allowed, portal } = await readData(classifier.id, withPortal);
  const list = document.querySelector<HTMLElement>('#cfgcuerpo .matlista'); if (!list) return;
  list.classList.add('matlista2');
  list.innerHTML = values.map(value => rowHtml(value, allowed.find(item => item.valor === value.valor), withPortal)).join('') || `<div class="sm">${t('settingsMore.material.none')}</div>`;
  if (values.length) list.insertAdjacentHTML('afterend', `<div class="acts mtacts" style="justify-content:space-between;align-items:center">
      <span class="sm">${withPortal && !portal?.material ? t('settingsMore.material.portalDefault') : ''}</span>
      <button class="btn" id="matguardar">${t('settingsMore.material.save')}</button></div>`);
  bind({ list, withPortal, portal });
}
