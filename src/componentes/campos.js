// @ts-check
// componentes/campos.js · los campos comunes están en src/app/components/fields.ts (v2.427.0). Estos nombres se quedan como
// adaptadores: muchas ventanas, los puentes y la capa de formularios los usan.

function ojoClave(inp) { window.delcos.leftovers.passwordEye(inp); }

/* v2.72.0 · Un clasificador de ficha, cliente o producto sin papel es un campo personalizado: tipo y dónde se ve */
function cajaCampo(c, completo) { return window.delcos.leftovers.customFieldBox(c, completo); }

function validarDoc(v, tipo) { return window.delcos.leftovers.checkDocument(v, tipo); }

function campoDato(v, k, valor) { return window.delcos.leftovers.valueDataField(v, k, valor); }

// Email comprobado mientras se escribe: ✓ verde si es válido, ✗ rojo si no
function validarEmailEnVivo(inp) { window.delcos.leftovers.liveEmailCheck(inp); }

function campoInput(c, v) { return window.delcos.leftovers.customFieldInput(c, v); }

function notaAmplia(i) { window.delcos.leftovers.wideNote(i); }

/* v2.109.0 · Las ventanas no muestran lo escrito en otras ocasiones. El navegador sugería, por ejemplo, la nota del pedido
   anterior al crear uno nuevo: los campos de las ventanas y de las pantallas no guardan historial (salvo los que lo piden). */
function sinHistorial(raiz) { window.delcos.leftovers.withoutHistory(raiz); }

// Una pasada por fotograma como mucho, aunque la pantalla cambie muchas veces seguidas
let sinHistorialPend = false;

const sinHistorialLuego = () => { if (sinHistorialPend) return; sinHistorialPend = true; requestAnimationFrame(() => { sinHistorialPend = false; sinHistorial(document.body); }); };

const campoTxt = k => CAMPO_TXT[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));

