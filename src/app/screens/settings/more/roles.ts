/**
 * Usuarios → «Roles y permisos»: the permission template of each role (level per module) and, for administration, the «Permisos»
 * table (what each role can do besides its modules). Migrated from the legacy pintarRolesBase and pintarRoles (v2.415.0): both
 * cards are painted together instead of adding the second one after a read.
 */
import { cardSectionsLegacy, cycleLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const LEVEL_HINTS: readonly MessageKey[] = ['settingsMore.roles.level0', 'settingsMore.roles.level1', 'settingsMore.roles.level2', 'settingsMore.roles.level3'];

interface Capability { clave: string; nombre: string; descripcion?: string | null }

const editableRoles = (): string[] => settingsMoreLegacy.roleNames().filter(role => !cardSectionsLegacy.roleCan(role, 'portal_prescriptor'));

function levelSelect(role: string, area: string): string {
  const current = Number(settingsMoreLegacy.roleTemplate(role)[area] ?? 0);
  const options = settingsMoreLegacy.levelNames().map((name, level) => `<option value="${level}" ${current === level ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('');
  return `<td><select data-rol="${escapeHtml(role)}" data-ar="${area}" class="nvsel chico" ${cardSectionsLegacy.roleCan(role, 'administrar') ? 'disabled' : ''}>${options}</select></td>`;
}

function templatesHtml(roles: readonly string[]): string {
  const legend = settingsMoreLegacy.levelNames().map((name, level) => `<span class="nv${level}"><b>${escapeHtml(name)}</b>${t(LEVEL_HINTS[level] ?? 'settingsMore.roles.level0')}</span>`).join('');
  const rows = settingsMoreLegacy.areas().map(([area, name]) => `<tr><td><b>${escapeHtml(name)}</b><span class="sm">${escapeHtml(settingsMoreLegacy.areaHint(area))}</span></td>
        ${roles.map(role => levelSelect(role, area)).join('')}</tr>`).join('');
  return `<div class="card cfgpanel"><h2>${t('settingsMore.roles.title')}</h2>
    <p class="sm">${t('settingsMore.roles.intro', { TheProfessionals: term('medico', { number: 'p', article: 'el', articleCapital: 'C' }) })}</p>
    <div class="nivleg">${legend}</div>
    <div class="dgrid-wrap"><table class="rolmat"><thead><tr><th>${t('settingsMore.roles.permission')}</th>${roles.map(role => `<th>${escapeHtml(role)}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table></div>
    <div class="acts u-end u-wrap"><button class="btn sec" id="rolrest">${t('settingsMore.roles.reset')}</button><button class="btn" id="rolok">${t('settingsMore.roles.saveTemplates')}</button></div></div>`;
}

function permissionsHtml(roles: readonly string[], capabilities: readonly Capability[]): string {
  const rows = capabilities.map(capability => `<tr><td><b>${escapeHtml(capability.nombre)}</b><span class="sm">${escapeHtml(capability.descripcion ?? '')}</span></td>
        ${roles.map(role => `<td><input type="checkbox" data-prol="${escapeHtml(role)}" data-pcap="${escapeHtml(capability.clave)}" aria-label="${escapeHtml(capability.nombre)} · ${escapeHtml(role)}" ${cardSectionsLegacy.roleCan(role, capability.clave) ? 'checked' : ''}></td>`).join('')}</tr>`).join('');
  return `<div class="card cfgpanel" id="rolperm"><h2>${t('settingsMore.roles.permissionsTitle')}</h2>
    <p class="sm">${t('settingsMore.roles.permissionsHint')}</p>
    <div class="dgrid-wrap"><table class="rolmat"><thead><tr><th>${t('settingsMore.roles.permission')}</th>${roles.map(role => `<th>${escapeHtml(role)}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table></div>
    <div class="acts u-end"><button class="btn" id="rolpermok">${t('settingsMore.roles.savePermissions')}</button></div></div>`;
}

function readTemplates(box: HTMLElement): Record<string, Record<string, number>> {
  const templates: Record<string, Record<string, number>> = {};
  box.querySelectorAll<HTMLSelectElement>('[data-rol]:not([disabled])').forEach(select => {
    const role = select.dataset.rol ?? '', area = select.dataset.ar ?? '';
    templates[role] = { ...templates[role], [area]: Number(select.value) };
  });
  return templates;
}

async function saveTemplates(box: HTMLElement): Promise<void> {
  const templates = readTemplates(box);
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'roles', p_valor: templates });
  if (error) { notices.toast(t('settingsMore.couldNotSave'), true); return; }
  cycleLegacy.setSetting('roles', templates);
  if (!await notices.confirm(t('settingsMore.roles.applyText'), { titulo: t('settingsMore.roles.applyTitle'), ok: t('settingsMore.roles.applyAll') })) { notices.toast(t('settingsMore.roles.saved')); return; }
  let people = 0;
  for (const [role, areas] of Object.entries(templates)) {
    const { data } = await legacyDb().rpc<{ personas?: number }>('aplicar_plantilla_rol', { p_rol: role, p_areas: areas });
    people += data?.personas ?? 0;
  }
  notices.toast(t('settingsMore.roles.savedApplied', { count: people }));
}

async function savePermissions(roles: readonly string[], button: HTMLButtonElement): Promise<void> {
  const table = document.getElementById('rolperm'); if (!table) return;
  button.disabled = true;
  let failed = false;
  for (const role of roles) {
    const list = [...table.querySelectorAll<HTMLInputElement>(`[data-prol="${CSS.escape(role)}"]:checked`)].map(input => input.dataset.pcap ?? '');
    const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_permisos_rol', { p_rol: role, p_permisos: list });
    if (error || data?.ok === false) failed = true;
  }
  button.disabled = false;
  await settingsMoreLegacy.reloadRoles();
  const { data: me } = await legacyDb().from<{ capacidades?: string[] } | null>('perfiles').select('capacidades').eq('id', settingsMoreLegacy.profileId()).single();
  if (Array.isArray(me?.capacidades)) settingsMoreLegacy.setCapabilities(me.capacidades);
  notices.toast(t(failed ? 'settingsMore.roles.someNotSaved' : 'settingsMore.roles.permissionsSaved'), failed);
}

function bind(box: HTMLElement, roles: readonly string[]): void {
  const colour = (): void => { box.querySelectorAll<HTMLSelectElement>('.nvsel').forEach(select => { select.className = `nvsel chico nv${select.value}`; }); };
  box.addEventListener('change', colour); colour();
  const reset = document.getElementById('rolrest');
  if (reset) reset.onclick = async (): Promise<void> => {
    await legacyDb().rpc('guardar_ajuste', { p_clave: 'roles', p_valor: {} }); cycleLegacy.setSetting('roles', {});
    notices.toast(t('settingsMore.roles.defaults')); void paintRoles();
  };
  const ok = document.getElementById('rolok'); if (ok) ok.onclick = (): void => { void saveTemplates(box); };
  const permissions = document.getElementById('rolpermok') as HTMLButtonElement | null;
  if (permissions) permissions.onclick = (): void => { void savePermissions(roles, permissions); };
}

async function readCapabilities(): Promise<Capability[]> {
  if (!cardSectionsLegacy.can('administrar')) return [];
  const { data } = await legacyDb().from<Capability[]>('capacidades').select('clave,nombre,descripcion,orden').eq('grupo', 'Permisos').order('orden');
  return data ?? [];
}

export async function paintRoles(): Promise<void> {
  const [, capabilities] = await Promise.all([cycleLegacy.loadSettings(), readCapabilities()]);
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const roles = editableRoles();
  box.innerHTML = templatesHtml(roles) + (capabilities.length ? permissionsHtml(roles, capabilities) : '');
  bind(box, roles);
}
