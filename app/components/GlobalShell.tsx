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
import { useLocation } from "react-router";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import { useTransitionCoordinator, type TransitionTarget } from "../motion/transitionCoordinator";
import { SiteMasthead } from "./SiteMasthead";
import { StudioMobileMenu } from "./StudioMobileMenu";

type RouteMotion = {
  go: (to: TransitionTarget) => void;
  endTransition: () => void;
  reduced: boolean;
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
    (to: TransitionTarget, options?: { onNavigate?: () => void }) => ({
      to,
      onClick(event: MouseEvent<HTMLAnchorElement>) {
        /* N5 BH2 (OPERATOR): fires on EVERY activation, native ones included,
           so the phone menu closes whichever way the link is opened */
        options?.onNavigate?.();
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        nav.go(to);
      },
    }),
    [nav],
  );
}

/* N5 BH2 (OPERATOR): the page transition follows the move, read from the real
   from / to paths for a link click and the browser's Back / Forward alike
   (so Back plays the reverse). `data-route-move` on .site-shell carries it:
     rise  Home -> a section: the section slides up over Home, which stays;
     fall  a section -> Home: the section drops away, revealing Home;
     next / prev  between neighbours in SEQ: both pages slide sideways, as
           one strip, next = towards the right neighbour;
     fade  everything else (non-adjacent sections, /products <-> /products/ccos,
           404 paths): the P2 CORR02 fade of the outgoing page, unchanged.
   Any /work/* path counts as /work. A move inside /work keeps one routeKey,
   so it never animates. The shared bar sits outside the moving route.
   H3-1 (OPERATOR, Variant B, kept): the incoming page is opaque, in flow, from
   its first frame; the popped outgoing page is layered by global.css
   (`data-route-move`). Slide / rise / fall run MOVE_S; reduced motion: instant.
   N4 P-I A-09: `data-route` had no reader and is gone. */
type RouteMove = "rise" | "fall" | "next" | "prev" | "fade";
const SEQ = ["/studio", "/services", "/work", "/products", "/contact"];
function normPath(path: string): string {
  const p = path.replace(/\/+$/, "") || "/";
  return p === "/work" || p.startsWith("/work/") ? "/work" : p;
}
function routeMove(fromPath: string, toPath: string): RouteMove {
  const from = normPath(fromPath);
  const to = normPath(toPath);
  const fi = SEQ.indexOf(from);
  const ti = SEQ.indexOf(to);
  if (from === "/" && ti >= 0) return "rise";
  if (to === "/" && fi >= 0) return "fall";
  if (fi >= 0 && ti >= 0 && Math.abs(ti - fi) === 1) return ti > fi ? "next" : "prev";
  return "fade";
}
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const FADE_OUT_S = 0.25;
const MOVE_S = 0.5;
const FADE_EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
/* how long the arriving page counts as arriving (its pieces show at once):
   until the outgoing page is gone (fade: it fades over; slides: MOVE_S) */
const arriveMs = (move: RouteMove) => (move === "fade" ? FADE_OUT_S : MOVE_S) * 1000 + 150;

/* N5 BH2: the route's variants. `custom` is the CURRENT move, read by the
   exiting route too (AnimatePresence custom), so the leaving page plays this
   navigation's exit, not the one it entered with. "enter" is the initial pose
   (AnimatePresence initial={false} still skips the first load). Final poses
   are x: 0 / y: 0, which Motion writes as transform "none". rise: the exit
   keeps the page in place for MOVE_S (opacity 0.999, because an exit that
   changes nothing ends at once, which NAV-T3 found); fall: the entry is
   static, the exit drops one screen. */
function routeTransition(reduced: boolean, duration: number) {
  return reduced ? { duration: 0 } : { duration, ease: FADE_EASE };
}
type RouteVariantCtx = { move: RouteMove; reduced: boolean };
const routeVariants = {
  enter: ({ move }: RouteVariantCtx) =>
    move === "next" ? { x: "100%" } : move === "prev" ? { x: "-100%" } : move === "rise" ? { y: "100vh" } : { opacity: 1 },
  center: ({ move, reduced }: RouteVariantCtx) => ({
    x: 0,
    y: 0,
    opacity: 1,
    transition: routeTransition(reduced, move === "fade" ? FADE_OUT_S : MOVE_S),
  }),
  exit: ({ move, reduced }: RouteVariantCtx) => {
    const transition = routeTransition(reduced, move === "fade" ? FADE_OUT_S : MOVE_S);
    if (move === "next") return { x: "-100%", transition };
    if (move === "prev") return { x: "100%", transition };
    if (move === "rise") return { opacity: 0.999, transition };
    if (move === "fall") return { y: "100vh", transition };
    return { opacity: 0, transition };
  },
};

