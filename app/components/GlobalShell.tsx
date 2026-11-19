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
import { useLocation, useNavigationType } from "react-router";
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

/* P2 CORR02 (OPERATOR): ONE page transition for every navigation — a band,
   a masthead cell, the footer, the menu, a Back link, `collapse`, a typed
   link or the browser's Back / Forward: the old page fades to the ink ground
   and the new one fades in, fully drawn. It replaces NAV-T3's rise / fall
   (the rise exit animated nothing, so Motion ended it at once and the grey
   body showed while the new page slid up; the fall moved the whole page one
   screen down, which read as a scroll) and the plain 0.22s fade.

   The direction (`data-route-dir`) is kept for a later direction-aware
   motion: "back" for Home, a parent page (/products from /products/ccos,
   /work from a case), and the browser's Back / Forward (POP); "forward"
   otherwise. The fade itself does not use it. */
type RouteMove = "fade" | "load";
type RouteDir = "forward" | "back";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const FADE_OUT_S = 0.25;
const FADE_IN_S = 0.4;
const FADE_IN_DELAY_S = 0.12;
const FADE_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
/* how long the arriving page counts as arriving (its pieces show at once) */
const ARRIVE_MS = (FADE_IN_DELAY_S + FADE_IN_S) * 1000 + 150;

function routeDir(from: string, to: string, pop: boolean): RouteDir {
  if (pop || to === "/" || from.startsWith(`${to}/`)) return "back";
  return "forward";
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
  const navigationType = useNavigationType();
  const moveRef = useRef<{ key: string; path: string; move: RouteMove; dir: RouteDir; from: number | null }>({
    key: location.key,
    path: location.pathname,
    move: "load",
    dir: "forward",
    from: null,
  });
  if (moveRef.current.key !== location.key) {
    moveRef.current = {
      key: location.key,
      path: location.pathname,
      move: "fade",
      dir: routeDir(moveRef.current.path, location.pathname, navigationType === "POP"),
      from: typeof window !== "undefined" ? window.scrollY : 0,
    };
  }
  const { move, dir } = moveRef.current;

  /* while the new page fades in, its arrival pieces (cover lockups, labels:
     data-spawn) show with it instead of building after it (global.css,
     [data-arriving]); a first load keeps its own entrance */
  useIsomorphicLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell || moveRef.current.from === null) return;
    shell.setAttribute("data-arriving", "");
    const timer = window.setTimeout(() => shell.removeAttribute("data-arriving"), ARRIVE_MS);
    return () => {
      window.clearTimeout(timer);
      shell.removeAttribute("data-arriving");
    };
  }, [location.key]);

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
     and fades out over it. The document is never empty. onExitComplete ->
     endTransition is unchanged. P2 CORR02: the exit is a real fade (1 -> 0),
     so Motion runs it instead of ending it at once; the incoming route
     starts transparent and fades in a beat later, over the ink ground
     (global.css). Reduced motion: the same swap, instant. */
  return (
    <NavigationContext.Provider value={transition}>
      <div
        className="site-shell"
        ref={shellRef}
        data-route={location.pathname}
        data-route-move={move}
        data-route-dir={dir}
      >
        <div className="site-stage">
          <AnimatePresence mode="popLayout" initial={false} onExitComplete={transition.endTransition}>
            <motion.div
              key={routeKey}
              className="site-stage__route"
              initial={move === "load" ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: transition.reduced ? { duration: 0 } : { duration: FADE_OUT_S, ease: FADE_EASE },
              }}
              transition={
                transition.reduced
                  ? { duration: 0 }
                  : { duration: FADE_IN_S, delay: FADE_IN_DELAY_S, ease: FADE_EASE }
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
