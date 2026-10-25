/**
 * Bridge of Comisiones to the legacy code (kept apart from bridge.ts, which is at its size limit): the schemes stay in the legacy
 * ESQUEMAS (the user editor of Configuración reads them), the team with its roles, and what the user may see of their commission.
 */
export const commissionsLegacy = {
  schemes: (): unknown[] => ESQUEMAS,
  setSchemes: (list: unknown[]): void => { ESQUEMAS = list; },
  team: (): readonly { id: string; nombre: string; rol: string }[] => COMS as { id: string; nombre: string; rol: string }[],
  whatUserSees: (): string | undefined => (PERFIL as { comision_ver?: string } | null)?.comision_ver,
};
