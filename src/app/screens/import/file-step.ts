/**
 * Steps 1 and 2 of «Nueva importación»: what to import, then the file (dropped or chosen; Excel or CSV, any sheet). Reading the
 * sheet proposes the field of each column, or reuses the mapping remembered for a file with the same columns. Migrated from the
 * legacy pintarImportar, impArchivo, impLeer and impHoja (v2.410.0).
 */
import { icon, importLegacy, callRpc, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { entityName, entityTypes, type Entity } from './fields';
import { cellValue, detectHeaderRow, hashText, normaliseHeader, proposeField } from './matching';
import { onClick, paint, steps, stepsHtml, wizard, type DataRow } from './wizard';

const MAX_ROWS = 20000;

/** Step 1: what to import. */
export function paintImport(): void {
  wizard.book = null;
  const types = entityTypes().map(type => `<button class="imptipo" type="button" data-impt="${type.key}"><span class="imptic">${icon(type.icon)}</span><b>${escapeHtml(type.name)}</b><span class="sm">${escapeHtml(type.hint)}</span></button>`).join('');
  const box = paint(`<div class="card cfgpanel impcaja">${stepsHtml(1)}
    <h2 class="u-p-0-0-4">${t('importing.start.title')}</h2>
    <p class="sm">${t('importing.start.text')}</p>
    <div class="imptipos">${types}</div></div>`);
  box?.querySelectorAll<HTMLElement>('[data-impt]').forEach(button => { button.onclick = (): void => { wizard.entity = button.dataset.impt as Entity; paintFileStep(); }; });
}

/** Step 2: the file. */
export function paintFileStep(): void {
  paint(`<div class="card cfgpanel impcaja">${stepsHtml(2)}
    <h2 class="u-p-0-0-4">${t('importing.file.title', { name: escapeHtml(entityName(wizard.entity).toLowerCase()) })}</h2>
    <p class="sm">${t('importing.file.text')}${wizard.entity === 'ventas' ? t('importing.file.salesText') : ''}</p>
    <label class="impzona" id="impzona"><input type="file" id="impfile" accept=".xlsx,.xls,.csv,.txt" hidden>
      ${icon('file-spreadsheet')}<b>${t('importing.file.drop')}</b><span class="sm">${t('importing.file.maxRows')}</span></label>
    <div id="imphojas"></div>
    <div class="acts u-between"><button class="btn sec" type="button" id="impvolver">${t('importing.file.back')}</button></div></div>`);
  onClick('impvolver', steps.start);
  const zone = document.getElementById('impzona'), input = document.getElementById('impfile') as HTMLInputElement | null;
  if (!zone || !input) return;
  zone.ondragover = (event): void => { event.preventDefault(); zone.classList.add('sobre'); };
  zone.ondragleave = (): void => { zone.classList.remove('sobre'); };
  zone.ondrop = (event): void => { event.preventDefault(); zone.classList.remove('sobre'); const file = event.dataTransfer?.files[0]; if (file) void readFile(zone, file); };
  input.onchange = (): void => { const file = input.files?.[0]; if (file) void readFile(zone, file); };
}

const zoneText = (zone: HTMLElement, text: string): void => { const label = zone.querySelector('b'); if (label) label.textContent = text; };

async function openBook(file: File): Promise<SheetBook> {
  const reader = await importLegacy.excelReader(), buffer = await file.arrayBuffer();
  if (/\.(csv|txt)$/i.test(file.name)) return reader.read(new TextDecoder('utf-8').decode(buffer), { type: 'string', cellDates: true, raw: false });
  return reader.read(buffer, { type: 'array', cellDates: true });
}

function askSheet(zone: HTMLElement, file: File, book: SheetBook): void {
  const place = document.getElementById('imphojas');
  if (!place) return;
  place.innerHTML = `<label for="imphoja">${t('importing.file.sheets')}</label><select id="imphoja">${book.SheetNames.map(name => `<option>${escapeHtml(name)}</option>`).join('')}</select>
        <div class="acts"><button class="btn" type="button" id="imphojaok">${t('importing.file.next')}</button></div>`;
  zoneText(zone, file.name); zone.classList.remove('leyendo');
  onClick('imphojaok', () => { void readSheet((document.getElementById('imphoja') as HTMLSelectElement | null)?.value ?? ''); });
}

async function readFile(zone: HTMLElement, file: File): Promise<void> {
  zone.classList.add('leyendo'); zoneText(zone, t('importing.file.reading', { name: file.name }));
  try {
    const book = await openBook(file);
    wizard.fileName = file.name; wizard.book = book;
    if (book.SheetNames.length > 1) askSheet(zone, file, book);
    else await readSheet(book.SheetNames[0] ?? '');
  } catch (error) {
    zone.classList.remove('leyendo'); zoneText(zone, t('importing.file.unreadable'));
    importLegacy.reportError(`Importar: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** The proposed mapping: the remembered one for these columns, else a field per column, a custom field or nothing. */
function proposeMapping(template: Readonly<Record<string, string>> | null): string[] {
  const used = new Set<string>();
  return wizard.headers.map((header, index) => {
    const remembered = template?.[header];
    if (remembered) { if (remembered.startsWith('std:')) used.add(remembered.slice(4)); return remembered; }
    const field = proposeField(header, wizard.entity, used);
    if (field) { used.add(field); return `std:${field}`; }
    return wizard.rows.some(row => row.v[index] !== '') ? 'extra' : 'no';
  });
}

async function readSheet(name: string): Promise<void> {
  const reader = await importLegacy.excelReader(), sheet = wizard.book?.Sheets[name];
  const rows = reader.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' }).map(row => row.map(cellValue));
  const titleRow = detectHeaderRow(rows);
  wizard.headers = (rows[titleRow] ?? []).map((cell, index) => cell || t('importing.file.column', { index: index + 1 }));
  wizard.rows = rows.slice(titleRow + 1).map((values, index): DataRow => ({ fila: titleRow + index + 2, v: values })).filter(row => row.v.some(cell => cell !== ''));
  if (!wizard.rows.length) { notices.toast(t('importing.file.noRows'), true); return; }
  if (wizard.rows.length > MAX_ROWS) { notices.toast(t('importing.file.tooMany'), true); return; }
  wizard.signature = hashText(`${wizard.entity}|${wizard.headers.map(normaliseHeader).join('|')}`);
  const { data: template } = await callRpc<Record<string, string> | null>('plantilla_importacion', { p_entidad: wizard.entity, p_firma: wizard.signature });
  wizard.mapping = proposeMapping(template ?? null);
  wizard.remembered = Boolean(template);
  steps.columns();
}
