/**
 * «Material y dudas» of the portal: ask for the material the company offers (up to its maximum each time; a pending request can be
 * cancelled) and write questions to the sales rep. Migrated from the legacy portalMedicoBase and portalMedico (v2.413.0); the
 * continuity card it painted and then removed now lives only in «Resumen».
 */
import { callRpc, legacyDb, notices, permissions, portalLegacy } from '../../legacy/bridge';
import { portalPageLegacy } from '../../legacy/portal-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { failureText, helpButton, messageThread, shortDateTime, type PortalMessage } from './model';

interface Allowed { valor: string; max: number }
interface MaterialRequest { id: string; material: string; cantidad: number; nota?: string | null; estado: string; creado_en: string }

const PENDING = 'Pendiente', CANCELLED = 'Anulado';

function requestRow(request: MaterialRequest): string {
  return `<div class="item u-cursor-default"><span class="tx"><b>${formatNumber(request.cantidad)} × ${escapeHtml(request.material)}</b>
          <span class="sm">${shortDateTime(request.creado_en)}${request.nota ? ` · ${escapeHtml(request.nota)}` : ''}</span></span>${portalLegacy.materialPill(request.estado)}
          ${request.estado === PENDING ? `<button type="button" class="btn sec chico" data-mdanu="${request.id}">${t('portal.material.cancel')}</button>` : ''}</div>`;
}

function askHtml(allowed: readonly Allowed[]): string {
  const first = allowed[0];
  if (!first) return `<p class="sm" style="padding:0 16px">${t('portal.material.nothingOffered')}</p>`;
  return `<div class="g2"><div><label for="mdmatm">${t('portal.material.material')}</label><select id="mdmatm">${allowed.map(item => `<option value="${escapeHtml(item.valor)}" data-max="${item.max}">${escapeHtml(item.valor)}</option>`).join('')}</select></div>
        <div><label for="mdmatn">${t('portal.material.quantity')}</label><input id="mdmatn" type="number" min="1" value="1"><span class="sm" id="mdmatmax">${t('portal.material.max', { max: formatNumber(first.max) })}</span></div></div>
        <label for="mdmatt">${t('portal.material.note')}</label><input id="mdmatt" placeholder="${t('portal.material.optional')}">
        <div class="acts u-start"><button type="button" class="btn" id="mdmatok">${t('portal.material.ask')}</button></div>`;
}

function cardsHtml(allowed: readonly Allowed[], requests: readonly MaterialRequest[], messages: readonly PortalMessage[]): string {
  const askTitle = t('portal.material.title'), questionsTitle = t('portal.material.questionsTitle');
  return `
    <div class="card ancard" id="mdmat"><h2>${askTitle} ${helpButton(askTitle, t('portal.material.help'))}</h2>
      ${askHtml(allowed)}
      ${requests.length ? `<div class="lista" id="mdmatl">${requests.map(requestRow).join('')}</div>` : ''}</div>
    <div class="card ancard" id="mdmsg"><h2>${questionsTitle} ${helpButton(questionsTitle, t('portal.material.questionsHelp'))}</h2>
      <div id="mdhilo">${messageThread(messages, true)}</div>
      <textarea id="mdmsgt" rows="2" placeholder="${t('portal.material.questionPlaceholder')}" aria-label="${t('portal.material.questionLabel')}"></textarea>
      <div class="acts u-start"><button type="button" class="btn" id="mdmsgok">${t('portal.material.send')}</button></div></div>`;
}

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const chosenMax = (): number => Number((document.getElementById('mdmatm') as HTMLSelectElement | null)?.selectedOptions[0]?.dataset.max);

/** No maximum on the field (it silently lowered what was typed): past the maximum, the hint turns red. */
function showMaximum(): void {
  const hint = document.getElementById('mdmatmax'); if (!hint || !document.getElementById('mdmatm')) return;
  const max = chosenMax(), count = Number(value('mdmatn')) || 0;
  hint.classList.toggle('mdmatpasa', count > max); hint.textContent = t(count > max ? 'portal.material.atMost' : 'portal.material.max', { max: formatNumber(max) });
}

async function ask(button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const max = chosenMax(), count = Number(value('mdmatn')) || 0;
  if (count < 1 || count > max) { button.disabled = false; showMaximum(); notices.toast(count < 1 ? t('portal.material.howMany') : t('portal.material.tooMany', { max: formatNumber(max) }), true); return; }
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; motivo?: string; max?: number }>('pedir_material', { p_material: value('mdmatm'), p_cantidad: count, p_nota: value('mdmatt').trim() || null });
  button.disabled = false;
  if (!result?.ok) { notices.toast(result?.motivo === 'cantidad' ? t('portal.material.atMostShort', { max: formatNumber(result.max) }) : failureText(result), true); return; }
  notices.toast(t('portal.material.asked')); void paintMaterial();
}

async function cancel(id: string): Promise<void> {
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; motivo?: string }>('cerrar_material', { p_id: id, p_estado: CANCELLED });
  if (!result?.ok) { notices.toast(failureText(result), true); return; }
  notices.toast(t('portal.material.cancelled')); void paintMaterial();
}

async function sendMessage(button: HTMLButtonElement): Promise<void> {
  const text = value('mdmsgt').trim(); if (!text) { notices.toast(t('portal.failures.empty'), true); return; }
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; motivo?: string }>('enviar_mensaje_cuenta', { p_cuenta: null, p_texto: text });
  button.disabled = false;
  if (!result?.ok) { notices.toast(failureText(result), true); return; }
  notices.toast(t('portal.material.messageSent')); void paintMaterial();
}

function bind(box: HTMLElement): void {
  const select = document.getElementById('mdmatm'); if (select) select.onchange = showMaximum;
  document.getElementById('mdmatn')?.addEventListener('input', showMaximum);
  const ok = document.getElementById('mdmatok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void ask(ok); };
  box.querySelectorAll<HTMLElement>('[data-mdanu]').forEach(button => { button.onclick = (): void => { void cancel(button.dataset.mdanu ?? ''); }; });
  const send = document.getElementById('mdmsgok') as HTMLButtonElement | null; if (send) send.onclick = (): void => { void sendMessage(send); };
}

/** Paints «Material y dudas» (only with the «Portal» extra of the company). */
export async function paintMaterial(): Promise<void> {
  await portalPageLegacy.loadPlan();
  if (!permissions.isProfessionalPortal() || !portalLegacy.hasPortal() || !document.getElementById('v-informe')) return;
  if (!document.getElementById('mdportal')) document.getElementById('v-informe')?.insertAdjacentHTML('beforeend', '<div id="mdportal" class="angrid"></div>');
  const [{ data: allowed }, { data: requests }, { data: messages }] = await Promise.all([
    callRpc<Allowed[]>('portal_material_permitido', {}),
    legacyDb().from<MaterialRequest[]>('solicitudes_material').select('id,material,cantidad,nota,estado,creado_en,cerrado_en').order('creado_en', { ascending: false }).limit(20),
    legacyDb().from<PortalMessage[]>('mensajes_cuenta').select('id,texto,del_portal,creado_en,leido_en').order('creado_en', { ascending: true }).limit(200),
  ]);
  // The page may have been painted again meanwhile: the box is looked up after the answer
  const box = document.getElementById('mdportal'); if (!box) return;
  const list = messages ?? [];
  box.innerHTML = cardsHtml(Array.isArray(allowed) ? allowed : [], requests ?? [], list);
  bind(box);
  if (list.some(message => !message.del_portal && !message.leido_en)) void callRpc('leer_mensajes_cuenta', { p_cuenta: null });
}
