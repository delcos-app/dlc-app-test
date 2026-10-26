// Legacy globals Productos uses (src/app/screens/products): the catalog loaders, the product editor and the visit material stay in legacy.

declare function cargarProductosModulo(): Promise<void>;
declare function fichaStock(line: object): Promise<void>;
declare function editorProducto(product: object | null): void;
declare function editorMuestras(): Promise<void>;
declare function clasCumple(values: Record<string, unknown> | null | undefined, filters: Record<string, unknown>): boolean;
declare function clasCeldas(fields: readonly CustomField[], values: Record<string, unknown> | null | undefined): string;
