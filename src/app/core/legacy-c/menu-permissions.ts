/**
 * Applying the menu permissions also builds the menu entries added by the layers 073–079: pages (v2.131.0), Pedidos and its sections
 * (v2.139.0), the plan padlocks, the platform mode (v2.16x), Eventos, Ciclo and Intervenciones (v2.195.0–v2.199.0). The legacy chain
 * aplicarPermisosMenuBase3…Base9 is one function now (folded from legado 073, 075, 076 and 079, v2.425.0), with the same order: the
 * entries are built before and checked again after the previous layers.
 */

const quietly = (work: () => void): void => { try { work(); } catch { /* a menu entry must not stop the others */ } };
const SECTION_MENUS = [(): void => { menuCirugias(); }, (): void => { menuCiclo(); }, (): void => { menuEventos(); }] as const;

/** The legacy aplicarPermisosMenuBase9: everything after aplicarPermisosMenuBase2. */
export function applyMenuPermissions(args: readonly unknown[]): unknown {
  SECTION_MENUS.forEach(quietly);
  quietly(() => { menuPedidos2139(); });
  const result = aplicarPermisosMenuBase2(...args);
  menuPaginas2131(); void franjaVista();
  menuPedidos2139();
  quietly(() => { candadoSecciones(); });
  quietly(() => { aplicarModoPlataforma(); });
  [...SECTION_MENUS].reverse().forEach(quietly);
  return result;
}

/** The menu entries built once the page has loaded (v2.131.0, v2.139.0, the padlocks). */
export function buildMenusSoon(): void { setTimeout(() => { quietly(() => { menuPaginas2131(); void franjaVista(); }); }, 0); }
export function buildSalesMenusSoon(): void { setTimeout(() => { quietly(() => { menuPedidos2139(); }); }, 0); }
export function padlocksSoon(): void { setTimeout(() => { quietly(() => { candadoSecciones(); }); }, 0); }

/** v2.195.0–v2.199.0: the menu entries of Eventos, Ciclo and Intervenciones right away. */
export const eventsMenu = (): void => { quietly(() => { menuEventos(); }); };
export const cycleMenu = (): void => { quietly(() => { menuCiclo(); }); };
export const surgeriesMenu = (): void => { quietly(() => { menuCirugias(); }); };

/** v2.117.0: showing the app also builds the Organización entry of the user menu (the legacy mostrarApp). */
export function showApp(args: readonly unknown[]): unknown {
  const result = mostrarAppBase(...args); menuOrganizacion(); return result;
}

/** v2.16x: the platform mode shows only the panel sections, and it is remembered for the next start (the legacy aplicarModoPlataforma). */
export function applyPlatformMode(): void {
  document.body.classList.toggle('modo-plataforma', MODO_PLATAFORMA);
  document.querySelectorAll('#nav [data-t]').forEach(button => {
    const panelSection = button.classList.contains('pdsec');
    if (MODO_PLATAFORMA) button.classList.toggle('hide', !panelSection);
    else if (panelSection) button.classList.add('hide');
  });
  if (MODO_PLATAFORMA) document.querySelectorAll('[data-u="organizacion"], [data-u="plan"], [data-u="empresa"]').forEach(button => { button.classList.add('hide'); });
  quietly(() => { MENU_FIRMA = ''; montarMenuLateral(); });
  try { localStorage.setItem('dlc-modo', MODO_PLATAFORMA ? 'plataforma' : 'empresa'); } catch { /* private mode */ }
}
