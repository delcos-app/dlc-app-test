// Legacy globals Productos uses (src/app/screens/products): the catalog loaders, the product editor and the visit material stay in legacy.

declare function cargarProductosModulo(): Promise<void>;
declare function fichaStock(line: object): Promise<void>;
declare function editorProducto(product: object | null): void;
