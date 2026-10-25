/**
 * «Equipos» of a confirmed order with products of kind equipment: the units still to register in the installed base, with a serial
 * number per unit, installation date and place. Migrated from the legacy verPedidoBase5 (v2.414.0).
 */
import { accountCardLegacy, appLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { range, sum } from '../../../services/values';
import { STATES } from '../model';

const MAX_SERIALS = 30;

interface Pending { nombre: string; cuenta?: string | null; cuenta_id?: string | null; producto_id: string; faltan: number; revision_meses?: number | null }

const isOpen = (): boolean => Boolean((document.getElementById('dlg') as HTMLDialogElement | null)?.open) && !document.getElementById('pdequipos');
const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function formHtml(pending: readonly Pending[]): string {
  return `<div class="depbox"><span class="sm">${t('orders.equipment.writeSerials')}</span>
        ${pending.map((item, index) => `<div><b>${escapeHtml(item.nombre)}</b> <span class="sm">· ${escapeHtml(item.cuenta ?? '')}</span><div class="cirser">${range(Math.min(item.faltan, MAX_SERIALS)).map(unit => `<input data-pqs="${index}" maxlength="120" placeholder="${t('orders.equipment.serialOf', { unit: unit + 1 })}" aria-label="${t('orders.equipment.serialLabel', { unit: unit + 1, name: escapeHtml(item.nombre) })}">`).join('')}</div></div>`).join('')}
        <div class="g2"><div><label for="pdeqi">${t('orders.equipment.installedOn')}</label><input id="pdeqi" type="date" value="${todayIso()}"></div><div><label for="pdequ">${t('orders.equipment.place')}</label><input id="pdequ" placeholder="${t('orders.equipment.placePlaceholder')}"></div></div>
        <div class="acts u-end"><button type="button" class="btn" id="pdeqok">${t('orders.equipment.register')}</button></div></div>`;
}

function rowsOf(pending: readonly Pending[], orderId: string): Record<string, unknown>[] {
  const box = document.getElementById('pdeqf'), rows: Record<string, unknown>[] = [];
  pending.forEach((item, index) => box?.querySelectorAll<HTMLInputElement>(`[data-pqs="${index}"]`).forEach(input => {
    if (!input.value.trim() || !item.cuenta_id) return;
    rows.push({ cuenta_id: item.cuenta_id, producto_id: item.producto_id, serie: input.value.trim(), instalado: value('pdeqi') || todayIso(), ubicacion: value('pdequ').trim() || null, revision_meses: Number(item.revision_meses) || 0, pedido_id: orderId });
  }));
  return rows;
}

async function register(pending: readonly Pending[], orderId: string, button: HTMLButtonElement): Promise<void> {
  const rows = rowsOf(pending, orderId);
  if (!rows.length) { notices.toast(t(pending.some(item => !item.cuenta_id) ? 'orders.equipment.noAccount' : 'orders.equipment.writeOne'), true); return; }
  button.disabled = true;
  const { error } = await legacyDb().from('equipos').insert(rows as unknown as Record<string, unknown>);
  button.disabled = false;
  if (error) { const message = (error as { message?: string }).message ?? ''; notices.toast(/row-level|policy/i.test(message) ? t('orders.equipment.noPermission') : t('orders.equipment.couldNotSave', { error: message }), true); return; }
  notices.toast(rows.length === 1 ? t('orders.equipment.oneRegistered') : t('orders.equipment.registered', { count: rows.length })); appLegacy.openOrder(orderId);
}

/** What is still to register of a confirmed order (nothing for any other). */
async function pendingOf(orderId: string): Promise<Pending[]> {
  const { data: order } = await legacyDb().from<{ estado: string }>('pedidos').select('estado').eq('id', orderId).maybeSingle();
  if (order?.estado !== STATES.confirmed) return [];
  const { data } = await legacyDb().rpc<Pending[]>('equipos_pendientes_pedido', { p_pedido: orderId });
  return (data ?? []).filter(item => item.faltan > 0);
}

export async function paintEquipment(orderId: string): Promise<void> {
  if (!isOpen() || !accountCardLegacy.planIncludes('parque')) return;
  const pending = await pendingOf(orderId);
  if (!pending.length || !isOpen()) return;
  const place = document.getElementById('pddist') ?? document.getElementById('pdpago') ?? document.getElementById('dbody')?.querySelector('.acts:last-of-type'); if (!place) return;
  const count = sum(pending.map(item => item.faltan));
  place.insertAdjacentHTML('beforebegin', `<div class="blk" id="pdequipos"><h3>${t('orders.equipment.title')}</h3>
      <div class="banda-aviso">${count === 1 ? t('orders.equipment.oneMissing') : t('orders.equipment.missing', { count })} <button type="button" class="btn sec" id="pdeqalta">${t('orders.equipment.registerAll')}</button></div>
      <div id="pdeqf"></div></div>`);
  const open = document.getElementById('pdeqalta');
  if (open) open.onclick = (): void => {
    const form = document.getElementById('pdeqf'); if (form) form.innerHTML = formHtml(pending);
    const ok = document.getElementById('pdeqok') as HTMLButtonElement | null;
    if (ok) ok.onclick = (): void => { void register(pending, orderId, ok); };
  };
}
