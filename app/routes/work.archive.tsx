import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router";
import { SiteFooter } from "../components/SiteFooter";
import { GearMark } from "../components/marks/GearMark";
import { ProjectList } from "../components/ProjectList";
import { WorkIndexFilter } from "../components/work/WorkIndexFilter";
import { WorkPreviewPane } from "../components/work/WorkPreviewPane";
import { useBoundaryNav, useNavIdle } from "../motion/routeNav";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useStepScroll } from "../motion/stepScroll";
import { AVAILABLE_YEARS, DEFAULT_PREVIEW_ID, PROJECTS, TYPES, YEARS, typeLabel } from "../data/workProjects";

export function meta() {
  return [{ title: "CCDV — Work Archive" }];
}

/* Work archive (WORK-T2): the Work Index that used to close /work, now its own
   page, reached from the hub's `View all projects`. Thin masthead (as Studio /
   Services) and the M1 bar on phones.
   WORK-T3 (OPERATOR retouch): one screen tall on desktop. A top row carries
   the `\\Work Index` bar and both filters on one line; below it the project
   list (left) and the preview (right: a wide lead image over three cards,
   then the caption) for the active row.

   The six projects, YEARS and TYPES live in app/data/workProjects.ts (shared
   with Workcase). The Year filter is live for the years that have records
   (AVAILABLE_YEARS: 2026, 2025); 2024/2023 are drawn but native-disabled
   (D3). Year and Type are independent filters and combine (AND). D4: one view,
   no List / Mosaic switch. */

/* MTG02 — archive context restoration. The archive unmounts when a Workcase
   opens, so its Year/Type filters and scroll are kept in sessionStorage (per
   tab; survives a hard refresh; every access is try/catch-guarded and the page
   works without it).
     - `year` / `type` are written whenever they change.
     - `scrollY` (+ the history `scrollKey` it belongs to) is written just
       before a project link navigates to its Workcase.
   Arrival intent, decided once on mount:
     - POP (Back/Forward/reload)        -> restore year + type; scroll only if
                                           the saved scrollKey is this entry
                                           (otherwise the router's own scroll
                                           restoration stands).
     - PUSH with state.restore (the Workcase return links)
                                        -> restore year + type + scroll.
     - PUSH with state.filter (Workcase Year or Type link)
                                        -> select exactly that filter and clear
                                           the other, NO stale scroll, focus the
                                           Work Index.
     - anything else                    -> defaults. */
const CONTEXT_KEY = "ccdv.work.context";

const UNAVAILABLE_YEARS = YEARS.filter((year) => !AVAILABLE_YEARS.includes(year));

interface WorkContext {
  year: string | null;
  type: string | null;
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
    /* storage unavailable: the archive simply does not restore */
  }
}

function validType(value: unknown): string | null {
  return typeof value === "string" && TYPES.includes(value) ? value : null;
}

function validYear(value: unknown): string | null {
  return typeof value === "string" && AVAILABLE_YEARS.includes(value) ? value : null;
}

type Arrival =
  | { kind: "fresh" }
  | { kind: "restore"; scroll: boolean }
  | { kind: "filter"; year: string | null; type: string | null };

export default function WorkArchive() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const rootRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  useBoundaryNav(rootRef, resultsRef, ".masthead--work");
  useNavIdle(rootRef);
  const { reduced } = useMotionPolicy();
  useStepScroll(rootRef, null, reduced); // A3: the index, then the footer

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

  useEffect(() => {
    writeContext({ year, type });
  }, [year, type]);

  useLayoutEffect(() => {
    if (arrival.kind !== "restore" || !arrival.scroll) return;
    const { scrollY } = readContext();
    if (typeof scrollY === "number") window.scrollTo(0, scrollY);
  }, [arrival]);

  // Passive effect: runs after GlobalShell has attached <main> (and focused it),
  // so the Work Index is the final focus owner.
  useEffect(() => {
    if (arrival.kind !== "filter") return;
    const node = resultsRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "start" });
  }, [arrival]);

  const saveScrollForCase = () => {
    writeContext({ year, type, scrollY: window.scrollY, scrollKey: location.key });
  };

  // Years without records are native-disabled options (derived from the
  // data, not from position). The guard below is defense in depth: a year
  // that would return empty results can never be selected.
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
    <div className="r11 r11--work r11--work-archive" ref={rootRef}>
      <section
        ref={resultsRef}
        id="work-index"
        tabIndex={-1}
        className="work-index"
        aria-labelledby="work-index-title"
      >
        <div className="work-index__filters">
          <h1 className="work-index__title" id="work-index-title">
            <GearMark className="work-index__gear" fill="#141414" dotFill="#FEF36A" />
            {"\\\\Work Index"}
          </h1>
          <WorkIndexFilter
            label="Year"
            options={YEARS}
            value={year}
            onChange={selectYear}
            disabledOptions={UNAVAILABLE_YEARS}
          />
          <WorkIndexFilter label="Type" options={TYPES} value={type} onChange={setType} formatLabel={typeLabel} />
        </div>

        <div className="work-index__list" onMouseLeave={() => setPreviewId(DEFAULT_PREVIEW_ID)}>
          <ProjectList
            projects={filtered}
            activeId={previewId}
            onActiveChange={setPreviewId}
            onCaseNavigate={saveScrollForCase}
          />
        </div>

        <WorkPreviewPane project={previewProject} />
      </section>

      <SiteFooter />
    </div>
  );
}
