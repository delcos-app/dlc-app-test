/**
 * Windows in the page (v2.422.0): a window or a module page inside the Configuración panel, windows that take the content area on a
 * desktop, the stacked window and «loading» on the dialog. Registered as window.delcos.components.embeddedWindow: the legacy names
 * in componentes/ventana.js are one-line adapters to these.
 */
export { closeEmbedded, EMBED_MIN_WIDTH, embedArea, openStacked, placeEmbedded, returnEmbedded, withDialogLoading } from './embed';
export { guardPanelDialog, leavePanel, showModuleInPanel, showWindowInPanel } from './panel';
