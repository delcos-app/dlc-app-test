/**
 * Ciclo de visitas → «Equipo» (who sees the whole team): each person's portfolio by class and how their cycle goes. Pressing a
 * person opens their cycle. Migrated from the legacy pintarCicloEquipo (v2.408.0).
 */
import { rpc } from '../../api/client';
import { currentScreen } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { cycleState, goToTab, percentOf, progressBar, rangeText, visitsText, words } from './model';

interface Member { id: string; nombre: string; rol: string; cartera: number; a: number; b: number; c: number; sin_clase: number; al_dia: number; hechas: number; objetivo: number }
interface CycleRange { meses: number; desde: string; hasta: string; obj_a: number; obj_b: number; obj_c: number }

const ofText = (done: number, goal: number): string => t('cycle.current.progress', { done: formatNumber(done), goal: formatNumber(goal) });

function rowHtml(member: Member): string {
  const classified = member.a + member.b + member.c, percent = member.objetivo ? percentOf(member.hechas, member.objetivo) : null;
  const progress = percent === null ? '—' : `<span class="cicbarc">${progressBar(percent)}${ofText(member.hechas, member.objetivo)} · ${percent}%</span>`;
  return `<tr><td><button type="button" class="lnk" data-cde="${member.id}"><b>${escapeHtml(member.nombre)}</b></button><span class="sm"> · ${escapeHtml(member.rol)}</span></td><td>${formatNumber(member.cartera)}</td><td>${formatNumber(member.a)}</td><td>${formatNumber(member.b)}</td><td>${formatNumber(member.c)}</td>
          <td class="${member.sin_clase ? 'cicaviso' : ''}">${formatNumber(member.sin_clase)}</td><td>${classified ? ofText(member.al_dia, classified) : '—'}</td>
          <td>${progress}</td></tr>`;
}

function tableHtml(members: readonly Member[]): string {
  if (!members.length) return `<div class="vacio">${t('cycle.team.nobody')}</div>`;
  const head = [t('cycle.team.person'), t('cycle.team.portfolio'), 'A', 'B', 'C', t('cycle.team.noClass'), t('cycle.team.upToDate'), t('cycle.team.cycleVisits', words())];
  return `<div class="card cicbloque"><div class="dgrid-wrap"><table class="trtabla cictab"><thead><tr>${head.map(title => `<th>${title}</th>`).join('')}</tr></thead>
      <tbody>${members.map(rowHtml).join('')}</tbody></table></div></div>
      <p class="sm">${t('cycle.team.countHint', words())}</p>`;
}

export async function paintCycleTeam(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const [{ data: memberRows }, { data: rangeRows }] = await Promise.all([rpc('ciclo_equipo'), rpc('ciclo_rango')]);
  const members = memberRows as Member[] | null, ranges = rangeRows as CycleRange[] | null;
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'ciclo') return;
  const range = (ranges ?? [])[0];
  const goals = range ? `<p class="sm">${escapeHtml(rangeText(range))}${t('cycle.team.goals', { ...words(), a: visitsText(range.obj_a), b: range.obj_b, c: range.obj_c })}</p>` : '';
  box.innerHTML = `<div class="cicpag">${goals}
    ${tableHtml(members ?? [])}</div>`;
  box.querySelectorAll<HTMLElement>('[data-cde]').forEach(button => { button.onclick = (): void => { cycleState.owner = button.dataset.cde ?? ''; goToTab('ciclo'); }; });
}
