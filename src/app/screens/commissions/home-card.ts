/**
 * Inicio → «Tu comisión» (or «Tu actividad»): units of the period, the commission if the person may see it and how far the next
 * tier is. Migrated from the legacy tarjetaComision (v2.411.0); tarjetaComision stays as an adapter (Inicio calls it).
 */
import { legacyDb } from '../../legacy/bridge';
import { commissionsLegacy } from '../../legacy/commissions-bridge';
import { t } from '../../i18n';
import { formatMonth } from '../../services/date-format';
import { formatCurrency, formatNumber } from '../../services/format';

interface Period {
  ok?: boolean; periodo: string; unidades: number; importe: number; valor_unidad?: number | null; sin_esquema?: boolean;
  siguiente?: { faltan: number; valor: number } | null;
}

const NOTHING = 'nada', AMOUNT = 'importe';

function nextHtml(period: Period, withAmount: boolean): string {
  const next = period.siguiente;
  if (!next) return `<p class="sm" style="padding:0 16px 14px">${t(period.sin_esquema ? 'commissions.homeCard.noScheme' : 'commissions.homeCard.topTier')}</p>`;
  return `<p class="sm" style="padding:0 16px 14px">
      ${t('commissions.homeCard.nextTier', { missing: formatNumber(next.faltan) })}${withAmount ? t('commissions.homeCard.nextTierAmount', { amount: formatCurrency(next.valor) }) : ''}.</p>`;
}

function cardHtml(period: Period, withAmount: boolean): string {
  const title = t(withAmount ? 'commissions.homeCard.yourCommission' : 'commissions.homeCard.yourActivity', { period: formatMonth(period.periodo) });
  return `<h2>${title}</h2>
    <div class="kpis" style="padding:10px 16px 4px;margin:0">
      <div class="kpi"><b>${formatNumber(period.unidades)}</b><span>${t('commissions.homeCard.units')}</span></div>
      ${withAmount ? `<div class="kpi ok"><b>${formatCurrency(period.importe)}</b><span>${t('commissions.homeCard.accrued')}</span></div>` : ''}
      ${withAmount && period.valor_unidad ? `<div class="kpi"><b>${formatCurrency(period.valor_unidad)}</b><span>${t('commissions.homeCard.perUnit')}</span></div>` : ''}
    </div>
    ${nextHtml(period, withAmount)}`;
}

export async function paintCommissionCard(): Promise<void> {
  const box = document.getElementById('c-comision');
  if (!box) return;
  const sees = commissionsLegacy.whatUserSees();
  if (!sees || sees === NOTHING) { box.innerHTML = ''; return; }
  const { data, error } = await legacyDb().rpc<Period>('comision_periodo', {});
  if (error || !data || data.ok === false || (data.sin_esquema && !data.unidades)) { box.innerHTML = ''; return; }
  box.innerHTML = cardHtml(data, sees === AMOUNT && !data.sin_esquema);
}
