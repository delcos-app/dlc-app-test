/**
 * Router: the single way to move between screens. It replaces the legacy `ir()`, which grew to 26 layers, one per version.
 * What used to be a layer is now data:
 *   - routes: each screen registers itself (id, how to enter, who may enter);
 *   - redirects: rules that send a request elsewhere (e.g. «config» → «plan» after paying);
 *   - hooks: what happens after every navigation (reveal the screen, remember the way back…).
 */
export interface NavigationContext {
  readonly from: string | null;
  readonly params: readonly unknown[];
}

export interface Route {
  readonly id: string;
  /** Shows the screen. Returns when its first paint is ready. */
  enter(context: NavigationContext): void | Promise<void>;
  /** Whether the current user may open it (plan, permissions). Default: yes. */
  canEnter?(): boolean;
}

/** Returns another route id to go there instead, or undefined to keep the requested one. */
export type Redirect = (target: string, context: NavigationContext) => string | undefined;
export type NavigationHook = (routeId: string, context: NavigationContext) => void;

export interface Router {
  register(route: Route): void;
  addRedirect(redirect: Redirect): void;
  onNavigate(hook: NavigationHook): void;
  navigate(target: string, ...params: unknown[]): Promise<string>;
  readonly current: string | null;
}

const MAX_REDIRECTS = 10;

export function createRouter(fallbackRoute: string): Router {
  const routes = new Map<string, Route>();
  const redirects: Redirect[] = [];
  const hooks: NavigationHook[] = [];
  let current: string | null = null;

  function resolve(target: string, context: NavigationContext): string {
    let resolved = target;
    for (let hops = 0; hops < MAX_REDIRECTS; hops++) {
      const next = redirects.map(redirect => redirect(resolved, context)).find(id => id !== undefined && id !== resolved);
      if (next === undefined) break;
      resolved = next;
    }
    const route = routes.get(resolved);
    return route && (route.canEnter?.() ?? true) ? resolved : fallbackRoute;
  }

  async function navigate(target: string, ...params: unknown[]): Promise<string> {
    const context: NavigationContext = { from: current, params };
    const routeId = resolve(target, context);
    const route = routes.get(routeId);
    if (!route) throw new Error(`Unknown route: ${routeId}`);
    current = routeId;
    await route.enter(context);
    hooks.forEach(hook => { hook(routeId, context); });
    return routeId;
  }

  return {
    register: route => { routes.set(route.id, route); },
    addRedirect: redirect => { redirects.push(redirect); },
    onNavigate: hook => { hooks.push(hook); },
    navigate,
    get current() { return current; },
  };
}
