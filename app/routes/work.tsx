import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigationType } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { FilterGroup } from "../components/FilterGroup";
import { ProjectList } from "../components/ProjectList";
import { ProjectMosaic } from "../components/ProjectMosaic";
import { ViewSelector, type WorkView } from "../components/ViewSelector";
import { AVAILABLE_YEARS, DEFAULT_PREVIEW_ID, PROJECTS, TYPES, YEARS } from "../data/workProjects";

export function meta() {
  return [{ title: "CCDV — Work" }];
}

/* Work is a 1195-tall artboard: 268.12 masthead, 31 stripe, 177 hero,
   31 stripe, 527 explorer (filters + list + preview), 160 footer — the
   literal rect heights from pages_work.svg, summing unchanged.

   The six projects, YEARS and TYPES live in app/data/workProjects.ts (shared
   with Workcase). MTG02 CORR01 (FB002): the Year filter is live for the years
   that have records (AVAILABLE_YEARS: 2026, 2025); 2024/2023 have none and
   are native-disabled options (MTG02 CORR02). Year and Type are independent filters and combine (AND).

   FB001: the explorer section is `min-height` 527 (see global.css), not a
   fixed height — the six List rows need ~561u, and the fixed 527u let them
   overflow beneath the footer. */

/* MTG02 — Work context restoration. Work unmounts when a Workcase opens, so
   its Year/Type filters, desktop List/Mosaic choice and scroll are kept in
   sessionStorage (per tab; survives a hard refresh; every access is
   try/catch-guarded and the page works without it).
     - `year` / `type` / `view` are written whenever they change.
     - `scrollY` (+ the history `scrollKey` it belongs to) is written just
       before a project link navigates to its Workcase.
   Arrival intent, decided once on mount:
     - POP (Back/Forward/reload)        -> restore type + view; scroll only if
                                           the saved scrollKey is this entry
                                           (otherwise the router's own scroll
                                           restoration stands).
     - PUSH with state.restore (the three Workcase return links)
                                        -> restore year + type + view + scroll.
     - PUSH with state.filter (Workcase Year or Type link)
                                        -> select exactly that filter and clear
                                           the other, keep the view, NO stale
                                           scroll, focus the results area.
     - anything else                    -> defaults. */
const CONTEXT_KEY = "ccdv.work.context";

const UNAVAILABLE_YEARS = YEARS.filter((year) => !AVAILABLE_YEARS.includes(year));

interface WorkContext {
  year: string | null;
  type: string | null;
  view: WorkView;
  scrollY?: number;
  scrollKey?: string;
}

interface WorkNavState {
  restore?: boolean;
  filter?: { year?: string; type?: string };
}

function readContext(): Partial<WorkContext> {
  try {
    const raw = window.sessionStorage.getItem(CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as Partial<WorkContext>) : {};
  } catch {
    return {};
  }
}

function writeContext(patch: Partial<WorkContext>) {
  try {
    window.sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({ ...readContext(), ...patch }));
  } catch {
    /* storage unavailable: Work simply does not restore */
  }
}

function validType(value: unknown): string | null {
  return typeof value === "string" && TYPES.includes(value) ? value : null;
}

function validYear(value: unknown): string | null {
  return typeof value === "string" && AVAILABLE_YEARS.includes(value) ? value : null;
}

function validView(value: unknown): WorkView {
  return value === "mosaic" ? "mosaic" : "list";
}

type Arrival =
  | { kind: "fresh" }
  | { kind: "restore"; scroll: boolean }
  | { kind: "filter"; year: string | null; type: string | null };

