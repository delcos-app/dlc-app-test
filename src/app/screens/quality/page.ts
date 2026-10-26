/**
 * Calidad del dato (the «seguimiento» screen, opened from Cuentas): the header with «‹ Cuentas» and «Duplicados», the commercial
 * funnel and totals, the completeness card, the doubtful addresses and the follow-up list with its filters. Migrated from the
 * legacy cargarSeguimiento chain (Base, Paso1, Paso2, Base2–4; v2.410.0), painted in its final form at once: the title no longer
 * starts as «Seguimiento» and changes after the first answers.
 */
import { accountListLegacy, cardSectionsLegacy, goTo, icon, legacyDb, permissions, qualityLegacy, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { paintDoubtfulAddresses, paintSummary } from './data-quality';
import { followUpState, paintFollowUp } from './follow-up';
import { markCurrent } from '../../core/navigation/current';

interface FilterOptions { estados?: { v: string }[]; provincias?: { v: string }[]; municipios?: { v: string }[] }
interface FollowUpSummary { embudo?: { n: number; estado: string }[]; visitados: number; visitas_total: number; muestras_total: number; con_direccion: number; con_dias: number; total: number }

const MODES = [['todos', 'quality.page.showAll'], ['visitados', 'quality.page.showVisited'], ['sin_visitar', 'quality.page.showNotVisited'], ['con_accion', 'quality.page.showWithAction'], ['atrasados', 'quality.page.showLate']] as const;

const canSeeDuplicates = (): boolean => cardSectionsLegacy.can('administrar') || permissions.canReviewDuplicates();

function headerHtml(): string {
  const duplicates = canSeeDuplicates() ? `<button class="btn sec" id="caldup">${icon('copy')} ${t('quality.page.duplicates')}</button>` : '';
  return `<button class="cfgvolver visible" id="calvolver" type="button">‹ ${escapeHtml(accountListLegacy.contactsLabel())}</button>
    <div class="saludo"><div><h1>${t('quality.page.title')}</h1><div class="fecha">${t('quality.page.subtitle', { professional: term('medico') })}</div></div>
      <div class="acts u-m-0">${duplicates}</div></div>`;
}

function pageHtml(): string {
  const modes = MODES.map(([value, key]) => `<option value="${value}">${t(key)}</option>`).join('');
  return `${headerHtml()}
    <div class="kpis" id="segkpis"><div class="skel"></div></div>
    <div class="panel">
      <div class="filtros">
        <div><label for="sest">${t('quality.page.commercialState')}</label><select id="sest"></select></div>
        <div><label for="sprov">${t('quality.page.province')}</label><select id="sprov"></select></div>
        <div><label for="smuni">${t('quality.page.municipality')}</label><select id="smuni"></select></div>
        <div><label for="smodo">${t('quality.page.show')}</label><select id="smodo">${modes}</select></div>
      </div>
      <div class="cuenta" id="scuenta">${t('quality.page.loading')}</div>
      <div id="slista"><div class="cargador"><span class="spin"></span><span class="sm">${t('quality.page.loadingFollowUp')}</span></div></div>
      <div id="spag"></div>
    </div>`;
}

const selectValue = (id: string): string => (document.getElementById(id) as HTMLSelectElement | null)?.value ?? '';

function fillFilters(options: FilterOptions | null): void {
  const fill = (id: string, list: readonly { v: string }[] | undefined, all: string): void => {
    const select = document.getElementById(id);
    if (select) select.innerHTML = `<option value="">${all}</option>${(list ?? []).map(option => `<option>${escapeHtml(option.v)}</option>`).join('')}`;
  };
  fill('sest', options?.estados, t('quality.page.allStates'));
  fill('sprov', options?.provincias, t('quality.page.allProvinces'));
  fill('smuni', options?.municipios, t('quality.page.allMunicipalities'));
  for (const id of ['sest', 'sprov', 'smuni', 'smodo']) {
    const select = document.getElementById(id);
    if (select) select.onchange = (): void => {
      Object.assign(followUpState, { estado: selectValue('sest'), prov: selectValue('sprov'), muni: selectValue('smuni'), modo: selectValue('smodo'), pagina: 0 });
      void paintFollowUp(true);
    };
  }
}

const percentText = (part: number, total: number): string => `${total ? Math.round(part / total * 100) : 0}%`;

function paintIndicators(summary: FollowUpSummary | null): void {
  const box = document.getElementById('segkpis');
  if (!summary || !box) return;
  const funnel = (summary.embudo ?? []).map(step => `<div class="kpi"><b>${formatNumber(step.n)}</b><span>${escapeHtml(step.estado)}</span></div>`).join('');
  box.innerHTML = `${funnel}<div class="kpi ok"><b>${formatNumber(summary.visitados)}</b><span>${term('medico', { number: 'p', adjective: 'visitado' })}</span></div>
       <div class="kpi"><b>${formatNumber(summary.visitas_total)}</b><span>${term('visita', { number: 'p', adjective: 'registrado' })}</span></div>
       <div class="kpi"><b>${formatNumber(summary.muestras_total)}</b><span>${t('quality.page.samplesGiven')}</span></div>
       <div class="kpi"><b>${percentText(summary.con_direccion, summary.total)}</b><span>${t('quality.page.withAddress')}</span></div>
       <div class="kpi"><b>${percentText(summary.con_dias, summary.total)}</b><span>${t('quality.page.withDays')}</span></div>`;
}

function bindHeader(): void {
  const back = document.getElementById('calvolver'); if (back) back.onclick = (): void => { goTo('directorio'); };
  const duplicates = document.getElementById('caldup'); if (duplicates) duplicates.onclick = (): void => { goTo('duplicados'); };
  // The page belongs to Cuentas: its menu entry stays marked
  document.querySelectorAll<HTMLElement>('nav.main [data-t]').forEach(button => { markCurrent(button, button.dataset.t === 'directorio'); });
  // Downloads are switched off (servicios/archivos.js): the export menu only shows why nothing is saved. v2.432.0: it no longer asks
  // for the rows — exportar_seguimiento was dropped in SQL 20 (data protection) and the call always failed
  qualityLegacy.setExport(format => { qualityLegacy.download([], 'Exportacion_seguimiento', format); });
}

/** Paints the whole screen. */
export async function loadQuality(): Promise<void> {
  const view = document.getElementById('v-seguimiento'); if (!view) return;
  // The selects start empty on every visit, so the filters do too (legacy kept them hidden from the previous visit)
  Object.assign(followUpState, { estado: '', prov: '', muni: '', modo: 'todos', pagina: 0 });
  view.innerHTML = pageHtml();
  bindHeader();
  const { data: options } = await legacyDb().rpc<FilterOptions>('opciones_filtros', {});
  fillFilters(options);
  const { data: summary } = await legacyDb().rpc<FollowUpSummary>('resumen_seguimiento');
  paintIndicators(summary);
  void paintFollowUp(true);
  await paintSummary();
  try { await paintDoubtfulAddresses(); } catch { /* the addresses card is optional */ }
}
