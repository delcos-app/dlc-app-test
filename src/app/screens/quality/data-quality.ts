/**
 * Calidad del dato → how complete the accounts are (what is missing, with an «i» for each) and the addresses whose map point is
 * far from their municipality, with «Volver a situar». Migrated from the legacy cargarSeguimientoPaso1Base and
 * pintarDireccionesDudosas (v2.410.0).
 */
import { agendaActions, callRpc, legacyDb, notices, qualityLegacy, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';

interface DataQuality {
  total: number; completas: number; sin_ubicacion: number; sin_horario: number; sin_especialidad: number; sin_contacto: number;
  sin_provincia: number; sin_comercial: number; duplicados: number;
}

const percentOf = (done: number, total: number): number => (total ? Math.round(done / total * 100) : 0);

const words = (): Record<string, string> => ({
  professional: term('medico'), professionals: term('medico', { number: 'p' }), Professionals: term('medico', { number: 'p', capital: 'C' }),
  speciality: term('especialidad'), anyPlace: term('consulta', { article: 'ningun' }), ofVisit: term('visita', { article: 'del' }),
});

function indicator(count: number, title: string, help: string): string {
  return `<div class="kpi ${count ? 'warn' : 'ok'}"><button class="ai" data-ayuda-txt="${escapeHtml(help)}" data-ayuda-tit="${escapeHtml(title)}" aria-label="${t('quality.summary.whatIs')}">i</button><b>${formatNumber(count)}</b><span>${escapeHtml(title)}</span></div>`;
}

const INDICATORS: readonly (readonly [keyof DataQuality, MessageKey, MessageKey])[] = [
  ['sin_ubicacion', 'quality.summary.noLocation', 'quality.summary.noLocationHelp'],
  ['sin_horario', 'quality.summary.noTimetable', 'quality.summary.noTimetableHelp'],
  ['sin_especialidad', 'quality.summary.noSpeciality', 'quality.summary.noSpecialityHelp'],
  ['sin_contacto', 'quality.summary.noContact', 'quality.summary.noContactHelp'],
  ['sin_provincia', 'quality.summary.noProvince', 'quality.summary.noProvinceHelp'],
  ['sin_comercial', 'quality.summary.noSalesperson', 'quality.summary.noSalespersonHelp'],
  ['duplicados', 'quality.summary.duplicates', 'quality.summary.duplicatesHelp'],
];

function summaryHtml(quality: DataQuality): string {
  const percent = percentOf(quality.completas, quality.total);
  return `<div class="card" id="calidad" style="padding-bottom:6px">
    <div class="manh" style="padding:14px 16px 0"><h2 class="u-p-0">${t('quality.summary.complete', { percent })}</h2><span class="sm">${t('quality.summary.completeOf', { ...words(), done: formatNumber(quality.completas), total: formatNumber(quality.total) })}</span></div>
    <div class="barra" style="margin:8px 16px 10px"><i style="width:${percent}%"></i></div>
    <div class="kpis" style="padding:0 16px 10px">
      ${INDICATORS.map(([key, title, help]) => indicator(quality[key], t(title, words()), t(help, words()))).join('')}
    </div>
    <p class="sm" style="padding:0 16px 10px">${t('quality.summary.completeHint', words())}</p></div>`;
}

/** Adds the «Fichas completas» card under the page header. */
export async function paintSummary(): Promise<void> {
  const { data: quality } = await callRpc<DataQuality>('calidad_datos', {});
  if (!quality || document.getElementById('calidad')) return;
  document.querySelector('#v-seguimiento .saludo')?.insertAdjacentHTML('afterend', summaryHtml(quality));
}

interface DoubtfulPlace { id: string; cuenta_id: string; nombre: string; centro_nombre?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null; provincia?: string | null; km?: number | null }

function placeRow(place: DoubtfulPlace): string {
  const address = [place.centro_nombre, place.direccion, [place.cp, place.municipio].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
  const distance = place.km !== null && place.km !== undefined ? t('quality.addresses.farFrom', { km: formatNumber(place.km), municipality: escapeHtml(orFallback(place.municipio, '')) }) : t('quality.addresses.outOfSpain');
  return `<div class="item cdir u-cursor-default" data-cdir="${place.id}">
      <span class="tx"><b>${escapeHtml(place.nombre)}</b>
        <span class="sm">${escapeHtml(address || t('quality.addresses.noAddress'))}</span>
        <span class="sm cdirkm">${distance}</span></span>
      <span class="acts u-m-0">
        <button type="button" class="btn sec" data-cdirf="${place.cuenta_id}">${t('quality.addresses.card')}</button>
        ${place.direccion || place.municipio ? `<button type="button" class="btn" data-cdirg="${place.id}">${t('quality.addresses.relocate')}</button>` : ''}</span></div>`;
}

const addressesHtml = (places: readonly DoubtfulPlace[]): string => `<div class="card" id="caldirs">
    <div class="fh"><div><h2>${t('quality.addresses.title', { count: formatNumber(places.length) })}</h2>
      <div class="sm">${t('quality.addresses.hint', { thesePlaces: term('consulta', { number: 'p', article: 'este' }) })}</div></div></div>
    <div class="lista">${places.map(placeRow).join('')}</div></div>`;

/** Removes a relocated row (and the card when none is left). */
function removeRow(box: HTMLElement, id: string): void {
  box.querySelector(`[data-cdir="${id}"]`)?.remove();
  const title = box.querySelector('h2'), left = box.querySelectorAll('.cdir').length;
  if (!left) box.remove(); else if (title) title.textContent = t('quality.addresses.title', { count: formatNumber(left) });
}

async function relocate(box: HTMLElement, place: DoubtfulPlace, button: HTMLButtonElement): Promise<void> {
  const text = button.textContent; button.disabled = true; button.textContent = t('quality.addresses.searching');
  const query = [place.direccion, place.cp, place.municipio, place.provincia, 'España'].filter(Boolean).join(', ');
  const found = await qualityLegacy.geocode(query, { direccion: place.direccion, municipio: place.municipio, cp: place.cp });
  button.disabled = false; button.textContent = text;
  if (!found) { notices.toast(t('quality.addresses.notFound'), true); return; }
  if (found.fuera) { notices.toast(t('quality.addresses.elsewhere', { place: found.fuera, municipality: orFallback(place.municipio, '') }), true); return; }
  const { error } = await legacyDb().from('ubicaciones').update({ lat: Number(found.lat), lon: Number(found.lon) }).eq('id', place.id);
  if (error) { notices.toast(t('quality.addresses.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t('quality.addresses.placed', { name: place.nombre, municipality: orFallback(place.municipio, '') }));
  removeRow(box, place.id);
}

/** Adds «Direcciones que no cuadran» under the completeness card, if there are any. */
export async function paintDoubtfulAddresses(): Promise<void> {
  if (!document.getElementById('calidad') || document.getElementById('caldirs')) return;
  const { data, error } = await legacyDb().rpc<DoubtfulPlace[]>('ubicaciones_dudosas', {});
  const card = document.getElementById('calidad');
  if (error || !card || document.getElementById('caldirs')) return;
  const places = data ?? [];
  if (!places.length) return;
  card.insertAdjacentHTML('afterend', addressesHtml(places));
  const box = document.getElementById('caldirs'); if (!box) return;
  box.querySelectorAll<HTMLElement>('[data-cdirf]').forEach(button => { button.onclick = (): void => { agendaActions.openAccount(button.dataset.cdirf ?? ''); }; });
  box.querySelectorAll<HTMLButtonElement>('[data-cdirg]').forEach(button => {
    button.onclick = (): void => { const place = places.find(item => item.id === button.dataset.cdirg); if (place) void relocate(box, place, button); };
  });
}
