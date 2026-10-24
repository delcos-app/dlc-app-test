/* ============================================================
   v2.341.0 · Los indicadores de las listas se adaptan a los filtros (Eric: con «Manresa» la tabla tenía 111 y los indicadores seguían
   con el total). Cada indicador cuenta su condición dentro de los filtros que haya (búsqueda, municipio, estado…); sin filtros, el
   total de siempre. Se recalculan al cambiar los filtros (kpiFirma).
   ============================================================ */
(() => {
  const d = PL.directorio;
  if (d) {
    const base = () => ({ q: F.q || null, f_provincia: F.prov || null, f_municipio: F.muni || null, f_estado: F.est || null, f_especialidad: F.esp || null,
      f_area: null, f_comercial: F.com || null, f_reporting: F.rep || null, ...(Object.keys(F.campos || {}).length ? { f_campos: F.campos } : {}) });
    d.kpiFirma = () => JSON.stringify([F.q, F.prov, F.muni, F.est, F.esp, F.com, F.rep, F.tipo, !!F.urg, !!F.mios, !!F.sin, F.campos || {}]);
    const filtrado = () => !!(F.q || F.prov || F.muni || F.est || F.esp || F.com || F.rep || F.tipo || F.urg || F.mios || F.sin || Object.keys(F.campos || {}).length);
    d.kpis = async () => {
      const t = x => RPC_ORIG('buscar_cuentas', { ...base(), f_tipo: F.tipo || null, f_urgentes: !!F.urg, f_mios: !!F.mios, f_sin_visitar: !!F.sin, lim: 1, desplaz: 0, ...x }).then(r => (r.data && r.data.total) || 0, () => 0);
      const [pro, cen, urg, sin, mios] = await Promise.all([t({ f_tipo: 'Persona' }), t({ f_tipo: 'Centro' }), t({ f_urgentes: true }), t({ f_sin_visitar: true }), t({ f_mios: true })]);
      const fl = filtrado(), con = 'con estos filtros';
      return [{ k: 'Persona', t: TT('medico', 'p', '', 'l', 'C'), n: pro, s: fl ? con : 'en total' }, { k: 'Centro', t: 'Centros', n: cen, s: fl ? con : 'en total' },
        { k: 'urg', t: 'Urgentes', n: urg, s: fl ? con : 'marcados como urgentes' }, { k: 'sin', t: 'Sin visitar nunca', n: sin, s: fl ? con : 'todavía sin ' + TT('visita', 'p', '', 'l', 'l') },
        { k: 'mios', t: 'De mi cartera', n: mios, s: fl ? con : 'asignados a ti' }];
    };
  }
  const c = PL.pacientes;
  if (c) {
    const base = () => ({ q: PAC.q || null, p_medico: PAC.medico || null, p_municipio: PAC.municipio || null, ...(Object.keys(PAC.campos || {}).length ? { f_campos: PAC.campos } : {}) });
    c.kpiFirma = () => JSON.stringify([PAC.q, PAC.medico, PAC.municipio, PAC.tipo, PAC.pedidos, PAC.campos || {}]);
    c.kpis = async () => {
      const t = x => RPC_ORIG('clientes_lista', { ...base(), p_tipo: PAC.tipo || null, p_pedidos: PAC.pedidos || null, lim: 1, desplaz: 0, ...x }).then(r => (r.data && r.data.total) || 0, () => 0);
      const [tot, con, sin, emp] = await Promise.all([t({ p_tipo: null, p_pedidos: null }), t({ p_pedidos: 'con' }), t({ p_pedidos: 'sin' }), t({ p_tipo: 'Empresa' })]);
      const fl = !!(PAC.q || PAC.medico || PAC.municipio || PAC.tipo || PAC.pedidos || Object.keys(PAC.campos || {}).length), cf = 'con estos filtros';
      return [{ k: 'tot', t: 'Clientes', n: tot, s: fl ? cf : 'en total' }, { k: 'con', t: 'Con pedidos', n: con, s: fl ? cf : 'han comprado alguna vez' },
        { k: 'sin', t: 'Sin pedidos', n: sin, s: fl ? cf : 'todavía sin compras' }, { k: 'emp', t: 'Empresas', n: emp, s: fl ? cf : 'centros, tiendas y otras' }];
    };
  }
})();


