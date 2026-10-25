/**
 * Running an import: it is registered (importar_iniciar), the custom fields become classifiers of the module, the rows are saved
 * in batches and the end shows what was created, with «Deshacer esta importación». Also undoing an import. Migrated from the
 * legacy impEjecutar and impDeshacer (v2.410.0).
 */
import { accountListLegacy, callRpc, goTo, goToOrders, icon, importLegacy, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { isPresent } from '../../services/values';
import { entityName, type Entity } from './fields';
import { customFieldKey } from './matching';
import { sendInBatches, type BatchResult } from './rows';
import { errorLines, onClick, paint, pageBox, showProgress, steps, stepsHtml, wizard } from './wizard';

const MAX_CLASSIFIER_VALUES = 30;
const DESTINATIONS: Readonly<Record<Entity, string>> = { clientes: 'pacientes', productos: 'productos', prescriptores: 'directorio', ventas: 'ventas' };

/** The custom fields, with their values when they are few (they become the options of the classifier). */
function customFields(): { clave: string; nombre: string; valores: string[] }[] {
  return wizard.mapping.map((value, index) => (value === 'extra' ? index : null)).filter(isPresent).map(index => {
    const values = [...new Set(wizard.rows.map(row => row.v[index] ?? '').filter(Boolean))], name = wizard.headers[index] ?? '';
    return { clave: customFieldKey(name), nombre: name, valores: values.length <= MAX_CLASSIFIER_VALUES ? values : [] };
  });
}

async function start(rowCount: number): Promise<string | null> {
  const mapping: Record<string, string> = {};
  wizard.headers.forEach((header, index) => { mapping[header] = wizard.mapping[index] ?? 'no'; });
  const { data } = await callRpc<{ ok?: boolean; id: string }>('importar_iniciar', { p_entidad: wizard.entity, p_archivo: wizard.fileName, p_filas: rowCount, p_mapeo: mapping, p_firma: wizard.signature });
  return data?.ok ? data.id : null;
}

function finishedHtml(result: BatchResult): string {
  const errors = result.errores, figure = (value: number, label: string, extraClass = ''): string => `<div class="${extraClass}"><b>${formatNumber(value)}</b><span>${label}</span></div>`;
  return `<div class="card cfgpanel impcaja"><div class="impfin">${icon('check')}</div>
    <h2 style="padding:0 0 4px;text-align:center">${t('importing.run.finished')}</h2>
    <div class="impres">${figure(result.creados, t('importing.run.created'), 'ok')}${figure(result.actualizados, t('importing.run.updated'))}
      ${figure(result.omitidos, t('importing.run.unchanged'))}${figure(errors.length, t('importing.run.withErrors'), errors.length ? 'mal' : '')}</div>
    ${errors.length ? `<details class="imperr"><summary>${t('importing.review.seeErrors')}</summary><div>${errorLines(errors)}</div></details>` : ''}
    <div class="acts" style="justify-content:center;flex-wrap:wrap"><button class="btn sec" type="button" id="impdes">${icon('undo-2')} ${t('importing.run.undo')}</button>
      <button class="btn sec" type="button" id="impotra">${t('importing.run.another')}</button><button class="btn" type="button" id="impver">${t('importing.run.see', { name: escapeHtml(entityName(wizard.entity).toLowerCase()) })}</button></div></div>`;
}

function showRunProgress(done: number, total: number): void {
  showProgress(done, total);
  const counter = document.getElementById('impav');
  if (counter) counter.textContent = t('importing.run.progress', { done: formatNumber(done), total: formatNumber(total) });
}

export async function runImport(rows: readonly Record<string, unknown>[], mode: string): Promise<void> {
  const importId = await start(rows.length);
  if (!importId) { notices.toast(t('importing.run.couldNotStart'), true); return; }
  const fields = customFields();
  if (fields.length) await callRpc('importar_campos', { p_entidad: wizard.entity, p_campos: fields });
  paint(`<div class="card cfgpanel impcaja">${stepsHtml(4)}<h2 style="padding:0 0 4px">${t('importing.run.running')}</h2><p class="sm" id="impav">${t('importing.run.progress', { done: 0, total: formatNumber(rows.length) })}</p><div class="impbarra"><i style="width:0"></i></div></div>`);
  let result: BatchResult;
  try {
    result = await sendInBatches(rows, { entity: wizard.entity, mode, simulate: false, importId }, showRunProgress);
  } catch (error) {
    notices.toast(t('importing.run.interrupted', { error: error instanceof Error ? error.message : String(error) }), true);
    return;
  }
  await callRpc('importar_terminar', { p_imp: importId });
  importLegacy.countWrite();
  if (!pageBox()) return;
  paint(finishedHtml(result));
  const destination = DESTINATIONS[wizard.entity];
  onClick('impdes', () => { void undoImport(importId); });
  onClick('impotra', steps.start);
  onClick('impver', () => { if (destination === 'ventas') goToOrders('ventas'); else goTo(destination); });
}

/** Deletes what an import created (what it updated stays, and nothing already used in orders, invoices or appointments). */
export async function undoImport(id: string): Promise<void> {
  if (!await notices.confirm(t('importing.undo.text'), { titulo: t('importing.undo.title'), ok: t('importing.undo.ok'), peligro: true })) return;
  const { data } = await callRpc<{ ok?: boolean; clientes: number; productos: number; prescriptores: number; pedidos: number }>('importar_deshacer', { p_imp: id });
  if (!data?.ok) { notices.toast(t('importing.undo.couldNotUndo'), true); return; }
  importLegacy.countWrite();
  notices.toast(t('importing.undo.done', { customers: data.clientes, products: data.productos, contacts: data.prescriptores, contactsLabel: accountListLegacy.contactsLabel().toLowerCase(), orders: data.pedidos }));
  importLegacy.showHistory();
  steps.history();
}
