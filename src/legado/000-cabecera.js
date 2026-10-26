// @ts-check
/* v2.424.0: lo de este archivo está en src/app/core/legacy-a/early.ts. Aquí queda, en su sitio del orden de carga:
   - ENLACE_ERROR (legado 129 lo lee): el error del enlace de activación caducado, leído antes de nada
   - la lista de clases que no cuenta como cambio añadir una clase que ya está o quitar una que no está */
const ENLACE_ERROR = window.delcos.legacyA.readLinkError();
window.delcos.legacyA.patchClassList();
