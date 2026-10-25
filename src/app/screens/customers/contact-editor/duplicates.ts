/**
 * v2.225.0 · Customers without duplicates: the database does not allow two customers with the same tax id, email or mobile; here it
 * is said while typing. With a match, a notice above the buttons with the existing customer and «Usar este cliente» (coming from an
 * order or a sale) or «Ver su ficha»; if another person carries it and it cannot be seen, only that it exists. Create stays off.
 */
import { legacyDb, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { showCustomer } from '../sheet';
import { field, fieldValue, type EditorState, type SavedCustomer } from './state';

const CHECK_WAIT_MS = 350, MIN_TAX_ID = 8, MIN_PHONE = 9;
const FIELDS = ['konif', 'komail', 'komov', 'kotel'];

interface Match extends SavedCustomer { campo: string; visible?: boolean; nif?: string | null; email?: string | null; municipio?: string | null; cuenta?: string | null; cuenta_codigo?: string | null }
interface Written { nif: string; email: string; movil: string; telefono: string; excluir: string | null }

const digits = (value: string): number => value.replace(/\D/g, '').length;
const hasData = (written: Written): boolean => written.nif.replace(/[^A-Za-z0-9]/g, '').length >= MIN_TAX_ID || /.@.+\../.test(written.email)
  || [written.movil, written.telefono].some(value => digits(value) >= MIN_PHONE);

function read(state: EditorState): Written {
  const raw = (id: string): string => field(id)?.value ?? '';
  return { nif: raw('konif'), email: raw('komail'), movil: raw('komov'), telefono: raw('kotel'), excluir: state.customer.id ?? null };
}

function markFields(match: Match): void {
  const marked = match.campo === 'NIF' ? ['konif'] : match.campo === 'correo' ? ['komail'] : ['komov', 'kotel'].filter(id => digits(fieldValue(id)) >= MIN_PHONE);
  marked.forEach(id => field(id)?.classList.add('campodup'));
}

function noticeHtml(match: Match, use: boolean): string {
  if (!match.visible) {
    return `<div class="kodupt"><b>${t('leftovers.customer.dupHidden', { aPatient: term('paciente', { article: 'un' }), field: escapeHtml(match.campo) })}</b></div>
         <div class="sm">${t('leftovers.customer.dupOtherPerson')}</div>`;
  }
  const details = [match.nif, orFallback(match.movil, match.telefono ?? ''), match.email, match.municipio].filter(Boolean).join(' · ');
  return `<div class="kodupt"><b>${t('leftovers.customer.dupExists', { ThisPatient: term('paciente', { article: 'este', articleCapital: 'C' }) })}</b><span>${t('leftovers.customer.dupSame', { field: escapeHtml(match.campo) })}</span></div>
         <div class="kodupc"><b>${escapeHtml(match.nombre)}</b><span class="sm">${escapeHtml(details)}</span></div>
         <button type="button" class="btn" id="kodupusar">${use ? t('leftovers.customer.useThis', { thisPatient: term('paciente', { article: 'este' }) }) : t('leftovers.customer.seeCard')}</button>`;
}

function paint(state: EditorState, match: Match | null, use: boolean): void {
  const notice = document.getElementById('kodup'); if (!notice) return;
  FIELDS.forEach(id => field(id)?.classList.remove('campodup'));
  [document.getElementById('kook'), document.getElementById('kopedido')].forEach(button => { if (button) (button as HTMLButtonElement).disabled = Boolean(match); });
  if (!match) { notice.classList.add('hide'); notice.innerHTML = ''; return; }
  markFields(match);
  notice.innerHTML = noticeHtml(match, use);
  notice.classList.remove('hide');
  const useButton = document.getElementById('kodupusar');
  if (useButton) useButton.onclick = (): void => {
    (document.getElementById('dlg2') as HTMLDialogElement | null)?.close();
    const chosen: SavedCustomer = { ...match, ...(match.cuenta_id ? { medico: match.cuenta ?? '', medico_codigo: match.cuenta_codigo ?? null } : {}) };
    if (use && state.onSave) state.onSave(chosen); else void showCustomer(match.id);
  };
}

/** Watches the tax id, email and phones of the editor and warns of an existing customer. */
export function watchDuplicates(state: EditorState, screen: string): void {
  if (!field('konif') || !document.getElementById('kook')) return;
  const actions = document.getElementById('kook')?.closest('.acts');
  if (actions && !document.getElementById('kodup')) actions.insertAdjacentHTML('beforebegin', '<div id="kodup" class="kodup hide" role="alert" aria-live="polite"></div>');
  const use = !state.customer.id && Boolean(state.onSave) && screen !== 'pacientes';
  let timer: ReturnType<typeof setTimeout> | undefined, turn = 0;
  const check = (): void => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const written = read(state), mine = ++turn;
      if (!hasData(written)) { paint(state, null, use); return; }
      const { data } = await legacyDb().rpc<Match[]>('clientes_coincidencias', { p: written });
      if (mine !== turn || !document.getElementById('kodup')) return;
      paint(state, Array.isArray(data) && data.length ? data[0] ?? null : null, use);
    }, CHECK_WAIT_MS);
  };
  FIELDS.forEach(id => field(id)?.addEventListener('input', check));
  if (!state.customer.id && hasData(read(state))) check();
}
