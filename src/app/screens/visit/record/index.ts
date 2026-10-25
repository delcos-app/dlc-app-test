/**
 * «Registrar visita»: everything is asked first and the window is painted complete (before, six layers added parts after it was
 * open). It opens without connection with the saved copy of the card and its results. Migrated from the legacy abrirVisita chain
 * (v2.412.0); abrirVisita stays as an adapter (Agenda, the card, Configuración and the tests open it by that name).
 */
import { cardSectionsLegacy, notices, term } from '../../../legacy/bridge';
import { visitLegacy } from '../../../legacy/visit-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { pressed, togglePressed } from '../model';
import { paintPhotos, readVisitPhoto } from '../photos';
import { presentProduct } from '../presentation';
import { loadVisitData, type SampleLeft, type VisitData } from './data';
import { splitGroups, visitHtml, type ButtonIndex } from './form';
import { forgetOperation, saveVisit, type OpenVisit } from './save';

const REPORTING = /reporting/i;

function bindResults(body: HTMLElement, visit: OpenVisit): void {
  body.querySelectorAll<HTMLElement>('[data-vk]').forEach(button => {
    button.onclick = (): void => {
      const key = button.dataset.vk ?? '', on = pressed(button);
      if (visit.index.get(key)?.group === visit.resultsKey) {
        const negative = button.dataset.neg === '1';
        body.querySelectorAll<HTMLElement>('[data-res]').forEach(other => {
          if ((negative || other.dataset.neg === '1') && other !== button) {
            other.setAttribute('aria-pressed', 'false');
            body.querySelector(`[data-box="${CSS.escape(other.dataset.vk ?? '')}"]`)?.classList.add('hide');
          }
        });
      }
      button.setAttribute('aria-pressed', String(!on));
      const box = body.querySelector(`[data-box="${CSS.escape(key)}"]`);
      if (box) { box.classList.toggle('hide', on); if (!on) { const field = box.querySelector<HTMLElement>('input, select'); if (field) setTimeout(() => { field.focus(); }, 30); } }
    };
  });
  const more = document.getElementById('vtodos');
  if (more) more.onclick = (): void => { body.classList.add('vertodos'); more.remove(); };
}

function bindModeAndProducts(body: HTMLElement, draft: VisitDraft): void {
  const modes = body.querySelectorAll<HTMLElement>('[data-vmodo]');
  modes.forEach(button => { button.onclick = (): void => { draft.modo = button.dataset.vmodo ?? 'presencial'; modes.forEach(other => { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); }); }; });
  body.querySelectorAll<HTMLElement>('[data-vprod]').forEach(button => {
    button.onclick = (): void => { togglePressed(button); draft.productos = [...body.querySelectorAll<HTMLElement>('[data-vprod][aria-pressed=true]')].map(item => item.dataset.vprod ?? ''); };
  });
  body.querySelectorAll<HTMLElement>('[data-vpres]').forEach(button => { button.onclick = (): void => { presentProduct(button.dataset.vpres ?? ''); }; });
}

function bindPhotos(draft: VisitDraft): void {
  const paint = (): void => { paintPhotos(document.getElementById('vfotos'), draft.fotos, index => { draft.fotos.splice(index, 1); paint(); }); };
  const input = document.getElementById('vfotof') as HTMLInputElement | null;
  if (input) input.onchange = async (): Promise<void> => {
    for (const file of [...(input.files ?? [])]) {
      if (draft.fotos.length >= visitLegacy.photosMax()) { notices.toast(t('visit.photos.atMost', { max: visitLegacy.photosMax(), visit: term('visita') }), true); break; }
      const photo = await readVisitPhoto(file); if (photo) draft.fotos.push(photo);
    }
    input.value = ''; paint();
  };
}