/* H3-1 GH-A01: only the present route is the landmark. The route that is
   fading out (popped, still mounted for the exit) is `inert` — out of the
   accessibility tree and the tab order — and gives up the id, so the page
   never carries two #main-content. Two <main> elements still coexist for the
   length of the exit; only the incoming one is exposed. Lives inside the
   route's motion.div so it reads that route's presence.
   N4 P-H A-14 (OPERATOR): the route box is a plain focus target, not a
   landmark. Each page marks its own <main> (its body without the masthead
   and the footer), so Home's header is the banner and every footer is the
   contentinfo. #main-content stays here, the skip link's target. */
function RouteMain({
  focusRef,
  children,
}: {
  focusRef: (node: HTMLElement | null) => void;
  children: ReactNode;
}) {
  const present = useIsPresent();
  return (
    <div className="site-route" ref={focusRef} tabIndex={-1} id={present ? "main-content" : undefined} inert={!present}>
      {children}
    </div>
  );
}

/* N4 P-H A-14: the first stop in the tab order, shown only when focused. It
   moves focus by script, not by a hash link, so the router sees no navigation. */
function SkipLink() {
  return (
    <a
      className="skip-link"
      href="#main-content"
      onClick={(event) => {
        event.preventDefault();
        document.getElementById("main-content")?.focus();
      }}
    >
      Skip to content
    </a>
  );
}

/* N4 H6: N1 (OPERATOR): the navigation bar belongs to the shell, not to a page.
   The four section pages (Studio, Services, Products and, per N2, Contact) share
   one thin bar (>= 768) and one M1 bar + menu (phones), rendered once beside the
   stage, so a swap between two of them never fades or moves it; only the current
   cell changes. Work has no bar (N3), and Home and CC.OS keep their own mastheads
   with no shared bar, so on those routes the bar fades out with the page (and
   back in with the next section page). See chromeSection below.
   `.site-chrome` is `display: contents` and carries the section's page class
   (`r11 r11--studio` and so on), so every bar rule scoped to the page keeps matching and
   the bar stays a direct child of `.site-shell` (sticky needs the tall box).
   The page driving it (motion/routeNav.ts) writes --nav-in / data-nav-idle
   here. Fade-out and fade-in are CSS (`data-chrome`), timed as the page. */
type ChromeSection = "studio" | "services" | "products" | "contact"; // N4 P-I A-05: no "work"
type ChromePhase = "on" | "in" | "leaving";
type ChromeState = { key: ChromeSection | null; shown: ChromeSection | null; phase: ChromePhase };
const CHROME_ROUTE: Record<ChromeSection, string> = {
  studio: "/studio",
  services: "/services",
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
  /* N3 Work V3 (OPERATOR): the Work workspace has no bar — its rail carries
     Home and the sections. W-A1: a case study is part of the workspace too.
     Home, CC.OS and every other path have no bar either. */
  return null;
}

function nextChrome(state: ChromeState, section: ChromeSection | null): ChromeState {
  if (section) {
    const present = state.shown !== null && state.phase !== "leaving";
    return { key: section, shown: section, phase: present ? state.phase : "in" };
  }
  return { key: null, shown: state.shown, phase: "leaving" };
}

/* GF07-C: the shell paints no page header or footer of its own. Home, Work and
   CC.OS own their chrome; the four section pages share the bar rendered below
   (N1 / N4 H6, see ChromeSection). The component otherwise orchestrates the
   route: navigation context, the exit / enter presence (GF07-A), the skip link
   and incoming-route focus. */
export function GlobalShell({ children }: { children: ReactNode }) {
  const transition = useTransitionCoordinator();
  const location = useLocation();
  const initialMount = useRef(true);
  /* N3 W-A1: every /work path is one page (the Work workspace moves between
     its views itself), so it keeps one key and never fades or remounts */
  const routeKey = location.pathname === "/work" || location.pathname.startsWith("/work/") ? "/work" : location.pathname;

  const shellRef = useRef<HTMLDivElement>(null);
  /* `from` is the outgoing page's scroll offset, read while rendering the new
     location (ScrollRestoration has not moved the window yet); null on the
     first load, which has no swap. */
  const moveRef = useRef<{ key: string; path: string; move: RouteMove; from: number | null }>({
    key: location.key,
    path: location.pathname,
    move: "fade",
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
  const { move } = moveRef.current;
  const custom: RouteVariantCtx = { move, reduced: transition.reduced };

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
    const timer = window.setTimeout(() => shell.removeAttribute("data-arriving"), arriveMs(moveRef.current.move));
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
     motion: the same swap, instant.
     N5 BH2 (OPERATOR): the exit / entry now follow `data-route-move` (see
     routeVariants); `animate` is "center", the exit reads the current move
     through AnimatePresence `custom`. */
  return (
    <NavigationContext.Provider value={transition}>
      <div
        className="site-shell"
        ref={shellRef}
        data-route-move={move}
      >
        <SkipLink />
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
          <AnimatePresence mode="popLayout" initial={false} custom={custom} onExitComplete={transition.endTransition}>
            <motion.div
              key={routeKey}
              className="site-stage__route"
              variants={routeVariants}
              custom={custom}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <RouteMain focusRef={focusRoute}>{children}</RouteMain>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </NavigationContext.Provider>
  );
}
