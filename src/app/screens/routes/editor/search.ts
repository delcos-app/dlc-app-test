/**
 * The searches of the route window by list: «Añadir un centro» (adds all its accounts; those already in the route move to it) and
 * «Añadir profesionales». Migrated from the legacy editorRuta (v2.418.0).
 */
import { callRpc, legacyDb, notices, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { editorHooks, type EditorMember, type EditorState } from './state';

const WAIT_MS = 300, MIN_LETTERS = 2, RESULTS = 8, CENTRE_RADIUS_KM = 400;

interface FoundCentre { id: string; nombre: string; direccion?: string | null; municipio?: string | null; medicos?: number | null }

const professionals = (count: number): string => term('medico', { number: count === 1 ? 's' : 'p' });

async function addCentre(state: EditorState, centre: FoundCentre, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { data, error } = await legacyDb().rpc<EditorMember[]>('cuentas_de_centro', { p_centro: centre.id });
  if (error) { notices.toast(t('routesMore.editor.couldNotAddCentre', { error: (error as { message?: string }).message ?? '' }), true); button.disabled = false; return; }
  // All its accounts; those already in the route move to this centre
  const list = data ?? [];
  for (const member of list) {
    const already = state.members.find(item => item.id === member.id);
    if (already) already.centro_ruta = centre.id; else { state.codes.push(member.id); state.members.push(member); }
  }
  if (list.length) state.centres.push({ id: centre.id, nombre: centre.nombre, municipio: centre.municipio ?? null });
  state.centreSearch = '';
  notices.toast(list.length ? t('routesMore.editor.centreAdded', { count: formatNumber(list.length), professionals: professionals(list.length), centre: centre.nombre })
    : t('routesMore.editor.centreEmpty', { centre: centre.nombre, professionals: term('medico', { number: 'p' }) }), !list.length);
  editorHooks.repaint();
}

async function searchCentres(state: EditorState, query: string): Promise<void> {
  const box = document.getElementById('rrescen'); if (!box) return;
  if (query.length < MIN_LETTERS) { box.innerHTML = ''; return; }
  const { data } = await callRpc<FoundCentre[]>('buscar_centros', { p_q: query, p_lat: null, p_lon: null, p_radio: CENTRE_RADIUS_KM, p_lim: RESULTS });
  const place = document.getElementById('rrescen'); if (!place) return;
  const found = (data ?? []).filter(centre => !state.centres.some(item => item.id === centre.id));
  place.innerHTML = found.map((centre, index) => `<button class="item" type="button" data-raddc="${index}"><span class="ic">+</span>
          <span class="tx"><b>${escapeHtml(centre.nombre)}</b><span class="sm">${escapeHtml([centre.direccion, centre.municipio].filter(Boolean).join(' · '))}${centre.medicos ? ` · ${formatNumber(centre.medicos)} ${professionals(centre.medicos)}` : ''}</span></span></button>`).join('')
    || `<div class="vacio">${t('routesMore.editor.noCentre')}</div>`;
  place.querySelectorAll<HTMLButtonElement>('[data-raddc]').forEach(button => {
    button.onclick = (): void => { const centre = found[Number(button.dataset.raddc)]; if (centre) void addCentre(state, centre, button); };
  });
}

async function searchAccounts(state: EditorState, query: string): Promise<void> {
  const box = document.getElementById('rres'); if (!box) return;
  if (query.length < MIN_LETTERS) { box.innerHTML = ''; return; }
  const { data } = await legacyDb().rpc<{ filas?: EditorMember[] }>('buscar_cuentas', { q: query, f_provincia: null, f_municipio: null, f_estado: null,
    f_especialidad: null, f_area: null, f_urgentes: false, f_mios: false, f_sin_visitar: false, orden: 'nombre', lim: RESULTS, desplaz: 0 });
  const found = (data?.filas ?? []).filter(member => !state.codes.includes(member.id));
  box.innerHTML = found.map(member => `<button class="item" data-radd='${escapeHtml(JSON.stringify({ id: member.id, nombre: member.nombre, especialidad: member.especialidad, centro_nombre: member.centro_nombre, municipio: member.municipio }))}'>
          <span class="ic">+</span><span class="tx"><b>${escapeHtml(member.nombre)}</b>
            <span class="sm">${escapeHtml(member.especialidad ?? '')} · ${escapeHtml(member.centro_nombre ?? '')} ${escapeHtml(member.municipio ?? '')}</span></span></button>`).join('')
    || `<div class="vacio">${t('routesMore.editor.noMatches')}</div>`;
  box.querySelectorAll<HTMLElement>('[data-radd]').forEach(button => {
    button.onclick = (): void => {
      const member = JSON.parse(button.dataset.radd ?? '{}') as EditorMember;
      state.codes.push(member.id); state.members.push(member);
      state.search = ''; editorHooks.repaint();
    };
  });
}

function bindSearch(input: HTMLInputElement | null, onText: (text: string) => void, search: (query: string) => Promise<void>, initial: string): void {
  if (!input) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  input.oninput = (): void => { onText(input.value); clearTimeout(timer); timer = setTimeout(() => { void search(input.value.trim()); }, WAIT_MS); };
  if (initial) void search(initial);
}

/** The two searches of the list mode. */
export function bindSearches(state: EditorState): void {
  bindSearch(document.getElementById('rbuscacen') as HTMLInputElement | null, text => { state.centreSearch = text; }, query => searchCentres(state, query), state.centreSearch);
  bindSearch(document.getElementById('rbusca') as HTMLInputElement | null, text => { state.search = text; }, query => searchAccounts(state, query), state.search);
}
