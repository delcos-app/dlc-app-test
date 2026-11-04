/**
 * Panel delcos → Clientes → «Cifras» (PED-1, decision D12 B, v2.466.0): the orders of a company that count in Inicio and Analítica
 * although they are not completed. Only who manages the platform sees and changes them (cifras_pedidos and marcar_cuenta_en_cifras,
 * SQL 193); each change goes to the audit with its reason. Nobody in the company sees this mark.
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import type { Organization } from './model';

interface MarkedOrder { id: string; numero: string | null; fecha: string; estado: string; cliente: string | null; motivo: string | null }
interface Answer { ok?: boolean; error?: string; pedidos?: MarkedOrder[] }

const ERRORS = new Map<string, MessageKey>([['permiso', 'platform.figures.noPermission'], ['motivo', 'platform.figures.writeReason'], ['no_existe', 'platform.figures.notFound']]);

const rowHtml = (order: MarkedOrder): string => `<div class="ajfila"><div><b>${escapeHtml(order.numero ?? '—')} · ${escapeHtml(order.cliente ?? '')}</b>
    <span class="sm">${formatShortDate(order.fecha)} · ${escapeHtml(order.estado)}${order.motivo ? ` · ${escapeHtml(order.motivo)}` : ''}</span></div>
    <button type="button" class="btn sec chico" data-cifq="${escapeHtml(order.numero ?? '')}">${t('platform.figures.remove')}</button></div>`;

function windowHtml(organization: Organization, orders: readonly MarkedOrder[]): string {
  return `<div class="fh"><div><h2>${t('platform.figures.title', { name: escapeHtml(organization.nombre) })}</h2><div class="sm">${t('platform.figures.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="ajlista" id="cifl">${orders.length ? orders.map(rowHtml).join('') : `<div class="vacio vlinea">${t('platform.figures.none')}</div>`}</div>
    <div class="g2 u-mt-12"><div><label for="cifnum">${t('platform.figures.number')}</label><input id="cifnum" placeholder="${t('platform.figures.numberPlaceholder')}"></div>
      <div><label for="cifmot">${t('platform.figures.reason')}</label><input id="cifmot" maxlength="200" placeholder="${t('platform.figures.reasonPlaceholder')}"></div></div>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.close')}</button><button class="btn" id="cifok">${t('platform.figures.mark')}</button></div>`;
}

async function mark(organization: Organization, number: string, count: boolean, reason: string): Promise<void> {
  const { data, error } = await legacyDb().rpc<Answer>('marcar_cuenta_en_cifras', { p_org: organization.id, p_numero: number, p_contar: count, p_motivo: reason || null });
  if (error || !data?.ok) { const key = ERRORS.get(data?.error ?? ''); notices.toast(key ? t(key) : t('platform.figures.couldNotSave'), true); return; }
  notices.toast(t(count ? 'platform.figures.marked' : 'platform.figures.removed', { number }));
  await openFigures(organization);
}

/** Opens the window of the company's orders that count in the figures. */
export async function openFigures(organization: Organization): Promise<void> {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  const { data, error } = await legacyDb().rpc<Answer>('cifras_pedidos', { p_org: organization.id });
  if (error || !data?.ok) { notices.toast(t(data?.error === 'permiso' ? 'platform.figures.noPermission' : 'platform.figures.couldNotLoad'), true); return; }
  body.innerHTML = windowHtml(organization, data.pedidos ?? []);
  if (!box.open) box.showModal();
  const ok = document.getElementById('cifok');
  if (ok) ok.onclick = (): void => {
    const number = (document.getElementById('cifnum') as HTMLInputElement | null)?.value.trim() ?? '';
    const reason = (document.getElementById('cifmot') as HTMLInputElement | null)?.value.trim() ?? '';
    if (!number) { notices.toast(t('platform.figures.writeNumber'), true); return; }
    if (!reason) { notices.toast(t('platform.figures.writeReason'), true); return; }
    void mark(organization, number, true, reason);
  };
  body.querySelectorAll<HTMLButtonElement>('[data-cifq]').forEach(button => { button.onclick = (): void => { void mark(organization, button.dataset.cifq ?? '', false, ''); }; });
}
