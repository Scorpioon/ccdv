import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";
import { WorkSidebar } from "./WorkSidebar";
import { WorkMosaic } from "./WorkMosaic";
import { WorkArchiveTable } from "./WorkArchiveTable";
import { WorkArchivePreview } from "./WorkArchivePreview";
import { WorkPhoneHead } from "./WorkPhoneHead";
import { WorkPhoneFilters } from "./WorkPhoneFilters";
import { WorkPhoneFeatured } from "./WorkPhoneFeatured";
import { WorkPhoneWorks } from "./WorkPhoneWorks";
import { SiteFooter } from "../SiteFooter";
import { Workcase } from "../Workcase";
import { useWorkDeck, type WorkMove, type WorkView } from "./useWorkDeck";
import { useMotionPolicy } from "../../motion/reducedMotion";
import {
  ARCHIVE_ROWS,
  DEFAULT_ARCHIVE_ROW,
  V3_ARCHIVE_CATEGORIES,
  V3_YEARS,
  WORKCASES,
  findProject,
  hasRows,
  typeLabel,
  workcaseHref,
} from "../../data/workProjects";

/* N3 Work V3, W-A1 (OPERATOR): one Work workspace for /work (Featured),
   /work/archive and /work/:slug (a case), drawn once by the `work` layout
   route, so moving between them never loads a page (GlobalShell keeps one key
   for every /work path; no shared bar; phones / tablets end on the site
   footer, desktop has none).

   Desktop (>= 1024): the rail (WorkSidebar) stays put; the content sits on a
   plane beside it and moves, as the CC.OS deck does (useWorkDeck: wheel,
   arrows, swipe; 0.8 s):
       Featured (0, 0)
       Archive  (0, 1)  ->  case (1, 1)
   down to the archive, right into a case. The URL follows every move, so
   links, Back / Forward and a reload land on the same view. The workspace
   fills the screen with the artboard's margins (51.2 around, the rail 185,
   the content from 260.2), the unit set by the screen's height.
   Phones / tablets (N4 P-J, OPERATOR: WORK V3_responsive / _responsive2):
   their own layout, one natively scrolling page — the M1 menu bar and the
   `CCDV:WORK` card (WorkPhoneHead), the `Filtros` bar, the Featured / All
   works switch and the filters (WorkPhoneFilters), then either Featured
   (WorkPhoneFeatured) or All works (WorkPhoneWorks, one card per row); a
   filter chosen on Featured opens All works (N4 P-K: the switch is two
   buttons that set the list and replace the URL). A case slides in over the page from the right;
   the page is taken to its top first (B-01: the overlay is fixed inside the
   shell, whose `container-type` makes the shell its box) and put back on
   the way out.

   The archive's filters and selection live here, so they survive a case
   visit. Arrival: `state.filter` (Workcase's Year / Type links) selects that
   one filter; a reload or Back / Forward (POP) restores the last filters
   (sessionStorage, guarded); anything else starts unfiltered. */

const CONTEXT_KEY = "ccdv.work.context";
const DESKTOP = "(min-width: 1024px)";

interface WorkNavState {
  restore?: boolean;
  filter?: { year?: string; type?: string; category?: string };
}

function readContext(): { year?: unknown; category?: unknown } {
  try {
    const raw = window.sessionStorage.getItem(CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as { year?: unknown; category?: unknown }) : {};
  } catch {
    return {};
  }
}

function writeContext(value: { year: string | null; category: string | null }) {
  try {
    window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable: the archive simply does not restore */
  }
}

function validYear(value: unknown): string | null {
  return typeof value === "string" && V3_YEARS.includes(value) && hasRows("year", value) ? value : null;
}

/* a category, or a legacy V2 Type key (Workcase sends `type`: "WEBSITE",
   "CC:OS" -> "CC.OS"); one with no rows is not selectable */
function validCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const category = V3_ARCHIVE_CATEGORIES.includes(value) ? value : typeLabel(value);
  return V3_ARCHIVE_CATEGORIES.includes(category) && hasRows("category", category) ? category : null;
}

