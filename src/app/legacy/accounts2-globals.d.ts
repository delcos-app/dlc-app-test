// Legacy globals of the account editor, the saved filters and the portfolio (only names no other legacy/*.d.ts declares).
declare const HM: readonly string[];
declare const HT: readonly string[];
declare const DIAS: readonly string[];

declare function cargarAdmin(): Promise<void>;
declare function asignarCartera(userId: string): Promise<void>;
