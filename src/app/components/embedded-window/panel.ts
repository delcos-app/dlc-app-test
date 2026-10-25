/**
 * A window or a module page painted inside the Configuración panel instead of floating: the dialog's own body (#dbody) steps aside as
 * #dbody-modal and a panel takes its id, so the legacy screens paint there unchanged (a module page, #v-admin, the same way). While a
 * window is in the panel the dialog does not open, and closing it repaints the panel. Migrated from the legacy panelDeVentana,
 * panelDeModuloBase/panelDeModulo, salirPanel and the dialog guard of legado 039 (v2.422.0).
 *
 * v2.422.0, the intermittent of the panel: (1) the painter was not awaited, so a page with several parts moved on to the next one and
 * gave #dbody back to the dialog while the previous painter was still reading its data; when it finished it painted into the dialog
 * (and could open it) and its own panel stayed empty. The painter is now awaited, up to a limit. (2) Closing the window repainted the
 * panel 60 ms later with whatever panel was active by then: after changing section, the old window was painted over the new one. The
 * repaint now happens only if the same panel is still active.
 */
import { shellLegacy } from '../../legacy/shell-bridge';

const PAINT_MAX_MS = 8000, REPAINT_DELAY_MS = 60, SUBNAV_CLEANUP_MS = [300, 1200];

const byId = (id: string): HTMLElement | null => document.getElementById(id);

/** Waits for a painter (sync or async) without letting it fail or hang the page. */
const settle = (work: unknown): Promise<void> => Promise.race([
  Promise.resolve(work).then(() => undefined, () => undefined),
  new Promise<void>(done => { setTimeout(done, PAINT_MAX_MS); }),
]);

/** Gives the dialog (or the module page) its id back and forgets the panel. */
export function leavePanel(): void {
  const active = shellLegacy.activePanel();
  if (!active) return;
  if (active.tipo === 'dbody') {
    const panel = document.querySelector('#cfgcuerpo [data-panel]#dbody'); if (panel) panel.id = '';
    const real = byId('dbody-modal'); if (real) real.id = 'dbody';
  }
  if (active.tipo === 'admin') {
    const panel = document.querySelector('#cfgcuerpo [data-panel]#v-admin'); if (panel) panel.id = '';
    const real = byId('v-admin-real'); if (real) real.id = 'v-admin';
  }
  shellLegacy.setActivePanel(null);
}

/** Paints a window (its painter writes into #dbody) inside the panel; resolves when it has been painted. */
export function showWindowInPanel(paint: () => unknown): Promise<void> {
  leavePanel();
  const real = byId('dbody'); if (real) real.id = 'dbody-modal';
  const box = byId('cfgcuerpo'); if (box) box.innerHTML = '<div id="dbody" data-panel="1" class="cfgpanel card"></div>';
  shellLegacy.setActivePanel({ tipo: 'dbody', refrescar: () => showWindowInPanel(paint) });
  return settle(paint());
}

const removeSubnavs = (): void => {
  document.querySelector('#cfgcuerpo .cfgmod')?.querySelectorAll('.subnav').forEach(subnav => { subnav.remove(); });
};

/** Paints a module page (Administración: accesos, auditoría, comisiones) inside the panel, without its inner menus. */
export function showModuleInPanel(section: string): Promise<void> {
  leavePanel();
  const real = byId('v-admin'); if (real) real.id = 'v-admin-real';
  const box = byId('cfgcuerpo'); if (box) box.innerHTML = '<div id="v-admin" data-panel="1" class="cfgpanel cfgmod"></div>';
  shellLegacy.setActivePanel({ tipo: 'admin' });
  shellLegacy.setAdminSection(section);
  const painted = settle(shellLegacy.loadAdmin());
  removeSubnavs(); SUBNAV_CLEANUP_MS.forEach(ms => { setTimeout(removeSubnavs, ms); });
  return painted;
}

/** While a window is in the panel the dialog does not open; closing it repaints that panel (if it is still the active one). */
export function guardPanelDialog(dialog: HTMLDialogElement | null): void {
  if (!dialog) return;
  const open = dialog.showModal.bind(dialog), close = dialog.close.bind(dialog);
  dialog.showModal = (): void => { if (shellLegacy.activePanel()?.tipo === 'dbody') return; open(); };
  dialog.close = (value?: string): void => {
    const active = shellLegacy.activePanel();
    if (active?.tipo === 'dbody' && !dialog.open) {
      setTimeout(() => { if (shellLegacy.activePanel() === active) void active.refrescar?.(); }, REPAINT_DELAY_MS);
      return;
    }
    close(value);
  };
}
