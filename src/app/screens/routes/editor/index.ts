/**
 * The window to create or edit a route (Rutas → «Cambiar el horario de la ruta» and the tests open it): a fixed list of accounts,
 * grouped by the centres added, or criteria that are calculated again every day. Migrated from the legacy editorRuta (v2.418.0);
 * the name stays as an adapter.
 */
import { cardSectionsLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { showLoading } from '../../../components';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { editorHtml } from './html';
import { bindSearches } from './search';
import { editorHooks, readHead, type EditorCentre, type EditorMember, type EditorState, type FilterOptions, type RouteRules } from './state';

const field = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

/** The criteria written in the window. */
function readRules(): RouteRules {
  // The keys go in the order they were always saved
  const rules: Record<string, string | number | boolean> = {};
  const texts: [string, string][] = [['provincia', 'cprov'], ['municipio', 'cmuni'], ['especialidad', 'cesp'], ['centro', 'ccen'], ['estado', 'cest']];
  for (const [key, id] of texts) if (field(id)) rules[key] = field(id);
  if (field('csv')) rules.sinVisita = Number(field('csv'));
  if (field('cdia')) rules.dia = field('cdia');
  if ((document.getElementById('curg') as HTMLInputElement | null)?.checked) rules.urgentes = true;
  return rules as RouteRules;
}

async function countMatching(button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const rules = readRules();
  const { data } = await legacyDb().rpc<unknown[]>('ids_filtrados', { f_provincia: rules.provincia ?? null, f_municipio: rules.municipio ?? null,
    f_estado: rules.estado ?? null, f_especialidad: rules.especialidad ?? null, f_urgentes: Boolean(rules.urgentes) });
  button.disabled = false;
  const preview = document.getElementById('rprev');
  if (preview) preview.innerHTML = t('routesMore.editor.matching', { count: formatNumber((data ?? []).length), professionals: term('medico', { number: 'p' }), beforeDays: rules.sinVisita ? t('routesMore.editor.beforeDays') : '' });
}

function payload(state: EditorState): Record<string, unknown> {
  const list = state.mode === 'lista';
  return {
    id: state.id, nombre: field('rn').trim(), tipo: field('rt'), desde: field('rd'), salida: field('rsal'), vuelta: field('rvue'),
    visible_para: cardSectionsLegacy.can('administrar') ? '*' : '', codigos: list ? state.codes : [], centros: list ? state.centres.map(centre => centre.id) : [], reglas: list ? null : readRules(),
  };
}

async function save(state: EditorState, button: HTMLButtonElement): Promise<void> {
  if (!field('rn').trim()) { notices.toast(t('routesMore.editor.writeName'), true); return; }
  if (state.mode === 'lista' && !state.codes.length) { notices.toast(t('routesMore.editor.addOne', { professional: term('medico', { article: 'un' }) }), true); return; }
  button.disabled = true; button.textContent = t('routesMore.editor.saving');
  const { error } = await legacyDb().rpc('guardar_ruta', { p: payload(state) });
  button.disabled = false; button.textContent = t(state.id ? 'routesMore.editor.save' : 'routesMore.editor.create');
  if (error) { notices.toast(t('routesMore.editor.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t('routesMore.editor.saved')); routes2Legacy.setSection('mis'); routes2Legacy.reloadRoutes();
}

function removeMember(state: EditorState, id: string): void {
  state.codes = state.codes.filter(code => code !== id);
  state.members = state.members.filter(member => member.id !== id);
  // A centre without accounts no longer shows in the route
  state.centres = state.centres.filter(centre => state.members.some(member => member.centro_ruta === centre.id));
  paint(state);
}

function removeCentre(state: EditorState, id: string): void {
  const out = state.members.filter(member => member.centro_ruta === id).map(member => member.id);
  state.codes = state.codes.filter(code => !out.includes(code)); state.members = state.members.filter(member => !out.includes(member.id));
  state.centres = state.centres.filter(centre => centre.id !== id);
  paint(state);
}

function bind(state: EditorState, body: HTMLElement): void {
  body.querySelectorAll<HTMLElement>('[data-rm]').forEach(button => { button.onclick = (): void => { state.mode = button.dataset.rm === 'crit' ? 'crit' : 'lista'; paint(state); }; });
  body.querySelectorAll<HTMLElement>('[data-rq]').forEach(button => { button.onclick = (): void => { removeMember(state, button.dataset.rq ?? ''); }; });
  body.querySelectorAll<HTMLElement>('[data-rqc]').forEach(button => { button.onclick = (): void => { removeCentre(state, button.dataset.rqc ?? ''); }; });
  if (state.mode === 'lista') bindSearches(state);
  const count = document.getElementById('rprob') as HTMLButtonElement | null;
  if (count) count.onclick = (): void => { void countMatching(count); };
  const ok = document.getElementById('rguardar') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void save(state, ok); };
}

function paint(state: EditorState): void {
  const body = document.getElementById('dbody'); if (!body) return;
  readHead(state);
  body.innerHTML = editorHtml(state);
  bind(state, body);
}

/** Loads what the window needs in the background: the filter options, the accounts and the centres of the route. */
function loadInBackground(state: EditorState): void {
  const { id, route } = state;
  void legacyDb().rpc<FilterOptions>('opciones_filtros', {}).then(({ data }) => { if (data) { state.options = data; if (state.mode === 'crit') paint(state); } });
  if (state.codes.length) {
    // With cuentas_de_ruta each account knows in which centre of the route it is
    const request = id && !route?.dinamica ? legacyDb().rpc<EditorMember[]>('cuentas_de_ruta', { p_id: id }) : legacyDb().rpc<EditorMember[]>('cuentas_por_ids', { p_ids: state.codes });
    void request.then(({ data }) => { state.members = (data ?? []).filter(member => state.codes.includes(member.id)); paint(state); });
  }
  const centreIds = (route?.centros ?? []) as string[];
  if (centreIds.length) {
    void legacyDb().from<EditorCentre[]>('centros').select('id,nombre,municipio').in('id', centreIds).then(({ data }) => {
      state.centres = centreIds.map(centreId => (data ?? []).find(centre => centre.id === centreId)).filter((centre): centre is EditorCentre => Boolean(centre)); paint(state);
    });
  }
}

function headOf(route: SavedRoute | null): EditorState['head'] {
  if (!route) return { nombre: '', tipo: 'Normal', desde: todayIso(), salida: '', vuelta: '' };
  return { nombre: route.nombre, tipo: route.tipo ?? '', desde: orFallback(route.desde, todayIso()), salida: orFallback(route.salida, ''), vuelta: orFallback(route.vuelta, '') };
}

function initialState(id: string | null, route: SavedRoute | null): EditorState {
  return {
    id, route, mode: route?.dinamica ? 'crit' : 'lista', codes: [...(route?.codigos ?? [])], members: [], centres: [], search: '', centreSearch: '',
    head: headOf(route), options: {}, rules: { ...((route?.reglas ?? {}) as RouteRules) },
  };
}

/** Opens the window of route `id`, or of a new route. */
export function editRoute(id: string | null): void {
  const route = id ? routes2Legacy.savedRoutes().find(item => item.id === id) ?? null : null, state = initialState(id, route);
  editorHooks.repaint = (): void => { paint(state); };
  showLoading(document.getElementById('dbody'), t('routesMore.editor.opening'));
  const box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (box && !box.open) box.showModal();
  loadInBackground(state);
  paint(state);
}
