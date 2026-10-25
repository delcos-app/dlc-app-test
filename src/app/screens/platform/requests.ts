/**
 * Panel delcos → Solicitudes: A medida quotes and contract conversations from the companies, with their state and an internal note
 * (the company sees the state in its Plan). Migrated from the legacy pintarSolicitudesPlan (v2.413.0).
 */
import { callRpc, notices } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { errorMessage, panelBox, shortDateTime } from './model';

const STATES = ['Nueva', 'En curso', 'Cerrada'];
const CONTACT = new Map<string, MessageKey>([['correo', 'platform.requests.byEmail'], ['llamada', 'platform.requests.byPhone'], ['video', 'platform.requests.byVideo']]);

interface RequestData { necesita_txt?: string[]; programa?: string; mensaje?: string; usuarios?: number; portal?: number; cuando?: string; nombre?: string; correo?: string; telefono?: string; contacto?: string; horario?: string }
interface PlanRequest { id: string; organizacion: string; plan?: string; estado: string; tipo?: string; creado_en: string; persona?: string | null; nota?: string | null; datos?: RequestData | null }

const statePill = (state: string): string => (state === 'Nueva' ? 'p-warn' : state === 'En curso' ? 'p-est' : 'p-anu');

function figuresText(data: RequestData): string {
  return (data.usuarios ? t('platform.requests.users', { count: formatNumber(data.usuarios) }) : '') + (data.portal ? t('platform.requests.portal', { count: formatNumber(data.portal) }) : '')
    + (data.cuando ? ` · ${escapeHtml(data.cuando)}` : '');
}

function contactText(request: PlanRequest, data: RequestData): string {
  const how = CONTACT.get(data.contacto ?? '');
  return escapeHtml(orFallback(data.nombre, request.persona ?? '')) + (data.correo ? ` · <a href="mailto:${escapeHtml(data.correo)}">${escapeHtml(data.correo)}</a>` : '')
    + (data.telefono ? ` · <a href="tel:${escapeHtml(data.telefono)}">${escapeHtml(data.telefono)}</a>` : '')
    + `\n          · ${how ? t(how) : ''}${data.horario ? ` (${escapeHtml(data.horario)})` : ''}`;
}

function rowHtml(request: PlanRequest, index: number): string {
  const data = request.datos ?? {}, needs = data.necesita_txt ?? [];
  return `<div class="presufila${request.estado === 'Cerrada' ? ' cerrada' : ''}">
        <div class="presucab"><b>${escapeHtml(request.organizacion)}</b> <span class="pill p-est">${escapeHtml(platformLegacy.planName(request.plan))}</span>
          <span class="pill ${statePill(request.estado)}">${escapeHtml(request.estado)}</span>
          <span class="sm">${t(request.tipo === 'contrato' ? 'platform.requests.contract' : 'platform.requests.quote')} · ${shortDateTime(request.creado_en)}</span></div>
        ${needs.length ? `<div class="chips">${needs.map(need => `<span class="chip">${escapeHtml(need)}</span>`).join('')}</div>` : ''}
        ${data.programa ? `<div class="sm">${t('platform.requests.program', { program: `<b>${escapeHtml(data.programa)}</b>` })}</div>` : ''}
        ${data.mensaje ? `<p class="presumsg">${escapeHtml(data.mensaje)}</p>` : ''}
        <div class="sm">${figuresText(data)}</div>
        <div class="sm">${contactText(request, data)}</div>
        <div class="presuges"><select data-psest="${index}" aria-label="${t('platform.requests.state')}">${STATES.map(state => `<option ${request.estado === state ? 'selected' : ''}>${state}</option>`).join('')}</select>
          <input data-psnota="${index}" placeholder="${t('platform.requests.notePlaceholder')}" value="${escapeHtml(request.nota ?? '')}">
          <button type="button" class="btn sec" data-psok="${index}">${t('common.save')}</button></div></div>`;
}

async function save(box: HTMLElement, request: PlanRequest, index: string): Promise<void> {
  const field = (attribute: string): string => box.querySelector<HTMLInputElement>(`[data-${attribute}="${index}"]`)?.value ?? '';
  const { data: result } = await callRpc<{ ok?: boolean }>('marcar_solicitud_plan', { p_id: request.id, p_estado: field('psest'), p_nota: field('psnota') });
  const ok = Boolean(result?.ok);
  notices.toast(t(ok ? 'platform.requests.saved' : 'platform.requests.couldNotSave'), !ok);
  if (ok) void paintRequests();
}

export async function paintRequests(): Promise<void> {
  const start = panelBox(); if (!start) return;
  start.innerHTML = '<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>';
  const { data, error } = await callRpc<PlanRequest[]>('solicitudes_plan_lista', {});
  const box = panelBox(); if (!box) return;
  const list = error ? [] : data ?? [];
  box.innerHTML = `<div class="card cfgpanel"><h2>${t('platform.requests.title')}</h2>
    <p class="sm">${t('platform.requests.subtitle')}</p>
    ${error ? `<div class="banda-peligro">${t('platform.billing.couldNotRead', { error: escapeHtml(errorMessage(error)) })}</div>` : ''}
    <div class="presulista">${list.map(rowHtml).join('') || `<div class="vacio">${t('platform.requests.none')}</div>`}</div></div>`;
  box.querySelectorAll<HTMLElement>('[data-psok]').forEach(button => {
    button.onclick = (): void => { const index = button.dataset.psok ?? '', request = list[Number(index)]; if (request) void save(box, request, index); };
  });
}
