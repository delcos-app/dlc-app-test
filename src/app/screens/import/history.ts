/**
 * Configuración → Importar datos → «Importaciones»: every import with its figures, and «Deshacer» while it is not undone.
 * Migrated from the legacy pintarImportaciones (v2.410.0).
 */
import { callRpc, icon } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { entityTypes } from './fields';
import { undoImport } from './run-step';
import { paint } from './wizard';

const UNDONE = 'Deshecha';

interface ImportRecord { id: string; entidad: string; archivo?: string | null; creado_en: string; usuario?: string | null; filas: number; creados: number; actualizados: number; errores: number; estado: string }

function rowHtml(item: ImportRecord, names: ReadonlyMap<string, string>): string {
  const date = new Date(item.creado_en).toLocaleString(t('dates.locale'), { dateStyle: 'short', timeStyle: 'short' });
  const line = t('importing.history.line', {
    date, user: escapeHtml(orFallback(item.usuario, '—')), rows: formatNumber(item.filas), created: formatNumber(item.creados),
    updated: formatNumber(item.actualizados), errors: formatNumber(item.errores), state: escapeHtml(item.estado),
  });
  return `<div class="errfila e-${item.estado === UNDONE ? 'api' : 'reporte'}"><div><b>${escapeHtml(names.get(item.entidad) ?? item.entidad)} · ${escapeHtml(item.archivo ?? '')}</b>
      <span class="sm">${line}</span></div>
      ${item.estado !== UNDONE ? `<button class="btn sec" type="button" data-impdes="${item.id}">${icon('undo-2')} ${t('importing.history.undo')}</button>` : '<span></span>'}</div>`;
}

export async function paintImports(): Promise<void> {
  const { data } = await callRpc<ImportRecord[]>('importaciones_lista', {});
  const names = new Map(entityTypes().map(type => [type.key as string, type.name]));
  const box = paint(`<div class="card cfgpanel"><h2>${t('importing.history.title')}</h2>
    <p class="sm">${t('importing.history.text')}</p>
    <div class="errlista">${(data ?? []).map(item => rowHtml(item, names)).join('') || `<div class="vacio">${t('importing.history.none')}</div>`}</div></div>`);
  box?.querySelectorAll<HTMLElement>('[data-impdes]').forEach(button => { button.onclick = (): void => { void undoImport(button.dataset.impdes ?? ''); }; });
}
