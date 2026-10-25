/**
 * «Avisos de vencimiento» (administration): how many days before a contract ends the warnings are sent. Migrated from the legacy
 * editorAvisosVencimiento (v2.409.0). The days stay in the legacy CON_AVISOS: Parque uses them too.
 */
import { legacyDb, notices, tendersLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const MAX_DAYS = 999;
const newestFirst = (days: readonly number[]): number[] => [...days].sort((first, second) => second - first);

function warningsHtml(): string {
  return `<div class="fh"><div><h2>${t('tenders.warnings.title')}</h2><div class="sm">${t('tenders.warnings.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="convd">${t('tenders.warnings.days')}</label><input id="convd" value="${escapeHtml(newestFirst(tendersLegacy.warningDays()).join(', '))}" placeholder="90, 30">
    <p class="sm">${t('tenders.warnings.hint')}</p>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('tenders.warnings.cancel')}</button><button class="btn" id="convok">${t('tenders.warnings.save')}</button></div>`;
}

async function save(box: HTMLDialogElement): Promise<void> {
  const typed = (document.getElementById('convd') as HTMLInputElement | null)?.value ?? '';
  const days = newestFirst([...new Set(typed.split(/[^0-9]+/).map(Number).filter(day => day > 0 && day <= MAX_DAYS))]);
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'avisos_vencimiento', p_valor: { dias: days } });
  if (error || result?.ok === false) { notices.toast(t('tenders.warnings.couldNotSave'), true); return; }
  tendersLegacy.setWarningDays(days); box.close(); notices.toast(t('tenders.warnings.saved'));
}

export function editWarnings(): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = warningsHtml();
  if (!box.open) box.showModal();
  const ok = document.getElementById('convok'); if (ok) ok.onclick = (): void => { void save(box); };
}
