/**
 * «Mi informe», the portal page of a professional (a centre gets its own, see centre.ts): «Resumen», «Mi ficha» and «Material y
 * dudas» on one page, with the period on the right. Migrated from the legacy cargarInforme and cargarInforme2271 (v2.413.0).
 */
import { callRpc, term } from '../../legacy/bridge';
import { portalPageLegacy } from '../../legacy/portal-bridge';
import { t } from '../../i18n';
import { loadCentre } from './centre';
import { paintForm } from './form';
import { loadForm } from './form-data';
import { paintMaterial } from './material';
import { isCentre, portalState, skeleton } from './model';
import { summaryHtml, type Continuity, type ReportData } from './summary';
import { bindTabs, tabBar, tabPanel } from './tabs';

const setText = (id: string, text: string): void => { const element = document.getElementById(id); if (element) element.textContent = text; };

/** Without a linked card, both tabs say so (instead of loading for ever) and the header shows the user's name. */
function notLinked(): void {
  const text = `<div class="card"><div class="vacio">${t('portal.report.notLinked', { professional: term('medico') })}</div></div>`;
  const summary = document.getElementById('mdcuerpo'); if (summary) summary.innerHTML = text;
  const form = document.getElementById('pmficha'); if (form) form.innerHTML = text;
  setText('mdnom', portalPageLegacy.userName());
}

async function paintReport(): Promise<void> {
  const range = portalPageLegacy.periodOf(document.getElementById('mdper'));
  const [{ data }, { data: figures }, { data: card }] = await Promise.all([
    callRpc<ReportData>('informe_cuenta', { p_desde: range.desde, p_hasta: range.hasta }), callRpc<Continuity>('constancia_pacientes', { p_meses: 12 }),
    portalState.form ? Promise.resolve({ data: null }) : callRpc<{ ok?: boolean }>('portal_mi_ficha', {}),
  ]);
  if (card?.ok) loadForm(card);
  const summary = document.getElementById('mdcuerpo'); if (!summary) return;
  if (!data?.ok) { notLinked(); return; }
  setText('mdnom', data.medico.nombre); setText('mdesp', data.medico.especialidad ?? '');
  summary.innerHTML = summaryHtml(data, figures ?? {});
  bindTabs(summary, 'pmir');
  paintForm();
}

/** Opens the portal page: the centre's, or the professional's. */
export async function loadReport(): Promise<void> {
  if (isCentre()) { await loadCentre(); return; }
  const page = document.getElementById('v-informe'); if (!page) return;
  page.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">${t('portal.report.kicker')}</div><h1 id="mdnom">…</h1><div id="mdesp" class="sm" style="color:rgba(255,255,255,.85)"></div></div>
      <div class="medper"><div id="mdper"></div></div></div>
    ${tabBar([['res', 'portal.tabs.summary'], ['ficha', 'portal.tabs.card'], ['mat', 'portal.tabs.material']])}
    ${tabPanel('res', 'mdcuerpo', skeleton(false))}
    ${tabPanel('ficha', 'pmficha', skeleton(true))}
    ${tabPanel('mat', 'pmmat', '<div id="mdportal" class="pmfila"></div>')}`;
  bindTabs(page, 'pmt');
  // On entering, the period is always «Esta semana»
  portalPageLegacy.forgetPeriod();
  portalPageLegacy.mountPeriod(document.getElementById('mdper'), { id: 'informe', valor: 'semana', alCambiar: () => { void paintReport(); } });
  await paintReport();
  await paintMaterial();
}
