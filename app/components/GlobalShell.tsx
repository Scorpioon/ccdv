import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  useTransitionCoordinator,
  type TransitionDirection,
  type TransitionTarget,
} from "../motion/transitionCoordinator";

type RouteMotion = {
  go: (to: TransitionTarget) => void;
  endTransition: () => void;
  leaving: TransitionDirection;
  reduced: boolean;
  isBusy: boolean;
};

const NavigationContext = createContext<RouteMotion | null>(null);

export function useSiteNavigation(): RouteMotion {
  const value = useContext(NavigationContext);
  if (!value) throw new Error("Missing site navigation context");
  return value;
}

/* Props for an in-app link that routes through the transition coordinator.
   Keeps the real href so middle-click, context menu, modifier-click and
   keyboard activation stay native; only a plain left-click is intercepted,
   which is what makes the coordinator the single owner of in-app navigation.
   Lives here rather than in each consumer so that guard is written once. */
export function useTransitionLink() {
  const nav = useSiteNavigation();
  return useCallback(
    (to: TransitionTarget) => ({
      to,
      onClick(event: MouseEvent<HTMLAnchorElement>) {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        nav.go(to);
      },
    }),
    [nav],
  );
}

/* GF09-F CORR03: the CCOS hub and its six leaves share ONE presence key. A
   route swap normally exits (opacity 0) and remounts the stage; for a CCOS-to-
   CCOS hop that dip is the visible flash (the page fades to the bare body
   background and back, and the exiting node most likely re-renders the
   already-incoming route, so the destination mounts twice). With a shared key AnimatePresence
   sees no change: the stage node stays, the <Outlet /> inside it swaps the
   route component in a single React commit, and the document is never empty,
   transparent or shorter than the destination. No timers, no scroll writes:
   the browser keeps scrollY (clamped to the new height) and the router's
   ScrollRestoration honours the rail links' preventScrollReset. Entering or
   leaving the CCOS family still uses the original per-path exit/enter. */
const CCOS_ROOT = "/products/ccos";

function isCcosPath(pathname: string) {
  return pathname === CCOS_ROOT || pathname.startsWith(`${CCOS_ROOT}/`);
}

/* GF07-C: the shell no longer paints a header or footer. R1.1 gives Home and
   Studio genuinely different mastheads (two loose squares vs. a five-cell nav
   carrying the wheel tile), so each route owns its own chrome and this
   component is reduced to route orchestration: navigation context, the exit/
   enter presence that GF07-A established, and incoming-route focus. */
export function GlobalShell({ children }: { children: ReactNode }) {
  const transition = useTransitionCoordinator();
  const location = useLocation();
  const initialMount = useRef(true);
  const mainNode = useRef<HTMLElement | null>(null);
  const previousPath = useRef(location.pathname);
  const routeKey = isCcosPath(location.pathname) ? CCOS_ROOT : location.pathname;

  // Focus follows the INCOMING route. Under AnimatePresence mode="wait" the new
  // <main> mounts only after the outgoing one has unmounted, so attaching the
  // ref is the exact moment the new route owns focus. A pathname effect would
  // still be aiming at the outgoing <main>. Covers back/forward too, since any
  // route swap remounts this node; the first mount is skipped so a cold page
  // load does not steal focus from the document.
  const focusRoute = useCallback((node: HTMLElement | null) => {
    mainNode.current = node;
    if (!node) return;
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    node.focus({ preventScroll: true });
  }, []);

  // CCOS-to-CCOS keeps the same <main> (see CCOS_ROOT), so the ref above does
  // not fire. The clicked rail link is replaced with the new page, which would
  // drop focus to <body>; give it to <main> exactly as a remount would.
  useEffect(() => {
    const previous = previousPath.current;
    previousPath.current = location.pathname;
    if (previous === location.pathname) return;
    if (isCcosPath(previous) && isCcosPath(location.pathname)) {
      mainNode.current?.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  return (
    <NavigationContext.Provider value={transition}>
      <div className="site-shell" data-route={location.pathname}>
        <div className="site-stage">
          <AnimatePresence mode="wait" initial={false} onExitComplete={transition.endTransition}>
            <motion.div
              key={routeKey}
              className="site-stage__route"
              initial={transition.reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={transition.reduced ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: transition.reduced ? 0 : 0.22 }}
            >
              <main ref={focusRoute} tabIndex={-1} id="main-content">
                {children}
              </main>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </NavigationContext.Provider>
  );
}
