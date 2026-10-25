/**
 * Edit a user: name, user name, role, state, permissions by area, the commission, the work zone (roles with a portfolio) and the
 * linked professional card (portal roles). The window shows the loader until every part is in. Migrated from the legacy
 * editarUsuario, pintarUsuarioBase and usuarioFichaMedico (v2.420.0); editarUsuario stays as an adapter (legado 004, the commission
 * notices and the tests open it by name).
 */
import { callRpc, editorLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { usersLegacy, type UserRow } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { paintCommission } from './commission';
import { dialog, dialogBody, ensureUser, input, isPrescriber, roleOptions, userById, valueOf, words } from './model';
import { followRole, markedZones, paintZones } from './zones';

const LOADING_MAX_MS = 8000, HISTORY_START = '2000-01-01';

function editorHtml(user: UserRow): string {
  const areas = user.areas ?? {};
  const levels = (key: string): string => usersLegacy.levels().map((name, index) => `<option value="${index}" ${Number(areas[key] ?? 0) === index ? 'selected' : ''}>${name}</option>`).join('');
  return `
    <div class="fh"><div><h2>${escapeHtml(user.nombre)}</h2><div class="sm">${escapeHtml(user.email ?? '')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2">
      <div><label for="un">${t('settingsRest.editor.name')}</label><input id="un" value="${escapeHtml(user.nombre)}"></div>
      <div><label for="uu">${t('settingsRest.editor.user')}</label><input id="uu" value="${escapeHtml(user.usuario ?? '')}"></div>
    </div>
    <div class="g2">
      <div><label for="ur">${t('settingsRest.editor.role')}</label><select id="ur">${roleOptions(user.rol)}</select></div>
      <div><label for="ua">${t('settingsRest.editor.state')}</label><select id="ua">
        <option value="1" ${user.activo ? 'selected' : ''}>${t('settingsRest.editor.active')}</option>
        <option value="0" ${user.activo ? '' : 'selected'}>${t('settingsRest.editor.deactivated')}</option></select></div>
    </div>
    <label>${t('settingsRest.editor.areaPermissions')}</label>
    ${usersLegacy.areas().map(([key, title]) => `<div class="dprow" style="grid-template-columns:130px minmax(0,1fr)"><b>${title}</b>
      <select data-area="${key}">${levels(key)}</select></div>`).join('')}
    <div id="ucomzona"></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('settingsRest.editor.cancel')}</button>
      <button class="btn" id="uguardar">${t('settingsRest.editor.save')}</button>
    </div>`;
}

/** The role's permissions template (with the company's changes) fills the areas when the role changes. */
function presetOnRoleChange(body: HTMLElement): void {
  const role = document.getElementById('ur') as HTMLSelectElement | null; if (!role) return;
  role.onchange = (): void => {
    const changes = ((settingsExtraLegacy.setting('roles') ?? {}) as Record<string, Record<string, number> | undefined>)[role.value] ?? {};
    const preset: Record<string, number> = { ...(usersLegacy.role(role.value)?.plantilla ?? {}), ...changes };
    usersLegacy.areas().forEach(([key]) => { const select = body.querySelector<HTMLSelectElement>(`[data-area="${key}"]`); if (select) select.value = String(preset[key] ?? 0); });
  };
}

const startDate = (mode: string): string => (mode === 'todo' ? HISTORY_START : mode === 'fecha' ? valueOf('ucdf') || todayIso() : todayIso());

/** Only touches the scheme if it changes or another start date is chosen; then what the person sees (v2.276.0: a failure is said). */
async function saveCommission(id: string): Promise<boolean> {
  const scheme = input('ucom'); if (!scheme) return true;
  const mode = input('ucdm')?.value ?? 'hoy';
  if (scheme.value !== (scheme.dataset.orig ?? '') || mode !== 'hoy') {
    await legacyDb().rpc('asignar_esquema', { p_usuario: id, p_esquema: scheme.value || null, p_quitar: !scheme.value, p_desde: startDate(mode) });
  }
  const { error } = await legacyDb().from('perfiles').update({ comision_ver: valueOf('uverc') }).eq('id', id);
  if (error) { notices.toast(t('settingsRest.editor.savedButSees', { error: (error as { message?: string }).message ?? '' }), true); return false; }
  return true;
}

/** v2.109.0: the marked zone is saved with «Guardar» too. Returns the text to add to the notice, or null if it failed. */
async function saveZone(id: string): Promise<string | null> {
  const box = document.getElementById('uzonas');
  if (!box || box.classList.contains('hide') || markedZones().join('|') === (box.dataset.orig ?? '')) return '';
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; asignados?: number }>('asignar_zona', { p_usuario: id, p_zonas: markedZones() });
  if (error || result?.ok === false) { notices.toast(t('settingsRest.editor.savedButZone'), true); return null; }
  return t('settingsRest.editor.zoneSaved', { ...words(), count: formatNumber(result?.asignados) });
}

