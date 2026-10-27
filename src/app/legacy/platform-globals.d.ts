// Legacy globals used by Panel delcos (src/app/screens/platform).
declare const PLANES: readonly { id: string; nombre: string }[];
declare function planDe(id: string | null | undefined): { id: string; nombre: string };
declare function perdidasPlan(from: string, to: string, data: { extras: string[]; facturas: boolean }): string[];
declare function pedirTexto(message: string, value: string, options?: { titulo?: string; ok?: string; placeholder?: string; tipo?: string }): Promise<string | null>;
declare const VERSION_APP: string;
declare const EN_PRUEBAS: boolean;
declare function eur(value: number): string;
