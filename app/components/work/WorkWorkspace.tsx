import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";
import { WorkSidebar } from "./WorkSidebar";
import { WorkMosaic } from "./WorkMosaic";
import { WorkArchiveTable } from "./WorkArchiveTable";
import { WorkArchivePreview } from "./WorkArchivePreview";
import { Workcase } from "../Workcase";
import { useWorkDeck, type WorkMove, type WorkView } from "./useWorkDeck";
import { useMotionPolicy } from "../../motion/reducedMotion";
import {
  ARCHIVE_ROWS,
  DEFAULT_ARCHIVE_ROW,
  FEATURED_PROJECTS,
  V3_ARCHIVE_CATEGORIES,
  V3_YEARS,
  WORKCASES,
  findProject,
  typeLabel,
  workcaseHref,
} from "../../data/workProjects";

/* N3 Work V3, W-A1 (OPERATOR): one Work workspace for /work (Featured),
   /work/archive and /work/:slug (a case), drawn once by the `work` layout
   route, so moving between them never loads a page (GlobalShell keeps one key
   for every /work path; no shared bar, no footer).

   Desktop (>= 1024): the rail (WorkSidebar) stays put; the content sits on a
   plane beside it and moves, as the CC.OS deck does (useWorkDeck: wheel,
   arrows, swipe; 0.8 s):
       Featured (0, 0)
       Archive  (0, 1)  ->  case (1, 1)
   down to the archive, right into a case. The URL follows every move, so
   links, Back / Forward and a reload land on the same view. The workspace
   fills the screen with the artboard's margins (51.2 around, the rail 185,
   the content from 260.2), the unit set by the screen's height.
   Phones / tablets: Featured, then the archive, on one natively scrolling
   page; `All projects` / `Featured` scroll to them; a case slides in over
   them from the right.

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

const hasRows = (field: "year" | "category", value: string) => ARCHIVE_ROWS.some((entry) => entry[field] === value);

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

function useDesktop() {
  const [desktop, setDesktop] = useState(false);
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
  const archiveRef = useRef<HTMLElement>(null);
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

  const featured = FEATURED_PROJECTS[0];
  const marked =
    view === "featured" ? { year: featured.year, category: featured.category } : { year: selected.year, category: selected.category };

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

  /* a filter chosen from inside a case returns to the archive */
  const filterFrom = (set: (value: string | null) => void) => (value: string | null) => {
    set(value);
    if (view === "case") navigate("/work/archive", { preventScrollReset: true });
  };

  /* phones: the views are one page, so the switch links scroll to them */
  const lastView = useRef<WorkView | null>(null);
  useEffect(() => {
    const previous = lastView.current;
    lastView.current = view;
    if (desktop || view === "case" || previous === "case") return;
    if (previous === null && view === "featured") return;
    const behavior: ScrollBehavior = reduced || previous === null ? "auto" : "smooth";
    if (view === "archive") archiveRef.current?.scrollIntoView({ behavior, block: "start" });
    else window.scrollTo({ top: 0, behavior });
  }, [view, desktop, reduced]);

  /* a case that comes in starts at its top */
  useEffect(() => {
    if (view === "case" && caseRef.current) caseRef.current.scrollTop = 0;
  }, [view, shownSlug]);

  const project = shownSlug ? findProject(shownSlug) : undefined;
  const caseData = shownSlug ? WORKCASES[shownSlug] : undefined;
  const plane = { "--v": view === "featured" ? 0 : 1, "--h": view === "case" ? 1 : 0 } as CSSProperties;
  const caseOpen = view === "case";

  return (
    <div className="r11 wv3" ref={rootRef} data-view={view}>
      <WorkSidebar
        view={view}
        marked={marked}
        year={year}
        category={category}
        onYear={filterFrom(setYear)}
        onCategory={filterFrom(setCategory)}
        filtersAlways={!desktop}
      />

      {/* N4 P-H A-14: the stage (Featured, archive, case) is the page's main landmark; the rail is its nav */}
      <main className="wv3-stage">
        <div className="wv3-plane" style={plane}>
          <div className="wv3-panel wv3-panel--featured" inert={desktop ? view !== "featured" : caseOpen}>
            <WorkMosaic reduced={reduced} />
          </div>

          <section
            ref={archiveRef}
            className="wv3-panel wv3-panel--archive wv3-archive"
            id="work-index"
            aria-label="All projects"
            data-deck-scroll
            inert={desktop ? view !== "archive" : caseOpen}
          >
            <WorkArchiveTable
              rows={rows}
              selectedId={selected.id}
              onSelect={setSelectedId}
              onOpenCase={(href) => navigate(href, { preventScrollReset: true })}
            />
            <WorkArchivePreview entry={selected} />
          </section>

          <section
            ref={caseRef}
            className="wv3-panel wv3-panel--case wv3-case"
            aria-label={project ? `Case study: ${project.name}` : "Case study"}
            data-deck-scroll
            inert={!caseOpen}
          >
            {project && caseData ? <Workcase project={project} data={caseData} /> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
