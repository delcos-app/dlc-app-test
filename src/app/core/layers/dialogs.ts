/**
 * How the windows behave, added by legacy layers: a sheet (order, invoice, event…) looks like a sheet (v2.241.0), «‹ Volver» goes
 * back to the window it was opened from (v2.300.0), a window closed while loading does not open later on its own (v2.350.0, v2.354.0),
 * and the centre and its account open each other (v2.310.0). Moved from legado 089, 126, 134 and 159 (v2.424.0). The back history
 * (VISTA, VUELTA_REABRIENDO…) stays in legacy state: legado 159 and other code read it.
 */
import { backLegacy, dialogLegacy } from '../../legacy/legado-d-bridge';
import { closestOf } from './events';

const SHEETS = ['verPedido', 'verFactura', 'verEvento', 'verCirugia', 'verConcurso', 'verEquipo', 'fichaCentro', 'fichaStock', 'verDeposito'];

/** Wraps showModal of a dialog: `before` runs first and may stop it (returning false); `after` runs once it is shown. */
function aroundShowModal(dialog: HTMLDialogElement, before: () => boolean, after?: () => void): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- the original is called with the dialog as `this`
  const show = dialog.showModal;
  dialog.showModal = function (this: HTMLDialogElement): void {
    if (!before()) return;
    show.call(this);
    after?.();
  };
}

/** v2.241.0: while a sheet opens, its window takes the sheet look. */
export function installSheetLook(): void {
  const dialog = dialogLegacy.dialog('dlg');
  if (dialog) {
    aroundShowModal(dialog, () => { dialog.classList.toggle('dlgficha', dialogLegacy.openingSheet()); return true; });
    dialog.addEventListener('close', () => { dialog.classList.remove('dlgficha'); });
  }
  for (const name of SHEETS) {
    dialogLegacy.wrapGlobal(name, original => async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      dialogLegacy.sheetOpening(1);
      try { return await original.apply(this, args); } finally { dialogLegacy.sheetOpening(-1); }
    });
  }
}

/** v2.310.0: «Ficha comercial» in a centre opens its account; «Ver sus profesionales» in the account opens the centre. */
export function installCentreLinks(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('#fccuenta'); if (!button) return;
    dialogLegacy.dialog('dlg')?.close(); dialogLegacy.openAccount(button.dataset.fccta ?? '');
  });
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-fcver]'); if (!button) return;
    const card = dialogLegacy.dialog('ficha'); if (card?.open) card.close();
    dialogLegacy.openCentre(button.dataset.fcver ?? '');
  });
}

const BACK_MAX = 8, BACK_CLICK_MS = 1500, BACK_REOPEN_MS = 380;

/** The windows opened by name (VISTA_TITULO) remember the window they came from. */
function wrapOpeners(): void {
  for (const name of backLegacy.titledViews()) {
    backLegacy.wrapGlobal(name, original => async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      const view = { fn: name, args, t: performance.now() }, previous = backLegacy.view(), click = backLegacy.lastClick();
      // The previous one counts if it is still open or has just closed to open this one (buttons close and open in a row)
      const fromPrevious = Boolean(previous?.dlg && (previous.dlg.open || (click?.d === previous.dlg && performance.now() - click.t < BACK_CLICK_MS)));
      if (previous && !backLegacy.reopening() && fromPrevious && !backLegacy.sameView(previous, view)) backLegacy.push(previous, BACK_MAX);
      backLegacy.setView(view); backLegacy.setPutButton(backLegacy.stackSize() > 0);
      try {
        const result = await original.apply(this, args);
        if (backLegacy.view() === view) { const dialog = backLegacy.openDialog(); backLegacy.setViewDialog(view, dialog); backLegacy.button(view); }
        return result;
      } finally { if (backLegacy.view() === view) backLegacy.setPutButton(false); }
    });
  }
}

/** Closing a window that was opened from another one reopens that one. */
function reopenOnClose(dialog: HTMLDialogElement): void {
  dialog.addEventListener('close', () => {
    const view = backLegacy.view(); if (view?.dlg !== dialog) return;
    view.cerrada = performance.now();
    setTimeout(() => {
      if (backLegacy.view() !== view || !view.cerrada || dialog.open || !backLegacy.stackSize()) return;
      if (document.querySelector('dialog[open]')) return;   // something else opened over it: left alone
      const before = backLegacy.pop(); backLegacy.setView(null); backLegacy.setReopening(true);
      if (before) void Promise.resolve(backLegacy.callGlobal(before.fn, before.args)).finally(() => { backLegacy.setReopening(false); const now = backLegacy.view(); if (now) backLegacy.button(now); });
    }, BACK_REOPEN_MS);
  });
}

/** v2.300.0 «‹ Volver»: always back to where you started. */
export function installBack(): void {
  // The last click inside a window (but its ✕): so a new window is known to come from it even if the button closes it first
  document.addEventListener('click', event => {
    const dialog = closestOf(event.target, 'dialog');
    if (!dialog || closestOf(event.target, '[data-cerrar], .x, .vueltabtn')) return;
    backLegacy.setLastClick({ d: dialog, t: performance.now() });
  }, true);
  wrapOpeners();
  for (const id of ['dlg', 'ficha']) {
    const dialog = dialogLegacy.dialog(id); if (!dialog) continue;
    // «‹ Volver» is put before the window shows (if it came later, the title would jump)
    aroundShowModal(dialog, () => true, () => { const view = backLegacy.view(); if (backLegacy.putButton() && view) { backLegacy.setViewDialog(view, dialog); backLegacy.button(view, dialog); } });
    reopenOnClose(dialog);
  }
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest('.vueltabtn'); if (!button) return;
    const dialog = button.closest('dialog'); if (dialog?.open) dialog.close();
  });
}

const CLOSE_MS = 600, BLOCK_MS = 8000;

/** v2.350.0/v2.354.0: a window the user closed while it was loading does not open again by itself when its data arrives. */
export function installClosedWhileLoading(): void {
  const closedByUser: Record<string, number> = {}, closing: Record<string, number> = {};
  ['pointerdown', 'keydown'].forEach(name => { document.addEventListener(name, () => { dialogLegacy.setLastAction(performance.now()); }, true); });
  for (const id of ['dlg', 'dlg2', 'ficha']) {
    const dialog = dialogLegacy.dialog(id); if (!dialog) continue;
    dialog.addEventListener('cancel', () => { closing[id] = performance.now(); });
    dialog.addEventListener('click', event => { if (event.target === dialog || (event.target as Element).closest('[data-cerrar], [data-cerrar2], .x')) closing[id] = performance.now(); }, true);
    dialog.addEventListener('close', () => {
      const pressed = closing[id] ?? 0, loading = dialog.classList.contains('pdprep') || Boolean(dialog.querySelector('.spin, .preparando, .cargando, .skel'));
      if (pressed && performance.now() - pressed < CLOSE_MS && loading) closedByUser[id] = performance.now();
      closing[id] = 0;
    });
    aroundShowModal(dialog, () => {
      const closed = closedByUser[id] ?? 0;
      if (closed && dialogLegacy.lastAction() < closed && !backLegacy.reopening() && performance.now() - closed < BLOCK_MS) { closedByUser[id] = 0; return false; }
      return true;
    });
  }
}
