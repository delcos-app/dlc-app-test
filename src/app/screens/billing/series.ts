/**
 * Facturación → «Series y numeración»: each series with its format, next number and yearly restart, and its editor with the
 * preview of the next number. Migrated from the legacy pintarSeries and editorSerie (v2.413.0); pintarSeries stays as an adapter
 * (Configuración and Organización open it by that name).
 */
import { callRpc, cardSectionsLegacy, legacyDb, notices } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';

interface Series {
  id?: string; codigo: string; nombre: string; tipo: string; formato: string; siguiente: number; anio: number; reinicio_anual: boolean;
  por_defecto?: boolean; activa?: boolean; proximo?: string; ultima?: string | null; emitidas?: number;
}

const TYPES: readonly (readonly [string, MessageKey, MessageKey])[] = [
  ['ordinaria', 'billing.series.ordinary', 'billing.series.ordinary'],
  ['rectificativa', 'billing.series.rectifying', 'billing.series.rectifying'],
  ['simplificada', 'billing.series.simplified', 'billing.series.simplifiedTickets'],
];
const FALLBACK_YEAR = 2026, YEAR_DIGITS = 100;

const typeName = (type: string): string => t(TYPES.find(([key]) => key === type)?.[1] ?? 'billing.series.simplified');
const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const valueOf = (id: string): string => input(id)?.value ?? '';

function rowHtml(series: Series): string {
  const notes = `${series.por_defecto ? t('billing.series.byDefault') : ''}${series.activa ? '' : t('billing.series.inactive')}`;
  return `<button class="dr" data-ser="${series.id ?? ''}"><span><b>${escapeHtml(series.codigo)}</b><span class="sm">${escapeHtml(series.nombre)}${notes}</span></span>
        <span>${escapeHtml(typeName(series.tipo))}</span><span class="mono">${escapeHtml(series.formato)}</span>
        <span><b>${escapeHtml(series.proximo ?? '')}</b></span><span>${escapeHtml(orFallback(series.ultima, '—'))}</span><span class="num">${formatNumber(series.emitidas)}</span><span>${t(series.reinicio_anual ? 'billing.series.yes' : 'billing.series.no')}</span></button>`;
}

