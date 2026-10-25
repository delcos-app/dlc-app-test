/**
 * The base of the account card: header (name, pills, speciality, code), actions, «Para la visita», state, the other
 * consultations, the visits and the empty places other sections fill (custom fields, sales). Migrated from the legacy
 * pintarFichaBase (v2.402.0).
 */
import { accountCardLegacy, cachedRpc, cardBaseLegacy, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { visitBlock, visitConsultation } from '../../visit/card-block';
import { editVisit } from '../../visit/edit';

const WORKDAYS = ['L', 'M', 'X', 'J', 'V'], SHOWN_VISITS = 10;
const SKELETON = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';

const body = (): HTMLElement | null => document.getElementById('fbody');

function headerHtml(account: CardAccount): string {
  const urgent = account.urgente ? `<span class="pill p-urg">${t('accounts.base.urgent')}</span> ` : '';
  const noReporting = account.sin_reporting ? `<span class="pill p-sr" title="${t('accounts.base.noReportingTitle', { visit: term('visita') })}">${t('accounts.base.noReporting')}</span> ` : '';
  return `<div class="fh">
      <div><h2>${urgent}${noReporting}${escapeHtml(account.nombre)}</h2>
        <div class="sm">${escapeHtml(account.especialidad ?? '')}${account.area ? ` · ${escapeHtml(account.area)}` : ''}${t('accounts.base.code', { code: escapeHtml(account.codigo) })}</div></div>
      <button class="x" id="fx" aria-label="${t('common.close')}">✕</button>
    </div>`;
}

function actionsHtml(account: CardAccount): string {
  const record = cardBaseLegacy.canRecord(), edit = accountCardLegacy.canEditType(account.tipo);
  if (!record && !edit) return '';
  return `<div class="acts">
      ${record ? `<button class="btn" data-act="visita" data-id="${account.id}">${t('accounts.base.record', { visit: term('visita') })}</button>` : ''}
      ${edit ? `<button class="btn sec" data-act="editar" data-id="${account.id}">${t('accounts.base.edit')}</button>` : ''}
      ${edit ? `<button class="btn ${account.urgente ? 'sec' : 'warn'}" data-act="urgente" data-id="${account.id}" data-urg="${account.urgente ? 1 : 0}">${t(account.urgente ? 'accounts.base.unmarkUrgent' : 'accounts.base.markUrgent')}</button>` : ''}
      <button class="btn sec" data-agendar="${account.id}">${t('accounts.base.addToAgenda')}</button>
    </div>`;
}

function stateHtml(account: CardAccount, salesReps: readonly string[]): string {
  const state = cardBaseLegacy.canEdit()
    ? `<select data-estado="${account.id}" style="max-width:240px">${cardBaseLegacy.states().map(value => `<option ${value === account.estado_comercial ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select>`
    : `<span class="pill p-est">${escapeHtml(account.estado_comercial)}</span>`;
  return `<div class="blk"><h3>${t('accounts.card.stateTitle')}</h3>
      <div>${state}</div>
      ${salesReps.length ? `<div class="sm u-mt-6">${t('accounts.base.salesRep', { names: salesReps.map(escapeHtml).join(', ') })}</div>` : ''}
    </div>`;
}

function consultationHtml(consultation: CardConsultation): string {
  const days = consultation.dias ?? {};
  const address = escapeHtml([consultation.direccion, consultation.cp, consultation.municipio].filter(Boolean).join(', '));
  const room = [consultation.planta, consultation.sala].filter(Boolean).join(' · ');
  return `<div class="blk"><h3>${escapeHtml(orFallback(consultation.centro_nombre, term('consulta', { capital: 'C', adjective: 'privado' })))}</h3>
      <div>${address || `<span class="sm">${t('accounts.base.noAddress')}</span>`}</div>
      ${room ? `<div class="sm">${escapeHtml(room)}</div>` : ''}
      ${consultation.indicaciones ? `<div class="sm">${escapeHtml(consultation.indicaciones)}</div>` : ''}
      ${consultation.telefono ? `<div class="sm">${t('accounts.base.phone', { phone: escapeHtml(consultation.telefono) })}</div>` : ''}
      <div class="dias u-mt-8">${WORKDAYS.map(day => `<span class="${days[day] ? 'on' : ''}">${day}</span>`).join('')}</div>
      ${WORKDAYS.filter(day => days[day]).map(day => `<div class="sm">${day}: ${escapeHtml(days[day])}</div>`).join('')}
      ${consultation.lat ? `<div class="sm u-mt-6"><button class="lnk" type="button" data-nav="${cardBaseLegacy.directionsAttribute([consultation.lat, consultation.lon ?? 0])}">${t('accounts.base.directions')}</button></div>` : ''}
    </div>`;
}

function visitHtml(visit: CardVisit, canRecord: boolean): string {
  const mode = visit.modo === 'telefono' ? t('accounts.base.byPhone') : visit.modo === 'video' ? t('accounts.base.byVideo') : '';
  const results = orFallback((visit.resultados ?? []).join(' + '), t('accounts.base.noResult'));
  return `<div data-vrow="${visit.id}" style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <span><b>${formatShortDate(visit.fecha)}</b>${mode} · ${escapeHtml(results)}
          ${visit.muestras ? t('accounts.base.samples', { count: visit.muestras }) : ''}
          ${visit.nota ? `<div class="sm">${escapeHtml(visit.nota)}</div>` : ''}
          ${visit.proxima_fecha ? `<div class="sm">${t('accounts.base.next', { date: formatShortDate(visit.proxima_fecha), action: escapeHtml(visit.proxima_accion ?? '') })}</div>` : ''}</span>
        ${canRecord ? `<button class="btn sec chico" data-editv='${escapeHtml(JSON.stringify(visit))}'>${t('accounts.base.editVisit')}</button>` : ''}
      </div>`;
}

function visitsHtml(visits: readonly CardVisit[]): string {
  const canRecord = cardBaseLegacy.canRecord();
  const list = visits.length ? visits.slice(0, SHOWN_VISITS).map(visit => visitHtml(visit, canRecord)).join('')
    : `<div class="sm">${t('accounts.base.noVisits', { visits: term('visita', { number: 'p', adjective: 'registrado' }) })}</div>`;
  return `<div class="blk"><h3>${term('visita', { number: 'p', capital: 'C' })}</h3>
      ${list}</div>`;
}

function cardHtml(data: Required<Pick<CardData, 'medico'>> & CardData, cached: boolean): string {
  const account = data.medico, consultations = data.consultas ?? [], visits = data.visitas ?? [];
  const forVisit = visitConsultation(consultations);
  return `${cached ? `<div class="cacheaviso">${t('accounts.base.cachedNotice')}</div>` : ''}
    ${headerHtml(account)}
    ${actionsHtml(account)}
    ${visitBlock(account, consultations, visits)}
    ${stateHtml(account, data.comerciales ?? [])}
    ${consultations.filter(consultation => consultation !== forVisit).map(consultationHtml).join('')}
    ${visitsHtml(visits)}
    <div id="fzcampos"></div>
    <section class="blk fventas" id="fventas"><h3>${t('accounts.base.salesTitle', { patients: term('paciente', { number: 'p' }) })}</h3><div id="fventasc"></div></section>`;
}

/** Opens the card window with a skeleton and paints the base when the data arrives (from the offline copy without connection). */
export async function paintBase(id: string): Promise<void> {
  const box = body(), card = document.getElementById('ficha') as HTMLDialogElement | null;
  if (!box || !card) return;
  accountCardLegacy.setShownId(id);
  box.innerHTML = SKELETON;
  card.showModal();
  const result = await cachedRpc<CardData>('ficha_cuenta', { p_id: id }, `ficha-${id}`);
  const data = result.data, account = data?.medico;
  if (!data || !account) { box.innerHTML = `<p class="sm">${t('accounts.base.noConnection')}</p>`; return; }
  box.innerHTML = cardHtml({ ...data, medico: account }, Boolean(result.cache));
  const close = document.getElementById('fx'); if (close) close.onclick = (): void => { card.close(); };
  box.querySelectorAll<HTMLElement>('[data-editv]').forEach(button => {
    button.onclick = (): void => { void editVisit(JSON.parse(button.dataset.editv ?? '{}') as CardVisit, id); };
  });
}
