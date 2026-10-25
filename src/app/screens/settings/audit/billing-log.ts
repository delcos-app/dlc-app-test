/** Facturación → «Registro»: everything that happened in the billing (issues, rectifications, payments, settings). Migrated from the legacy pintarRegistro (v2.415.0). */
import { callRpc } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const LIMIT = 200;

interface BillingEvent { fecha: string; tipo: string; numero?: string | null; usuario?: string | null; detalle: unknown }

const when = (date: string): string => new Date(date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

const rowHtml = (event: BillingEvent): string => `<div class="dr u-cursor-default"><span>${when(event.fecha)}</span><span><b>${escapeHtml(event.tipo)}</b></span>
      <span>${escapeHtml(orFallback(event.numero, '—'))}</span><span>${escapeHtml(orFallback(event.usuario, '—'))}</span><span class="sm corta">${escapeHtml(settingsLegacy.billingEventDetail(event.detalle))}</span></div>`;

export async function paintBillingLog(): Promise<void> {
  settingsLegacy.showLoading(document.getElementById('fcuerpo'), t('settings.billingLog.loading'));
  const { data } = await callRpc<BillingEvent[]>('eventos_facturacion_lista', { lim: LIMIT });
  const box = document.getElementById('fcuerpo'); if (!box) return;
  const head = [t('settings.billingLog.date'), t('settings.billingLog.event'), t('settings.billingLog.invoice'), t('settings.billingLog.person'), t('settings.billingLog.detail')];
  box.innerHTML = `<div class="panel"><div class="cuenta">${t('settings.billingLog.intro')}</div>
    <div class="dgrid-wrap"><div class="dgrid evs"><div class="dh">${head.map(title => `<span>${title}</span>`).join('')}</div>
    ${(data ?? []).map(rowHtml).join('') || `<div class="vacio">${t('settings.billingLog.empty')}</div>`}
    </div></div></div>`;
}
