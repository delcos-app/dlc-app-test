/**
 * The commission in the user editor, painted at once: the scheme (shown as information: it is assigned inside each scheme), what the
 * person sees of it in Inicio, and from when a change applies with the scheme history (kept hidden, as before). Migrated from the
 * legacy panelComisionUsuario, the commission part of usuarioComisionYZona and usuarioComisionInfo (v2.420.0): before, three layers
 * waited for each other's fields.
 */
import { callRpc, legacyDb } from '../../../legacy/bridge';
import { usersLegacy, type Scheme, type UserRow } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const SEES = [['nada', 'nothing'], ['unidades', 'unitsOnly'], ['importe', 'unitsAndAmount']] as const;

interface SchemePeriod { esquema: string; desde: string; hasta?: string | null }

async function schemes(): Promise<Scheme[]> {
  if (!usersLegacy.schemes().length) { const { data } = await legacyDb().rpc<Scheme[]>('esquemas_lista'); usersLegacy.setSchemes(data ?? []); }
  return usersLegacy.schemes();
}

function historyText(list: readonly SchemePeriod[]): string {
  if (!list.length) return '';
  return t('settingsRest.commission.history', { list: list.map(item => escapeHtml(t('settingsRest.commission.since', { scheme: item.esquema, from: formatShortDate(item.desde) }))
    + (item.hasta ? escapeHtml(t('settingsRest.commission.until', { to: formatShortDate(item.hasta) })) : '')).join(' · ') });
}

function commissionHtml(list: readonly Scheme[], current: Scheme | undefined, sees: string, history: string): string {
  const options = list.map(scheme => `<option value="${scheme.id}" ${current?.id === scheme.id ? 'selected' : ''}>${escapeHtml(scheme.nombre)}</option>`).join('');
  const seesOptions = SEES.map(([value, key]) => `<option value="${value}" ${sees === value ? 'selected' : ''}>${t(`settingsRest.commission.${key}`)}</option>`).join('');
  return `<label>${t('settingsRest.commission.title')}</label>
    <div class="g2 hide">
      <div><label class="sm" for="ucom">${t('settingsRest.commission.scheme')}</label><select id="ucom" data-orig="${current?.id ?? ''}">
        <option value="">${t('settingsRest.commission.none')}</option>
        ${options}
      </select></div>
    </div><div class="avisoh" id="ucominfo"><span>${t('settingsRest.commission.info', { scheme: escapeHtml(current?.nombre ?? t('settingsRest.commission.none')) })}</span></div><div id="uvercw"><label for="uverc">${t('settingsRest.commission.whatSees')}</label><select id="uverc">
        ${seesOptions}
      </select><div class="sm">${t('settingsRest.commission.seesHint')}</div></div><div class="g2 hide" id="ucdesde">
      <div><label class="sm" for="ucdm">${t('settingsRest.commission.applies')}</label><select id="ucdm">
        <option value="hoy">${t('settingsRest.commission.fromToday')}</option><option value="todo">${t('settingsRest.commission.wholeHistory')}</option><option value="fecha">${t('settingsRest.commission.fromDate')}</option></select></div>
      <div><label class="sm" for="ucdf">${t('settingsRest.commission.date')}</label><input id="ucdf" type="date" value="${todayIso()}" disabled></div></div>
      <div class="sm hide" id="uchist">${history}</div>`;
}

/** Paints the commission into #ucomzona (v2.276.0: what the person sees, read from their profile). */
export async function paintCommission(user: UserRow): Promise<void> {
  const [list, { data: profile }, { data: history }] = await Promise.all([
    schemes(),
    legacyDb().from<{ comision_ver?: string | null }>('perfiles').select('comision_ver').eq('id', user.id).maybeSingle(),
    callRpc<SchemePeriod[]>('historial_esquemas', { p_usuario: user.id })]);
  const sees = orFallback(orFallback(profile?.comision_ver, user.comision_ver ?? ''), 'nada'); user.comision_ver = sees;
  const zone = document.getElementById('ucomzona'); if (!zone) return;
  zone.innerHTML = commissionHtml(list, list.find(scheme => (scheme.personas ?? []).includes(user.nombre)), sees, historyText(history ?? []));
  const mode = document.getElementById('ucdm') as HTMLSelectElement | null, date = document.getElementById('ucdf') as HTMLInputElement | null;
  if (mode && date) mode.onchange = (): void => { date.disabled = mode.value !== 'fecha'; };
}
