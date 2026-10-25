/** The opportunity window: client, what they want (with the records extra) and how it ends. Migrated from editorOportunidad (v2.410.0). */
import { term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { catalog, chipsHtml, followUpButtons, ORDER_DONE } from '../model';
import type { Draft } from './draft';

function title(draft: Draft): string {
  if (draft.source.id) return t(draft.closed ? 'opportunities.editor.closedSale' : 'opportunities.editor.opportunity');
  return t(draft.previous ? 'opportunities.editor.callAgain' : 'opportunities.editor.newSale');
}

function subtitle(draft: Draft): string {
  if (draft.previous) return t('opportunities.editor.followUpOf', { name: escapeHtml(orFallback(draft.previous.cliente, orFallback(draft.previous.nombre, ''))) });
  return t(draft.recording ? 'opportunities.editor.subtitleRecord' : 'opportunities.editor.subtitleOrder');
}

/** The date of the opportunity for a datetime-local field (local time). */
function localDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function wantsHtml(draft: Draft): string {
  if (!draft.recording) return '';
  return `<div class="llpaso" id="nvp2"><span class="lln">2</span><b>${t('opportunities.editor.wants')}</b>
      <div id="nvint"></div>
      <label>${t('opportunities.editor.reference', { Professional: term('medico', { capital: 'C' }) })}</label><div id="nvmed"></div>
      <div class="sm u-mt-4">${t('opportunities.editor.referenceHint')}</div>
      <label>${t('opportunities.editor.howArrived')}</label><div class="chipsw" id="nvori">${chipsHtml(catalog('origen_oportunidad'), draft.origin, 'data-nvo')}</div>
      <label>${t('opportunities.editor.reason')}</label><div class="chipsw" id="nvmot">${chipsHtml(catalog('motivo_llamada'), draft.reason, 'data-nvm')}</div>
      <details class="llmas"><summary>${t('opportunities.editor.moreDetails')}</summary>
        <div class="g2"><div><label for="nvf">${t('opportunities.editor.dateTime')}</label><input id="nvf" type="datetime-local" value="${localDateTime(draft.source.fecha ?? '')}"></div>
          <div><label for="nvno">${t('opportunities.editor.note')}</label><input id="nvno" value="${escapeHtml(orFallback(draft.source.nota, ''))}"></div></div></details></div>`;
}

function noSaleHtml(draft: Draft): string {
  if (!draft.recording || draft.closed) return '';
  const results = catalog('resultado_llamada').filter(entry => entry.extra !== 'pos' && entry.valor !== ORDER_DONE);
  return `<div id="nvnoz" class="${draft.noSale ? '' : 'hide'}">
        <label>${t('opportunities.editor.whyNoSale')}</label><div class="chipsw" id="nvres">${chipsHtml(results, draft.result, 'data-nvr')}</div>
        <div class="sm" style="margin:8px 0 4px">${t('opportunities.callAgainWhen')}</div>
        <div class="chipsw">${followUpButtons('nvd')}</div>
        <div class="g2 u-mt-6"><div><input id="nvpf" type="date" value="${escapeHtml(orFallback(draft.source.proxima_fecha, ''))}" aria-label="${t('opportunities.callAgainOn')}"></div>
          <div><input id="nvpa" value="${escapeHtml(orFallback(draft.source.proxima_accion, ''))}" placeholder="${t('opportunities.whatToDoPlaceholder')}" aria-label="${t('opportunities.whatToDo')}"></div></div>
        <div id="nvperd" class="sm u-mt-6"></div>
        <div class="acts" style="margin:8px 0 0;justify-content:flex-start"><button type="button" class="btn" id="nvnook">${t('opportunities.editor.saveWithoutOrder')}</button></div></div>`;
}

function endsHtml(draft: Draft): string {
  const ends = draft.closed ? `<div class="banda-ok">${t('opportunities.editor.closedWith', { order: escapeHtml(orFallback(draft.source.pedido, '')) })}</div>`
    : `<div class="acts nvfin" style="margin:6px 0 0;justify-content:flex-start">
          <button type="button" class="btn" id="nvped">${t('opportunities.editor.makeOrder')}</button>
          ${draft.recording ? `<button type="button" class="btn sec ${draft.noSale ? 'on' : ''}" id="nvno2">${t('opportunities.editor.noSale')}</button>` : ''}</div>`;
  return `<div class="llpaso" id="nvp3"><span class="lln">${draft.recording ? 3 : 2}</span><b>${t('opportunities.editor.howEnds')}</b>
      ${ends}
      ${noSaleHtml(draft)}
    </div>`;
}

export function editorHtml(draft: Draft): string {
  const saveChanges = draft.recording && (draft.closed || draft.source.id) ? `<button class="btn sec" id="nvguar">${t('opportunities.editor.saveChanges')}</button>` : '';
  return `
    <div class="fh"><div><h2>${title(draft)}</h2>
      <div class="sm">${subtitle(draft)}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="llpaso" id="nvp1"><span class="lln">1</span><b>${t('opportunities.editor.client')}</b><div id="nvcli"></div><div id="nvctx" class="nvctx"></div></div>
    ${wantsHtml(draft)}
    ${endsHtml(draft)}
    <div class="acts u-end u-wrap"><button class="btn sec" data-cerrar>${t('opportunities.editor.close')}</button>
      ${saveChanges}</div>`;
}
