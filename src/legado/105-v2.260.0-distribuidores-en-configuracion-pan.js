/* ============================================================
   v2.260.0 · Distribuidores en Configuración (pantalla que faltaba, auditoría del 8/10/2026). Hasta ahora solo se podían añadir
   desde el editor del pedido y no se podían corregir ni retirar. Ahora, en Configuración → Datos → Distribuidores (administración):
   la lista con su correo y teléfono, añadir, editar (nombre, correo para pedidos, teléfono y nota) y dejar de usar o volver a usar
   (no se borran: los pedidos antiguos siguen diciendo quién los sirvió). Los que no se usan no salen al hacer un pedido.
   ============================================================ */
function arbolCfgUnicoBase3(...a) {
  const g = arbolCfgUnicoBase2.apply(this, a);
  if (!puede('administrar') || !puedeModulo('ventas')) return g;
  let dat = g.find(x => x[0] === 'Datos');
  if (!dat) { dat = ['Datos', []]; g.push(dat); }
  if (!dat[1].some(x => x.k === 'distribuidores'))
    dat[1].push({ k: 'distribuidores', t: 'Distribuidores', ic: 'package', d: 'Quién sirve pedidos por vosotros: correo, teléfono y si se usa', r: () => pintarDistribuidores() });
  return g;
}
CFG_CLAVES.distribuidores = 'distribuidores mayoristas almacenes pedidos transfer servir correo';




