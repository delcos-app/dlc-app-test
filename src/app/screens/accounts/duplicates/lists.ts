/**
 * Duplicados: the two lists (pending and similar names) of the chosen tab, «Profesionales» or «Centros», with how many of each.
 * Migrated from the legacy listasDuplicados, pintarListasDupBase and pintarListasDup (legado 017 and 136, v2.417.0).
 */
import { legacyDb, term } from '../../../legacy/bridge';
import { showLoading } from '../../../components';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { CENTRE, duplicatesState, kindOf, PERSON, type PendingDuplicate, type SimilarPair } from './model';

const KINDS_PER_READ = 150, SIMILAR_LIMIT = 200, SIMILAR_THRESHOLD = 80;

const selectedPair = (): string => (duplicatesState.current ? duplicatesState.current.join('|') : '');

function pendingRow(item: PendingDuplicate): string {
  const selected = item.par_id && selectedPair() === `${item.id}|${item.par_id}` ? 'sel' : '';
  const place = `${escapeHtml(orFallback(item.centro, ''))} ${escapeHtml(orFallback(item.municipio, ''))}`;
  const buttons = item.par_id ? `<button class="btn" data-dcmp="${item.id}|${item.par_id}">${t('accountsMore.duplicates.compare')}</button>
          <button class="btn sec" data-ddes="${item.id}|${item.par_id}">${t('accountsMore.duplicates.notDuplicate')}</button>` : '';
  return `<div class="item ${selected} u-cursor-default">
      <span class="ic w">${item.pct ? `${item.pct}%` : '?'}</span>
      <span class="tx"><b>${escapeHtml(item.nombre)}</b>
        <span class="sm">${t('accountsMore.duplicates.code', { code: escapeHtml(item.codigo) })} · ${place}</span>
        <span class="sm">${item.par_nombre ? t('accountsMore.duplicates.looksLike', { name: escapeHtml(item.par_nombre) }) : t('accountsMore.duplicates.noPair')}</span></span>
      <span class="acts u-m-0">
        ${buttons}
        <button class="btn sec" data-dver="${item.id}">${t('accountsMore.duplicates.card')}</button></span></div>`;
}

function similarRow(pair: SimilarPair): string {
  return `<div class="item ${selectedPair() === `${pair.a_id}|${pair.b_id}` ? 'sel' : ''}" style="cursor:default">
      <span class="ic">${pair.pct}%</span>
      <span class="tx"><b>${escapeHtml(pair.a_nombre)}</b><span class="sm">${escapeHtml(pair.b_nombre)} · ${t('accountsMore.duplicates.codes', { a: escapeHtml(pair.a_codigo), b: escapeHtml(pair.b_codigo) })}</span></span>
      <span class="acts u-m-0">
        <button class="btn" data-dcmp="${pair.a_id}|${pair.b_id}">${t('accountsMore.duplicates.compare')}</button>
        <button class="btn sec" data-ddes="${pair.a_id}|${pair.b_id}">${t('accountsMore.duplicates.notDuplicates')}</button></span></div>`;
}

function paintTabs(): void {
  const grid = document.querySelector('#v-duplicados .dupgrid');
  if (grid && !document.getElementById('duppest')) grid.insertAdjacentHTML('beforebegin', `<div class="segs duppest" id="duppest" role="group" aria-label="${t('accountsMore.duplicates.kindLabel')}"></div>`);
  const tabs = document.getElementById('duppest'); if (!tabs) return;
  const count = (kind: string): number => duplicatesState.pending.filter(item => kindOf(item.id) === kind).length + duplicatesState.similar.filter(pair => kindOf(pair.a_id) === kind).length;
  tabs.innerHTML = [[PERSON, term('medico', { number: 'p', capital: 'C' })], [CENTRE, t('accountsMore.duplicates.centres')]].map(([kind = '', label = '']) =>
    `<button type="button" data-dpest="${kind}" class="${duplicatesState.tab === kind ? 'on' : ''}" aria-pressed="${String(duplicatesState.tab === kind)}">${escapeHtml(label)} <span class="n">${formatNumber(count(kind))}</span></button>`).join('');
}

/** Paints both lists for the chosen tab and the tabs with their counts. */
export function paintLists(): void {
  const pendingBox = document.getElementById('dpendc'), similarBox = document.getElementById('dparc');
  if (!pendingBox || !similarBox) return;
  const pending = duplicatesState.pending.filter(item => kindOf(item.id) === duplicatesState.tab);
  const similar = duplicatesState.similar.filter(pair => kindOf(pair.a_id) === duplicatesState.tab);
  pendingBox.innerHTML = `<h2>${t('accountsMore.duplicates.pendingTitle')}<span class="n">${pending.length}</span></h2>
    <p class="sm">${t('accountsMore.duplicates.pendingHint')}</p>
    <div class="lista" id="dpendl">${pending.map(pendingRow).join('') || `<div class="vacio">${t('accountsMore.duplicates.noPending')}</div>`}</div>`;
  similarBox.innerHTML = `<h2>${t('accountsMore.duplicates.similarTitle')}<span class="n">${similar.length}</span></h2>
    <p class="sm">${t('accountsMore.duplicates.similarHint')}</p>
    <div class="lista" id="dparl">${similar.map(similarRow).join('') || `<div class="vacio">${t('accountsMore.duplicates.noSimilar')}</div>`}</div>`;
  paintTabs();
}

async function readKinds(ids: readonly string[]): Promise<void> {
  duplicatesState.kindById = new Map();
  for (let start = 0; start < ids.length; start += KINDS_PER_READ) {
    const { data } = await legacyDb().from<{ id: string; tipo?: string | null }[]>('cuentas').select('id, tipo').in('id', ids.slice(start, start + KINDS_PER_READ));
    (data ?? []).forEach(account => { duplicatesState.kindById.set(account.id, orFallback(account.tipo, PERSON)); });
  }
}

/** Reads the pending and similar pairs (and the kind of each account) and paints them. */
export async function loadLists(): Promise<void> {
  showLoading(document.getElementById('dpendc'), t('accountsMore.duplicates.searchingPending'));
  showLoading(document.getElementById('dparc'), t('accountsMore.duplicates.searchingSimilar'));
  const [pending, similar] = await Promise.all([legacyDb().rpc<PendingDuplicate[]>('duplicados_pendientes'),
    legacyDb().rpc<SimilarPair[]>('escanear_duplicados', { p_umbral: SIMILAR_THRESHOLD, p_tope: SIMILAR_LIMIT })]);
  duplicatesState.pending = pending.data ?? []; duplicatesState.similar = similar.data ?? [];
  await readKinds([...new Set([...duplicatesState.pending.map(item => item.id), ...duplicatesState.similar.map(pair => pair.a_id)])]);
  paintLists();
}
