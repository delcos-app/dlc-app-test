/**
 * «Pide tu plan A medida» / «Hablar de tu contrato A medida»: what the company needs, its team and how to contact them; delcos
 * answers in a working day. Migrated from the legacy pedirPresupuesto (v2.420.0); pedirPresupuesto stays as an adapter.
 */
import { callRpc, currentScreen, goTo, icon, notices, term } from '../../../legacy/bridge';
import { settingsExtraLegacy } from '../../../legacy/settings3-bridge';
import { planLegacy, profileLegacy } from '../../../legacy/settings4-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';

const MIN_CUSTOM_USERS = 50, PLAN_SCREENS = ['plan', 'organizacion', 'config'];
const CONTACTS = [['correo', 'byEmail', 'howEmail'], ['llamada', 'byCall', 'howCall'], ['video', 'byVideo', 'howVideo']] as const;
const FAILURES = new Map<string, MessageKey>([['demasiadas', 'settingsRest.request.tooMany'], ['vacia', 'settingsRest.request.empty'], ['permiso', 'settingsRest.request.noPermission']]);

const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const text = (id: string): string => field(id)?.value.trim() ?? '';

function needsHtml(): string {
  return `<section><h3>${t('settingsRest.request.lookingFor')} <span class="sm">${t('settingsRest.request.lookingForHint')}</span></h3>
        <div class="presuops">${planLegacy.needs().map(([key, title]) => `<label class="presuop"><input type="checkbox" value="${key}"><span>${escapeHtml(title)}</span></label>`).join('')}</div>
        <div id="presuprogw" class="hide"><label for="presuprog">${t('settingsRest.request.program')}</label><input id="presuprog" placeholder="${t('settingsRest.request.programPlaceholder')}"></div>
        <label for="presumsg">${t('settingsRest.request.words')}</label>
        <textarea id="presumsg" rows="4" placeholder="${t('settingsRest.request.wordsPlaceholder')}"></textarea></section>`;
}

function teamHtml(): string {
  const state = planLegacy.paymentState(), used = Number(state.usuarios ?? 0), professionals = Number(state.medicos ?? 0);
  return `<section><h3>${t('settingsRest.request.team')}</h3>
        <div class="g2"><div><label for="presuusu">${t('settingsRest.request.users')}</label><input id="presuusu" type="number" min="1" class="numw" value="${Math.max(MIN_CUSTOM_USERS, used)}">
            <span class="sm">${t('settingsRest.request.nowYouAre', { count: formatNumber(used) })}</span></div>
          <div><label for="presumed">${t('settingsRest.request.withPortal', { Professionals: term('medico', { number: 'p', capital: 'C' }) })}</label><input id="presumed" type="number" min="0" class="numw" value="${professionals || ''}" placeholder="${t('settingsRest.request.optional')}"></div>
          <div><label for="presucuando">${t('settingsRest.request.when')}</label><select id="presucuando">${planLegacy.whenOptions().map(option => `<option>${escapeHtml(option)}</option>`).join('')}</select></div></div></section>`;
}

function contactHtml(): string {
  const me = profileLegacy.me();
  return `<section><h3>${t('settingsRest.request.contact')}</h3>
        <div class="g2"><div><label for="presunom">${t('settingsRest.request.name')}</label><input id="presunom" value="${escapeHtml(me.nombre)}"></div>
          <div><label for="presumail">${t('settingsRest.request.email')}</label><input id="presumail" type="email" value="${escapeHtml(me.email ?? '')}"></div>
          <div><label for="presutel">${t('settingsRest.request.phone')}</label><input id="presutel" type="tel" placeholder="${t('settingsRest.request.optional')}" value="${escapeHtml(me.telefono ?? '')}"></div>
          <div><label for="presuhora">${t('settingsRest.request.bestTime')}</label><input id="presuhora" placeholder="${t('settingsRest.request.bestTimePlaceholder')}"></div></div>
        <label>${t('settingsRest.request.prefers')}</label><div class="segs" role="group" id="presucont">${CONTACTS
          .map(([key, label]) => `<button type="button" data-pc="${key}" class="${key === 'correo' ? 'on' : ''}" aria-pressed="${String(key === 'correo')}">${t(`settingsRest.request.${label}`)}</button>`).join('')}</div></section>`;
}

