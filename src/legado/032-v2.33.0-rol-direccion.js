/* ============================================================
   DLC OS 2.0 · v2.33.0 · Rol «Dirección»
   ============================================================ */

MANUAL.unshift({ id: 'roles', t: 'Roles del equipo', a: null, para: 'Qué ve y qué puede hacer cada rol. Los permisos de cada persona se pueden ajustar en Administración → Usuarios.',
  hacer: [[0, 'Administrador: todo, incluida la gestión de usuarios, permisos, configuración, facturación y VeriFactu'],
    [0, 'Dirección: ve toda la actividad del equipo (agendas, cumplimiento, ventas, facturación, analítica); por defecto consulta sin modificar'],
    [0, 'Televenta: ve toda la base, crea y confirma pedidos, da de alta clientes, emite facturas y registra cobros'],
    [0, `Comercial: su cartera, su agenda y rutas, sus ${TT('visita', 'p', '', 'l', 'l')} y las ventas y clientes de sus ${TT('medico', 'p', '', 'l', 'l')}`],
    [0, 'Solo consulta: ve sin modificar lo que le permitan sus permisos']], config: ['Permisos por persona: Administración → Usuarios → Editar'] });


