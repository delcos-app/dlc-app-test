/**
 * Eventos → «Informe de gastos»: what was given to each professional during a year, by concept, to download as CSV (the base of
 * the yearly report of the Farmaindustria and Fenin codes). Migrated from the legacy pintarTransparencia (v2.407.0). Fixes the
 * old intermittent «Cannot set properties of null (setting 'onclick')»: the box is looked up again after the answer arrives
 * (if the page was painted again meanwhile, the old one was no longer on screen).
 */
import { currentScreen, legacyDb, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml, formatCurrency } from '../../services/format';
import { range, sum } from '../../services/values';
import { CONCEPTS, conceptLabel, type Concept } from './model';

const YEARS_SHOWN = 4;
/** Byte order mark: Excel needs it to read the accents of a UTF-8 CSV. */
const BOM = String.fromCharCode(0xfeff);

type ReportRow = Partial<Record<Concept | 'total', number | string | null>> & { nombre: string; codigo?: string | null; especialidad?: string | null; eventos: number };

const amount = (row: ReportRow, key: Concept | 'total'): number => Number(row[key]) || 0;

function tableHtml(rows: readonly ReportRow[]): string {
  const total = (key: Concept | 'total'): string => formatCurrency(sum(rows.map(row => amount(row, key))));
  return `<div class="dgrid-wrap"><table class="trtabla"><thead><tr><th>${term('medico', { capital: 'C' })}</th><th>${t('events.report.events')}</th>${CONCEPTS.map(concept => `<th>${conceptLabel(concept)}</th>`).join('')}<th>${t('events.report.total')}</th></tr></thead>
      <tbody>${rows.map(row => `<tr><td><b>${escapeHtml(row.nombre)}</b>${row.especialidad ? `<span class="sm"> · ${escapeHtml(row.especialidad)}</span>` : ''}</td><td>${row.eventos}</td>${CONCEPTS.map(concept => `<td>${formatCurrency(amount(row, concept))}</td>`).join('')}<td><b>${formatCurrency(amount(row, 'total'))}</b></td></tr>`).join('')}</tbody>
      <tfoot><tr><td>${t('events.report.total')}</td><td></td>${CONCEPTS.map(concept => `<td>${total(concept)}</td>`).join('')}<td><b>${total('total')}</b></td></tr></tfoot></table></div>`;
}

/** The CSV (semicolons, decimal commas, with BOM so Excel reads the accents). */
function download(rows: readonly ReportRow[], year: number): void {
  const quote = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`, decimal = (value: unknown): string => String(Number(value) || 0).replace('.', ',');
  const header = [term('medico', { capital: 'C' }), t('events.report.code'), term('especialidad', { capital: 'C' }), t('events.report.events'), ...CONCEPTS.map(conceptLabel), t('events.report.total')].map(quote).join(';');
  const lines = rows.map(row => [quote(row.nombre), quote(row.codigo), quote(row.especialidad), row.eventos, ...CONCEPTS.map(concept => decimal(row[concept])), decimal(row.total)].join(';'));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([BOM + [header, ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  link.download = t('events.report.fileName', { year });
  document.body.appendChild(link); link.click();
  setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 1000);
}

/** Paints the report of `year` (by default, last year). */
export async function paintExpenseReport(year?: number): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const current = Number(todayIso().slice(0, 4)), shown = year ?? current - 1;
  const { data } = await legacyDb().rpc<{ filas?: ReportRow[] }>('transparencia_anual', { p_anio: shown });
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'eventos') return;
  const rows = data?.filas ?? [];
  box.innerHTML = `<div class="evpag"><div class="evcab"><label for="trano">${t('events.report.year')}</label><select id="trano">${range(YEARS_SHOWN).map(back => current - back).map(option => `<option ${option === shown ? 'selected' : ''}>${option}</option>`).join('')}</select>
      ${rows.length ? `<button type="button" class="btn sec" id="trcsv">${t('events.report.download')}</button>` : ''}</div>
    <p class="sm">${t('events.report.note', { professional: term('medico') })}</p>
    ${rows.length ? tableHtml(rows) : `<div class="vacio vlinea">${t('events.report.empty', { year: shown })}</div>`}</div>`;
  const select = box.querySelector<HTMLSelectElement>('#trano'); if (select) select.onchange = (): void => { void paintExpenseReport(Number(select.value)); };
  const csv = box.querySelector<HTMLElement>('#trcsv'); if (csv) csv.onclick = (): void => { download(rows, shown); };
}