const checkedNeeds = (body: HTMLElement): string[] => [...body.querySelectorAll<HTMLInputElement>('.presuop input:checked')].map(box => box.value);

function requestData(body: HTMLElement, contact: string): Record<string, unknown> {
  const needs = checkedNeeds(body);
  return {
    necesita: needs, necesita_txt: needs.map(key => planLegacy.needs().find(item => item[0] === key)?.[1] ?? key), programa: text('presuprog') || null,
    mensaje: text('presumsg'), usuarios: Number(field('presuusu')?.value) || null, portal: Number(field('presumed')?.value) || null, cuando: field('presucuando')?.value ?? '',
    nombre: text('presunom'), correo: text('presumail'), telefono: text('presutel') || null, horario: text('presuhora') || null, contacto: contact, plan_actual: planLegacy.current().plan ?? null,
  };
}

function sentHtml(data: Record<string, unknown>, contact: string): string {
  const how = t(`settingsRest.request.${CONTACTS.find(item => item[0] === contact)?.[2] ?? 'howVideo'}`);
  const email = data.correo ? ` (${escapeHtml(data.correo)})` : '';
  return `<div class="fh"><div><h2>${t('settingsRest.request.sentTitle')}</h2></div><button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <div class="presuok"><div class="presuokic">${icon('check')}</div>
        <p>${t('settingsRest.request.thanks', { name: escapeHtml(settingsExtraLegacy.firstName(String(data.nombre || profileLegacy.me().nombre || ''))), how, email })}</p>
        <p class="sm">${t('settingsRest.request.seeState')}</p></div>
      <div class="acts u-end"><button class="btn" data-cerrar>${t('settingsRest.request.understood')}</button></div>`;
}

/** Something to go on and a way to answer; false (with the notice) if not. */
function complete(body: HTMLElement): boolean {
  if (!checkedNeeds(body).length && !text('presumsg')) { notices.toast(t('settingsRest.request.tellUs'), true); field('presumsg')?.focus(); return false; }
  if (!text('presumail') && !text('presutel')) { notices.toast(t('settingsRest.request.leaveContact'), true); return false; }
  return true;
}

async function send(kind: string, body: HTMLElement, contact: string, button: HTMLButtonElement): Promise<void> {
  if (!complete(body)) return;
  const data = requestData(body, contact);
  button.disabled = true;
  const { data: result, error } = await callRpc<{ ok?: boolean; error?: string }>('pedir_presupuesto', { p: { tipo: kind, datos: data } });
  button.disabled = false;
  if (error || !result?.ok) { notices.toast(t(FAILURES.get(result?.error ?? '') ?? 'settingsRest.request.couldNotSend'), true); return; }
  body.innerHTML = sentHtml(data, contact);
  document.getElementById('dlg')?.addEventListener('close', () => { if (PLAN_SCREENS.includes(currentScreen())) goTo(currentScreen()); }, { once: true });
}

function bind(kind: string, body: HTMLElement): void {
  const state = { contact: 'correo' };
  body.querySelectorAll<HTMLInputElement>('.presuop input').forEach(box => {
    box.onchange = (): void => { box.closest('.presuop')?.classList.toggle('on', box.checked); document.getElementById('presuprogw')?.classList.toggle('hide', !checkedNeeds(body).includes('conexion')); };
  });
  const options = body.querySelectorAll<HTMLElement>('[data-pc]');
  options.forEach(option => {
    option.onclick = (): void => { state.contact = option.dataset.pc ?? 'correo'; options.forEach(other => { other.classList.toggle('on', other === option); other.setAttribute('aria-pressed', String(other === option)); }); };
  });
  const ok = document.getElementById('presuok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void send(kind, body, state.contact, ok); };
}

export function askBudget(requested: string): void {
  const kind = requested === 'contrato' ? 'contrato' : 'presupuesto', body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${t(kind === 'contrato' ? 'settingsRest.request.contractTitle' : 'settingsRest.request.budgetTitle')}</h2>
      <div class="sm">${t('settingsRest.request.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="presu">
      ${needsHtml()}
      ${teamHtml()}
      ${contactHtml()}
    </div>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('settingsRest.request.cancel')}</button><button class="btn" id="presuok">${t('settingsRest.request.send')}</button></div>`;
  bind(kind, body);
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}
