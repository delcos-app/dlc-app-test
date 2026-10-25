/**
 * «Editar visita» from the account card: date, samples, results, how it was, products presented, next action and note; or delete
 * it. Migrated from the legacy editarVisitaBase and editarVisita (v2.412.0); how it was and the products now go in the same
 * payload (before, a db.rpc hook of legado 080 added them).
 */
import { accountCardLegacy, agendaActions, legacyDb, notices, term } from '../../legacy/bridge';
import { visitLegacy } from '../../legacy/visit-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { modeButtons, NEGATIVE, pressed, togglePressed } from './model';

interface Extra { mode: string; products: string[]; productList: readonly { id: string; nombre: string }[] }

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function resultButtons(values: readonly { valor: string; extra?: string | null }[], marked: readonly string[], negative: boolean): string {
  return values.map(result => `<button type="button" class="opt${negative ? ' neg' : ''}" data-res="${escapeHtml(result.valor)}"${negative ? ' data-neg="1"' : ''}
      aria-pressed="${String(marked.includes(result.valor))}"><span class="mk"></span>${escapeHtml(result.valor)}</button>`).join('');
}

function extraHtml(extra: Extra): string {
  const products = extra.productList.length ? `<label>${t('visit.record.products')}</label><div class="opciones" id="evprods">${extra.productList.map(product => `<button type="button" class="opt" data-evprod="${product.id}" aria-pressed="${String(extra.products.includes(product.id))}"><span class="mk"></span>${escapeHtml(product.nombre)}</button>`).join('')}</div>` : '';
  return `<label>${t('visit.record.howItWas')}</label>
      <div class="segs" id="evmodo" role="group" aria-label="${t('visit.record.howItWas')}">${modeButtons('evmodo', extra.mode)}</div>
      ${products}`;
}

function editorHtml(visit: CardVisit, extra: Extra): string {
  const results = visitLegacy.resultValues(), marked = visit.resultados ?? [];
  return `
    <div class="fh"><div><h2>${t('visit.edit.title', { visit: term('visita') })}</h2><div class="sm">${t('visit.edit.recordedOn', { date: formatShortDate(visit.fecha) })}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2">
      <div><label for="evf">${t('visit.edit.date')}</label><input id="evf" type="date" value="${escapeHtml(visit.fecha)}"></div>
      <div><label for="evm">${t('visit.edit.samples')}</label><input id="evm" type="number" min="0" value="${visit.muestras ?? 0}"></div>
    </div>
    ${extraHtml(extra)}
    <label>${t('visit.edit.result')}</label>
    <div class="opciones">${resultButtons(results.filter(result => result.extra !== NEGATIVE), marked, false)}</div>
    <div class="opciones u-mt-8">${resultButtons(results.filter(result => result.extra === NEGATIVE), marked, true)}</div>
    <div class="g2 u-mt-6">
      <div><label for="evpa">${t('visit.edit.nextAction')}</label><input id="evpa" value="${escapeHtml(visit.proxima_accion ?? '')}"></div>
      <div><label for="evpf">${t('visit.edit.date')}</label><input id="evpf" type="date" value="${escapeHtml(visit.proxima_fecha ?? '')}"></div>
    </div>
    <label for="evn">${t('visit.edit.note')}</label><textarea id="evn" rows="3">${escapeHtml(visit.nota ?? '')}</textarea>
    <div class="acts u-between">
      <button class="btn sec dang" id="evborrar">${t('visit.edit.delete', { visit: term('visita') })}</button>
      <span class="acts u-m-0"><button class="btn sec" data-cerrar>${t('common.cancel')}</button>
        <button class="btn" id="evok">${t('common.save')}</button></span></div>`;
}

