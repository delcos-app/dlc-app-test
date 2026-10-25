/**
 * Navigation pipeline (middleware). Every navigation goes through an ordered list of steps:
 *   1. each step's `before` runs in order: it may change the target (redirect), stop the navigation (block) or prepare something;
 *   2. the screen is switched (`switchScreen`) with the final target, unless a step blocked;
 *   3. each step's `after` runs in reverse order, seeing the target as it was when that step passed it on;
 *   4. each step's `cleanup` runs at the end even if something failed.
 * This is exactly how the legacy `ir()` behaved with its 26 wrappers, but explicit: one named, documented step per rule.
 */
export interface Navigation {
  /** Screen requested; steps may change it. */
  target: string;
  readonly args: readonly unknown[];
  /** Set by a step to stop here: inner steps and the screen switch do not run, outer `after`s still do. */
  blocked: boolean;
}

export interface NavigationStep {
  /** Short description of the rule (and the version it comes from), for whoever reads or debugs the pipeline. */
  readonly name: string;
  before?(navigation: Navigation): void;
  /** `target` is the value this step passed on to the inner steps. */
  after?(target: string, args: readonly unknown[]): void;
  cleanup?(target: string): void;
}

interface Passed { readonly step: NavigationStep; readonly target: string }

function runBefores(steps: readonly NavigationStep[], navigation: Navigation): Passed[] {
  const passed: Passed[] = [];
  for (const step of steps) {
    step.before?.(navigation);
    passed.push({ step, target: navigation.target });
    if (navigation.blocked) break;
  }
  return passed;
}

/** Runs one navigation through the steps and the screen switch. */
export function runNavigation(steps: readonly NavigationStep[], switchScreen: (target: string, args: readonly unknown[]) => void,
  target: string, args: readonly unknown[]): void {
  const navigation: Navigation = { target, args, blocked: false };
  let passed: Passed[] = [];
  try {
    passed = runBefores(steps, navigation);
    if (!navigation.blocked) switchScreen(navigation.target, args);
    for (const { step, target: seen } of [...passed].reverse()) step.after?.(seen, args);
  } finally {
    for (const { step, target: seen } of [...passed].reverse()) step.cleanup?.(seen);
  }
}
