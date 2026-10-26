/**
 * «Por hacer» of Pedidos (v2.139.0): a card per alert (pending payment, parcels to prepare, e-mails to send) with the oldest one and the
 * entries of the last 10 days; each person chooses which ones they see, and the administration fixes the mandatory ones by role. And in
 * the centre portal, a product row with units is marked (v2.134.0). Folded from legado 073 (v2.425.0); pintarOperativa stays as an adapter.
 */
import { t } from '../../i18n';
import { byId, closestTo } from './dom';
import { sessionStore } from '../session-store';

const DAYS = 10, DAY_MS = 864e5, MIN_BAR = 14, EMPTY_BAR = 6;
interface Entry { fecha?: string; total?: number }
type AlertCard = readonly [string, string, string, string];
interface Context { today: string; entries: Record<string, Entry[] | undefined> }

const dayOf = (entry: Entry): string => String(entry.fecha ?? '').slice(0, 10);

function bars(list: readonly Entry[], today: string): number[] {
  const count: Record<string, number> = {};
  list.forEach(entry => { count[dayOf(entry)] = (count[dayOf(entry)] ?? 0) + 1; });
  return [...Array(DAYS).keys()].map(index => count[isoMas(today, index - (DAYS - 1))] ?? 0);
}

const oldestDays = (list: readonly Entry[], today: string): number =>
  (list.length ? Math.max(0, ...list.map(entry => Math.round((new Date(today).getTime() - new Date(dayOf(entry)).getTime()) / DAY_MS))) : 0);

function ago(days: number): string {
  if (days === 0) return t('legacyC.orderAlerts.today');
  return days === 1 ? t('legacyC.orderAlerts.yesterday') : t('legacyC.orderAlerts.daysAgo', { days: num(days) });
}

function sentence(key: string, list: readonly Entry[], today: string): string {
  if (!list.length) return t(key === 'pago' ? 'legacyC.orderAlerts.allPaid' : key === 'paquete' ? 'legacyC.orderAlerts.allPrepared' : 'legacyC.orderAlerts.allSent');
  const oldest = t('legacyC.orderAlerts.oldest', { ago: ago(oldestDays(list, today)) });
  if (key === 'pago' && verImportes()) return t('legacyC.orderAlerts.toCollect', { amount: eurI(list.reduce((total, entry) => total + (Number(entry.total) || 0), 0)), oldest });
  return oldest.charAt(0).toUpperCase() + oldest.slice(1);
}

function cardHtml([key, filter, title, icon]: AlertCard, context: Context): string {
  const list = context.entries[key] ?? [], dayBars = bars(list, context.today), top = Math.max(1, ...dayBars), urgent = key === 'pago' && list.length;
  const day = (index: number): string => isoMas(context.today, index - (DAYS - 1));
  return `<button type="button" class="pkt ${urgent ? 'alta' : ''}" data-pk="${filter}" aria-pressed="false" ${list.length ? '' : 'data-cero'}>
          <span class="pkfil">${t('legacyC.orderAlerts.filtering')}</span><span class="pktt">${svgIco(ICON_NOM[icon] ?? ICON_NOM.info ?? '')} ${title}</span>
          <span class="pkn" data-v="${list.length}">${num(list.length)}</span><span class="pks">${sentence(key, list, context.today)}</span>
          <span class="pkbars" aria-hidden="true">${dayBars.map((count, index) => `<i class="${index === DAYS - 1 ? 'u' : pkLibre(day(index)) ? 'fin' : ''}" style="height:${count ? Math.max(MIN_BAR, 100 * count / top) : EMPTY_BAR}%"></i>`).join('')}</span>
          <span class="pkdias">${dayBars.map((count, index) => pkDia(day(index), count, index === DAYS - 1)).join('')}</span>
          <span class="pklg">${t('legacyC.orderAlerts.lastDays')}</span></button>`;
}

function alertsBox(): HTMLElement | null {
  if (!byId('operativa')) { const reference = byId('vcuerpo'); if (!reference) return null; reference.insertAdjacentHTML('beforebegin', '<div id="operativa"></div>'); }
  return byId('operativa');
}

function bindCards(box: HTMLElement, mandatory: unknown, shown: number): void {
  box.querySelectorAll<HTMLElement>('[data-pk]').forEach(card => {
    card.onclick = (): void => {
      const select = byId<HTMLSelectElement>('popf'); if (!select) return;
      select.value = select.value === card.dataset.pk ? '' : card.dataset.pk ?? ''; select.dispatchEvent(new Event('change', { bubbles: true }));
      pkMarcar();
    };
  });
  // The gear, next to «Filtros y columnas» of the header (if it is in view)
  const tools = document.querySelector<HTMLElement>('#v-ventas .htbtn'), gear = byId('opcfg');
  if (tools?.offsetParent && gear && shown) { gear.className = 'btn sec pkcfg pkcfgcab'; tools.insertAdjacentElement('beforebegin', gear); }
  const settings = byId('opcfg'); if (settings) settings.onclick = (): void => { configurarAvisosPedidos(mandatory); };
  pkMarcar();
  pkContar([...box.querySelectorAll<HTMLElement>('.pkn[data-v]')], (value: number) => num(Math.round(value)));
}

/** Paints the alert cards of Pedidos (the legacy pintarOperativa). */
export async function paintOrderAlerts(): Promise<void> {
  if (!alertsBox()) return;
  const [{ data }, { data: settings }] = await Promise.all([RPC_ORIG('operativa_pendiente', {}) as unknown as Promise<{ data: Record<string, Entry[]> | null }>,
    (db as unknown as { from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { maybeSingle: () => Promise<{ data: { valor?: { obligatorios?: Record<string, string[]> } } | null }> } } } })
      .from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle()]);
  const box = byId('operativa'); if (!box) return;
  box.className = 'pkop';
  document.querySelectorAll('#opcfg').forEach(gear => { gear.remove(); });
  const profile = sessionStore.profile as { rol: string; preferencias?: { avisos_pedidos?: Record<string, boolean> } };
  const mandatory = settings?.valor?.obligatorios?.[profile.rol] ?? [], preferences = profile.preferencias?.avisos_pedidos ?? {};
  const shown = (PK_TARJ as readonly AlertCard[]).filter(([key]) => mandatory.includes(key) || preferences[key] !== false);
  const gear = `<button type="button" class="pkcfg" id="opcfg" aria-label="${t('legacyC.orderAlerts.choose')}" title="${t('legacyC.orderAlerts.choose')}">${svgIco(ICON_NOM.settings ?? '')}</button>`;
  const context: Context = { today: hoyISO(), entries: data ?? {} };
  box.innerHTML = !shown.length ? `<div class="pkvacio">${t('legacyC.orderAlerts.hidden')} ${gear}</div>` : `<div class="pk">${shown.map(card => cardHtml(card, context)).join('')}${gear}</div>`;
  bindCards(box, mandatory, shown.length);
}

/** v2.134.0: in «Pedir reposición» of the centre portal, the row of a product with units is marked. */
export function markPortalOrderRows(): void {
  document.addEventListener('input', event => {
    const input = closestTo<HTMLInputElement>(event.target, '#ctprods [data-ctp]'); if (!input) return;
    input.closest('.ctlin')?.classList.toggle('con', (Number(input.value) || 0) > 0);
  });
}
