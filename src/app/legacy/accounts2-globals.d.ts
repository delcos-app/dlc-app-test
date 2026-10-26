// Legacy globals of the account editor, the saved filters and the portfolio (only names no other legacy/*.d.ts declares).
declare function estadoPapel(role: string): string;
declare const HM: readonly string[];
declare const HT: readonly string[];
declare const DIAS: readonly string[];
declare function geoInversa(lat: number, lon: number): Promise<{ address?: Record<string, string | undefined>; display_name?: string } | null>;
declare function estoyAqui(box: HTMLElement, index: string, button: HTMLElement): Promise<void>;
declare function todosLos(word: string): string;

declare function cargarAdmin(): Promise<void>;
declare function asignarCartera(userId: string): Promise<void>;
