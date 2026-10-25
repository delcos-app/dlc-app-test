/**
 * «Ventas por canal» in Analítica, after «Embudo comercial»: which part of the units comes with a referring professional and which
 * by direct sale to a centre. Migrated from graficoCanal in componentes/graficos.js (v2.416.0); graficoCanal stays as an adapter.
 */
import { callRpc, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { CHART_COLOURS, emptyChart } from './small-charts';

interface ChannelRow { nombre: string; total: number | string | null }

const CENTRE = 80, RADIUS = 60, COLOURS = 4;

function slices(rows: readonly ChannelRow[], total: number): string {
  let angle = 0;
  return rows.map((row, index) => {
    const share = (Number(row.total) || 0) / (total || 1), from = angle, to = angle + share * 2 * Math.PI; angle = to;
    const point = (at: number): [number, number] => [CENTRE + RADIUS * Math.sin(at), CENTRE - RADIUS * Math.cos(at)];
    const [x0, y0] = point(from), [x1, y1] = point(to - 0.0001);
    return `<path d="M80 80 L${x0} ${y0} A60 60 0 ${to - from > Math.PI ? 1 : 0} 1 ${x1} ${y1} Z" fill="${CHART_COLOURS[index % COLOURS] ?? ''}"/>`;
  }).join('');
}

function chartHtml(rows: readonly ChannelRow[], total: number): string {
  if (!total) return emptyChart(t('components.charts.channelEmpty'));
  return `<div class="donut"><svg viewBox="0 0 160 160" width="160" height="160">${slices(rows, total)}<circle cx="80" cy="80" r="36" fill="#fff"/><text x="80" y="86" text-anchor="middle" font-size="18" font-weight="700" fill="#0B3A66">${formatNumber(total)}</text></svg>
      <div class="donutley">${rows.map((row, index) => `<div><i style="background:${CHART_COLOURS[index % COLOURS] ?? ''}"></i><span>${escapeHtml(row.nombre)}</span><b>${formatNumber(row.total)}</b><span class="sm">${Math.round((Number(row.total) || 0) / total * 100)}%</span></div>`).join('')}</div></div>`;
}

export async function channelChart(): Promise<void> {
  const funnel = [...document.querySelectorAll('#v-analitica .ancard')].find(card => (card.querySelector('h2')?.textContent ?? '').includes('Embudo comercial'));
  if (!funnel || document.getElementById('ancanal')) return;
  funnel.insertAdjacentHTML('afterend', `<div class="card ancard" id="ancanal"><h2>${t('components.charts.channelTitle')}</h2><div class="cargandolocal" style="min-height:160px"></div>
    <p class="leer"><b>${t('components.charts.howToRead')}</b> ${t('components.charts.channelHint', { aProfessional: term('medico', { article: 'un' }) })}</p></div>`);
  const { data } = await callRpc<{ filas?: ChannelRow[] }>('analitica_tabla', { p_dim: 'canal', p_medida: 'unidades' });
  const rows = data?.filas ?? [], total = sum(rows.map(row => Number(row.total) || 0));
  const place = document.getElementById('ancanal')?.querySelector('.cargandolocal');
  if (place) place.outerHTML = chartHtml(rows, total);
}
