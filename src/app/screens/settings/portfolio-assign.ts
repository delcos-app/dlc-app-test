/**
 * Assign or remove a user's portfolio by looking at the list (legado 019, v2.424.0): filters, the list with its pages, untick the
 * ones you do not want, and assign or remove all the selected ones. assignPortfolioToUser is the legacy asignarCartera (legado 052).
 */
import { legacyDb, notices, term } from '../../legacy/bridge';
import { adminLegacy, portfolioLegacy, type AdminUser } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { ensureUser } from './users/model';

const PAGE = 50, FILTER_IDS = ['aprov', 'amuni', 'aesp', 'aest', 'aurg'];

interface Option { v: string; n: number }
interface Options { provincias?: Option[]; municipios?: Option[]; especialidades?: Option[]; estados?: Option[] }
interface Found { id: string; nombre: string; especialidad?: string | null; centro_nombre?: string | null; municipio?: string | null; comerciales?: { nombre: string }[] }
interface State { total: number; page: number; readonly left: Set<string> }

const byId = (id: string): HTMLElement | null => document.getElementById(id);
/** The value of a filter, or null when it is empty (no filter). */
const valueOf = (id: string): string | null => { const value = (byId(id) as HTMLSelectElement | null)?.value; return value ? value : null; };
const optionsHtml = (list: readonly Option[] | undefined): string => `<option value=""></option>${(list ?? []).map(item => `<option value="${escapeHtml(item.v)}">${escapeHtml(item.v)} (${item.n})</option>`).join('')}`;

const filters = (): Record<string, unknown> => ({
  f_provincia: valueOf('aprov'), f_municipio: valueOf('amuni'), f_especialidad: valueOf('aesp'), f_estado: valueOf('aest'), f_urgentes: Boolean((byId('aurg') as HTMLInputElement | null)?.checked),
});

function windowHtml(user: AdminUser, options: Options): string {
  const professionals = term('medico', { number: 'p' });
  return `<div data-nosucio>
    <div class="fh"><div><h2>${t('legacyA.portfolio.title', { name: escapeHtml(user.nombre) })}</h2>
      <div class="sm">${t('legacyA.portfolio.now', { count: formatNumber(user.medicos), assigned: term('medico', { number: 'p', adjective: 'asignado' }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <p class="sm">${t('legacyA.portfolio.hint')}</p>
    <div class="g2">
      <div><label for="aprov">${t('legacyA.tools.province')}</label><select id="aprov">${optionsHtml(options.provincias)}</select></div>
      <div><label for="amuni">${t('legacyA.tools.municipality')}</label><select id="amuni">${optionsHtml(options.municipios)}</select></div></div>
    <div class="g2">
      <div><label for="aesp">${term('especialidad', { capital: 'C' })}</label><select id="aesp">${optionsHtml(options.especialidades)}</select></div>
      <div><label for="aest">${t('legacyA.portfolio.state')}</label><select id="aest">${optionsHtml(options.estados)}</select></div></div>
    <label class="opt u-mt-10"><input type="checkbox" id="aurg"> ${t('legacyA.tools.onlyUrgent')}</label>
    <div id="amsg" class="cuenta u-p-10-0-0"></div>
    <div id="alista"></div>
    <div class="acts u-end">
      <button class="btn sec" id="aquitar">${t('legacyA.portfolio.removeSelected', { professionals })}</button>
      <button class="btn" id="aasignar">${t('legacyA.portfolio.assignSelected', { professionals })}</button></div></div>`;
}

function rowHtml(item: Found, state: State): string {
  const chips = (item.comerciales ?? []).map(person => `<span>${escapeHtml(portfolioLegacy.firstName(person.nombre))}</span>`).join('') || `<span class="sin">${t('legacyA.portfolio.unassigned')}</span>`;
  return `<label class="item" style="cursor:pointer;margin:0">
        <input type="checkbox" data-am="${item.id}" ${state.left.has(item.id) ? '' : 'checked'}>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml([item.especialidad, item.centro_nombre, item.municipio].filter(Boolean).join(' · '))}</span></span>
        <span class="comchips">${chips}</span>
      </label>`;
}

function paintCount(state: State, repaint: () => void): void {
  const message = byId('amsg'); if (!message) return;
  message.innerHTML = `${t('legacyA.portfolio.selected', { count: formatNumber(state.total - state.left.size), total: formatNumber(state.total) })}
      ${state.left.size ? ` · <button class="kcfg" id="atodos">${t('legacyA.portfolio.tickAll')}</button>` : ''}`;
  const all = byId('atodos'); if (all) all.onclick = (): void => { state.left.clear(); repaint(); };
}

