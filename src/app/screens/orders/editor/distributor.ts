/**
 * «Lo sirve» in the order editor: us or a distributor; with a distributor, which one, the customer's code in it and whether the
 * distributor invoices it. Administration adds distributors from there. Painted with the editor and saved with the order (before,
 * a MutationObserver and a db.rpc wrapper of legado 078 added it afterwards). Migrated from the legacy cargarDistribuidores,
 * pintarBloqueDistribuidor and nuevoDistribuidor (v2.417.0).
 */
import { cardSectionsLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { orderEditorLegacy, type DistributorRow } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import type { Order } from '../model';

export interface DistributorChoice { on: boolean; id: string; codigo: string; factura: boolean }

/** The active distributors (read once; `force` reads them again). They stay in the legacy DISTRIBUIDORES, which the tests read. */
export async function loadDistributors(force = false): Promise<DistributorRow[]> {
  const known = orderEditorLegacy.distributors();
  if (known && !force) return known;
  const { data } = await legacyDb().from<DistributorRow[]>('distribuidores').select('id,nombre,email,telefono,activo').order('nombre');
  const list = (data ?? []).filter(item => item.activo);
  orderEditorLegacy.setDistributors(list);
  return list;
}

export const choiceOf = (order: Order | null): DistributorChoice => ({
  on: Boolean(order?.distribuidor_id), id: order?.distribuidor_id ?? '', codigo: order?.distribuidor_codigo ?? '',
  factura: order?.distribuidor_id ? Boolean(order.factura_distribuidor) : true,
});

/** What is saved with the order. */
export function distributorFields(choice: DistributorChoice): Record<string, unknown> {
  const on = choice.on && Boolean(choice.id);
  return { distribuidor_id: on ? choice.id : '', distribuidor_codigo: on ? choice.codigo : '', factura_distribuidor: on && choice.factura };
}

function choicesHtml(choice: DistributorChoice, list: readonly DistributorRow[], admin: boolean): string {
  if (!list.length) return `<p class="sm">${t('ordersMore.distributor.noneYet')}${admin ? '' : t('ordersMore.distributor.askAdmin')}</p>`;
  return `<div class="g2"><div><label for="pdsel">${t('ordersMore.distributor.distributor')}</label><select id="pdsel">${list.map(item => `<option value="${item.id}" ${item.id === choice.id ? 'selected' : ''}>${escapeHtml(item.nombre)}</option>`).join('')}</select></div>
        <div><label for="pdcod">${t('ordersMore.distributor.customerCode')}</label><input id="pdcod" value="${escapeHtml(choice.codigo)}" placeholder="${t('ordersMore.distributor.ifAny')}"></div></div>
        <label class="opt"><input type="checkbox" id="pdfac" ${choice.factura ? 'checked' : ''}> ${t('ordersMore.distributor.invoicedByDistributor')} <span class="sm">${t('ordersMore.distributor.noInvoiceOfOurs')}</span></label>`;
}

/** The block, painted right after the «Origen» row. */
export function distributorHtml(choice: DistributorChoice): string {
  const list = orderEditorLegacy.distributors() ?? [], admin = cardSectionsLegacy.can('administrar');
  if (choice.on && !choice.id && list[0]) choice.id = list[0].id;
  return `<div class="pdist" id="pdist"><label>${t('ordersMore.distributor.servedBy')}</label>
    <div class="segs" id="pdsirve" role="group" aria-label="${t('ordersMore.distributor.servedBy')}"><button type="button" data-ds="0" class="${choice.on ? '' : 'on'}" aria-pressed="${String(!choice.on)}">${t('ordersMore.distributor.us')}</button>
      <button type="button" data-ds="1" class="${choice.on ? 'on' : ''}" aria-pressed="${String(choice.on)}">${t('ordersMore.distributor.aDistributor')}</button></div>
    <div id="pddat" class="${choice.on ? '' : 'hide'}">
      ${choicesHtml(choice, list, admin)}
      ${admin ? `<button type="button" class="lnk" id="pdnuevo">${t('ordersMore.distributor.addNew')}</button>` : ''}
      <p class="sm">${t('ordersMore.distributor.noStock')}</p></div></div>`;
}

function repaintBlock(choice: DistributorChoice): void {
  const block = document.getElementById('pdist'); if (!block) return;
  block.outerHTML = distributorHtml(choice);
  bindDistributor(choice);
}

async function addDistributor(choice: DistributorChoice): Promise<void> {
  const name = (document.getElementById('dsn') as HTMLInputElement | null)?.value.trim() ?? '';
  if (!name) { notices.toast(t('ordersMore.distributor.writeName'), true); return; }
  const optional = (id: string): string | null => { const text = (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? ''; return text === '' ? null : text; };
  const { data, error } = await legacyDb().from<{ id: string }>('distribuidores').insert({ nombre: name, email: optional('dse'), telefono: optional('dst') }).select('id').single();
  if (error || !data) { notices.toast(t('ordersMore.distributor.couldNotAdd', { error: (error as { message?: string } | null)?.message ?? '' }), true); return; }
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.close(); notices.toast(t('ordersMore.distributor.added'));
  await loadDistributors(true);
  choice.on = true; choice.id = data.id;
  repaintBlock(choice);
}

/** «+ Nuevo distribuidor», in the second window. */
function newDistributor(choice: DistributorChoice): void {
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = `<div class="fh"><div><h2>${t('ordersMore.distributor.newTitle')}</h2><div class="sm">${t('ordersMore.distributor.newSubtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <label for="dsn">${t('ordersMore.distributor.name')}</label><input id="dsn" placeholder="${t('ordersMore.distributor.namePlaceholder')}">
    <div class="g2"><div><label for="dse">${t('ordersMore.distributor.email')}</label><input id="dse" type="email"></div><div><label for="dst">${t('ordersMore.distributor.phone')}</label><input id="dst" inputmode="tel"></div></div>
    <div class="acts u-end"><button type="button" class="btn sec" data-cerrar2>${t('ordersMore.distributor.cancel')}</button><button type="button" class="btn" id="dsok">${t('ordersMore.distributor.add')}</button></div>`;
  box.showModal();
  const ok = document.getElementById('dsok'); if (ok) ok.onclick = (): void => { void addDistributor(choice); };
}

export function bindDistributor(choice: DistributorChoice): void {
  const block = document.getElementById('pdist'); if (!block) return;
  const list = orderEditorLegacy.distributors() ?? [], buttons = block.querySelectorAll<HTMLElement>('[data-ds]');
  buttons.forEach(button => {
    button.onclick = (): void => {
      choice.on = button.dataset.ds === '1';
      if (choice.on && !choice.id && list[0]) choice.id = list[0].id;
      buttons.forEach(other => { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); });
      document.getElementById('pddat')?.classList.toggle('hide', !choice.on);
    };
  });
  const select = document.getElementById('pdsel') as HTMLSelectElement | null; if (select) select.onchange = (): void => { choice.id = select.value; };
  const code = document.getElementById('pdcod') as HTMLInputElement | null; if (code) code.oninput = (): void => { choice.codigo = code.value; };
  const invoice = document.getElementById('pdfac') as HTMLInputElement | null; if (invoice) invoice.onchange = (): void => { choice.factura = invoice.checked; };
  const add = document.getElementById('pdnuevo'); if (add) add.onclick = (): void => { newDistributor(choice); };
}