/** The samples given, checked before saving (the legacy listener of legado 078 stops the save if something fails). */
function bindSamples(body: HTMLElement, samples: readonly SampleLeft[], draft: VisitDraft): void {
  if (!samples.length) return;
  let pad: SignaturePad | null = null;
  const items = (): SampleItem[] => [...body.querySelectorAll<HTMLInputElement>('[data-vmprod]')]
    .map(input => ({ producto_id: input.dataset.vmprod ?? '', unidades: Math.max(0, Math.floor(Number(input.value) || 0)), max: Number(input.max) })).filter(item => item.unidades > 0);
  const show = (): void => {
    const any = items().length > 0, canvas = document.getElementById('vmcanvas') as HTMLCanvasElement | null;
    document.getElementById('vmfirma')?.classList.toggle('hide', !any);
    if (any && !pad && canvas) pad = visitLegacy.signaturePad(canvas);
  };
  body.querySelectorAll('[data-vmprod]').forEach(input => { input.addEventListener('input', show); });
  const clear = document.getElementById('vmborrar'); if (clear) clear.onclick = (): void => { pad?.borrar(); };
  draft.muestras = {
    items, firmante: () => (document.getElementById('vmfirmante') as HTMLInputElement | null)?.value.trim() ?? '', firma: () => pad?.imagen() ?? null,
    validar: () => {
      const chosen = items();
      if (!chosen.length) return null;
      if (chosen.some(item => item.unidades > item.max)) return t('visit.samples.overLimit');
      return !pad || pad.vacia() ? t('visit.samples.missingSignature') : null;
    },
  };
}

/** Visits are recorded the same day unless the role may record past dates (then the chosen day of the appointment, if any). */
function applyDateRules(date: string): void {
  const field = document.getElementById('vf') as HTMLInputElement | null; if (!field) return;
  const today = todayIso();
  field.max = today;
  if (!cardSectionsLegacy.can('visita_fecha_pasada')) { field.value = today; field.min = today; field.disabled = true; field.title = t('visit.record.sameDay'); }
  else if (date && date <= today) field.value = date;
}

/** An account «sin reporting»: the reporting results are hidden, with a note. */
function hideReporting(box: HTMLElement): void {
  let hidden = 0;
  box.querySelectorAll<HTMLElement>('.chips button, [data-res], .chip').forEach(button => { if (REPORTING.test(button.textContent ?? '')) { button.style.display = 'none'; hidden++; } });
  if (!hidden || box.querySelector('.srnota')) return;
  const first = box.querySelector('.chips, [data-res]'), container = first?.classList.contains('chips') ? first : first?.parentElement;
  container?.insertAdjacentHTML('afterend', `<p class="sm srnota">${t('visit.record.noReporting', { professional: term('medico', { article: 'este', articleCapital: 'C' }), visit: term('visita') })}</p>`);
}

function paint(id: string, data: VisitData, date: string): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  const index: ButtonIndex = new Map(), resultsKey = splitGroups(data.groups).results.clave;
  body.classList.remove('vertodos');
  body.innerHTML = visitHtml(data, index);
  const draft: VisitDraft = { id, modo: 'presencial', fotos: [], ...(data.products.length ? { productos: [] } : {}) };
  visitLegacy.setCurrent(draft);
  const visit: OpenVisit = { id, account: data.account, index, resultsKey };
  bindResults(body, visit);
  bindModeAndProducts(body, draft);
  bindPhotos(draft);
  bindSamples(body, data.samples, draft);
  applyDateRules(date);
  const save = document.getElementById('vguardar') as HTMLButtonElement | null; if (save) save.onclick = (): void => { void saveVisit(visit, save); };
  box.showModal();
  if (data.noReporting) hideReporting(box);
}

/** Opens «Registrar visita» for account `id` (the day chosen in the Agenda, if any). */
export async function openVisit(id: string): Promise<void> {
  const date = visitLegacy.takeDate();
  forgetOperation();
  await visitLegacy.withLoading(async () => {
    const data = await loadVisitData(id);
    if (typeof data === 'string') { notices.toast(t('visit.record.couldNotOpen', { reason: t(data === 'online' ? 'visit.record.cardUnreadable' : 'visit.record.noCopy') }), true); return; }
    paint(id, data, date);
  });
}