/* N4 P-J (B-9): the width is read on the first render (SPA, no server
   render), so a desktop never draws the phone layout for a frame */
function useDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(DESKTOP).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(DESKTOP);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function WorkWorkspace() {
  const { reduced } = useMotionPolicy();
  const desktop = useDesktop();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const caseRef = useRef<HTMLElement>(null);

  /* the layout's own params do not carry the child's :slug, so it is read
     from the path; an unknown slug is the child route's 404 */
  const path = location.pathname.replace(/\/+$/, "");
  const slug = path.startsWith("/work/") ? path.slice("/work/".length) : "";
  const caseSlug = slug && slug !== "archive" && workcaseHref(slug) ? slug : null;
  const view: WorkView = caseSlug ? "case" : path === "/work" ? "featured" : "archive";

  /* the case on the plane: kept after leaving, so it slides out drawn */
  const [shownSlug, setShownSlug] = useState<string | null>(caseSlug);
  useEffect(() => {
    if (caseSlug) setShownSlug(caseSlug);
  }, [caseSlug]);

  const [year, setYear] = useState<string | null>(() => {
    const state = location.state as WorkNavState | null;
    if (state?.filter) return validYear(state.filter.year);
    return navigationType === "POP" || state?.restore ? validYear(readContext().year) : null;
  });
  const [category, setCategory] = useState<string | null>(() => {
    const state = location.state as WorkNavState | null;
    if (state?.filter) return validYear(state.filter.year) ? null : validCategory(state.filter.category ?? state.filter.type);
    return navigationType === "POP" || state?.restore ? validCategory(readContext().category) : null;
  });
  const [selectedId, setSelectedId] = useState(DEFAULT_ARCHIVE_ROW);

  /* a metadata link (Workcase's Year / Type) arriving while the workspace is up */
  const arrivalKey = useRef(location.key);
  useEffect(() => {
    if (arrivalKey.current === location.key) return;
    arrivalKey.current = location.key;
    const filter = (location.state as WorkNavState | null)?.filter;
    if (!filter) return;
    const nextYear = validYear(filter.year);
    setYear(nextYear);
    setCategory(nextYear ? null : validCategory(filter.category ?? filter.type));
  }, [location.key, location.state]);

  useEffect(() => {
    writeContext({ year, category });
  }, [year, category]);

  const rows = useMemo(
    () => ARCHIVE_ROWS.filter((entry) => (!year || entry.year === year) && (!category || entry.category === category)),
    [year, category],
  );
  const selected =
    rows.find((entry) => entry.id === selectedId) ?? rows[0] ?? ARCHIVE_ROWS.find((entry) => entry.id === DEFAULT_ARCHIVE_ROW)!;

  const move = (to: WorkMove) => {
    if (to === "down" && view === "featured") navigate("/work/archive", { preventScrollReset: true });
    else if (to === "up" && view === "archive") navigate("/work", { preventScrollReset: true });
    else if (to === "in" && view === "archive") {
      const href = selected.projectId ? workcaseHref(selected.projectId) : undefined;
      if (!href) return false;
      navigate(href, { preventScrollReset: true });
    } else if (to === "out" && view === "case") navigate("/work/archive", { preventScrollReset: true, state: { restore: true } });
    else return false;
    return true;
  };

  useWorkDeck({ rootRef, enabled: desktop, reduced, view, move });

  /* a filter chosen from inside a case returns to the archive; on phones and
     tablets (N4 P-J) one chosen on Featured opens All works too */
  const filterFrom = (set: (value: string | null) => void) => (value: string | null) => {
    set(value);
    if (view === "case") navigate("/work/archive", { preventScrollReset: true });
    else if (!desktop && view === "featured") showList("archive");
  };

  /* N4 P-J: the list shown under a phone case is the one it was opened from
     (a direct load of a case shows All works) */
  const [list, setList] = useState<"featured" | "archive">(view === "featured" ? "featured" : "archive");
  useEffect(() => {
    if (view !== "case") setList(view);
  }, [view]);

  /* N4 P-K: the Featured / All works switch is two buttons, not two links; it
     sets the list at once and the URL follows (replace: the switch is a view
     of one page, not a history step) */
  const showList = (next: "featured" | "archive") => {
    setList(next);
    const to = next === "featured" ? "/work" : "/work/archive";
    if (path !== to) navigate(to, { replace: true, preventScrollReset: true });
  };

  /* N4 P-J (B-01): phones take the page to its top before a case shows, and
     back to where it was when the case leaves */
  const pageScroll = useRef<number | null>(null);
  useEffect(() => {
    if (desktop) return;
    if (view === "case") {
      if (pageScroll.current === null) {
        pageScroll.current = window.scrollY;
        window.scrollTo(0, 0);
      }
    } else if (pageScroll.current !== null) {
      const top = pageScroll.current;
      pageScroll.current = null;
      window.scrollTo(0, top);
    }
  }, [view, desktop]);

  /* a case that comes in starts at its top */
  useEffect(() => {
    if (view === "case" && caseRef.current) caseRef.current.scrollTop = 0;
  }, [view, shownSlug]);

  const project = shownSlug ? findProject(shownSlug) : undefined;
  const caseData = shownSlug ? WORKCASES[shownSlug] : undefined;
  const plane = { "--v": view === "featured" ? 0 : 1, "--h": view === "case" ? 1 : 0 } as CSSProperties;
  const caseOpen = view === "case";

  const caseSection = (
    <section
      ref={caseRef}
      className="wv3-panel wv3-panel--case wv3-case"
      aria-label={project ? `Case study: ${project.name}` : "Case study"}
      data-deck-scroll
      inert={!caseOpen}
    >
      {project && caseData ? <Workcase project={project} data={caseData} /> : null}
    </section>
  );

  if (!desktop) {
    /* N4 P-K: the footer is a sibling of .wv3 (not inside it: .wv3 redefines
       --u); the case overlay (fixed, z 30) covers it, inert keeps it out of reach */
    return (
      <>
        <div className="r11 wv3 wv3p" ref={rootRef} data-view={view}>
          <div className="wv3p-page" inert={caseOpen}>
            <WorkPhoneHead />
            <WorkPhoneFilters
              list={list}
              onList={showList}
              year={year}
              category={category}
              onYear={filterFrom(setYear)}
              onCategory={filterFrom(setCategory)}
            />
            <main className="wv3p-main" id="wv3p-list">
              {list === "featured" ? <WorkPhoneFeatured /> : <WorkPhoneWorks rows={rows} />}
            </main>
          </div>
          {caseSection}
        </div>
        <div className="r11 wv3p-foot" inert={caseOpen}>
          <SiteFooter />
        </div>
      </>
    );
  }

  return (
    <div className="r11 wv3" ref={rootRef} data-view={view}>
      <WorkSidebar
        view={view}
        year={year}
        category={category}
        onYear={filterFrom(setYear)}
        onCategory={filterFrom(setCategory)}
      />

      {/* N4 P-H A-14: the stage (Featured, archive, case) is the page's main landmark; the rail is its nav */}
      <main className="wv3-stage">
        <div className="wv3-plane" style={plane}>
          <div className="wv3-panel wv3-panel--featured" inert={view !== "featured"}>
            <WorkMosaic reduced={reduced} />
          </div>

          <section
            className="wv3-panel wv3-panel--archive wv3-archive"
            id="work-index"
            aria-label="All projects"
            data-deck-scroll
            inert={view !== "archive"}
          >
            <WorkArchiveTable
              rows={rows}
              selectedId={selected.id}
              onSelect={setSelectedId}
              onOpenCase={(href) => navigate(href, { preventScrollReset: true })}
            />
            <WorkArchivePreview entry={selected} />
          </section>

          {caseSection}
        </div>
      </main>
    </div>
  );
}