/** How it was and the products presented of a saved visit (the products only with the coverage section). */
async function loadExtra(visitId: string, planHasCoverage: boolean): Promise<Extra> {
  const { data: activity } = await legacyDb().from<{ modo?: string | null; productos?: string[] | null }>('actividades').select('modo,productos').eq('id', visitId).maybeSingle();
  const chosen = activity?.productos ?? [];
  let productList: { id: string; nombre: string }[] = [];
  if (planHasCoverage) {
    productList = [...await visitLegacy.promotedProducts()];
    const missing = chosen.filter(id => !productList.some(product => product.id === id));
    if (missing.length) { const { data } = await legacyDb().from<{ id: string; nombre: string }[]>('productos').select('id,nombre').in('id', missing); productList = productList.concat(data ?? []); }
  }
  return { mode: activity?.modo ?? 'presencial', products: [...chosen], productList };
}

function afterChange(accountId: string, message: string): void {
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(message); agendaActions.openAccount(accountId); visitLegacy.reloadHome();
}

async function save(visit: CardVisit, extra: Extra, accountId: string, button: HTMLButtonElement): Promise<void> {
  const body = document.getElementById('dbody');
  const results = [...(body?.querySelectorAll<HTMLElement>('[data-res][aria-pressed=true]') ?? [])].map(item => item.dataset.res ?? '');
  button.disabled = true; button.textContent = t('visit.edit.saving');
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('actualizar_actividad', { p: {
    id: visit.id, fecha: value('evf'), resultados: results, muestras: Number(value('evm')) || 0,
    nota: value('evn').trim(), proxima_accion: value('evpa').trim(), proxima_fecha: value('evpf'),
    modo: extra.mode, ...(document.getElementById('evprods') ? { productos: extra.products } : {}),
  } });
  button.disabled = false; button.textContent = t('common.save');
  if (error || result?.ok === false) { notices.toast(t('visit.edit.couldNotSave'), true); return; }
  afterChange(accountId, t('visit.edit.saved', { visit: term('visita', { capital: 'C', adjective: 'actualizado' }) }));
}

async function remove(visit: CardVisit, accountId: string): Promise<void> {
  const text = t('visit.edit.deleteText', { visit: term('visita', { article: 'el', articleCapital: 'C' }), professional: term('medico', { article: 'del' }) });
  if (!await notices.confirm(text, { titulo: t('visit.edit.deleteTitle', { visit: term('visita', { article: 'el' }) }), ok: t('visit.edit.deleteOk'), peligro: true })) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('borrar_actividad', { p_id: visit.id });
  if (error || result?.ok === false) { notices.toast(t('visit.edit.couldNotDelete'), true); return; }
  afterChange(accountId, t('visit.edit.deleted', { visit: term('visita', { capital: 'C', adjective: 'borrado' }) }));
}

function bind(body: HTMLElement, visit: CardVisit, extra: Extra, accountId: string): void {
  body.querySelectorAll<HTMLElement>('[data-res]').forEach(button => {
    button.onclick = (): void => {
      const negative = button.dataset.neg === '1', on = pressed(button);
      body.querySelectorAll<HTMLElement>('[data-res]').forEach(other => { if (negative || other.dataset.neg === '1') other.setAttribute('aria-pressed', 'false'); });
      button.setAttribute('aria-pressed', String(!on));
    };
  });
  const modes = body.querySelectorAll<HTMLElement>('[data-evmodo]');
  modes.forEach(button => { button.onclick = (): void => { extra.mode = button.dataset.evmodo ?? 'presencial'; modes.forEach(other => { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); }); }; });
  body.querySelectorAll<HTMLElement>('[data-evprod]').forEach(button => {
    button.onclick = (): void => { togglePressed(button); extra.products = [...body.querySelectorAll<HTMLElement>('[data-evprod][aria-pressed=true]')].map(item => item.dataset.evprod ?? ''); };
  });
  const ok = document.getElementById('evok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(visit, extra, accountId, ok); };
  const del = document.getElementById('evborrar'); if (del) del.onclick = (): void => { void remove(visit, accountId); };
}

/** Opens the editor of a saved visit of `accountId`. */
export async function editVisit(visit: CardVisit, accountId: string): Promise<void> {
  const extra = await loadExtra(visit.id, accountCardLegacy.planIncludes('cobertura')).catch((): Extra => ({ mode: 'presencial', products: [], productList: [] }));
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(visit, extra);
  bind(body, visit, extra, accountId);
  box.showModal();
}
