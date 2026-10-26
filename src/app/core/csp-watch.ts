/**
 * Content Security Policy violations (v2.435.0, plan 9.1). The policy is a <meta> in index.html: GitHub Pages cannot send headers,
 * and a <meta> cannot be «report-only», so every blocked resource is logged in the error registry instead. A missing origin then
 * shows up in Panel delcos → Errores rather than failing in silence. Before signing in the registry only keeps it in the session.
 */
import { registerError } from './errors';

const MAX_SAMPLE = 80;

/** «script-src https://example.com/x.js (app.js:12)». */
function describe(event: SecurityPolicyViolationEvent): string {
  const blocked = event.blockedURI || 'inline';
  const where = event.sourceFile ? ` (${event.sourceFile}:${event.lineNumber})` : '';
  return `${event.effectiveDirective} ${blocked}${where}`;
}

export function listenToPolicyViolations(): void {
  document.addEventListener('securitypolicyviolation', event => {
    registerError('csp', describe(event), { muestra: event.sample.slice(0, MAX_SAMPLE), politica: event.disposition });
  });
}
