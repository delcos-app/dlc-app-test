/**
 * Configuración → Datos → Distribuidores: wholesalers or depots that serve orders, with «Editar», «Dejar de usar» and, v2.265.0,
 * their transfers (how many unsent, under way, served and with an issue; pressing one opens the order). Migrated from the legacy
 * pintarDistribuidores, editarDistribuidor and verTransfers (v2.414.0); pintarDistribuidores stays as an adapter (legado 105).
 */
import { appLegacy, legacyDb, notices } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { ordersLegacy, type Distributor } from '../../legacy/orders-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { euros, transferPill } from './model';
import { loadDistributors } from './editor/distributor';

const SETTINGS_KEY = 'distribuidores', EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Every distributor, also the ones no longer used (the transfers window looks them up). */
let all: Distributor[] = [];

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? '';
const secondWindow = (): HTMLDialogElement | null => document.getElementById('dlg2') as HTMLDialogElement | null;
const stillShown = (): boolean => Boolean(document.getElementById('cfgcuerpo')) && ordersLegacy.settingsSection() === SETTINGS_KEY;

function editorHtml(distributor: Partial<Distributor>, isNew: boolean): string {
  return `<div class="fh"><div><h2>${t(isNew ? 'orders.distributors.newTitle' : 'orders.distributors.editTitle')}</h2><div class="sm">${t('orders.distributors.subtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <label for="dsn">${t('orders.distributors.name')}</label><input id="dsn" placeholder="${t('orders.distributors.namePlaceholder')}" value="${escapeHtml(distributor.nombre ?? '')}">
    <div class="g2"><div><label for="dse">${t('orders.distributors.email')}</label><input id="dse" type="email" value="${escapeHtml(distributor.email ?? '')}"></div>
      <div><label for="dst">${t('orders.distributors.phone')}</label><input id="dst" inputmode="tel" value="${escapeHtml(distributor.telefono ?? '')}"></div></div>
    <label for="dsnota">${t('orders.distributors.note')}</label><input id="dsnota" placeholder="${t('orders.distributors.notePlaceholder')}" value="${escapeHtml(distributor.nota ?? '')}">
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar2>${t('common.cancel')}</button><button type="button" class="btn" id="dsok">${t(isNew ? 'orders.distributors.add' : 'common.save')}</button></div>`;
}

/** The written distributor, or null (with a notice) if something is missing or wrong. */
function readForm(): Record<string, string | null> | null {
  const name = value('dsn'); if (!name) { notices.toast(t('orders.distributors.writeName'), true); return null; }
  const email = value('dse') || null;
  if (email && !EMAIL.test(email)) { notices.toast(t('orders.distributors.badEmail'), true); return null; }
  return { nombre: name, email, telefono: value('dst') || null, nota: value('dsnota') || null };
}

async function save(existing: Distributor | null, button: HTMLButtonElement): Promise<void> {
  const row = readForm(); if (!row) return;
  button.disabled = true;
  const { error } = existing ? await legacyDb().from('distribuidores').update(row).eq('id', existing.id) : await legacyDb().from('distribuidores').insert(row);
  if (error) { button.disabled = false; notices.toast(t(existing ? 'orders.distributors.couldNotSave' : 'orders.distributors.couldNotAdd', { error: (error as { message?: string }).message ?? '' }), true); return; }
  secondWindow()?.close(); notices.toast(t(existing ? 'orders.distributors.saved' : 'orders.distributors.added'));
  await loadDistributors(true).catch(() => []);
  if (stillShown()) void paintDistributors();
}

