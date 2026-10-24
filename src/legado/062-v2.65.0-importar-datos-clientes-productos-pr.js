/* ============================================================
   v2.65.0 · Importar datos: clientes, productos, prescriptores y
   ventas desde Excel o CSV, con correspondencia de columnas,
   campos personalizados (clasificadores del módulo), revisión
   previa, registro de importaciones y deshacer
   ============================================================ */

Object.assign(ICON_NOM, {"file-spreadsheet": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /> <path d=\"M8 13h2\" /> <path d=\"M14 13h2\" /> <path d=\"M8 17h2\" /> <path d=\"M14 17h2\" />", "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /> <circle cx=\"9\" cy=\"7\" r=\"4\" /> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /> <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />", "package": "<path d=\"M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z\" /> <path d=\"M12 22V12\" /> <path d=\"m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7\" /> <path d=\"m7.5 4.27 9 5.15\" />", "stethoscope": "<path d=\"M11 2v2\" /> <path d=\"M5 2v2\" /> <path d=\"M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1\" /> <path d=\"M8 15a6 6 0 0 0 12 0v-3\" /> <circle cx=\"20\" cy=\"10\" r=\"2\" />", "shopping-cart": "<circle cx=\"8\" cy=\"21\" r=\"1\" /> <circle cx=\"19\" cy=\"21\" r=\"1\" /> <path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\" />", "check": "<path d=\"M20 6 9 17l-5-5\" />", "undo-2": "<path d=\"M9 14 4 9l5-5\" /> <path d=\"M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11\" />", "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" /> <path d=\"M12 7v5l4 2\" />"});

