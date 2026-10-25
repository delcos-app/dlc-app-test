/**
 * The sheet of a centre: address, phone, how to get there, its commercial card and its professionals (add, open, «+ Cita»,
 * remove). Migrated from the legacy fichaCentro (v2.417.0); fichaCentro stays as an adapter («‹ Volver», Agenda and the tests).
 */
import { agendaActions, appointmentLegacy, editorLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { editCentre } from './editor';
import { hoursText, type Centre, type CentreProfessional, type CentreSheet } from './model';

const header = (title: string, subtitle = ''): string =>
  `<div class="fh"><div><h2>${title}</h2>${subtitle}</div><button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;

function professionalRow(item: CentreProfessional, canChange: boolean): string {
  const where = [item.planta ? t('accountsMore.centre.floor', { value: item.planta }) : '', item.sala ? t('accountsMore.centre.room', { value: item.sala }) : ''].filter(Boolean).join(' · ');
  const days = hoursText(item.dias);
  return `<div class="item fcpro">
        <span class="tx"><b>${item.urgente ? '❗ ' : ''}${escapeHtml(item.nombre)}</b>
          <span class="sm">${escapeHtml([item.especialidad, where].filter(Boolean).join(' · ') || '—')}</span>
          ${days ? `<span class="sm">${escapeHtml(t('accountsMore.centre.attends', { days }))}</span>` : ''}</span>
        <span class="acts u-m-0">
          <button type="button" class="btn sec" data-fcf="${item.id}">${t('accountsMore.centre.card')}</button>
          <button type="button" class="btn sec" data-fcc="${item.id}">${t('accountsMore.centre.appointment')}</button>
          ${canChange ? `<button type="button" class="btn sec fcquitar" data-fcq="${item.id}" aria-label="${t('accountsMore.centre.removeLabel', { name: escapeHtml(item.nombre) })}">${t('accountsMore.centre.remove')}</button>` : ''}
        </span></div>`;
}

function sheetHtml(sheet: CentreSheet, centre: Centre, accountId: string | null): string {
  const list = sheet.profesionales ?? [], canChange = Boolean(sheet.puede_fichas), who = term('medico', { number: 'p', capital: 'C' });
  const address = [centre.direccion, [centre.cp, centre.municipio].filter(Boolean).join(' '), centre.provincia].filter(Boolean).join(', ');
  const hours = hoursText(centre.horario);
  const empty = `<div class="vacio">${t('accountsMore.centre.nobody', { professionals: escapeHtml(who.toLowerCase()) })}${canChange ? t('accountsMore.centre.addThem') : ''}</div>`;
  return `
    ${header(escapeHtml(centre.nombre), `<div class="sm">${escapeHtml(address || t('accountsMore.centre.noAddress'))}</div>`)}
    <div class="fcacts">
      ${centre.telefono ? `<a class="btn sec" href="tel:${escapeHtml(centre.telefono)}">${t('accountsMore.centre.call', { phone: escapeHtml(centre.telefono) })}</a>` : ''}
      ${centre.lat !== null && centre.lat !== undefined ? `<button type="button" class="btn sec" id="fcllegar">${t('accountsMore.centre.directions')}</button>` : ''}
      ${sheet.puede_editar ? `<button type="button" class="btn sec" id="fceditar">${t('accountsMore.centre.edit')}</button>` : ''}
      ${accountId ? `<button type="button" class="btn sec" id="fccuenta" data-fccta="${accountId}">${t('accountsMore.centre.commercialCard')}</button>` : ''}
    </div>
    ${hours ? `<div class="vcdatos"><div class="vcfila"><span>${t('accountsMore.centre.timetable')}</span><b>${escapeHtml(hours)}</b></div></div>` : ''}
    <div class="fcprocab"><h3>${escapeHtml(who)} · ${formatNumber(list.length)}</h3>${canChange ? `<button type="button" class="btn" id="fcanadir">${t('accountsMore.centre.add')}</button>` : ''}</div>
    <div id="fcsel"></div>
    ${list.length ? `<div class="lista fclista">${list.map(item => professionalRow(item, canChange)).join('')}</div>` : empty}`;
}

async function addProfessional(centre: Centre, account: PickedAccount | null): Promise<void> {
  if (!account) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; ya?: boolean; error?: string }>('centro_anadir_profesional', { p_centro: centre.id, p_cuenta: account.id });
  if (error || !result?.ok) {
    notices.toast(result?.error === 'permiso' ? t('accountsMore.centre.noPermission', { name: account.nombre ?? '' }) : t('accountsMore.centre.couldNotAdd'), true);
    void showCentre(centre.id); return;
  }
  notices.toast(result.ya ? t('accountsMore.centre.alreadyThere', { name: account.nombre ?? '' }) : t('accountsMore.centre.added', { name: account.nombre ?? '', centre: centre.nombre }));
  void showCentre(centre.id);
}

async function removeProfessional(centre: Centre, item: CentreProfessional): Promise<void> {
  const only = Number(item.consultas) <= 1;
  const text = t('accountsMore.centre.removeText', { name: item.nombre, centre: centre.nombre, thisConsultation: term('consulta', { article: 'este' }) })
    + (only ? t('accountsMore.centre.removeOnly', { consultation: term('consulta') }) : '');
  if (!await notices.confirm(text, { titulo: t('accountsMore.centre.removeTitle'), ok: t('accountsMore.centre.remove'), peligro: true })) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('centro_quitar_profesional', { p_centro: centre.id, p_cuenta: item.id });
  if (error || !result?.ok) { notices.toast(result?.error === 'permiso' ? t('accountsMore.centre.noPermission', { name: item.nombre }) : t('accountsMore.centre.couldNotRemove'), true); return; }
  notices.toast(t('accountsMore.centre.removed', { name: item.nombre, centre: centre.nombre }));
  void showCentre(centre.id);
}

function bind(body: HTMLElement, box: HTMLDialogElement, sheet: CentreSheet, centre: Centre): void {
  const on = (id: string, action: (button: HTMLButtonElement) => void): void => { const button = document.getElementById(id) as HTMLButtonElement | null; if (button) button.onclick = (): void => { action(button); }; };
  on('fcllegar', () => { appointmentLegacy.navigateTo([Number(centre.lat), Number(centre.lon)]); });
  on('fceditar', () => { editCentre(centre, showCentre); });
  on('fcanadir', button => {
    button.disabled = true;
    const place = document.getElementById('fcsel');
    editorLegacy.pickAccount(place, null, account => addProfessional(centre, account as PickedAccount | null));
    place?.querySelector('input')?.focus();
  });
  body.querySelectorAll<HTMLElement>('[data-fcf]').forEach(button => { button.onclick = (): void => { box.close(); appointmentLegacy.openAccountFromCentre(button.dataset.fcf ?? '', centre.nombre); }; });
  body.querySelectorAll<HTMLElement>('[data-fcc]').forEach(button => { button.onclick = (): void => { miscLegacy.setCardCentre(centre.nombre); agendaActions.newAppointment(button.dataset.fcc ?? '', null); }; });
  body.querySelectorAll<HTMLElement>('[data-fcq]').forEach(button => {
    button.onclick = (): void => { const item = (sheet.profesionales ?? []).find(other => other.id === button.dataset.fcq); if (item) void removeProfessional(centre, item); };
  });
}

/** Opens the sheet of a centre (by its id in `centros`). */
export async function showCentre(id: string): Promise<void> {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  box.classList.remove('pequena');
  body.innerHTML = `${header(t('accountsMore.centre.title'))}
    <div class="skel" style="width:60%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>`;
  if (!box.open) box.showModal();
  // With the sheet comes its account of kind Centro (one centre), to open its commercial card from here
  const [{ data: sheet, error }, { data: account }] = await Promise.all([legacyDb().rpc<CentreSheet>('ficha_centro', { p_id: id }),
    legacyDb().from<{ id: string } | null>('cuentas').select('id').eq('centro_id', id).maybeSingle().then(result => result, () => ({ data: null }))]);
  if (!box.open) return;
  if (error || !sheet?.datos) {
    body.innerHTML = `${header(t('accountsMore.centre.title'))}
      <div class="banda-peligro">${t('accountsMore.centre.couldNotOpen', { error: error ? `: ${escapeHtml(orFallback((error as { message?: string }).message, ''))}` : '' })}</div>`;
    return;
  }
  body.innerHTML = sheetHtml(sheet, sheet.datos, account?.id ?? null);
  bind(body, box, sheet, sheet.datos);
}
