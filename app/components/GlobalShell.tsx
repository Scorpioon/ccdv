import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { useLocation, useNavigationType } from "react-router";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import {
  useTransitionCoordinator,
  type TransitionDirection,
  type TransitionTarget,
} from "../motion/transitionCoordinator";
import { SiteMasthead } from "./SiteMasthead";
import { StudioMobileMenu } from "./StudioMobileMenu";

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
   otherwise. The fade itself does not use it.

   H3-1 (OPERATOR, Variant B): the ink beat is gone. The incoming page is
   opaque from its first frame and only the outgoing page fades out above it
   (the exit below is unchanged), so no ink shows between two pages. */
type RouteMove = "fade" | "load";
type RouteDir = "forward" | "back";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const FADE_OUT_S = 0.25;
const FADE_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
/* how long the arriving page counts as arriving (its pieces show at once):
   until the outgoing page, which fades over it, is gone */
const ARRIVE_MS = FADE_OUT_S * 1000 + 150;

/* H3-1 GH-A01: only the present route is the landmark. The route that is
   fading out (popped, still mounted for the exit) is `inert` — out of the
   accessibility tree and the tab order — and gives up the id, so the page
   never carries two #main-content. Two <main> elements still coexist for the
   length of the exit; only the incoming one is exposed. Lives inside the
   route's motion.div so it reads that route's presence. */
function RouteMain({
  focusRef,
  children,
}: {
  focusRef: (node: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const present = useIsPresent();
  return (
    <main ref={focusRef} tabIndex={-1} id={present ? "main-content" : undefined} inert={!present}>
      {children}
    </main>
  );
}

/* N1 (OPERATOR): the navigation bar belongs to the shell, not to a page. The
   four section pages share one thin bar (>= 768) and one M1 bar + menu
   (phones), rendered once beside the stage, so a swap between two sections
   never fades or moves it; only the current cell changes. Home and CC.OS keep
   their own mastheads for now, so for them the bar fades out with the page
   (and back in with the next section page). N2 (OPERATOR): Contact joins.

   `.site-chrome` is `display: contents` and carries the section's page class
   (`r11 r11--work`), so every bar rule scoped to the page keeps matching and
   the bar stays a direct child of `.site-shell` (sticky needs the tall box).
   The page driving it (motion/routeNav.ts) writes --nav-in / data-nav-idle
   here. Fade-out and fade-in are CSS (`data-chrome`), timed as the page. */
type ChromeSection = "studio" | "services" | "work" | "products" | "contact";
type ChromePhase = "on" | "in" | "leaving";
type ChromeState = { key: ChromeSection | null; shown: ChromeSection | null; phase: ChromePhase };
const CHROME_ROUTE: Record<ChromeSection, string> = {
  studio: "/studio",
  services: "/services",
  work: "/work",
  products: "/products",
  contact: "/contact",
};
const CHROME_UNMOUNT_MS = FADE_OUT_S * 1000 + 60;

function chromeSection(pathname: string): ChromeSection | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/studio") return "studio";
  if (path === "/services") return "services";
  if (path === "/products") return "products";
  if (path === "/contact") return "contact";
  if (path === "/work" || path.startsWith("/work/")) return "work";
  return null;
}

function nextChrome(state: ChromeState, section: ChromeSection | null): ChromeState {
  if (section) {
    const present = state.shown !== null && state.phase !== "leaving";
    return { key: section, shown: section, phase: present ? state.phase : "in" };
  }
  return { key: null, shown: state.shown, phase: "leaving" };
}

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

  /* the shared bar: derived while rendering, so it is in the DOM in the same
     commit as the incoming page (whose effects look it up); a bar that is
     leaving stays mounted for its fade, then goes */
  const section = chromeSection(location.pathname);
  const [chrome, setChrome] = useState<ChromeState>(() => ({
    key: section,
    shown: section,
    phase: section ? "on" : "leaving",
  }));
  if (chrome.key !== section) setChrome(nextChrome(chrome, section));
  useEffect(() => {
    if (chrome.phase !== "leaving" || chrome.shown === null) return;
    const timer = window.setTimeout(
      () => setChrome((current) => (current.phase === "leaving" ? { ...current, shown: null } : current)),
      CHROME_UNMOUNT_MS,
    );
    return () => window.clearTimeout(timer);
  }, [chrome.phase, chrome.shown]);

  /* while the new page arrives, its pieces (cover lockups, labels: data-spawn)
     come in on one short, even beat after the ground (global.css,
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
     (absolute, `[data-motion-pop-id]`, stacked above in global.css with
     pointer-events off, and `inert` through RouteMain) and fades out over
     it. The document is never empty. onExitComplete -> endTransition is
     unchanged. P2 CORR02: the exit is a real fade (1 -> 0), so Motion runs
     it instead of ending it at once. H3-1: the incoming route is opaque from
     its first frame (no entry fade, no ink beat); `isolation` on
     .site-stage__route keeps each route's z-indexes inside it, so the
     incoming chrome never paints over the route that is leaving. Reduced
     motion: the same swap, instant. */
  return (
    <NavigationContext.Provider value={transition}>
      <div
        className="site-shell"
        ref={shellRef}
        data-route={location.pathname}
        data-route-move={move}
        data-route-dir={dir}
      >
        {chrome.shown && (
          <div
            className={`r11 r11--${chrome.shown} site-chrome`}
            data-chrome={chrome.phase}
            inert={chrome.phase === "leaving"}
          >
            <StudioMobileMenu current={CHROME_ROUTE[chrome.shown]} />
            <SiteMasthead variant={chrome.shown} compact />
          </div>
        )}
        <div className="site-stage">
          <AnimatePresence mode="popLayout" initial={false} onExitComplete={transition.endTransition}>
            <motion.div
              key={routeKey}
              className="site-stage__route"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: transition.reduced ? { duration: 0 } : { duration: FADE_OUT_S, ease: FADE_EASE },
              }}
              transition={transition.reduced ? { duration: 0 } : { duration: FADE_OUT_S, ease: FADE_EASE }}
            >
              <RouteMain focusRef={focusRoute}>{children}</RouteMain>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </NavigationContext.Provider>
  );
}
