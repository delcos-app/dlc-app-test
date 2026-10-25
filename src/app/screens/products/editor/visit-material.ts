/**
 * Configuración → Stock y material → «Material de visita»: the samples (which product, and whether they come off the stock) and
 * the promotional material (shown or hidden, and — with settingsMore's improveMaterial — its quantity and portal limits); and the
 * products promoted in visits. Migrated from the legacy pintarMaterialBase, pintarMaterial, productosPromocionadosBase and
 * productosPromocionados (v2.427.0); pintarMaterial and productosPromocionados stay as adapters.
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { registerError } from '../../../core/errors';
import { escapeHtml } from '../../../services/format';
import { improveMaterial } from '../../settings/more/visit-material';
import { loadMaterials } from '../../visit/presentation';

/** Values stored in the database. */
const MATERIAL_ROLE = 'material_visita', NUMBER_KIND = 'numero', UNITS_LABEL = 'Unidades', DISCONTINUED = 'Descatalogado';

interface Samples { producto_id: string | null; restar_stock: boolean }
interface MaterialValue { id: string; valor: string; activo: boolean; dato_tipo?: string | null }

const byId = (id: string): HTMLElement | null => document.getElementById(id);
const words = (): Record<string, string> => ({
  visit: term('visita'), aVisit: term('visita', { article: 'un' }), theVisit: term('visita', { article: 'el' }), theVisits: term('visita', { number: 'p', article: 'el' }),
  ofProfessional: term('medico', { article: 'del' }), professional: term('medico'),
});

function samplesHtml(samples: Samples): string {
  const products = billing2Legacy.products().filter(item => item.tipo !== 'servicio');
  return `<div class="card cfgpanel"><h2>${t('productsMore.visitMaterial.samplesKind')}</h2>
      <div class="g2"><div><label for="muprod">${t('productsMore.visitMaterial.sampleProduct')}</label><select id="muprod"><option value="">${t('productsMore.visitMaterial.none')}</option>${products.map(item => `<option value="${item.id}" ${item.id === samples.producto_id ? 'selected' : ''}>${escapeHtml(item.nombre)}</option>`).join('')}</select></div><div></div></div>
      <label class="vfswitch u-mt-10"><input type="checkbox" id="murest" ${samples.restar_stock ? 'checked' : ''}><span class="sw"></span>
        <span><b>${t('productsMore.visitMaterial.discount')}</b><br><span class="sm">${t('productsMore.visitMaterial.discountText', words())}</span></span></label>
      <div class="acts u-end"><button class="btn" id="muok">${t('productsMore.visitMaterial.save')}</button></div></div>`;
}

const valueRow = (value: MaterialValue): string => `<div class="matfila ${value.activo ? '' : 'off'}"><b>${escapeHtml(value.valor)}</b><span class="sm">${t(value.dato_tipo === NUMBER_KIND ? 'productsMore.visitMaterial.asksQuantity' : 'productsMore.visitMaterial.onlyMarked')}</span>
        <label class="vfswitch mini"><input type="checkbox" data-mact="${value.id}" ${value.activo ? 'checked' : ''}><span class="sw"></span><span class="sm">${t(value.activo ? 'productsMore.visitMaterial.active' : 'productsMore.visitMaterial.hidden')}</span></label></div>`;

function pageHtml(samples: Samples, values: readonly MaterialValue[], canAdd: boolean): string {
  return `
    <div class="card cfgpanel"><h2>${t('productsMore.visitMaterial.title', words())}</h2>
      <p class="sm">${t('productsMore.visitMaterial.intro', words())}</p>
      <div class="mattipos"><div><b>${t('productsMore.visitMaterial.samplesKind')}</b><span>${t('productsMore.visitMaterial.samplesKindText')}</span></div>
        <div><b>${t('productsMore.visitMaterial.promoKind')}</b><span>${t('productsMore.visitMaterial.promoKindText')}</span></div></div></div>
    ${samplesHtml(samples)}
    <div class="card cfgpanel"><h2>${t('productsMore.visitMaterial.promoKind')}</h2>
      <p class="sm">${t('productsMore.visitMaterial.promoText', words())}</p>
      <div class="matlista">${values.map(valueRow).join('') || `<div class="sm">${t('productsMore.visitMaterial.noMaterial')}</div>`}</div>
      <div class="matadd"><input id="matn" placeholder="${t('productsMore.visitMaterial.newPlaceholder')}"><label class="opt u-m-0"><input type="checkbox" id="matq" checked> ${t('productsMore.visitMaterial.countUnits')}</label>
        <button class="btn sec" id="matok" ${canAdd ? '' : 'disabled'}>${t('productsMore.visitMaterial.add')}</button></div></div>`;
}