export default function Work() {
  const location = useLocation();
  const navigationType = useNavigationType();

  const [arrival] = useState<Arrival>(() => {
    const state = (location.state ?? null) as WorkNavState | null;
    if (navigationType === "POP") return { kind: "restore", scroll: readContext().scrollKey === location.key };
    if (state?.filter) {
      // a metadata link carries ONE filter; the other is cleared
      const filterYear = validYear(state.filter.year);
      const filterType = filterYear ? null : validType(state.filter.type);
      if (filterYear || filterType) return { kind: "filter", year: filterYear, type: filterType };
    }
    if (state?.restore) return { kind: "restore", scroll: true };
    return { kind: "fresh" };
  });

  const [year, setYear] = useState<string | null>(() => {
    if (arrival.kind === "filter") return arrival.year;
    if (arrival.kind === "restore") return validYear(readContext().year);
    return null;
  });
  const [type, setType] = useState<string | null>(() => {
    if (arrival.kind === "filter") return arrival.type;
    if (arrival.kind === "restore") return validType(readContext().type);
    return null;
  });
  const [previewId, setPreviewId] = useState<string>(DEFAULT_PREVIEW_ID);
  /* Desktop view choice only. Both views stay mounted and CSS shows one
     (`data-view`), so <=767px can force List without any viewport state. */
  const [view, setView] = useState<WorkView>(() =>
    arrival.kind === "fresh" ? "list" : validView(readContext().view),
  );
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    writeContext({ year, type, view });
  }, [year, type, view]);

  useLayoutEffect(() => {
    if (arrival.kind !== "restore" || !arrival.scroll) return;
    const { scrollY } = readContext();
    if (typeof scrollY === "number") window.scrollTo(0, scrollY);
  }, [arrival]);

  // Passive effect: runs after GlobalShell has attached <main> (and focused it),
  // so the results area is the final focus owner.
  useEffect(() => {
    if (arrival.kind !== "filter") return;
    const node = resultsRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "start" });
  }, [arrival]);

  const saveScrollForCase = () => {
    writeContext({ year, type, view, scrollY: window.scrollY, scrollKey: location.key });
  };

  // Years without records are passed to FilterGroup as native-disabled options
  // (derived from the data, not from position). The guard below is defense in
  // depth: a year that would return empty results can never be selected.
  const selectYear = (value: string | null) => {
    if (value === null || AVAILABLE_YEARS.includes(value)) setYear(value);
  };

  const filtered = useMemo(
    () =>
      PROJECTS.filter(
        (project) => (!year || project.year === year) && (!type || project.typeFilter === type),
      ),
    [year, type],
  );

  const previewProject =
    PROJECTS.find((project) => project.id === previewId) ?? PROJECTS.find((project) => project.id === DEFAULT_PREVIEW_ID)!;

  return (
    <div className="r11 r11--work">
      <SiteMasthead variant="work" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="work-hero">
        <h1 className="band__label" id="work-hero">
          [Work]
        </h1>
        <span className="band__suffix" style={{ left: "calc(722 * var(--u))" }}>
          +.+
        </span>
        <Link
          className="hero__watermark"
          to="/"
          state={{ from: "work" }}
          aria-label="collapse — back to Home"
        >
          collapse
        </Link>
      </section>

      <div className="section section--stripe" />

      <section
        ref={resultsRef}
        tabIndex={-1}
        className="section section--work-explorer"
        aria-label="Work projects"
        data-view={view}
      >
        <div className="work-filters">
          <FilterGroup
            label="Year"
            options={YEARS}
            value={year}
            onChange={selectYear}
            align="start"
            disabledOptions={UNAVAILABLE_YEARS}
          />
          <div className="work-filters__end">
            <FilterGroup label="Type" options={TYPES} value={type} onChange={setType} align="end" />
            <ViewSelector value={view} onChange={setView} />
          </div>
        </div>

        <div className="work-layout">
          <div className="work-layout__list" onMouseLeave={() => setPreviewId(DEFAULT_PREVIEW_ID)}>
            <ProjectList
              projects={filtered}
              activeId={previewId}
              onActiveChange={setPreviewId}
              onCaseNavigate={saveScrollForCase}
            />
          </div>

          <div className="work-preview" role="status" aria-live="polite">
            <p className="work-preview__name">{previewProject.name}</p>
            <p className="work-preview__note">[ preview unavailable ]</p>
          </div>
        </div>

        <ProjectMosaic projects={filtered} onCaseNavigate={saveScrollForCase} />
      </section>

      <SiteFooter />
    </div>
  );
}