function listHtml(list: readonly Series[], admin: boolean): string {
  const head = [['', 'series'], ['', 'type'], ['', 'format'], ['', 'next'], ['', 'last'], ['num', 'issued'], ['', 'yearlyReset']] as const;
  return `<div class="panel">
    <div class="cuenta">${t('billing.series.intro')}
      ${admin ? `<button class="btn sec" id="sernueva" style="margin-left:8px">${t('billing.series.add')}</button>` : ''}</div>
    <div class="dgrid-wrap"><div class="dgrid sers">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(`billing.series.${key}`)}</span>`).join('')}</div>
      ${list.map(rowHtml).join('')}
    </div></div>
    <p class="sm" style="padding:10px 16px">${t('billing.series.formatHelp')}</p></div>`;
}

export async function paintSeries(): Promise<void> {
  billingLegacy.showLoading(document.getElementById('fcuerpo'), t('billing.series.loading'));
  const { data } = await callRpc<Series[]>('series_lista', {});
  const body = document.getElementById('fcuerpo'); if (!body) return;
  const list = data ?? [], admin = cardSectionsLegacy.can('administrar');
  body.innerHTML = listHtml(list, admin);
  body.querySelectorAll<HTMLElement>('[data-ser]').forEach(button => { button.onclick = (): void => { editSeries(list.find(series => series.id === button.dataset.ser) ?? null); }; });
  const add = document.getElementById('sernueva'); if (add) add.onclick = (): void => { editSeries(null); };
}

function editorHtml(series: Series, admin: boolean): string {
  const locked = admin ? '' : 'disabled', fixed = series.id ? 'disabled' : locked;
  const types = TYPES.map(([key, , label]) => `<option value="${key}" ${series.tipo === key ? 'selected' : ''}>${t(label)}</option>`).join('');
  const check = (id: string, on: boolean | undefined, label: MessageKey): string => `<label class="opt" style="margin-top:${id === 'ser' ? 10 : 8}px"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} ${locked}> ${t(label)}</label>`;
  return `
    <div class="fh"><div><h2>${series.id ? t('billing.series.titleOf', { code: escapeHtml(series.codigo) }) : t('billing.series.newTitle')}</h2><div class="sm">${t('billing.series.nextNumber')}<b id="serprev"></b></div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2"><div><label for="sec">${t('billing.series.code')}</label><input id="sec" value="${escapeHtml(series.codigo)}" ${fixed} placeholder="${t('billing.series.codePlaceholder')}"></div>
      <div><label for="sen">${t('billing.series.name')}</label><input id="sen" value="${escapeHtml(series.nombre)}" ${locked}></div></div>
    <div class="g2"><div><label for="set">${t('billing.series.type')}</label><select id="set" ${fixed}>${types}</select></div>
      <div><label for="sef">${t('billing.series.format')}</label><input id="sef" value="${escapeHtml(series.formato)}" ${locked}></div></div>
    <div class="g2"><div><label for="ses">${t('billing.series.nextField')}</label><input id="ses" type="number" min="1" value="${series.siguiente}" ${locked}></div>
      <div><label for="sea">${t('billing.series.year')}</label><input id="sea" type="number" value="${series.anio}" ${locked}></div></div>
    ${check('ser', series.reinicio_anual, 'billing.series.restartYearly')}
    ${check('sed', series.por_defecto, 'billing.series.defaultForType')}
    ${series.id ? check('seac', series.activa !== false, 'billing.series.active') : ''}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.close')}</button>${admin ? `<button class="btn" id="seok">${t('common.save')}</button>` : ''}</div>`;
}

/** The number the series would give next («F260408»). */
function preview(): void {
  const code = valueOf('sec').trim().toUpperCase() || 'X', year = Number(valueOf('sea')) || FALLBACK_YEAR, next = Number(valueOf('ses')) || 1;
  const text = valueOf('sef').replace('{S}', code).replace('{AAAA}', String(year)).replace('{AA}', String(year % YEAR_DIGITS).padStart(2, '0'))
    .replace(/\{(N+)\}/, (...[, digits]: string[]) => String(next).padStart(digits?.length ?? 0, '0'));
  const place = document.getElementById('serprev'); if (place) place.textContent = text;
}

async function save(series: Series): Promise<void> {
  const checked = (id: string): boolean => Boolean(input(id)?.checked), active = input('seac');
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; ultimo?: string }>('guardar_serie', { p: {
    id: series.id ?? null, codigo: valueOf('sec').trim(), nombre: valueOf('sen').trim(), tipo: valueOf('set'), formato: valueOf('sef').trim(),
    siguiente: Number(valueOf('ses')), anio: Number(valueOf('sea')), reinicio_anual: checked('ser'), por_defecto: checked('sed'),
    ...(active ? { activa: active.checked } : {}),
  } });
  if (error || result?.ok === false) {
    notices.toast(result?.error === 'numero_usado' ? t('billing.series.numberUsed', { last: result.ultimo ?? '' }) : t('billing.series.couldNotSave'), true); return;
  }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('billing.series.saved')); void paintSeries();
}

export function editSeries(existing: Series | null): void {
  const admin = cardSectionsLegacy.can('administrar');
  const series = existing ?? { codigo: '', nombre: '', tipo: 'ordinaria', formato: '{S}{AA}{NNNN}', siguiente: 1, anio: Number(todayIso().slice(0, 4)), reinicio_anual: true };
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(series, admin);
  box.showModal();
  for (const id of ['sec', 'sef', 'ses', 'sea']) { const field = input(id); if (field) field.oninput = preview; }
  preview();
  const ok = document.getElementById('seok'); if (ok) ok.onclick = (): void => { void save(series); };
}
