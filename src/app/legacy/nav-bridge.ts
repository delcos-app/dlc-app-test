/** Legacy pieces navigation still needs with a shape their declarations do not give (v2.426.0). */
interface SessionAuth {
  getSession(): Promise<{ data: { session: { user: { id: string } } | null } }>;
  setSession(tokens: { access_token: string; refresh_token: string }): Promise<{ error: unknown }>;
}

export const navLegacy = {
  /** The Agenda refresh with its options (its declaration takes none). */
  refreshAgenda: (): void => { (agRefrescoQuieto as (day: null, options: { cifras: boolean }) => void)(null, { cifras: false }); },
  /** The list templates by screen (PL is declared read-only: the reveal takes one out for a moment). */
  listTemplates: (): Record<string, unknown> => PL as Record<string, unknown>,
  /** The session of the database client. */
  auth: (): SessionAuth => db.auth as unknown as SessionAuth,
  /** The date and time pickers on every field of the page. */
  improveFields: (): void => { (mejorarCampos as (root: ParentNode) => void)(document); },
};
