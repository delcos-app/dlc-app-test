/**
 * Errors: Panel delcos → Errores (the platform's errors grouped by fingerprint; marking a group solved notes the version and it
 * reopens if it comes back) and Configuración → Seguridad y registro → Errores (one company's errors and reports). Migrated from
 * the legacy pintarErroresDelcos and pintarErrores (v2.413.0).
 */
import { callRpc, icon, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { downloadJson, errorMessage, panelBox, platformState, shortDateTime } from './model';

const STATES = ['Nuevo', 'Revisado', 'Resuelto'], SOLVED = 'Resuelto', DAY_OPTIONS = [7, 15, 30, 90];
const KINDS = new Map<string, MessageKey>([['error', 'platform.errors.program'], ['api', 'platform.errors.database'], ['reporte', 'platform.errors.report']]);
const kindName = (kind: string): string => { const key = KINDS.get(kind); return key ? t(key) : kind; };
const stateOptions = (current: string): string => STATES.map(state => `<option ${current === state ? 'selected' : ''}>${state}</option>`).join('');
const select = (id: string): HTMLSelectElement | null => document.getElementById(id) as HTMLSelectElement | null;

interface ErrorGroup {
  tipo: string; pantalla?: string | null; veces: number; personas: number; ultima: string; primera: string; estado: string; mensaje: string; huella: string;
  resuelto_en_version?: string | null; resuelto_auto?: boolean; versiones?: string | null; detalle?: unknown;
}

function groupRow(group: ErrorGroup, index: number): string {
  const solved = group.resuelto_en_version ? t(group.resuelto_auto ? 'platform.errors.solvedAuto' : 'platform.errors.solvedIn', { version: escapeHtml(group.resuelto_en_version) }) : '';
  return `<div class="errfila e-${group.tipo}">
        <div><b>${escapeHtml(kindName(group.tipo))}</b> <span class="sm">· ${escapeHtml(orFallback(group.pantalla, '—'))} · ${formatNumber(group.veces)} ${t(group.veces === 1 ? 'platform.errors.time' : 'platform.errors.times')} · ${formatNumber(group.personas)} ${t(group.personas === 1 ? 'platform.errors.person' : 'platform.errors.people')}
          · ${t('platform.errors.last', { date: shortDateTime(group.ultima) })}${solved}</span>
          <div class="errmsg">${escapeHtml(group.mensaje)}</div>
          <details class="errdet"><summary class="sm">${t('platform.errors.details')}</summary><div class="sm">${t('platform.errors.versions', { versions: escapeHtml(orFallback(group.versiones, '—')), date: shortDateTime(group.primera) })}</div>
            <pre>${escapeHtml(JSON.stringify(group.detalle ?? {}, null, 1))}</pre></details></div>
        <select class="chico" data-egh="${index}" aria-label="${t('platform.errors.groupState')}">${stateOptions(group.estado)}</select></div>`;
}

function platformHtml(list: readonly ErrorGroup[], error: unknown): string {
  const filters = platformState.platformErrors;
  const states = [['abiertos', 'platform.errors.open'], ['resueltos', 'platform.errors.solved'], ['todos', 'platform.errors.all']] as const;
  return `<div class="card cfgpanel errgrupos"><h2 style="padding:0 0 4px">${t('platform.errors.platformTitle')}</h2>
    <p class="sm">${t('platform.errors.platformText')}</p>
    ${error ? `<div class="banda-peligro">${t('platform.errors.couldNotRead', { error: escapeHtml(errorMessage(error)) })}</div>` : ''}
    <div class="usrbar"><select id="egest">${states.map(([key, label]) => `<option value="${key}" ${filters.estado === key ? 'selected' : ''}>${t(label)}</option>`).join('')}</select>
      <select id="egdias">${DAY_OPTIONS.map(days => `<option value="${days}" ${filters.dias === days ? 'selected' : ''}>${t('platform.errors.lastDays', { days })}</option>`).join('')}</select>
      <button class="btn sec" id="egdesc">${icon('download')} ${t('platform.errors.download')}</button></div>
    <div class="errlista">${list.map(groupRow).join('') || `<div class="vacio">${t(filters.estado === 'abiertos' ? 'platform.errors.noneOpen' : 'platform.errors.none')}</div>`}</div></div>`;
}

const shown = (group: ErrorGroup): boolean => {
  const filter = platformState.platformErrors.estado;
  return filter === 'todos' || (filter === 'abiertos' ? group.estado !== SOLVED : group.estado === SOLVED);
};

async function markGroup(group: ErrorGroup, state: string): Promise<void> {
  const { data: result } = await callRpc<{ ok?: boolean }>('marcar_errores_huella', { p_huella: group.huella, p_estado: state });
  const ok = Boolean(result?.ok);
  notices.toast(ok ? t(state === SOLVED ? 'platform.errors.groupSolved' : 'platform.errors.stateChanged') : t('platform.errors.couldNotChange'), !ok);
  if (ok) void paintPlatformErrors();
}

/** Panel delcos → Errores. */
export async function paintPlatformErrors(): Promise<void> {
  const start = panelBox(); if (!start) return;
  start.innerHTML = '<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>';
  const { data, error } = await callRpc<ErrorGroup[]>('errores_resumen', { p_dias: platformState.platformErrors.dias });
  const box = panelBox(); if (!box) return;
  const all = error ? [] : data ?? [], list = all.filter(shown);
  box.innerHTML = platformHtml(list, error);
  const refilter = (): void => { platformState.platformErrors = { estado: select('egest')?.value ?? 'abiertos', dias: Number(select('egdias')?.value) }; void paintPlatformErrors(); };
  const states = select('egest'), days = select('egdias'); if (states) states.onchange = refilter; if (days) days.onchange = refilter;
  box.querySelectorAll<HTMLSelectElement>('[data-egh]').forEach(field => { field.onchange = (): void => { const group = list[Number(field.dataset.egh)]; if (group) void markGroup(group, field.value); }; });
  const save = document.getElementById('egdesc');
  if (save) save.onclick = (): void => { downloadJson({ generado: new Date().toISOString(), version: platformLegacy.appVersion(), errores: all }, `errores_${todayIso()}.json`); };
}

interface CompanyError { id: number; tipo: string; creado_en: string; usuario?: string | null; pantalla?: string | null; version?: string | null; mensaje: string; estado: string }

function companyRow(item: CompanyError): string {
  return `<div class="errfila e-${item.tipo}"><div><b>${escapeHtml(kindName(item.tipo))}</b> <span class="sm">${shortDateTime(item.creado_en)} · ${escapeHtml(orFallback(item.usuario, '—'))} · ${escapeHtml(orFallback(item.pantalla, '—'))} · v${escapeHtml(item.version ?? '')}</span>
        <div class="errmsg">${escapeHtml(item.mensaje)}</div></div>
      <select data-errst="${item.id}">${stateOptions(item.estado)}</select></div>`;
}

function companyHtml(list: readonly CompanyError[]): string {
  const filters = platformState.companyErrors;
  const kinds = [...KINDS.keys()].map(kind => `<option value="${kind}" ${filters.tipo === kind ? 'selected' : ''}>${kindName(kind)}</option>`).join('');
  const states = ['', ...STATES].map(state => `<option value="${state}" ${filters.estado === state ? 'selected' : ''}>${state || t('platform.errors.allStates')}</option>`).join('');
  return `<div class="card cfgpanel"><h2>${t('platform.errors.companyTitle')}</h2>
    <p class="sm">${t('platform.errors.companyText')}</p>
    <div class="usrbar"><select id="erft"><option value="">${t('platform.errors.allKinds')}</option>${kinds}</select>
      <select id="erfe">${states}</select>
      <button class="btn sec" id="erdesc">${icon('download')} ${t('platform.errors.download')}</button></div>
    <div class="errlista">${list.map(companyRow).join('') || `<div class="vacio">${t('platform.errors.none')}</div>`}</div></div>`;
}

/** Configuración → Seguridad y registro → Errores (administration). */
export async function paintCompanyErrors(): Promise<void> {
  const filters = platformState.companyErrors;
  const { data } = await callRpc<CompanyError[]>('errores_lista', { p_tipo: filters.tipo || null, p_estado: filters.estado || null });
  const box = panelBox(); if (!box) return;
  const list = data ?? [];
  box.innerHTML = companyHtml(list);
  const refilter = (): void => { platformState.companyErrors = { tipo: select('erft')?.value ?? '', estado: select('erfe')?.value ?? '' }; void paintCompanyErrors(); };
  const kind = select('erft'), state = select('erfe'); if (kind) kind.onchange = refilter; if (state) state.onchange = refilter;
  box.querySelectorAll<HTMLSelectElement>('[data-errst]').forEach(field => {
    field.onchange = async (): Promise<void> => { await callRpc('marcar_error', { p_id: Number(field.dataset.errst), p_estado: field.value }); notices.toast(t('platform.errors.stateChanged')); };
  });
  const save = document.getElementById('erdesc'); if (save) save.onclick = (): void => { downloadJson(list, `errores_${todayIso()}.json`); };
}
