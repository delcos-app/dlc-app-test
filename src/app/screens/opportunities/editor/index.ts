/**
 * The opportunity window («Nueva venta», «Oportunidad», «Volver a llamar», «Venta cerrada»). Migrated from the legacy
 * editorOportunidad (v2.410.0); editorOportunidad stays as an adapter (Pedidos, «+ Nueva venta» and the tests use it).
 */
import { legacyDb, opportunitiesLegacy, permissions, term } from '../../../legacy/bridge';
import { orFallback } from '../../../services/values';
import { catalog, dateIn, FOLLOW_UP_REASON, loadOpportunityCatalogs, ORDER_DONE, OUTGOING_CALL, toggleChip } from '../model';
import { paintClient } from './client';
import type { Client, Draft, Opportunity, Previous, Reference } from './draft';
import { editorHtml } from './html';
import { paintInterest, paintReference } from './interest';
import { bindOutcome } from './outcome';

export type { Opportunity, Previous } from './draft';

function clientOf(source: Opportunity): Client | null {
  if (source.contacto) return source.contacto;
  if (!source.contacto_id) return null;
  return { id: source.contacto_id, nombre: orFallback(source.cliente, orFallback(source.nombre, '')), movil: orFallback(source.tel_cliente, orFallback(source.telefono, '')) };
}

function referenceOf(source: Opportunity, client: Client | null): Reference | null {
  if (source.medico && typeof source.medico === 'object') return source.medico;
  if (source.cuenta_id) return { id: source.cuenta_id, nombre: typeof source.medico === 'string' ? source.medico : '' };
  if (client?.cuenta_id) return { id: client.cuenta_id, nombre: orFallback(client.medico, term('medico', { capital: 'C' })) };
  return null;
}

function draftOf(start: Opportunity | null, previous: Previous | null): Draft {
  const now = new Date().toISOString(), source: Opportunity = { fecha: now, ...start };
  if (!source.fecha) source.fecha = now;
  const recording = permissions.hasOpportunities(), client = clientOf(source);
  const lines = (source.interes ?? []).map(line => ({ producto_id: line.producto_id, unidades: line.unidades }));
  const defaultOrigin = previous ? OUTGOING_CALL : catalog('origen_oportunidad')[0]?.valor ?? '';
  return {
    source, previous, recording, closed: Boolean(source.pedido_id), client, reference: referenceOf(source, client),
    lines: lines.length ? lines : [{ producto_id: opportunitiesLegacy.defaultProduct(), unidades: 1 }],
    origin: orFallback(source.origen, defaultOrigin), reason: orFallback(source.motivo, ''), result: orFallback(source.resultado, ''),
    noSale: Boolean(source.id && source.resultado && source.resultado !== ORDER_DONE),
  };
}

function onChip(group: string, handler: (pressed: HTMLElement) => void): void {
  const box = document.getElementById(group);
  if (box) box.onclick = (event): void => { const target = event.target as Element; handler(target as HTMLElement); };
}

function bindChoices(draft: Draft): void {
  onChip('nvori', target => {
    const chip = target.closest<HTMLElement>('[data-nvo]'), box = document.getElementById('nvori');
    if (chip && box) draft.origin = toggleChip(box, 'data-nvo', draft.origin, chip.dataset.nvo ?? '');
  });
  onChip('nvmot', target => {
    const chip = target.closest<HTMLElement>('[data-nvm]'), box = document.getElementById('nvmot');
    if (chip && box) draft.reason = toggleChip(box, 'data-nvm', draft.reason, chip.dataset.nvm ?? '');
  });
  onChip('nvnoz', target => {
    const days = target.closest<HTMLElement>('[data-nvd]'), box = document.getElementById('nvnoz');
    if (days && box) {
      const date = document.getElementById('nvpf') as HTMLInputElement | null; if (date) date.value = dateIn(Number(days.dataset.nvd));
      box.querySelectorAll('[data-nvd]').forEach(other => { other.classList.toggle('on', other === days); });
      return;
    }
    const chip = target.closest<HTMLElement>('[data-nvr]'), results = document.getElementById('nvres');
    if (chip && results) draft.result = toggleChip(results, 'data-nvr', draft.result, chip.dataset.nvr ?? '');
  });
  const noSale = document.getElementById('nvno2');
  if (noSale) noSale.onclick = (): void => {
    draft.noSale = !draft.noSale; noSale.classList.toggle('on', draft.noSale);
    document.getElementById('nvnoz')?.classList.toggle('hide', !draft.noSale);
  };
}

/** Opens the window for `start` (an opportunity or starting data) following up `previous` if given. */
export async function editOpportunity(start: Opportunity | null, previous: Previous | null = null): Promise<void> {
  await opportunitiesLegacy.loadProducts();
  if (permissions.hasOpportunities()) await loadOpportunityCatalogs();
  const draft = draftOf(start, previous);
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(draft);
  box.showModal();
  paintClient(draft);
  if (draft.recording) { paintInterest(draft); paintReference(draft); }
  bindChoices(draft);
  bindOutcome(draft);
}

/** «Registrar» on a pending call back: the window with what they wanted then. */
export async function registerFollowUp(call: Opportunity & Previous): Promise<void> {
  const { data: previous } = await legacyDb().from<{ interes?: Opportunity['interes'] } | null>('llamadas').select('interes').eq('id', call.id).maybeSingle();
  await editOpportunity({
    contacto_id: call.contacto_id ?? null, cliente: call.cliente ?? null, nombre: call.nombre ?? null, telefono: call.telefono ?? null, tel_cliente: call.tel_cliente ?? null,
    cuenta_id: call.cuenta_id ?? null, medico: call.medico ?? null, motivo: FOLLOW_UP_REASON, origen: OUTGOING_CALL, interes: previous?.interes ?? [],
  }, call);
}
