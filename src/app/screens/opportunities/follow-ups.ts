/** Oportunidades → «Volver a llamar»: clients who did not buy and we promised to call back, with «Llamar», «Registrar» and «✓». */
import { callRpc, legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { registerFollowUp } from './editor';

const SHOWN = 20;

interface PendingCall {
  id: string; contacto_id?: string | null; cliente?: string | null; nombre?: string | null; telefono?: string | null; tel_cliente?: string | null;
  cuenta_id?: string | null; medico?: string | null; resultado?: string | null; proxima_fecha: string; proxima_accion?: string | null;
}

function whenHtml(call: PendingCall, today: string): string {
  if (call.proxima_fecha < today) return `<b class="u-danger">${t('opportunities.list.late')}</b>`;
  return call.proxima_fecha === today ? `<b class="u-warn">${t('opportunities.list.today')}</b>` : `${formatShortDate(call.proxima_fecha)} · `;
}

function iconStyle(call: PendingCall, today: string): string {
  if (call.proxima_fecha < today) return 'background:#FDECEC;color:var(--dang)';
  return call.proxima_fecha === today ? 'background:#FFF4E5;color:var(--warn)' : '';
}

function rowHtml(call: PendingCall, today: string): string {
  const phone = orFallback(call.tel_cliente, orFallback(call.telefono, ''));
  const details = `${whenHtml(call, today)}${escapeHtml(orFallback(call.resultado, ''))}${call.proxima_accion ? ` · ${escapeHtml(call.proxima_accion)}` : ''}${call.medico ? t('opportunities.list.fromReference', { name: escapeHtml(call.medico) }) : ''}`;
  return `<div class="item u-cursor-default">
        <span class="ic" style="${iconStyle(call, today)}">📞</span>
        <span class="tx"><b>${escapeHtml(orFallback(call.cliente, orFallback(call.nombre, t('opportunities.list.noName'))))}</b>
          <span class="sm">${details}</span></span>
        <span class="acts" style="margin:0;flex-wrap:nowrap">${phone ? `<a class="btn sec chico" href="tel:${escapeHtml(phone)}">${t('opportunities.list.call')}</a>` : ''}
          <button class="btn chico" data-llseg="${call.id}">${t('opportunities.list.record')}</button><button class="btn sec chico" data-llok="${call.id}" title="${t('opportunities.list.notNeeded')}">✓</button></span></div>`;
}

export async function paintFollowUps(): Promise<void> {
  const { data } = await callRpc<PendingCall[]>('llamadas_seguimiento', {});
  const list = data ?? [], today = todayIso(), box = document.getElementById('llsegz');
  if (!box) return;
  box.innerHTML = !list.length ? '' : `<div class="card" id="llsegs"><h2>${t('opportunities.list.callAgainTitle')}<span class="n">${list.length}</span></h2>
      <p class="sm" style="padding:0 16px">${t('opportunities.list.callAgainHint')}</p>
      <div class="lista">${list.slice(0, SHOWN).map(call => rowHtml(call, today)).join('')}</div></div>`;
  box.querySelectorAll<HTMLElement>('[data-llseg]').forEach(button => {
    button.onclick = (): void => { const call = list.find(item => item.id === button.dataset.llseg); if (call) void registerFollowUp(call); };
  });
  box.querySelectorAll<HTMLElement>('[data-llok]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      await legacyDb().rpc('marcar_seguimiento', { p_id: button.dataset.llok, p_hecho: true });
      notices.toast(t('opportunities.list.followUpClosed')); void paintFollowUps();
    };
  });
}
