// Legacy names read by the Configuración shell and the windows in the page (v2.422.0).
declare let PANEL_ACTIVO: unknown;
declare let ADM_SEC: string;
declare let FX_FICHA: unknown;
declare const PILA_VENT: { nodos: ChildNode[]; clases: string; titulo: string | undefined }[];
declare let APILANDO: boolean;
declare function arbolCfgUnico(): unknown;
declare const CFG_CLAVES: Record<string, string>;
declare function cargarConfig(): Promise<void>;
declare const PAG_SUCIO: Set<unknown>;
declare function pedsecVista(): string;
declare function facSinPlan(): boolean;
declare function aplicarPermisosMenu(): void;