async function saveSamples(): Promise<void> {
  const product = (byId('muprod') as HTMLSelectElement | null)?.value ?? '', discount = Boolean((byId('murest') as HTMLInputElement | null)?.checked);
  if (discount && !product) { notices.toast(t('productsMore.visitMaterial.chooseProduct'), true); return; }
  const value = { producto_id: product || null, restar_stock: discount };
  const { error } = await legacyDb().rpc('guardar_ajuste', { p_clave: 'muestras', p_valor: value });
  if (error) { notices.toast(t('productsMore.visitMaterial.couldNotSave'), true); return; }
  billing2Legacy.settings().muestras = value; notices.toast(t('productsMore.visitMaterial.saved'));
}

async function addMaterial(classifierId: string): Promise<void> {
  const name = ((byId('matn') as HTMLInputElement | null)?.value ?? '').trim(); if (!name) return;
  const counted = Boolean((byId('matq') as HTMLInputElement | null)?.checked);
  const { error } = await legacyDb().rpc('guardar_valor', { p: { clasificador_id: classifierId, valor: name, ...(counted ? { dato_tipo: NUMBER_KIND, dato_etiqueta: UNITS_LABEL } : {}) } });
  if (error) { notices.toast(t('productsMore.visitMaterial.couldNotAdd', { error: (error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t('productsMore.visitMaterial.added')); billing2Legacy.loadCatalogs(); void paintVisitMaterial();
}

function bind(box: HTMLElement, classifierId: string | null): void {
  const ok = byId('muok'); if (ok) ok.onclick = (): void => { void saveSamples(); };
  box.querySelectorAll<HTMLInputElement>('[data-mact]').forEach(input => {
    input.onchange = async (): Promise<void> => {
      await legacyDb().rpc('guardar_valor', { p: { id: input.dataset.mact, activo: input.checked } });
      notices.toast(t(input.checked ? 'productsMore.visitMaterial.visible' : 'productsMore.visitMaterial.hiddenIn', words()));
      billing2Legacy.loadCatalogs(); void paintVisitMaterial();
    };
  });
  const add = byId('matok'); if (add && classifierId) add.onclick = (): void => { void addMaterial(classifierId); };
}

export async function paintVisitMaterial(): Promise<void> {
  await Promise.all([billing2Legacy.loadSettings(), billing2Legacy.loadProducts()]);
  const samples: Samples = { producto_id: null, restar_stock: false, ...(billing2Legacy.settings().muestras as Partial<Samples> | undefined) };
  await legacyDb().rpc('clasificadores_actividad');
  const { data: classifier } = await legacyDb().from<{ id: string }>('clasificadores').select('id').eq('papel', MATERIAL_ROLE).maybeSingle();
  const { data: values } = classifier ? await legacyDb().from<MaterialValue[]>('valores_clasificador').select('id,valor,activo,dato_tipo').eq('clasificador_id', classifier.id).order('orden') : { data: [] };
  const box = byId('cfgcuerpo'); if (!box) return;
  box.innerHTML = pageHtml(samples, values ?? [], Boolean(classifier));
  bind(box, classifier?.id ?? null);
  try { await improveMaterial(); } catch (error) { registerError('error', t('productsMore.visitMaterial.errorLog', { error: (error as Error).message })); }
}

/** The products promoted in visits (the last list read when offline); with them, the material to present, at the same time. */
export async function promotedProducts(): Promise<{ id: string; nombre: string }[]> {
  const read = async (): Promise<{ id: string; nombre: string }[]> => {
    // v2.259.0: offline, the last list read
    if (!navigator.onLine) return billing2Legacy.promoted() ?? [];
    try {
      const { data, error } = await legacyDb().from<{ id: string; nombre: string; estado?: string | null }[]>('productos').select('id,nombre,estado').eq('promocionado', true).order('nombre');
      if (!error) billing2Legacy.setPromoted((data ?? []).filter(item => (item.estado ?? 'Activo') !== DISCONTINUED).map(item => ({ id: item.id, nombre: item.nombre })));
    } catch { /* the last list read */ }
    return billing2Legacy.promoted() ?? [];
  };
  const [list] = await Promise.all([read(), loadMaterials()]);
  return list;
}
