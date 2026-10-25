/**
 * Duplicados: the compare panel of a pair. It reads both accounts once and paints, in one go, which one stays, the fields that
 * differ, and the centres and consultations to keep; «Unificar» joins them. Migrated from the legacy compararEnBase (legado 017)
 * and compararEn (legado 136), which added the centres block afterwards with a MutationObserver (v2.417.0).
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { showLoading } from '../../../components';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { bindCentres, centresHtml, keepsNone, tidyAfterUnify, type CentreChoice, type Consultation, type KindRow } from './centres';
import { CENTRE, duplicatesState, emptyPanel, forgetAccount, unifyFields } from './model';
import { paintLists } from './lists';

type Account = Record<string, string | null | undefined> & { id: string; nombre: string; codigo: string };
interface AccountSheet { medico: Account; consultas?: (Omit<Consultation, 'de'> & { id: string | null })[]; visitas?: unknown[] }

interface Comparison {
  readonly a: Account; readonly b: Account; readonly sheets: readonly [AccountSheet, AccountSheet];
  readonly rows: { a: KindRow; b: KindRow }; readonly centres: CentreChoice;
  stays: string; readonly fields: Record<string, 'queda' | 'va'>;
}

const words = (): Record<string, string> => ({
  Consultations: term('consulta', { number: 'p', capital: 'C' }), visits: term('visita', { number: 'p' }),
});

const summary = (sheet: AccountSheet): string => t('accountsMore.compare.summary', {
  consultations: formatNumber((sheet.consultas ?? []).length), consultationsWord: term('consulta', { number: 'p' }),
  visits: formatNumber((sheet.visitas ?? []).length), visitsWord: term('visita', { number: 'p' }),
});

function optionsHtml(view: Comparison): string {
  return [[view.a, view.sheets[0]], [view.b, view.sheets[1]]].map(([account, sheet]) => {
    const item = account as Account, stays = view.stays === item.id;
    return `<button class="opt" data-queda="${item.id}" aria-pressed="${String(stays)}">
          <span class="mk"></span><span><b>${escapeHtml(item.nombre)}</b><br>
          <span class="sm">${t('accountsMore.duplicates.code', { code: escapeHtml(item.codigo) })} · ${summary(sheet as AccountSheet)}</span><br>
          <span class="sm">${t(stays ? 'accountsMore.compare.kept' : 'accountsMore.compare.goes')}</span></span></button>`;
  }).join('');
}

function fieldsHtml(view: Comparison): string {
  const { a, b } = view, goes = view.stays === a.id ? b : a, stays = view.stays === a.id ? a : b;
  const different = unifyFields().filter(([key]) => orFallback(a[key], '') !== orFallback(b[key], ''));
  if (!different.length) return `<p class="sm u-mt-12">${t('accountsMore.compare.same')}</p>`;
  const option = (key: string, side: 'queda' | 'va', account: Account): string =>
    `<button class="opt" data-campo="${key}|${side}" aria-pressed="${String(view.fields[key] === side)}"><span class="mk"></span>${escapeHtml(orFallback(account[key], t('accountsMore.compare.empty')))}</button>`;
  return `<div>${different.map(([key, label]) => `
        <label>${label}</label>
        <div class="opciones">
          ${option(key, 'queda', stays)}
          ${option(key, 'va', goes)}
        </div>`).join('')}</div>`;
}

function panelHtml(view: Comparison): string {
  const { a, b } = view, pair = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
  return `<div class="fbox">
      <div class="fh"><div><h2>${t('accountsMore.compare.title')}</h2>
        <div class="sm">${t('accountsMore.compare.hint', words())}</div></div>
        <button class="x" id="dcx" aria-label="${t('common.close')}">✕</button></div>
      <div class="opciones">
        ${optionsHtml(view)}
      </div>
      <div class="acts"><button class="btn sec" data-dver="${a.id}">${t('accountsMore.compare.seeCard', { code: escapeHtml(a.codigo) })}</button>
        <button class="btn sec" data-dver="${b.id}">${t('accountsMore.compare.seeCard', { code: escapeHtml(b.codigo) })}</button></div>
      ${fieldsHtml(view)}
      ${centresHtml(view.centres)}
      <div class="acts u-end">
        <button class="btn sec" data-ddes="${pair}">${t('accountsMore.duplicates.notDuplicates')}</button>
        <button class="btn dang" id="duniok">${t('accountsMore.compare.unify')}</button></div></div>`;
}

async function unify(view: Comparison, button: HTMLButtonElement): Promise<void> {
  if (keepsNone(view.centres)) { notices.toast(t('accountsMore.compare.keepOne', { consultation: term('consulta') }), true); return; }
  const goes = view.stays === view.a.id ? view.b : view.a;
  if (!await notices.confirm(t('accountsMore.compare.confirmText', { name: goes.nombre }), { titulo: t('accountsMore.compare.confirmTitle'), ok: t('accountsMore.compare.unify'), peligro: true })) return;
  button.disabled = true; button.textContent = t('accountsMore.compare.unifying');
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('unificar_cuentas', { p: { queda: view.stays, va: goes.id, campos: view.fields } });
  if (error || result?.ok === false) { button.disabled = false; button.textContent = t('accountsMore.compare.unify'); notices.toast(t('accountsMore.compare.couldNotUnify'), true); return; }
  try { await tidyAfterUnify(view.centres, view.stays, view.rows); } catch (problem) { notices.toast(t('accountsMore.compare.couldNotTidy', { error: (problem as Error).message }), true); }
  notices.toast(t('accountsMore.compare.unified'));
  forgetAccount(goes.id);
  duplicatesState.current = null; paintLists(); emptyPanel(t('accountsMore.compare.unifiedPanel'));
  // The directory reloads when it is opened again
  const list = document.getElementById('lista'); if (list) list.innerHTML = '';
}

function paint(panel: HTMLElement, view: Comparison): void {
  panel.innerHTML = panelHtml(view);
  const close = document.getElementById('dcx');
  if (close) close.onclick = (): void => {
    duplicatesState.current = null;
    document.querySelectorAll('#v-duplicados .item.sel').forEach(item => { item.classList.remove('sel'); });
    emptyPanel('');
  };
  panel.querySelectorAll<HTMLElement>('[data-queda]').forEach(option => { option.onclick = (): void => { view.stays = option.dataset.queda ?? view.stays; paint(panel, view); }; });
  panel.querySelectorAll<HTMLElement>('[data-campo]').forEach(option => {
    option.onclick = (): void => { const [key = '', side] = (option.dataset.campo ?? '').split('|'); view.fields[key] = side === 'va' ? 'va' : 'queda'; paint(panel, view); };
  });
  bindCentres(panel, view.centres);
  const ok = document.getElementById('duniok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void unify(view, ok); };
}

async function professionalsOf(row: KindRow | undefined): Promise<number> {
  if (!row?.centro_id) return 0;
  const { data } = await legacyDb().rpc<{ profesionales?: unknown[] }>('ficha_centro', { p_id: row.centro_id });
  return (data?.profesionales ?? []).length;
}

async function centreChoice(sheets: readonly [AccountSheet, AccountSheet], rows: { a: KindRow; b: KindRow }): Promise<CentreChoice> {
  const isCentre = rows.a.tipo === CENTRE && rows.b.tipo === CENTRE;
  const consultations: Consultation[] = sheets.flatMap(sheet => (sheet.consultas ?? []).filter((item): item is Omit<Consultation, 'de'> => Boolean(item.id)).map(item => ({ ...item, de: sheet.medico.nombre })));
  const professionals: [number, number] = isCentre ? [await professionalsOf(rows.a), await professionalsOf(rows.b)] : [0, 0];
  return { isCentre, consultations, professionals, removed: new Set(), address: consultations[0]?.id ?? null };
}

/** Paints in `panel` the comparison of two accounts. */
export async function compareIn(panel: HTMLElement, idA: string, idB: string): Promise<void> {
  showLoading(panel, t('accountsMore.compare.loading'));
  const [{ data: first }, { data: second }, { data: kinds }] = await Promise.all([
    legacyDb().rpc<AccountSheet>('ficha_cuenta', { p_id: idA }), legacyDb().rpc<AccountSheet>('ficha_cuenta', { p_id: idB }),
    legacyDb().from<KindRow[]>('cuentas').select('id, tipo, centro_id, nombre').in('id', [idA, idB])]);
  if (!first?.medico || !second?.medico) { panel.innerHTML = `<div class="vacio">${t('accountsMore.compare.gone')}</div>`; return; }
  const kindOfId = (id: string): KindRow => (kinds ?? []).find(row => row.id === id) ?? { id };
  const sheets: [AccountSheet, AccountSheet] = [first, second], rows = { a: kindOfId(idA), b: kindOfId(idB) };
  const kept = second.medico, other = first.medico, fields: Record<string, 'queda' | 'va'> = {};
  // By default each field keeps the value of the account that stays, unless only the other one has it
  unifyFields().forEach(([key]) => { fields[key] = kept[key] ? 'queda' : other[key] ? 'va' : 'queda'; });
  paint(panel, { a: other, b: kept, sheets, rows, centres: await centreChoice(sheets, rows), stays: kept.id, fields });
}