async function paintList(state: State): Promise<void> {
  const list = byId('alista'); if (!list) return;
  const repaint = (): void => { void paintList(state); };
  portfolioLegacy.loading(list, t('legacyA.portfolio.searching', { professionals: term('medico', { number: 'p' }) }));
  const { data } = await legacyDb().rpc<{ total: number; filas?: Found[] }>('buscar_cuentas', { q: null, f_area: null, f_mios: false, f_sin_visitar: false, orden: 'nombre', lim: PAGE, desplaz: state.page * PAGE, ...filters() });
  state.total = data ? data.total : 0;
  const rows = data?.filas ?? [];
  list.innerHTML = `<div class="carsel">${rows.map(row => rowHtml(row, state)).join('') || `<div class="vacio">${t('legacyA.portfolio.none', { noProfessional: term('medico', { article: 'ningun', articleCapital: 'C' }) })}</div>`}</div><div id="apag"></div>`;
  list.querySelectorAll<HTMLInputElement>('[data-am]').forEach(box => {
    box.onchange = (): void => { if (box.checked) state.left.delete(box.dataset.am ?? ''); else state.left.add(box.dataset.am ?? ''); paintCount(state, repaint); };
  });
  const pages = byId('apag');
  if (pages) pages.innerHTML = state.total > PAGE ? portfolioLegacy.pages(state.total, state.page, PAGE).replace(/<span class="ptam">[\s\S]*?<\/span><\/div>$/, '</div>') : '';
  pages?.querySelectorAll<HTMLElement>('[data-pg]').forEach(button => { button.onclick = (): void => { state.page = Number(button.dataset.pg); repaint(); }; });
  paintCount(state, repaint);
}

function confirmChange(user: AdminUser, count: number, remove: boolean): Promise<boolean> {
  const text = t(remove ? 'legacyA.portfolio.confirmRemove' : 'legacyA.portfolio.confirmAssign', { count: formatNumber(count), professionals: term('medico', { number: 'p' }), name: user.nombre });
  return notices.confirm(text, { titulo: t(remove ? 'legacyA.portfolio.removeTitle' : 'legacyA.portfolio.assignTitle'), ok: t(remove ? 'legacyA.portfolio.remove' : 'legacyA.portfolio.assign'), peligro: remove });
}

/** «No se ha podido: …» with the error or «sin permiso». */
const failureText = (error: unknown): string => t('legacyA.portfolio.couldNot', { error: (error as { message?: string } | null)?.message ?? t('legacyA.portfolio.noPermission') });

function changedText(remove: boolean, rows: number, moved: number | undefined): string {
  const movedText = moved ? t('legacyA.portfolio.moved', { count: formatNumber(moved) }) : '';
  return t(remove ? 'legacyA.portfolio.removed' : 'legacyA.portfolio.assigned', { count: formatNumber(rows), professionals: term('medico', { number: 'p' }), moved: movedText });
}

async function apply(user: AdminUser, state: State, remove: boolean, button: HTMLButtonElement): Promise<void> {
  const ids = ((await legacyDb().rpc<string[]>('ids_filtrados', filters())).data ?? []).filter(id => !state.left.has(id));
  if (!ids.length) { notices.toast(t('legacyA.portfolio.noneSelected', { noProfessional: term('medico', { article: 'ningun', adjective: 'seleccionado' }) }), true); return; }
  if (!await confirmChange(user, ids.length, remove)) return;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; filas: number; movidos?: number }>('asignar_cartera', { p: { usuario_id: user.id, medicos: ids, quitar: remove } });
  button.disabled = false;
  if (error || result?.ok === false) { notices.toast(failureText(error), true); return; }
  notices.toast(changedText(remove, result?.filas ?? 0, result?.movidos));
  (byId('dlg') as HTMLDialogElement | null)?.close(); portfolioLegacy.reloadAdmin();
}

/** Makes sure user `id` has its profile, then opens its portfolio window (legado 052: a new user could not take a portfolio yet). */
export async function assignPortfolioToUser(id: string): Promise<void> {
  await ensureUser(id);
  await assignPortfolio(id);
}

/** Opens the portfolio window of user `id` (from the users list of Administración). */
export async function assignPortfolio(id: string): Promise<void> {
  const user = adminLegacy.users().find(item => item.id === id); if (!user) return;
  const { data: options } = await legacyDb().rpc<Options>('opciones_filtros', {});
  const body = byId('dbody'); if (!body) return;
  body.innerHTML = windowHtml(user, options ?? {});
  const state: State = { total: 0, page: 0, left: new Set() };
  FILTER_IDS.forEach(key => { const field = (byId(key) as HTMLInputElement | null); if (field) field.onchange = (): void => { state.page = 0; state.left.clear(); void paintList(state); }; });
  const assign = (byId('aasignar') as HTMLButtonElement | null), remove = (byId('aquitar') as HTMLButtonElement | null);
  if (assign) assign.onclick = (): void => { void apply(user, state, false, assign); };
  if (remove) remove.onclick = (): void => { void apply(user, state, true, remove); };
  (byId('dlg') as HTMLDialogElement | null)?.showModal();
  void paintList(state);
}
