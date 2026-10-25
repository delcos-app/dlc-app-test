/**
 * The portfolio of a person of the team (Configuración → Usuarios): its accounts, a search inside it, «Ficha», «Quitar» and
 * «Asignar más». Migrated from the legacy verCartera (v2.419.0).
 */
import { legacyDb, notices, term } from '../../legacy/bridge';
import { accountsEditorLegacy } from '../../legacy/accounts2-bridge';
import { showLoading } from '../../components';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { openAccountCard } from './card';

const LIMIT = 500, SEARCH_WAIT_MS = 300;

interface PortfolioAccount { id: string; nombre: string; urgente?: boolean; especialidad?: string | null; centro?: string | null; municipio?: string | null; ultima_visita?: string | null }

function rowHtml(account: PortfolioAccount): string {
  const last = account.ultima_visita ? ` · ${term('visita', { article: 'ultimo' })} ${formatShortDate(account.ultima_visita)}` : ` · ${t('accountsEditor.portfolio.notVisited')}`;
  return `<div class="item u-cursor-default">
        <span class="ic ${account.urgente ? 'w' : ''}">${account.urgente ? '!' : '·'}</span>
        <span class="tx"><b>${escapeHtml(account.nombre)}</b><span class="sm">${escapeHtml(account.especialidad ?? '')} · ${escapeHtml(account.centro ?? '')} ${escapeHtml(account.municipio ?? '')}
          ${last}</span></span>
        <span class="acts u-m-0">
          <button class="btn sec" data-cficha="${account.id}">${t('accountsEditor.portfolio.card')}</button>
          <button class="btn sec dang" data-cquita="${account.id}">${t('accountsEditor.portfolio.remove')}</button></span></div>`;
}

function pageHtml(name: string, list: readonly PortfolioAccount[], query: string): string {
  const assigned = term('medico', { number: 'p', adjective: 'asignado' });
  return `
      <div class="fh"><div><h2>${t('accountsEditor.portfolio.title', { name: escapeHtml(name) })}</h2>
        <div class="sm">${formatNumber(list.length)} ${assigned}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <input id="cbusca" value="${escapeHtml(query)}" placeholder="${t('accountsEditor.portfolio.search')}">
      <div class="lista" style="max-height:52vh;overflow:auto">${list.map(rowHtml).join('') || `<div class="vacio">${t('accountsEditor.portfolio.none', { assigned })}</div>`}</div>
      <div class="acts u-end"><button class="btn sec" id="cmas">${t('accountsEditor.portfolio.assignMore', { professionals: term('medico', { number: 'p' }) })}</button></div>`;
}

async function removeFrom(userId: string, accountId: string, repaint: () => void): Promise<void> {
  if (!await notices.confirm(t('accountsEditor.portfolio.removeText', { visits: term('visita', { number: 'p' }) }), { titulo: t('accountsEditor.portfolio.removeTitle'), ok: t('accountsEditor.portfolio.remove'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('quitar_de_cartera', { p_usuario: userId, p_medico: accountId });
  if (result?.ok === false) { notices.toast(t('accountsEditor.portfolio.noPermission'), true); return; }
  notices.toast(t('accountsEditor.portfolio.removed')); repaint(); accountsEditorLegacy.reloadAdmin();
}

async function paint(userId: string, name: string, query: string): Promise<void> {
  const { data } = await legacyDb().rpc<PortfolioAccount[]>('cartera_usuario', { p_usuario: userId, q: query || null, lim: LIMIT });
  const body = document.getElementById('dbody'), dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !dialog) return;
  body.innerHTML = pageHtml(name, data ?? [], query);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const search = document.getElementById('cbusca') as HTMLInputElement | null;
  if (search) search.oninput = (): void => { clearTimeout(timer); timer = setTimeout(() => { void paint(userId, name, search.value.trim()); }, SEARCH_WAIT_MS); };
  body.querySelectorAll<HTMLElement>('[data-cficha]').forEach(button => { button.onclick = (): void => { dialog.close(); void openAccountCard(button.dataset.cficha ?? ''); }; });
  body.querySelectorAll<HTMLElement>('[data-cquita]').forEach(button => { button.onclick = (): void => { void removeFrom(userId, button.dataset.cquita ?? '', () => { void paint(userId, name, query); }); }; });
  const more = document.getElementById('cmas'); if (more) more.onclick = (): void => { dialog.close(); accountsEditorLegacy.assignPortfolio(userId); };
}

export async function showPortfolio(userId: string): Promise<void> {
  const user = accountsEditorLegacy.teamUsers().find(item => item.id === userId);
  const body = document.getElementById('dbody'), dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  showLoading(body, t('accountsEditor.portfolio.loading'));
  dialog?.showModal();
  await paint(userId, user?.nombre ?? '', '');
}
