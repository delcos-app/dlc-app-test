/**
 * The blocks under the product form (they are painted with it, in one go, instead of the old layers added after timeouts): state,
 * regulated samples, promotion, equipment, packs for the centres and the material to present. Part of the legacy
 * editorProductoBase2–8 (v2.427.0).
 */
import { term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

/** Product states, as stored in the database (and shown as they are). */
export const PRODUCT_STATES = ['Activo', 'En pausa', 'Descatalogado'] as const;
const MAX_SAMPLES = 10;

export interface Pack { compra: number | string; regalo: number | string }
export interface ProductExtras {
  muestra_regulada?: boolean | null; muestra_desde?: string | null; muestra_max?: number | null; promocionado?: boolean | null;
  es_equipo?: boolean | null; revision_meses?: number | null; packs?: Pack[] | null; pvp_recomendado?: number | null;
}

export const stateHtml = (state: string): string => `<div class="blk" id="prestado"><h3>${t('productsMore.state.title')}</h3><div class="segs">${PRODUCT_STATES.map(item => `<button type="button" data-pest="${item}" class="${item === state ? 'on' : ''}">${item}</button>`).join('')}</div>
      <div class="sm u-mt-6">${t('productsMore.state.hint')}</div></div>`;

export const samplesForNewHtml = (): string => `<div class="blk" id="prmuestra"><h3>${t('productsMore.samples.title')}</h3><p class="sm">${t('productsMore.samples.saveFirst')}</p></div>`;

export const samplesHtml = (extras: ProductExtras): string => `<div class="blk" id="prmuestra"><h3>${t('productsMore.samples.title')}</h3>
      <label class="opt"><input type="checkbox" id="prmreg" ${extras.muestra_regulada ? 'checked' : ''}> ${t('productsMore.samples.regulated')}</label>
      <div class="g2 ${extras.muestra_regulada ? '' : 'hide'}" id="prmdat">
        <div><label for="prmdesde">${t('productsMore.samples.authorised')}</label><input id="prmdesde" type="date" value="${escapeHtml(extras.muestra_desde ?? '')}"></div>
        <div><label for="prmmax">${t('productsMore.samples.maxPerYear')}</label><input id="prmmax" type="number" min="1" max="${MAX_SAMPLES}" step="1" value="${Number(extras.muestra_max) || MAX_SAMPLES}"></div></div>
      <p class="sm">${t('productsMore.samples.law')}</p></div>`;

export const promotionHtml = (extras: ProductExtras): string => `<div class="blk" id="prpromo"><h3>${t('productsMore.promotion.title')}</h3>
      <label class="opt"><input type="checkbox" id="prpromoc" ${extras.promocionado ? 'checked' : ''}> ${t('productsMore.promotion.promoted', { visits: term('visita', { number: 'p' }) })}</label>
      <p class="sm">${t('productsMore.promotion.hint', { visit: term('visita') })}</p></div>`;

export const equipmentHtml = (extras: ProductExtras): string => `<div class="blk" id="prequipo"><h3>${t('productsMore.equipment.title')}</h3>
      <label class="opt"><input type="checkbox" id="preqc" ${extras.es_equipo ? 'checked' : ''}> ${t('productsMore.equipment.isEquipment')}</label>
      <div class="${extras.es_equipo ? '' : 'hide'}" id="preqd"><label for="preqr">${t('productsMore.equipment.review')}</label><input id="preqr" type="number" min="0" max="120" step="1" value="${Number(extras.revision_meses) || 0}" style="max-width:140px"></div>
      <p class="sm">${t('productsMore.equipment.hint')}</p></div>`;

export const packsHtml = (extras: ProductExtras): string => `<div class="blk" id="prpacks"><h3>${t('productsMore.packs.title')}</h3>
      <p class="sm">${t('productsMore.packs.hint')}</p>
      <div id="prpkl"></div><button type="button" class="btn sec chico" id="prpkmas">${t('productsMore.packs.add')}</button>
      <div class="g2 u-mt-10"><div><label for="prpkpvp">${t('productsMore.packs.retailPrice')}</label><input id="prpkpvp" type="number" step="0.01" value="${extras.pvp_recomendado !== null && extras.pvp_recomendado !== undefined ? Number(extras.pvp_recomendado) : ''}" placeholder="${t('productsMore.packs.notSet')}"></div></div>
      <span class="pcerr" id="prpkerr" hidden></span>
      <div class="prpkacts"><button type="button" class="btn sec" id="prpkok">${t('productsMore.packs.save')}</button></div></div>`;

export const materialHtml = (): string => `<div class="blk" id="prmat"><h3>${t('productsMore.material.title')}</h3>
      <p class="sm">${escapeHtml(t('productsMore.material.hint', { aVisit: term('visita', { article: 'una' }) }))}</p>
      <div class="prmatl" id="prmatl"></div>
      <label class="btn sec prmatadd">${t('productsMore.material.add')}<input type="file" id="prmatf" accept="image/*,application/pdf" data-fp="1" multiple hidden></label></div>`;