async function save(id: string, body: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const areas: Record<string, number> = {};
  usersLegacy.areas().forEach(([key]) => { areas[key] = Number(body.querySelector<HTMLSelectElement>(`[data-area="${key}"]`)?.value); });
  button.disabled = true; button.textContent = t('settingsRest.editor.saving');
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_perfil', { p: {
    id, nombre: valueOf('un').trim(), usuario: valueOf('uu').trim(), rol: valueOf('ur'), activo: valueOf('ua') === '1', areas,
  } });
  button.disabled = false; button.textContent = t('settingsRest.editor.save');
  if (error || result?.ok === false) { notices.toast(t('settingsRest.editor.couldNotSave'), true); return; }
  if (!await saveCommission(id)) return;
  const zone = await saveZone(id); if (zone === null) return;
  dialog()?.close(); notices.toast(t('settingsRest.editor.saved') + zone); usersLegacy.reloadAdmin();
}

interface LinkedCard { medico?: { id: string; nombre: string } }

async function linkedProfessional(id: string): Promise<PickedAccount | null> {
  const { data: profile } = await legacyDb().from<{ cuenta_id?: string | null }>('perfiles').select('cuenta_id').eq('id', id).single();
  if (!profile?.cuenta_id) return null;
  const { data: card } = await legacyDb().rpc<LinkedCard>('ficha_cuenta', { p_id: profile.cuenta_id });
  return card?.medico ? { id: card.medico.id, nombre: card.medico.nombre } : null;
}

function linkedHtml(linked: PickedAccount | null): string {
  return `<div class="blk" id="umedw"><h3>${t('settingsRest.editor.linkedCard', words())}</h3>
    <p class="sm">${t('settingsRest.editor.linkedHint', words())}</p>
    <div id="umedsel"></div><div class="acts u-mt-8"><button class="btn sec" id="umedok">${t('settingsRest.editor.saveLink')}</button>
    ${linked ? `<button class="btn sec" id="umedver">${t('settingsRest.editor.seeReport')}</button>` : ''}</div></div>`;
}

async function showReport(linked: PickedAccount): Promise<void> {
  const { data } = await callRpc<{ unidades: number; pautas: number; posicion?: number | null }>('informe_cuenta', { p_medico: linked.id });
  const position = data?.posicion ? t('settingsRest.editor.position', { position: data.posicion }) : '';
  notices.toast(t('settingsRest.editor.report', { ...words(), name: linked.nombre ?? '', units: formatNumber(data?.unidades), count: formatNumber(data?.pautas) }) + position);
}

/** Portal roles: the linked professional card (only their report and notices; no amounts or customer data). */
async function paintLinkedCard(user: UserRow): Promise<void> {
  if (!isPrescriber(user) || !dialog()?.open || document.getElementById('umedw')) return;
  let linked = await linkedProfessional(user.id);
  dialogBody()?.querySelector('.acts:last-of-type')?.insertAdjacentHTML('beforebegin', linkedHtml(linked));
  editorLegacy.pickAccount(document.getElementById('umedsel'), linked, account => { linked = account; }, t('settingsRest.editor.findCard'));
  const ok = document.getElementById('umedok');
  if (ok) ok.onclick = async (): Promise<void> => {
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('vincular_cuenta', { p_usuario: user.id, p_medico: linked ? linked.id : null });
    if (error || result?.ok === false) { notices.toast(t('settingsRest.editor.couldNotSave'), true); return; }
    notices.toast(linked ? t('settingsRest.editor.linkedWith', { name: linked.nombre ?? '' }) : t('settingsRest.editor.linkRemoved'));
  };
  const report = document.getElementById('umedver');
  if (report) report.onclick = (): void => { if (linked) void showReport(linked); };
}

async function paintParts(user: UserRow): Promise<void> {
  await paintCommission(user);
  if (!dialog()?.open) return;
  followRole(user);
  await paintZones(user);
  await paintLinkedCard(user);
}

/** Opens the editor of a user (it works before the user list is loaded). */
export async function editUser(id: string): Promise<void> {
  await ensureUser(id);
  const box = dialog(), body = dialogBody(), user = userById(id);
  if (!box || !body || !user) return;
  box.classList.add('cargando');
  const limit = setTimeout(() => { box.classList.remove('cargando'); }, LOADING_MAX_MS);
  try {
    body.innerHTML = editorHtml(user);
    presetOnRoleChange(body);
    const ok = document.getElementById('uguardar') as HTMLButtonElement | null;
    if (ok) ok.onclick = (): void => { void save(id, body, ok); };
    if (!box.open) box.showModal();
    await paintParts(user);
  } finally { clearTimeout(limit); requestAnimationFrame(() => { box.classList.remove('cargando'); }); }
}
