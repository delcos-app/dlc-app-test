/** The form of «Diseño del PDF de la factura» and its templates bar. Part of the legacy disenoPDFBase and disenoPDF (v2.427.0). */
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../format';
import type { DesignTemplate, DesignTemplates, InvoiceDesign } from './design';

type Options = readonly (readonly [string, MessageKey])[];

const COLUMNS: Options = [['precio', 'billingMore.designer.price'], ['unidades', 'billingMore.designer.units'], ['subtotal', 'billingMore.designer.subtotal'],
  ['iva', 'billingMore.designer.vat'], ['total', 'billingMore.designer.total']];

const segments = (design: InvoiceDesign, key: string, options: Options): string =>
  `<div class="segs" data-pk="${key}">${options.map(([value, label]) => `<button type="button" data-v="${value}" class="${design[key] === value ? 'on' : ''}">${t(label)}</button>`).join('')}</div>`;

function check(design: InvoiceDesign, key: string, label: MessageKey, group?: 'cols'): string {
  const on = group ? design.cols[key as keyof InvoiceDesign['cols']] : design[key];
  return `<label class="opt"><input type="checkbox" data-pc="${group ? `${group}.` : ''}${key}" ${on ? 'checked' : ''}> ${t(label)}</label>`;
}

function optionsHtml(design: InvoiceDesign): string {
  const columns = COLUMNS.map(([key, label]) => check(design, key, label, 'cols')).join('');
  return `<h4>${t('billingMore.designer.logo')}</h4>${check(design, 'logo', 'billingMore.designer.showLogo')}<div class="g2"><div><label>${t('billingMore.designer.position')}</label>${segments(design, 'logoPos', [['izq', 'billingMore.designer.left'], ['der', 'billingMore.designer.right']])}</div><div><label>${t('billingMore.designer.size')}</label>${segments(design, 'logoTam', [['s', 'billingMore.designer.small'], ['m', 'billingMore.designer.medium'], ['l', 'billingMore.designer.large']])}</div></div>
      <h4>${t('billingMore.designer.style')}</h4><div class="g2"><div><label for="pcol">${t('billingMore.designer.colour')}</label><input type="color" id="pcol" value="${escapeHtml(design.color)}"></div><div><label>${t('billingMore.designer.font')}</label>${segments(design, 'fuente', [['helvetica', 'billingMore.designer.modern'], ['times', 'billingMore.designer.classic']])}</div></div>
      <label for="ptit">${t('billingMore.designer.documentTitle')}</label><input id="ptit" value="${escapeHtml(design.titulo)}" maxlength="24">
      <h4>${t('billingMore.designer.header')}</h4>${check(design, 'empresaCab', 'billingMore.designer.companyInHeader')}<label>${t('billingMore.designer.customer')}</label>${segments(design, 'clientePos', [['der', 'billingMore.designer.onTheRight'], ['izq', 'billingMore.designer.onTheLeft']])}
      ${check(design, 'vencimiento', 'billingMore.designer.dueDate')}${check(design, 'direccion', 'billingMore.designer.shippingAddress')}
      <h4>${t('billingMore.designer.lines')}</h4>${check(design, 'fotos', 'billingMore.designer.photos')}<div class="pcols">${columns}</div>
      <h4>${t('billingMore.designer.paymentAndFooter')}</h4>${check(design, 'formaPago', 'billingMore.designer.paymentMethod')}${check(design, 'iban', 'billingMore.designer.iban')}${check(design, 'pieTel', 'billingMore.designer.phone')}${check(design, 'pieWeb', 'billingMore.designer.web')}${check(design, 'pieTexto', 'billingMore.designer.footerText')}${check(design, 'paginas', 'billingMore.designer.pages')}
      <h4>${t('billingMore.designer.verifactu')}</h4><div class="sm">${t('billingMore.designer.qrHint')}</div>${segments(design, 'qrPos', [['abajo', 'billingMore.designer.bottom'], ['arriba', 'billingMore.designer.top']])}`;
}

export const designerHtml = (design: InvoiceDesign): string => `<div class="fh"><div><h2>${t('billingMore.designer.title')}</h2><div class="sm">${t('billingMore.designer.subtitle')}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="pdfcfg" data-pagina="1"><div class="pdfops">
      ${optionsHtml(design)}
    </div><div class="pdfprev"><iframe id="pdfif" title="${t('billingMore.designer.preview')}"></iframe></div></div>
    <div class="acts u-between"><button class="btn sec" id="pdfdef" type="button">${t('billingMore.designer.original')}</button>
      <div class="u-flex u-gap-8"><button class="btn sec" data-cerrar>${t('billingMore.designer.cancel')}</button><button class="btn" id="pdfok">${t('billingMore.designer.save')}</button></div></div>`;

/** The card left on the page (phone) after closing the designer window. */
export const designerCardHtml = (): string => `<div class="card cfgpanel"><h2>${t('billingMore.designer.title')}</h2><p class="sm">${t('billingMore.designer.cardText')}</p>
        <div class="acts"><button class="btn" id="pdfabrir" type="button">${t('billingMore.designer.open')}</button></div></div>`;

export function templatesBarHtml(templates: DesignTemplates, current: DesignTemplate): string {
  const options = templates.lista.map(item => `<option value="${item.id}" ${item.id === current.id ? 'selected' : ''}>${escapeHtml(item.nombre)}${item.id === templates.defecto ? t('billingMore.templates.byDefault') : ''}</option>`).join('');
  return `<div class="pdfplbar" id="pdfplbar"><div><label for="pdfplsel">${t('billingMore.templates.template')}</label><select id="pdfplsel">${options}</select></div>
    <div class="pdfplacts"><button type="button" class="btn sec chico" id="pdfplnueva">${t('billingMore.templates.add')}</button><button type="button" class="btn sec chico" id="pdfplren">${t('billingMore.templates.rename')}</button>
      ${current.id !== templates.defecto ? `<button type="button" class="btn sec chico" id="pdfpldef">${t('billingMore.templates.useByDefault')}</button>` : ''}${templates.lista.length > 1 ? `<button type="button" class="btn sec chico dang" id="pdfplx">${t('billingMore.templates.remove')}</button>` : ''}
      ${billing2Legacy.helpButton(t('billingMore.templates.helpTitle'), t('billingMore.templates.help'))}</div></div>`;
}
