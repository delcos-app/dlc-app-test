/**
 * Agenda → «Equipo y cumplimiento» (who sees the team): each person's portfolio, appointments, visited, absent, postponed and not
 * done, their compliance and who is due a visit, for the chosen period; pressing a person opens their agenda. Migrated from the
 * legacy pintarEquipoBase of pantallas/parque.js (v2.427.0); the name stays as an adapter (the legado-b bridge calls it).
 */
import { callRpc, term } from '../../legacy/bridge';
import { leftoversLegacy } from '../../legacy/leftovers-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { showAgendaOf } from './agenda-access';

const FAR_START = '2000-01-01', A_YEAR = 365, LOW_COMPLIANCE = 60;

interface Member { id: string; nombre: string; rol: string; cartera: number; citas: number; visitadas: number; no_estaba: number; aplazadas: number; sin_hacer: number; visitas: number; atrasados: number }

/** Visited over the appointments of past days (visited, absent, postponed and not done); null without any. */
function compliance(member: Member): number | null {
  const base = member.visitadas + member.no_estaba + member.aplazadas + member.sin_hacer;
  return base ? Math.round(member.visitadas / base * 100) : null;
}

const warned = (value: number): string => (value ? 'color:var(--warn);font-weight:700' : '');

function complianceCell(percent: number | null): string {
  if (percent === null) return '<span class="vac">—</span>';
  return `<span class="barra"><i style="width:${percent}%;${percent < LOW_COMPLIANCE ? 'background:var(--warn)' : ''}"></i><em>${percent}%</em></span>`;
}

function rowHtml(member: Member): string {
  return `<button class="dr" data-eqver="${member.id}" title="${t('leftovers.team.seeAgenda')}">
        <span><b>${escapeHtml(member.nombre)}</b><span class="sm">${escapeHtml(member.rol)}</span></span>
        <span class="num">${formatNumber(member.cartera)}</span><span class="num">${formatNumber(member.citas)}</span>
        <span class="num"><b class="u-ok">${formatNumber(member.visitadas)}</b></span><span class="num">${formatNumber(member.no_estaba)}</span>
        <span class="num">${formatNumber(member.aplazadas)}</span><span class="num" style="${warned(member.sin_hacer)}">${formatNumber(member.sin_hacer)}</span>
        <span>${complianceCell(compliance(member))}</span>
        <span class="num">${formatNumber(member.visitas)}</span>
        <span class="num" style="${warned(member.atrasados)}">${formatNumber(member.atrasados)}</span></button>`;
}

function tableHtml(members: readonly Member[]): string {
  if (!members.length) return `<div class="vacio">${t('leftovers.team.noActivity')}</div>`;
  const words = { Visits: term('visita', { number: 'p', capital: 'C' }), professionals: term('medico', { number: 'p' }), visit: term('visita') };
  return `<div class="dgrid-wrap"><div class="dgrid eq">
      <div class="dh"><span>${t('leftovers.team.person')}</span><span class="num">${t('leftovers.team.portfolio')}</span><span class="num">${t('leftovers.team.appointments')}</span><span class="num">${t('leftovers.team.visited')}</span>
        <span class="num">${t('leftovers.team.absent')}</span><span class="num">${t('leftovers.team.postponed')}</span><span class="num">${t('leftovers.team.notDone')}</span><span>${t('leftovers.team.compliance')}</span>
        <span class="num">${words.Visits}</span><span class="num">${t('leftovers.team.due')}</span></div>
      ${members.map(rowHtml).join('')}
    </div></div>
    <p class="sm" style="padding:10px 16px 14px">${t('leftovers.team.help', words)}</p>`;
}

async function paintTable(): Promise<void> {
  const table = document.getElementById('eqtabla'), period = document.getElementById('eqper');
  if (!table || !period) return;
  leftoversLegacy.showLoading(table, t('leftovers.team.calculating'));
  const range = leftoversLegacy.periodRange(period);
  const { data, error } = await callRpc<Member[]>('supervision_equipo', {
    p_desde: orFallback(range.desde, FAR_START), p_hasta: orFallback(range.hasta, leftoversLegacy.addDays(leftoversLegacy.today(), A_YEAR)),
  });
  if (error) { table.innerHTML = `<div class="vacio">${escapeHtml((error as { message?: string }).message ?? '')}</div>`; return; }
  table.innerHTML = tableHtml(data ?? []);
  table.querySelectorAll<HTMLElement>('[data-eqver]').forEach(button => {
    button.onclick = (): void => { leftoversLegacy.showWeekFromToday(); void showAgendaOf(button.dataset.eqver); };
  });
}

export async function paintTeamCompliance(): Promise<void> {
  const body = document.getElementById('agcuerpo');
  if (!body) throw new TypeError('#agcuerpo');
  body.innerHTML = `<div class="semhead"><h2 class="u-p-0">${t('leftovers.team.title')}</h2>
      ${leftoversLegacy.can('administrar') ? `<button class="btn sec" id="eqfrec">⚙ ${t('leftovers.team.frequency')}</button>` : ''}</div>
    <div class="filtros" style="border:0;padding:4px 16px 10px"><div id="eqper"></div></div>
    <div id="eqtabla"></div>`;
  const frequency = document.getElementById('eqfrec'); if (frequency) frequency.onclick = (): void => { leftoversLegacy.editFrequency(); };
  leftoversLegacy.mountPeriod(document.getElementById('eqper'), { id: 'equipo', valor: 'semana', alCambiar: () => { void paintTable(); } });
  void paintTable();
  await Promise.resolve();
}
