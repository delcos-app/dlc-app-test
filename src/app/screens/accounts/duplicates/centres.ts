/**
 * Duplicados: the centres and consultations of two accounts being unified. Which ones stay is chosen in the compare panel; after
 * unifying, the others are removed and, for two centres, the professionals of both pass to the centre that stays. Migrated from
 * the legacy compararEn and dupJuntarCentros and the db.rpc hook of legado 136 (v2.417.0).
 */
import { appLegacy, legacyDb, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';

export interface Consultation { id: string; centro_nombre?: string | null; direccion?: string | null; municipio?: string | null; de: string }
export interface KindRow { id: string; tipo?: string | null; centro_id?: string | null; nombre?: string | null }

/** What the panel offers and what the user marked. */
export interface CentreChoice {
  readonly isCentre: boolean;
  readonly consultations: readonly Consultation[];
  readonly professionals: readonly [number, number];
  readonly removed: Set<string>;
  address: string | null;
}

const placeText = (item: Consultation): string =>
  [item.centro_nombre, item.direccion, item.municipio].filter(Boolean).join(' · ') || t('accountsMore.compare.noAddress');

const from = (item: Consultation): string => `<span class="sm">${t('accountsMore.compare.from', { name: escapeHtml(item.de) })}</span>`;

/** The block above «Unificar» (empty for two persons without consultations). */
export function centresHtml(choice: CentreChoice): string {
  const { consultations } = choice;
  if (choice.isCentre) {
    const addresses = consultations.map(item => `<label class="opt"><input type="radio" name="dupdir" value="${item.id}" ${item.id === choice.address ? 'checked' : ''}> <span>${escapeHtml(placeText(item))} ${from(item)}</span></label>`).join('');
    return `<div class="dupcons"><h3>${t('accountsMore.compare.centreAddress')}</h3><p class="sm">${t('accountsMore.compare.keepMarked')}</p>
      ${addresses || `<p class="sm">${t('accountsMore.compare.noAddresses')}</p>`}
      <h3>${escapeHtml(term('medico', { number: 'p', capital: 'C' }))}</h3><p class="sm">${t('accountsMore.compare.professionalsMove', { a: formatNumber(choice.professionals[0]), b: formatNumber(choice.professionals[1]) })}</p></div>`;
  }
  if (!consultations.length) return '';
  return `<div class="dupcons"><h3>${t('accountsMore.compare.centresAndConsultations', { consultations: term('consulta', { number: 'p' }) })}</h3><p class="sm">${t('accountsMore.compare.keepMarkedMany')}</p>
      ${consultations.map(item => `<label class="opt"><input type="checkbox" data-dupcons="${item.id}" ${choice.removed.has(item.id) ? '' : 'checked'}> <span>${escapeHtml(placeText(item))} ${from(item)}</span></label>`).join('')}</div>`;
}

/** Keeps what the user marks in the block. */
export function bindCentres(panel: HTMLElement, choice: CentreChoice): void {
  panel.querySelectorAll<HTMLInputElement>('[data-dupcons]').forEach(input => {
    input.onchange = (): void => { const id = input.dataset.dupcons ?? ''; if (input.checked) choice.removed.delete(id); else choice.removed.add(id); };
  });
  panel.querySelectorAll<HTMLInputElement>('input[name=dupdir]').forEach(input => { input.onchange = (): void => { if (input.checked) choice.address = input.value; }; });
}

/** The consultations to remove after unifying (for centres, every address but the chosen one). */
export const toRemove = (choice: CentreChoice): string[] =>
  (choice.isCentre ? choice.consultations.filter(item => item.id !== choice.address).map(item => item.id) : [...choice.removed]);

/** A person must keep at least one centre or consultation. */
export const keepsNone = (choice: CentreChoice): boolean =>
  !choice.isCentre && choice.consultations.length > 0 && toRemove(choice).length === choice.consultations.length;

interface CentreRow { id: string; nombre: string; municipio?: string | null }

/** The professionals of the centre that goes pass to the one that stays; whoever is twice in it keeps one consultation. */
async function joinCentres(stays: KindRow, goes: KindRow): Promise<void> {
  if (!stays.centro_id || !goes.centro_id) return;
  const centre = (id: string): PromiseLike<{ data: CentreRow | null }> => legacyDb().from<CentreRow>('centros').select('id, nombre, municipio').eq('id', id).maybeSingle();
  const { data: kept } = await centre(stays.centro_id), { data: gone } = await centre(goes.centro_id);
  if (!kept) return;
  const values = { centro_id: kept.id, centro_nombre: kept.nombre };
  await legacyDb().from('ubicaciones').update(values).eq('centro_id', goes.centro_id);
  if (gone) await legacyDb().from('ubicaciones').update(values).is('centro_id', null).eq('centro_nombre', gone.nombre);
  const { data: places } = await legacyDb().from<{ id: string; cuenta_id: string; principal?: boolean | null }[]>('ubicaciones').select('id, cuenta_id, principal').eq('centro_id', kept.id);
  const seen = new Set<string>(), extra: string[] = [];
  [...(places ?? [])].sort((first, second) => Number(Boolean(second.principal)) - Number(Boolean(first.principal))).forEach(place => {
    if (place.cuenta_id === stays.id) return;
    if (seen.has(place.cuenta_id)) extra.push(place.id); else seen.add(place.cuenta_id);
  });
  if (extra.length) await legacyDb().from('ubicaciones').delete().in('id', extra);
  appLegacy.forgetCache();
}

/** After a successful unification: removes the consultations not kept and, for centres, joins both centres. */
export async function tidyAfterUnify(choice: CentreChoice, staysId: string, rows: { a: KindRow; b: KindRow }): Promise<void> {
  const removed = toRemove(choice);
  if (removed.length) await legacyDb().from('ubicaciones').delete().in('id', removed);
  if (!choice.isCentre) return;
  // The address that stays also becomes the main one of the centre account
  await legacyDb().from('ubicaciones').update({ principal: true }).eq('cuenta_id', staysId);
  await joinCentres(staysId === rows.a.id ? rows.a : rows.b, staysId === rows.a.id ? rows.b : rows.a);
}
