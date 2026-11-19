import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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

/* NAV-T3 (OPERATOR): Home <-> the scene routes. Leaving Home for Studio or
   Services the new page RISES from below over Home ("rise"); going back Home
   (collapse, Back) the scene page FALLS away and uncovers Home ("fall"). Any
   other swap keeps the fade. The direction is read from the pair of paths, so
   Back/Forward get it too, and is held per location key so the exiting
   route's variant cannot change mid-exit. Products V2 P1b: /products is a
   scene route too (it used to fade in whole, cube first — the flash).
   P2 (OPERATOR): the CC.OS deck rises out of /products the same way and falls
   back to it (SCENE_PARENT). Its six leaf pages are gone, so the former
   shared CCOS presence key (GF09-F CORR03) has nothing left to join. */
type RouteMove = "rise" | "fall" | "fade" | "load";
const SCENE_ROUTES = ["/studio", "/services", "/products"];
const SCENE_PARENT: Record<string, string> = { "/products/ccos": "/products" };
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const SLIDE_S = 0.7;
const SLIDE_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

function routeMove(from: string, to: string): RouteMove {
  if (from === "/" && SCENE_ROUTES.includes(to)) return "rise";
  if (SCENE_ROUTES.includes(from) && to === "/") return "fall";
  if (SCENE_PARENT[to] === from) return "rise";
  if (SCENE_PARENT[from] === to) return "fall";
  return "fade";
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
  const routeKey = location.pathname;

  const shellRef = useRef<HTMLDivElement>(null);
  /* `from` is the outgoing page's scroll offset, read while rendering the new
     location (ScrollRestoration has not moved the window yet); null on the
     first load. "load" marks the first page, which has no swap. */
  const moveRef = useRef<{ key: string; path: string; move: RouteMove; from: number | null }>({
    key: location.key,
    path: location.pathname,
    move: "load",
    from: null,
  });
  if (moveRef.current.key !== location.key) {
    moveRef.current = {
      key: location.key,
      path: location.pathname,
      move: routeMove(moveRef.current.path, location.pathname),
      from: typeof window !== "undefined" ? window.scrollY : 0,
    };
  }
  const move: RouteMove = transition.reduced ? "fade" : moveRef.current.move;

  /* NAV-T4 (OPERATOR: swaps from a scrolled page flashed). The new location
     scrolls the window (top, or the restored offset on Back), but the popped
     outgoing page sits at its own top in the document, so for the whole exit
     it showed its cover — Studio's lockup and `COLLAPSE CREATIVE` header, its
     bar gone — instead of the screen being left. The popped page is held
     where it was on screen: translated by (window scroll - its old offset),
     re-applied on every scroll until it is gone (then the listener drops
     itself). Written on the popped node only, never on the shell, so no
     style recalculation reaches the incoming page. */
  useIsomorphicLayoutEffect(() => {
    const shell = shellRef.current;
    const from = moveRef.current.from;
    if (!shell || from === null) return;
    const stop = () => window.removeEventListener("scroll", sync);
    function sync() {
      const popped = shell?.querySelector<HTMLElement>(":scope > .site-stage > [data-motion-pop-id]");
      if (!popped) {
        stop();
        return;
      }
      popped.style.translate = `0 ${window.scrollY - from!}px`;
    }
    window.addEventListener("scroll", sync, { passive: true });
    sync();
    return stop;
  }, [location.key]);

  // Focus follows the INCOMING route. The new <main> mounts in the same commit
  // that pops the outgoing one (see the HOME-T1 note below), so attaching the
  // ref is the exact moment the new route owns focus. A pathname effect would
  // still be aiming at the outgoing <main>. Covers back/forward too, since any
  // route swap remounts this node; the first mount is skipped so a cold page
  // load does not steal focus from the document.
  const focusRoute = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    node.focus({ preventScroll: true });
  }, []);

  /* HOME-T1 (t_20261113_workv2 addendum): route swaps no longer flash. Under
     mode="wait" the outgoing route faded to 0 and unmounted BEFORE the
     incoming one mounted, so for every swap the stage was empty — bare body,
     collapsed document height, clamped scroll — the same dip GF09-F CORR03
     removed for CCOS-to-CCOS. mode="popLayout" mounts the incoming route at
     once, fully opaque, in flow; the outgoing route is popped out of layout
     (absolute, `[data-motion-pop-id]`, stacked above and inert in global.css)
     and fades out over it. The document is never empty. The coordinator's
     lead/leaving pose and onExitComplete -> endTransition are unchanged.
     NAV-T3: on "rise" the incoming route starts one screen down and slides up,
     painted above the popped Home (global.css, data-route-move); Home holds
     still underneath for the slide. On "fall" the popped scene route slides
     down over the incoming Home. */
  return (
    <NavigationContext.Provider value={transition}>
      <div className="site-shell" ref={shellRef} data-route={location.pathname} data-route-move={move}>
        <div className="site-stage">
          <AnimatePresence
            mode="popLayout"
            initial={false}
            custom={move}
            onExitComplete={transition.endTransition}
          >
            <motion.div
              key={routeKey}
              className="site-stage__route"
              initial={move === "rise" ? { y: "100vh" } : false}
              animate={{ opacity: 1, y: 0 }}
              exit="exit"
              variants={{
                exit: (m: RouteMove) =>
                  transition.reduced
                    ? { opacity: 1, transition: { duration: 0 } }
                    : m === "rise"
                      ? { opacity: 1, transition: { duration: SLIDE_S } }
                      : m === "fall"
                        ? { y: "100vh", transition: { duration: SLIDE_S, ease: SLIDE_EASE } }
                        : { opacity: 0, transition: { duration: 0.22 } },
              }}
              transition={
                transition.reduced
                  ? { duration: 0 }
                  : move === "rise"
                    ? { duration: SLIDE_S, ease: SLIDE_EASE }
                    : { duration: 0.22 }
              }
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
