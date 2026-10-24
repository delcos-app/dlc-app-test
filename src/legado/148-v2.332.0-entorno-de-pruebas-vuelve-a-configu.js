/* ============================================================
   v2.332.0 · «Entorno de pruebas» vuelve a Configuración (aviso de Eric, 20/10/2026: en apptest no salía «Traer los datos de
   producción»). Desde la Configuración en un solo sitio (v2.215.0) el apartado de Organización «Entorno de pruebas» no estaba en el
   índice y la franja de arriba está oculta desde la v2.137.0: no había forma de llegar a los botones. Ahora: Configuración → Empresa →
   «Entorno de pruebas» (solo en apptest y para la administración), con «Traer los datos de producción» y «Volver a los datos de partida».
   ============================================================ */
function arbolCfgUnicoBase7(...a) {
  const g = arbolCfgUnicoBase6.apply(this, a);
  if (!EN_PRUEBAS || !puede('administrar')) return g;
  let emp = g.find(x => x[0] === 'Empresa');
  if (!emp) { emp = ['Empresa', []]; g.push(emp); }
  if (!emp[1].some(x => x.k === 'o.pruebas'))
    emp[1].push({ k: 'o.pruebas', t: 'Entorno de pruebas', ic: 'refresh-cw', d: 'Traer los datos de producción o volver a los de partida', r: () => pintarCfgPruebas() });
  return g;
}
CFG_CLAVES['o.pruebas'] = 'pruebas produccion producción datos copia traer partida entorno';