// Campos estándar de cada tipo de datos: [clave, etiqueta, obligatorio, sinónimos para reconocer la columna]
const IMP_CAMPOS = {
  clientes: [
    ['nombre', 'Nombre o razón social', 1, ['nombre', 'cliente', 'razon social', 'name', 'nombre completo', 'denominacion', 'nombre cliente']],
    ['nif', 'NIF / CIF / DNI', 0, ['nif', 'cif', 'dni', 'nie', 'vat', 'tax id', 'nif cif', 'identificacion fiscal', 'documento']],
    ['email', 'Email', 0, ['email', 'correo', 'e mail', 'mail', 'correo electronico']],
    ['telefono', 'Teléfono', 0, ['telefono', 'tel', 'phone', 'telefono fijo', 'tlf', 'tfno', 'telf', 'tlfno', 'tfn']],
    ['movil', 'Móvil', 0, ['movil', 'mobile', 'celular', 'telefono movil', 'mvl']],
    ['direccion', 'Dirección', 0, ['direccion', 'domicilio', 'address', 'calle']],
    ['cp', 'Código postal', 0, ['codigo postal', 'cp', 'postal', 'zip', 'c p']],
    ['municipio', 'Población', 0, ['poblacion', 'municipio', 'ciudad', 'localidad', 'city']],
    ['provincia', 'Provincia', 0, ['provincia', 'state', 'region']],
    ['pais', 'País', 0, ['pais', 'country']],
    ['empresa', 'Empresa', 0, ['empresa', 'company', 'compania']],
    ['tipo', 'Tipo (Persona o Empresa)', 0, ['tipo', 'tipo cliente', 'tipo de cliente']],
    ['medico', `${TT('medico', 's', '', 'l', 'C')} de referencia`, 0, ['medico', 'prescriptor', 'doctor', 'recomendado por']],
    ['nota', 'Notas', 0, ['notas', 'nota', 'observaciones', 'comentarios']]],
  productos: [
    ['nombre', 'Nombre', 1, ['nombre', 'producto', 'articulo', 'name', 'descripcion corta']],
    ['referencia', 'Referencia', 0, ['referencia', 'ref', 'sku', 'codigo', 'codigo interno', 'cod']],
    ['codigo_barras', 'Código de barras (EAN)', 0, ['ean', 'codigo de barras', 'barcode', 'gtin', 'ean13']],
    ['precio', 'Precio sin IVA', 0, ['precio', 'pvp', 'price', 'precio venta', 'subtotal', 'precio sin iva']],
    ['iva', 'IVA (%)', 0, ['iva', 'impuesto', 'impuestos', 'tax', 'tipo iva', 'iva']],
    ['coste', 'Coste', 0, ['coste', 'costo', 'cost', 'precio compra', 'precio de compra']],
    ['presentacion', 'Presentación', 0, ['presentacion', 'formato', 'descripcion']],
    ['unidades_envase', 'Unidades por envase', 0, ['unidades por envase', 'uds envase', 'pack', 'unidades envase']],
    ['stock_minimo', 'Stock mínimo', 0, ['stock minimo', 'minimo']],
    ['tipo', 'Tipo (producto o servicio)', 0, ['tipo']]],
  prescriptores: [
    ['nombre', 'Nombre', 1, ['nombre', 'medico', 'doctor', 'prescriptor', 'nombre completo', 'name']],
    ['especialidad', TT('especialidad', 's', '', 'l', 'C'), 0, ['especialidad', 'specialty', 'especialitat', 'segmento', 'categoria']],
    ['area', 'Área', 0, ['area', 'zona']],
    ['cargo', 'Cargo', 0, ['cargo', 'puesto']],
    ['telefono', 'Teléfono', 0, ['telefono', 'tel', 'phone', 'movil', 'tfno', 'telf', 'tlf']],
    ['email', 'Email', 0, ['email', 'correo', 'e mail', 'mail']],
    ['centro', 'Centro o lugar de trabajo', 0, ['centro', 'clinica', 'hospital', 'centro de trabajo', 'consulta']],
    ['direccion', `Dirección ${TT('consulta', 's', 'del', 'l', 'l')}`, 0, ['direccion', 'domicilio', 'address']],
    ['cp', 'Código postal', 0, ['codigo postal', 'cp', 'postal']],
    ['municipio', 'Población', 0, ['poblacion', 'municipio', 'ciudad', 'localidad']],
    ['provincia', 'Provincia', 0, ['provincia']],
    ['nota', 'Notas', 0, ['notas', 'nota', 'observaciones']]],
  ventas: [
    ['numero', 'Número de pedido o factura', 0, ['numero', 'num factura', 'factura', 'n pedido', 'pedido', 'num', 'numero factura', 'numero pedido', 'n factura']],
    ['fecha', 'Fecha', 1, ['fecha', 'date', 'fecha factura', 'fecha pedido']],
    ['cliente', 'Cliente', 1, ['cliente', 'contacto', 'nombre cliente', 'razon social', 'customer']],
    ['nif', 'NIF del cliente', 0, ['nif', 'cif', 'dni']],
    ['producto', 'Producto', 1, ['producto', 'item', 'articulo', 'concepto', 'descripcion producto']],
    ['referencia', 'Referencia del producto', 0, ['referencia', 'sku', 'ref', 'codigo']],
    ['unidades', 'Unidades', 0, ['unidades', 'uds', 'cantidad', 'qty', 'unidad']],
    ['precio', 'Precio unitario', 0, ['precio', 'precio unitario', 'pvp']],
    ['importe', 'Importe de la línea (sin IVA)', 0, ['importe', 'subtotal', 'base', 'total linea', 'base imponible']],
    ['iva', 'IVA (%)', 0, ['iva', 'impuesto', 'tipo iva']],
    ['medico', `${TT('medico', 's', '', 'l', 'C')}`, 0, ['medico', 'prescriptor', 'doctor']],
    ['forma_pago', 'Forma de pago', 0, ['forma de pago', 'f pago', 'metodo de pago', 'pago']],
    ['cobrado', 'Cobrado (sí o no)', 0, ['cobrado', 'pagado', 'estado cobro']],
    ['canal', 'Canal', 0, ['canal']]]
};


// Configuración → Datos → Importar datos (administración)
arbolConfig = (orig => function () {
  const g = orig();
  // v2.109.0: con el permiso «Importar datos» del rol (antes, solo administración)
  if (!puede('importar_datos')) return g;
  const datos = g.find(x => x[0] === 'Datos');
  const item = { k: 'importar', ic: 'file-spreadsheet', t: 'Importar datos', d: `Clientes, productos, ${etiquetaContactos().toLowerCase()} y ventas desde Excel o CSV`,
    sub: [['nueva', 'Nueva importación', pintarImportar], ['historial', 'Importaciones', pintarImportaciones]] };
  if (datos) { if (!datos[1].some(x => x.k === 'importar')) datos[1].push(item); } else g.push(['Datos', [item]]);
  return g;
})(arbolConfig);


