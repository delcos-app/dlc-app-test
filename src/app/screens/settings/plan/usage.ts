/**
 * Usage of the company against the limits of its plan (plan 12.3, v2.447.0, SQL 189): records and space as bars, a warning band from
 * 80 % and another from 100 %. Plan y suscripción shows the own company; Panel delcos → Organizaciones a pill per company. Measuring
 * and warning only: nothing is cut. Without SQL 189, or without permission, the server answers nothing and nothing is shown.
 */
import { callRpc } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';

export interface LimitMeter { uso?: number; limite?: number | null; pct?: number | null }
export type LimitState = 'ok' | 'aviso' | 'excedido';
export interface LimitsUse { plan?: string; estado?: LimitState; filas?: LimitMeter; almacenamiento_mb?: LimitMeter; archivo_mb?: number | null; bloquear_archivos?: boolean }
export interface OrganisationLimits extends LimitsUse { id: string }

const FULL = 100, MIN_BAR = 2;

/** The own company's usage, or null (no SQL 189, no permission or an error). */
export async function loadLimits(): Promise<LimitsUse | null> {
  try {
    const { data, error } = await callRpc<LimitsUse>('limites_uso', {});
    return !error && data?.estado ? data : null;
  } catch { return null; }
}

/** Every client company's usage for Panel delcos, by id (empty without SQL 189). */
export async function loadOrganisationLimits(): Promise<Map<string, OrganisationLimits>> {
  try {
    const { data, error } = await callRpc<OrganisationLimits[]>('limites_organizaciones', {});
    return new Map(!error && Array.isArray(data) ? data.map(item => [item.id, item]) : []);
  } catch { return new Map(); }
}

const megabytes = (value: number | null | undefined): string => t('limits.megabytes', { value: formatNumber(value ?? 0) });

function meterRow(name: string, hint: string, meter: LimitMeter = {}, format: (value: number | null | undefined) => string): string {
  const { uso, limite } = meter, pct = meter.pct ?? 0, hasLimit = limite !== null && limite !== undefined;
  const text = hasLimit ? t('limits.ofLimit', { used: format(uso), limit: format(limite) }) : `${format(uso)} · ${t('limits.noLimit')}`;
  const width = hasLimit ? Math.max(MIN_BAR, Math.min(FULL, pct)) : 0;
  return `<div class="bh" title="${escapeHtml(hint)}"><span class="bhn">${escapeHtml(name)}</span>
    <span class="bhb"><i style="width:${width}%"></i></span><b>${hasLimit ? `${pct} %` : '–'}</b></div>
    <div class="sm">${text}</div>`;
}

/** «Uso de la cuenta» card for Plan y suscripción (empty without data). */
export function usageCardHtml(use: LimitsUse | null): string {
  if (!use) return '';
  const band = use.estado === 'excedido' ? `<div class="banda-aviso u-mt-8" id="limaviso" data-estado="excedido">${t('limits.exceeded')}${use.bloquear_archivos ? ` ${t('limits.filesBlocked')}` : ''}</div>`
    : use.estado === 'aviso' ? `<div class="banda-aviso u-mt-8" id="limaviso" data-estado="aviso">${t('limits.warning')}</div>` : '';
  const fileMax = use.archivo_mb !== null && use.archivo_mb !== undefined ? `<p class="sm">${t('limits.fileMax', { value: formatNumber(use.archivo_mb) })}</p>` : '';
  return `<div class="card cfgpanel" id="limuso"><h2 style="padding:0 0 4px">${t('limits.title')}</h2>
    <p class="sm">${t('limits.intro')}</p>
    <div class="barrash">${meterRow(t('limits.records'), t('limits.recordsHint'), use.filas, value => formatNumber(value ?? 0))}
      ${meterRow(t('limits.space'), t('limits.spaceHint'), use.almacenamiento_mb, megabytes)}</div>${fileMax}${band}</div>`;
}

/** Pill and usage line of a company in Panel delcos → Organizaciones. */
export function organisationLimitsHtml(use: OrganisationLimits | undefined): string {
  if (!use) return '';
  const pct = Math.max(use.filas?.pct ?? 0, use.almacenamiento_mb?.pct ?? 0);
  const pill = use.estado === 'excedido' ? `<span class="pill p-urg" data-limite="excedido">${t('limits.pillExceeded', { pct })}</span> `
    : use.estado === 'aviso' ? `<span class="pill p-warn" data-limite="aviso">${t('limits.pillWarning', { pct })}</span> ` : '';
  return `${pill}<span class="sm">${t('limits.panelUse', { records: formatNumber(use.filas?.uso ?? 0), space: megabytes(use.almacenamiento_mb?.uso) })}</span>`;
}
