import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useNavigationType } from "react-router";
import { WorkSidebar } from "../components/work/WorkSidebar";
import { WorkArchiveTable } from "../components/work/WorkArchiveTable";
import { WorkArchivePreview } from "../components/work/WorkArchivePreview";
import { ARCHIVE_ROWS, DEFAULT_ARCHIVE_ROW, V3_ARCHIVE_CATEGORIES, V3_YEARS, typeLabel } from "../data/workProjects";

export function meta() {
  return [{ title: "CCDV — Work Archive" }];
}

/* N3 Work V3 Archive (t_20261124_ccdvn3work, OPERATOR, WORK V3 _ archive.svg
   1536 x 994): the same rail (its Year / Category lists are the filters, AND),
   the archive card with the project table (WorkArchiveTable) and the preview
   column (WorkArchivePreview). No shared bar, no footer. Rows are the
   artboard's (OPERATOR decision); hover or focus selects one, the ADG-ARC row
   by default.

   Context restoration (MTG02, kept): the archive unmounts when a Workcase
   opens, so its filters and scroll are kept in sessionStorage (per tab, every
   access guarded).
     - POP (Back / Forward / reload)  -> restore the filters; scroll only if the
                                         saved scrollKey is this entry.
     - PUSH with state.restore        -> restore filters + scroll (the Workcase
                                         return links).
     - PUSH with state.filter         -> exactly that one filter (Workcase's
                                         Year / Type links, the Featured rail);
                                         a legacy Type maps to its category.
     - anything else                  -> no filter. */
const CONTEXT_KEY = "ccdv.work.context";

interface WorkContext {
  year: string | null;
  category: string | null;
  scrollY?: number;
  scrollKey?: string;
}

interface WorkNavState {
  restore?: boolean;
  filter?: { year?: string; type?: string; category?: string };
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

type Arrival =
  | { kind: "fresh" }
  | { kind: "restore"; scroll: boolean }
  | { kind: "filter"; year: string | null; category: string | null };

export default function WorkArchive() {
  const location = useLocation();
  const navigationType = useNavigationType();

  const [arrival] = useState<Arrival>(() => {
    const state = (location.state ?? null) as WorkNavState | null;
    if (navigationType === "POP") return { kind: "restore", scroll: readContext().scrollKey === location.key };
    if (state?.filter) {
      // a metadata link carries ONE filter; the other is cleared
      const filterYear = validYear(state.filter.year);
      const filterCategory = filterYear ? null : validCategory(state.filter.category ?? state.filter.type);
      if (filterYear || filterCategory) return { kind: "filter", year: filterYear, category: filterCategory };
    }
    if (state?.restore) return { kind: "restore", scroll: true };
    return { kind: "fresh" };
  });

  const [year, setYear] = useState<string | null>(() => {
    if (arrival.kind === "filter") return arrival.year;
    if (arrival.kind === "restore") return validYear(readContext().year);
    return null;
  });
  const [category, setCategory] = useState<string | null>(() => {
    if (arrival.kind === "filter") return arrival.category;
    if (arrival.kind === "restore") return validCategory(readContext().category);
    return null;
  });
  const [selectedId, setSelectedId] = useState(DEFAULT_ARCHIVE_ROW);

  useEffect(() => {
    writeContext({ year, category });
  }, [year, category]);

  useLayoutEffect(() => {
    if (arrival.kind !== "restore" || !arrival.scroll) return;
    const { scrollY } = readContext();
    if (typeof scrollY === "number") window.scrollTo(0, scrollY);
  }, [arrival]);

  const rows = useMemo(
    () => ARCHIVE_ROWS.filter((entry) => (!year || entry.year === year) && (!category || entry.category === category)),
    [year, category],
  );

  // the preview follows the selection while it is listed, else the first row shown
  const selected =
    rows.find((entry) => entry.id === selectedId) ?? rows[0] ?? ARCHIVE_ROWS.find((entry) => entry.id === DEFAULT_ARCHIVE_ROW)!;

  const saveScrollForCase = () => {
    writeContext({ year, category, scrollY: window.scrollY, scrollKey: location.key });
  };

  return (
    <div className="r11 wv3" data-view="archive">
      <div className="wv3__frame">
        <WorkSidebar
          view="archive"
          marked={{ year: selected.year, category: selected.category }}
          year={year}
          category={category}
          onYear={setYear}
          onCategory={setCategory}
        />
        <section className="wv3-archive" id="work-index" aria-labelledby="work-title">
          <WorkArchiveTable rows={rows} selectedId={selected.id} onSelect={setSelectedId} />
          <WorkArchivePreview entry={selected} onCaseNavigate={saveScrollForCase} />
        </section>
      </div>
    </div>
  );
}
