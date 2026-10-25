/** What the state, samples, promotion and equipment blocks do (each saves on change). Part of the legacy editorProductoBase2–6 (v2.427.0). */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { errorMessage } from '../model';

const MAX_SAMPLES = 10, MAX_REVIEW_MONTHS = 120;
const byId = (id: string): HTMLElement | null => document.getElementById(id);
const input = (id: string): HTMLInputElement | null => byId(id) as HTMLInputElement | null;

const orNull = (value: string | undefined): string | null => (value === undefined || value === '' ? null : value);
const update = (id: string, values: Record<string, unknown>): PromiseLike<LegacyResult<unknown>> => legacyDb().from('productos').update(values).eq('id', id);

/** Active, paused or discontinued (estado_producto, straight to the database). */
export function bindState(body: HTMLElement, product: { id: string }): void {
  body.querySelectorAll<HTMLElement>('[data-pest]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      const state = button.dataset.pest ?? '';
      const { data, error } = await billing2Legacy.rawRpc<{ ok?: boolean }>('estado_producto', { p_id: product.id, p_estado: state });
      if (error || !data?.ok) { notices.toast(t('productsMore.state.couldNotChange'), true); return; }
      billing2Legacy.productStates()[product.id] = state;
      const listed = billing2Legacy.products().find(item => item.id === product.id); if (listed) listed.estado = state;
      body.querySelectorAll('[data-pest]').forEach(other => { other.classList.toggle('on', other === button); });
      notices.toast(t('productsMore.state.changed', { state }));
    };
  });
}

export function bindSamples(productId: string): void {
  const save = async (): Promise<void> => {
    const regulated = Boolean(input('prmreg')?.checked), max = Math.min(MAX_SAMPLES, Math.max(1, Number(input('prmmax')?.value) || MAX_SAMPLES));
    byId('prmdat')?.classList.toggle('hide', !regulated);
    const { error } = await update(productId, { muestra_regulada: regulated, muestra_desde: orNull(input('prmdesde')?.value), muestra_max: max });
    notices.toast(error ? t('productsMore.editor.couldNotSave', { error: errorMessage(error) }) : t('productsMore.samples.saved'), Boolean(error));
  };
  ['prmreg', 'prmdesde', 'prmmax'].forEach(id => { byId(id)?.addEventListener('change', () => { void save(); }); });
}

export function bindPromotion(productId: string): void {
  const box = input('prpromoc'); if (!box) return;
  box.onchange = async (): Promise<void> => {
    const { error } = await update(productId, { promocionado: box.checked });
    const done = box.checked ? t('productsMore.promotion.on', { visits: term('visita', { number: 'p' }) }) : t('productsMore.promotion.off');
    notices.toast(error ? t('productsMore.editor.couldNotSave', { error: errorMessage(error) }) : done, Boolean(error));
    if (!error) billing2Legacy.setPromoted(null);
  };
}

export function bindEquipment(productId: string): void {
  const save = async (): Promise<void> => {
    const equipment = Boolean(input('preqc')?.checked);
    byId('preqd')?.classList.toggle('hide', !equipment);
    const months = Math.min(MAX_REVIEW_MONTHS, Math.max(0, Math.floor(Number(input('preqr')?.value) || 0)));
    const { error } = await update(productId, { es_equipo: equipment, revision_meses: months });
    notices.toast(error ? t('productsMore.editor.couldNotSave', { error: errorMessage(error) }) : t('productsMore.equipment.saved'), Boolean(error));
  };
  const box = input('preqc'), months = input('preqr');
  if (box) box.onchange = (): void => { void save(); };
  if (months) months.onchange = (): void => { void save(); };
}
