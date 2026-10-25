/**
 * What can be imported (customers, products, professionals and sales) and the standard fields of each one, with the synonyms
 * that recognise a column. Migrated from the legacy IMP_TIPOS and IMP_CAMPOS (v2.410.0). Keys and synonyms are data the
 * database and the matching use; the labels are texts in i18n.
 */
import { accountListLegacy, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';

export type Entity = 'clientes' | 'productos' | 'prescriptores' | 'ventas';

/** [key, required, synonyms] */
export type FieldDefinition = readonly [string, boolean, readonly string[]];

export interface EntityType { readonly key: Entity; readonly name: string; readonly hint: string; readonly icon: string }

/** The company words the field labels use. */
export const fieldWords = (): Record<string, string> => ({
  Patients: term('paciente', { number: 'p', capital: 'C' }), Professionals: term('medico', { number: 'p', capital: 'C' }),
  Professional: term('medico', { capital: 'C' }), Speciality: term('especialidad', { capital: 'C' }), ofConsultation: term('consulta', { article: 'del' }),
});

export const entityTypes = (): readonly EntityType[] => [
  { key: 'clientes', name: t('importing.types.clientes'), hint: t('importing.types.clientesHint', fieldWords()), icon: 'users' },
  { key: 'productos', name: t('importing.types.productos'), hint: t('importing.types.productosHint'), icon: 'package' },
  { key: 'prescriptores', name: accountListLegacy.contactsLabel(), hint: t('importing.types.prescriptoresHint', fieldWords()), icon: 'stethoscope' },
  { key: 'ventas', name: t('importing.types.ventas'), hint: t('importing.types.ventasHint'), icon: 'shopping-cart' },
];

export const entityName = (entity: Entity): string => entityTypes().find(type => type.key === entity)?.name ?? entity;

export const fieldLabel = (entity: Entity, key: string): string => t(`importing.fields.${entity}.${key}` as MessageKey, fieldWords());

const CUSTOMER_FIELDS: readonly FieldDefinition[] = [
  ['nombre', true, ['nombre', 'cliente', 'razon social', 'name', 'nombre completo', 'denominacion', 'nombre cliente']],
  ['nif', false, ['nif', 'cif', 'dni', 'nie', 'vat', 'tax id', 'nif cif', 'identificacion fiscal', 'documento']],
  ['email', false, ['email', 'correo', 'e mail', 'mail', 'correo electronico']],
  ['telefono', false, ['telefono', 'tel', 'phone', 'telefono fijo', 'tlf', 'tfno', 'telf', 'tlfno', 'tfn']],
  ['movil', false, ['movil', 'mobile', 'celular', 'telefono movil', 'mvl']],
  ['direccion', false, ['direccion', 'domicilio', 'address', 'calle']],
  ['cp', false, ['codigo postal', 'cp', 'postal', 'zip', 'c p']],
  ['municipio', false, ['poblacion', 'municipio', 'ciudad', 'localidad', 'city']],
  ['provincia', false, ['provincia', 'state', 'region']],
  ['pais', false, ['pais', 'country']],
  ['empresa', false, ['empresa', 'company', 'compania']],
  ['tipo', false, ['tipo', 'tipo cliente', 'tipo de cliente']],
  ['medico', false, ['medico', 'prescriptor', 'doctor', 'recomendado por']],
  ['nota', false, ['notas', 'nota', 'observaciones', 'comentarios']],
];

const PRODUCT_FIELDS: readonly FieldDefinition[] = [
  ['nombre', true, ['nombre', 'producto', 'articulo', 'name', 'descripcion corta']],
  ['referencia', false, ['referencia', 'ref', 'sku', 'codigo', 'codigo interno', 'cod']],
  ['codigo_barras', false, ['ean', 'codigo de barras', 'barcode', 'gtin', 'ean13']],
  ['precio', false, ['precio', 'pvp', 'price', 'precio venta', 'subtotal', 'precio sin iva']],
  ['iva', false, ['iva', 'impuesto', 'impuestos', 'tax', 'tipo iva', 'iva']],
  ['coste', false, ['coste', 'costo', 'cost', 'precio compra', 'precio de compra']],
  ['presentacion', false, ['presentacion', 'formato', 'descripcion']],
  ['unidades_envase', false, ['unidades por envase', 'uds envase', 'pack', 'unidades envase']],
  ['stock_minimo', false, ['stock minimo', 'minimo']],
  ['tipo', false, ['tipo']],
];

const PROFESSIONAL_FIELDS: readonly FieldDefinition[] = [
  ['nombre', true, ['nombre', 'medico', 'doctor', 'prescriptor', 'nombre completo', 'name']],
  ['especialidad', false, ['especialidad', 'specialty', 'especialitat', 'segmento', 'categoria']],
  ['area', false, ['area', 'zona']],
  ['cargo', false, ['cargo', 'puesto']],
  ['telefono', false, ['telefono', 'tel', 'phone', 'movil', 'tfno', 'telf', 'tlf']],
  ['email', false, ['email', 'correo', 'e mail', 'mail']],
  ['centro', false, ['centro', 'clinica', 'hospital', 'centro de trabajo', 'consulta']],
  ['direccion', false, ['direccion', 'domicilio', 'address']],
  ['cp', false, ['codigo postal', 'cp', 'postal']],
  ['municipio', false, ['poblacion', 'municipio', 'ciudad', 'localidad']],
  ['provincia', false, ['provincia']],
  ['nota', false, ['notas', 'nota', 'observaciones']],
];

const SALES_FIELDS: readonly FieldDefinition[] = [
  ['numero', false, ['numero', 'num factura', 'factura', 'n pedido', 'pedido', 'num', 'numero factura', 'numero pedido', 'n factura']],
  ['fecha', true, ['fecha', 'date', 'fecha factura', 'fecha pedido']],
  ['cliente', true, ['cliente', 'contacto', 'nombre cliente', 'razon social', 'customer']],
  ['nif', false, ['nif', 'cif', 'dni']],
  ['producto', true, ['producto', 'item', 'articulo', 'concepto', 'descripcion producto']],
  ['referencia', false, ['referencia', 'sku', 'ref', 'codigo']],
  ['unidades', false, ['unidades', 'uds', 'cantidad', 'qty', 'unidad']],
  ['precio', false, ['precio', 'precio unitario', 'pvp']],
  ['importe', false, ['importe', 'subtotal', 'base', 'total linea', 'base imponible']],
  ['iva', false, ['iva', 'impuesto', 'tipo iva']],
  ['medico', false, ['medico', 'prescriptor', 'doctor']],
  ['forma_pago', false, ['forma de pago', 'f pago', 'metodo de pago', 'pago']],
  ['cobrado', false, ['cobrado', 'pagado', 'estado cobro']],
  ['canal', false, ['canal']],
];

export const FIELDS: Readonly<Record<Entity, readonly FieldDefinition[]>> = {
  clientes: CUSTOMER_FIELDS, productos: PRODUCT_FIELDS, prescriptores: PROFESSIONAL_FIELDS, ventas: SALES_FIELDS,
};
