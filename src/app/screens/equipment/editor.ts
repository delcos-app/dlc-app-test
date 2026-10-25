/**
 * The window to register or change a piece of equipment: where it is, which product, serial number, contract, warranty and how
 * often it is reviewed. Migrated from the legacy editarEquipo (v2.409.0); editarEquipo stays as an adapter (the account card
 * opens it with the centre already chosen).
 */
import { appLegacy, editorLegacy, equipmentLegacy, legacyDb, notices, relatedLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { failureText, SALE, STATES, type Equipment } from './model';

const MAX_REVIEW_MONTHS = 120;

interface EquipmentProduct { id: string; nombre: string; es_equipo?: boolean | null; revision_meses?: number | null }

const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const value = (id: string): string => field(id)?.value ?? '';
const trimmedOrNull = (id: string): string | null => value(id).trim() || null;

async function products(): Promise<EquipmentProduct[]> {
  const { data } = await legacyDb().from<EquipmentProduct[]>('productos').select('id,nombre,es_equipo,revision_meses').order('nombre');
  return (data ?? []).sort((first, second) => (Number(second.es_equipo) - Number(first.es_equipo)) || String(first.nombre).localeCompare(String(second.nombre)));
}

function productOptions(list: readonly EquipmentProduct[], chosen: string | undefined): string {
  return list.map(product => `<option value="${product.id}" data-rm="${product.revision_meses ?? 0}" ${product.id === chosen ? 'selected' : ''}>${escapeHtml(product.nombre)}${product.es_equipo ? '' : t('equipment.editor.notMarked')}</option>`).join('');
}

function editorHtml(item: Partial<Equipment>, existing: Equipment | null, list: readonly EquipmentProduct[]): string {
  const contracts = equipmentLegacy.contracts().map(kind => `<option ${kind === item.contrato ? 'selected' : ''}>${kind}</option>`).join('');
  return `<div class="fh"><div><h2>${t(existing ? 'equipment.editor.changeTitle' : 'equipment.editor.newTitle')}</h2><div class="sm">${t('equipment.editor.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label>${t('equipment.editor.where')}</label><div id="eqcta"></div>
    <div class="g2"><div><label for="eqp">${t('equipment.editor.equipment')}</label><select id="eqp">${productOptions(list, item.producto_id)}</select></div>
      <div><label for="eqs">${t('equipment.editor.serial')}</label><input id="eqs" value="${escapeHtml(item.serie ?? '')}" maxlength="120"></div></div>
    <div class="g2"><div><label for="equ">${t('equipment.editor.location')}</label><input id="equ" value="${escapeHtml(item.ubicacion ?? '')}" placeholder="${t('equipment.editor.locationPlaceholder')}"></div>
      <div><label for="eqi">${t('equipment.editor.installedOn')}</label><input id="eqi" type="date" value="${escapeHtml(item.instalado ?? '')}"></div></div>
    <div class="g2"><div><label for="eqc">${t('equipment.editor.contract')}</label><select id="eqc">${contracts}</select></div>
      <div id="eqcfw"><label for="eqcf">${t('equipment.editor.contractEnd')}</label><input id="eqcf" type="date" value="${escapeHtml(item.contrato_fin ?? '')}"></div></div>
    <div class="g2"><div><label for="eqg">${t('equipment.editor.warrantyUntil')}</label><input id="eqg" type="date" value="${escapeHtml(item.garantia_hasta ?? '')}"></div>
      <div><label for="eqr">${t('equipment.editor.reviewEvery')}</label><input id="eqr" type="number" min="0" max="${MAX_REVIEW_MONTHS}" step="1" value="${Number(item.revision_meses) || 0}"></div></div>
    <label for="eqn">${t('equipment.editor.note')}</label><textarea id="eqn" rows="2">${escapeHtml(item.nota ?? '')}</textarea>
    <div class="acts u-end">${existing?.estado === STATES.installed ? `<button type="button" class="btn sec peligro" id="eqretirar">${t('equipment.editor.retire')}</button>` : ''}
      <button type="button" class="btn sec" data-cerrar>${t('equipment.editor.cancel')}</button><button type="button" class="btn" id="eqok">${t(existing ? 'equipment.editor.save' : 'equipment.editor.create')}</button></div>`;
}

function rowOf(account: PickedAccount): Record<string, unknown> {
  const contract = value('eqc');
  return {
    cuenta_id: account.id, producto_id: value('eqp'), serie: trimmedOrNull('eqs'), ubicacion: trimmedOrNull('equ'),
    instalado: value('eqi') || todayIso(), contrato: contract, contrato_fin: contract === SALE ? null : value('eqcf') || null,
    garantia_hasta: value('eqg') || null, revision_meses: Math.min(MAX_REVIEW_MONTHS, Math.max(0, Math.floor(Number(value('eqr')) || 0))), nota: trimmedOrNull('eqn'),
  };
}

async function save(existing: Equipment | null, account: PickedAccount | null, button: HTMLButtonElement): Promise<void> {
  if (!account || !value('eqp')) { notices.toast(t('equipment.editor.missing'), true); return; }
  const row = rowOf(account), table = legacyDb().from<{ id: string }>('equipos');
  button.disabled = true;
  const result = existing ? await table.update(row).eq('id', existing.id).select('id').single() : await table.insert(row).select('id').single();
  button.disabled = false;
  if (result.error) { notices.toast(failureText(result.error), true); return; }
  notices.toast(t(existing ? 'equipment.editor.saved' : 'equipment.editor.created')); appLegacy.forgetCache();
  relatedLegacy.openEquipment(result.data?.id ?? '');
}

async function retire(existing: Equipment): Promise<void> {
  if (!await notices.confirm(t('equipment.editor.retireText'), { titulo: t('equipment.editor.retireTitle'), ok: t('equipment.editor.retire'), peligro: true })) return;
  const { error } = await legacyDb().from('equipos').update({ estado: STATES.retired }).eq('id', existing.id);
  if (error) { notices.toast(failureText(error), true); return; }
  notices.toast(t('equipment.editor.retired')); relatedLegacy.openEquipment(existing.id);
}

function bind(existing: Equipment | null, chosen: { account: PickedAccount | null }): void {
  editorLegacy.pickAccount(field('eqcta'), chosen.account, account => { chosen.account = account; }, t('equipment.editor.wherePlaceholder'));
  const contract = document.getElementById('eqc') as HTMLSelectElement | null, product = document.getElementById('eqp') as HTMLSelectElement | null;
  const showEnd = (): void => { field('eqcfw')?.classList.toggle('hide', contract?.value === SALE); };
  showEnd(); if (contract) contract.onchange = showEnd;
  // A new one takes the review months of the product chosen
  if (product) product.onchange = (): void => { const months = field('eqr'); if (!existing && months) months.value = product.selectedOptions[0]?.dataset.rm ?? '0'; };
  const ok = document.getElementById('eqok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(existing, chosen.account, ok); };
  const retireButton = field('eqretirar'); if (retireButton && existing) retireButton.onclick = (): void => { void retire(existing); };
}

/** A new one: installed today, sold, the first product marked as equipment and its review months. */
function newItem(list: readonly EquipmentProduct[]): Partial<Equipment> {
  const first = list.find(product => product.es_equipo);
  return { instalado: todayIso(), contrato: SALE, ...(first ? { producto_id: first.id } : {}), revision_meses: first?.revision_meses ?? 0 };
}

/** Opens the editor of `existing`, or a new one (installed today, sold, the first product marked as equipment, at `account`). */
export async function editEquipment(existing: Equipment | null, account?: PickedAccount | null): Promise<void> {
  await equipmentLegacy.loadProducts();
  const list = await products(), item = existing ?? newItem(list);
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(item, existing, list);
  if (!box.open) box.showModal();
  bind(existing, { account: existing ? { id: existing.cuenta_id ?? '', nombre: existing.cuentas?.nombre ?? '' } : account ?? null });
}