export function editDistributor(existing: Distributor | null): void {
  const body = document.getElementById('dlg2body'); if (!body) return;
  body.innerHTML = editorHtml(existing ?? {}, !existing);
  secondWindow()?.showModal();
  const ok = document.getElementById('dsok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void save(existing, ok); };
}

interface TransferRow { id: string; numero?: string | null; cliente?: string | null; fecha: string; unidades: number; base: number; transfer_nota?: string | null; transfer_estado?: string | null }
interface Transfers { resumen?: Record<string, number> | null; pedidos?: TransferRow[] | null }

function transfersHtml(data: Transfers | null): string {
  const summary = data?.resumen ?? {}, rows = data?.pedidos ?? [];
  const counts = ([['orders.transfers.notSent', 'sin_enviar'], ['orders.transfers.sent', 'enviado'], ['orders.transfers.accepted', 'aceptado'], ['orders.transfers.served', 'servido'], ['orders.transfers.withIssue', 'incidencia']] as const)
    .map(([label, key]) => `<span class="${key === 'incidencia' && summary[key] ? 'warn' : ''}"><b>${formatNumber(summary[key] ?? 0)}</b> ${t(label)}</span>`).join('');
  const list = rows.length ? `<div class="lista trflista">${rows.map(row => `<button type="button" class="item" data-trfped="${row.id}">
        <span class="tx"><b>${escapeHtml(orFallback(row.numero, t('orders.transfers.order')))} · ${escapeHtml(orFallback(row.cliente, '—'))}</b><span class="sm">${formatShortDate(String(row.fecha).slice(0, 10))} · ${t('orders.transfers.units', { count: formatNumber(row.unidades) })} · ${euros(row.base)}${row.transfer_nota ? ` · ${escapeHtml(row.transfer_nota)}` : ''}</span></span>
        ${transferPill(row.transfer_estado)}</button>`).join('')}</div>` : `<p class="vacio">${t('orders.transfers.none')}</p>`;
  return `<div class="trfres">${counts}</div>
    ${list}`;
}

async function showTransfers(id: string): Promise<void> {
  const distributor = all.find(item => item.id === id), body = document.getElementById('dlg2body'); if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${t('orders.transfers.title', { name: escapeHtml(distributor?.nombre ?? '') })}</h2><div class="sm">${t('orders.transfers.subtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div><div id="trfcuerpo"></div>`;
  customersLegacy.showLoading(document.getElementById('trfcuerpo'), t('orders.transfers.loading'));
  secondWindow()?.showModal();
  const { data, error } = await legacyDb().rpc<Transfers>('transfers_distribuidor', { p_dist: id });
  const box = document.getElementById('trfcuerpo'); if (!box) return;
  if (error) { box.innerHTML = `<p class="vacio">${t('orders.transfers.couldNotRead', { error: escapeHtml((error as { message?: string }).message) })}</p>`; return; }
  box.innerHTML = transfersHtml(data);
  box.querySelectorAll<HTMLElement>('[data-trfped]').forEach(button => { button.onclick = (): void => { secondWindow()?.close(); appLegacy.openOrder(button.dataset.trfped ?? ''); }; });
}

const rowHtml = (item: Distributor): string => `<div class="ajfila disfila${item.activo ? '' : ' disoff'}" data-disid="${item.id}">
      <div><b>${escapeHtml(item.nombre)}${item.activo ? '' : ` <span class="pill">${t('orders.distributors.notUsed')}</span>`}</b>
        <span class="sm">${[item.email, item.telefono].filter((text): text is string => Boolean(text)).map(escapeHtml).join(' · ') || t('orders.distributors.noContact')}${item.nota ? ` · ${escapeHtml(item.nota)}` : ''}</span></div>
      <div class="ajctl"><button type="button" class="btn sec" data-distrf="${item.id}">${t('orders.distributors.transfers')}</button><button type="button" class="btn sec" data-dised="${item.id}">${t('orders.distributors.edit')}</button>
        <button type="button" class="btn sec" data-disact="${item.id}">${t(item.activo ? 'orders.distributors.stopUsing' : 'orders.distributors.useAgain')}</button></div></div>`;

function pageHtml(): string {
  const used = all.filter(item => item.activo), unused = all.filter(item => !item.activo);
  const list = all.length ? used.map(rowHtml).join('') + (unused.length ? `<h3 class="dissub">${t('orders.distributors.noLongerUsed')}</h3>${unused.map(rowHtml).join('')}` : '')
    : `<p class="vacio" id="disvacio">${t('orders.distributors.none')}</p>`;
  return `<div class="card disw">
      <div class="discab"><p class="sm">${t('orders.distributors.hint')}</p>
        <button type="button" class="btn" id="disnuevo">${t('orders.distributors.new')}</button></div>
      ${list}</div>`;
}

async function toggleUse(item: Distributor, button: HTMLButtonElement): Promise<void> {
  if (item.activo && !await notices.confirm(t('orders.distributors.stopText'), { titulo: t('orders.distributors.stopTitle', { name: item.nombre }), ok: t('orders.distributors.stopUsing') })) return;
  button.disabled = true;
  const { error } = await legacyDb().from('distribuidores').update({ activo: !item.activo }).eq('id', item.id);
  if (error) { button.disabled = false; notices.toast(t('orders.distributors.couldNotChange', { error: (error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t(item.activo ? 'orders.distributors.notUsedNow' : 'orders.distributors.usedAgain'));
  await loadDistributors(true).catch(() => []);
  void paintDistributors();
}

function bind(box: HTMLElement): void {
  const add = document.getElementById('disnuevo'); if (add) add.onclick = (): void => { editDistributor(null); };
  const find = (id: string | undefined): Distributor | undefined => all.find(item => item.id === id);
  box.querySelectorAll<HTMLElement>('[data-dised]').forEach(button => { button.onclick = (): void => { editDistributor(find(button.dataset.dised) ?? null); }; });
  box.querySelectorAll<HTMLButtonElement>('[data-disact]').forEach(button => { button.onclick = (): void => { const item = find(button.dataset.disact); if (item) void toggleUse(item, button); }; });
  box.querySelectorAll<HTMLElement>('[data-distrf]').forEach(button => { button.onclick = (): void => { void showTransfers(button.dataset.distrf ?? ''); }; });
}

export async function paintDistributors(): Promise<void> {
  const loading = document.getElementById('cfgcuerpo'); if (!loading) return;
  customersLegacy.showLoading(loading, t('orders.distributors.loading'));
  const { data, error } = await legacyDb().from<Distributor[]>('distribuidores').select('id,nombre,email,telefono,nota,activo').order('nombre');
  const box = document.getElementById('cfgcuerpo');
  if (!box || !stillShown()) return;
  if (error) { box.innerHTML = `<div class="card"><p class="sm">${t('orders.distributors.couldNotRead', { error: escapeHtml((error as { message?: string }).message) })}</p></div>`; return; }
  all = data ?? [];
  box.innerHTML = pageHtml();
  bind(box);
}
