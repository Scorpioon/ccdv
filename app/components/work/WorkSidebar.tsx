import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { WorkPixelBlock } from "./WorkPixelBlock";
import { ARCHIVE_ROWS, V3_ARCHIVE_CATEGORIES, V3_YEARS } from "../../data/workProjects";
import type { WorkView } from "./useWorkDeck";

/* N3 Work V3 rail (OPERATOR, WORK V3.svg / WORK V3 _ archive.svg). It stays
   put while the workspace's content moves (W-A1):
     - the gear and the 2 x 2 pixel mark (WorkPixelBlock): Home;
     - the yellow `Work` box (the page heading);
     - Year and Category, the archive's filters (AND; a head clears its
       group). W-A1 (OPERATOR: "I removed the filters from the upper screen;
       when going down, the filters appear"): hidden and inert on Featured,
       they open as the content moves down;
     - CC: DEV UNIT and the four other sections;
     - the view switch: `All projects ↓` / `Featured ↑`, which move the
       content (no page load); W-A1: plain typeface arrows.
   Fills: yellow is the active choice of a list (a head when nothing is
   chosen); white marks the year and category of the project in view. A
   category without rows is drawn but inert. */

const SECTIONS = [
  { label: "STUDIO", to: "/studio" },
  { label: "SERVICES", to: "/services" },
  { label: "PRODUCTS", to: "/products" },
  { label: "CONTACT", to: "/contact" },
];

const hasRows = (field: "year" | "category", value: string) => ARCHIVE_ROWS.some((entry) => entry[field] === value);

export function WorkSidebar({
  view,
  marked,
  year,
  category,
  onYear,
  onCategory,
  filtersAlways,
}: {
  view: WorkView;
  /** phones: the archive sits under Featured on one page, so its filters always show */
  filtersAlways: boolean;
  marked: { year: string | null; category: string | null };
  year: string | null;
  category: string | null;
  onYear: (value: string | null) => void;
  onCategory: (value: string | null) => void;
}) {
  const link = useTransitionLink();
  const filtersShown = filtersAlways || view !== "featured";

  const head = (field: "year" | "category") => {
    const none = (field === "year" ? year : category) === null;
    const set = field === "year" ? onYear : onCategory;
    return (
      <li>
        <button type="button" className="wv3-side__item wv3-side__head" aria-pressed={none} onClick={() => set(null)}>
          {field === "year" ? "[ YEAR ]" : "[ CATEGORY ]"}
        </button>
      </li>
    );
  };

  const entry = (field: "year" | "category", value: string) => {
    const text = field === "year" ? `[ ${value} ]` : value === "WEBSITE" ? `[${value}]` : `[ ${value} ]`;
    if (!hasRows(field, value)) {
      return (
        <span className="wv3-side__item" aria-disabled="true">
          {text}
        </span>
      );
    }
    const active = (field === "year" ? year : category) === value;
    const set = field === "year" ? onYear : onCategory;
    return (
      <button
        type="button"
        className="wv3-side__item"
        aria-pressed={active}
        data-marked={marked[field] === value && !active ? "" : undefined}
        onClick={() => set(active ? null : value)}
      >
        {text}
      </button>
    );
  };

  return (
    <aside className="wv3-side" data-view={view} aria-label="Work">
      <Link className="wv3-side__home" aria-label="CCDV — Home" {...link("/")}>
        <GearMark className="wv3-side__gear" fill="#1A1A1A" dotFill="#F2F2F2" />
        <WorkPixelBlock className="wv3-side__pixel" />
      </Link>

      <h1 className="wv3-side__title" id="work-title">
        <GearMark className="wv3-side__title-gear" fill="#1A1A1A" dotFill="#FEF36A" />
        Work
      </h1>

      <div className="wv3-side__filters" data-shown={filtersShown ? "" : undefined} inert={!filtersShown}>
        <div className="wv3-side__filters-inner">
          <ul className="wv3-side__list" aria-label="Year">
            {head("year")}
            {V3_YEARS.map((value) => (
              <li key={value}>{entry("year", value)}</li>
            ))}
          </ul>
          <ul className="wv3-side__list" aria-label="Category">
            {head("category")}
            {V3_ARCHIVE_CATEGORIES.map((value) => (
              <li key={value}>{entry("category", value)}</li>
            ))}
          </ul>
        </div>
      </div>

      <nav className="wv3-side__nav" aria-label="Sections">
        <p className="wv3-side__unit">
          <span className="wv3-side__sq" aria-hidden="true" />
          CC: DEV UNIT
          <span className="wv3-side__sq" aria-hidden="true" />
        </p>
        <ul>
          {SECTIONS.map(({ label, to }) => (
            <li key={to}>
              <Link className="wv3-side__section" to={to}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {view === "featured" ? (
        <Link className="wv3-side__view" to="/work/archive" preventScrollReset>
          All projects <span aria-hidden="true">↓</span>
        </Link>
      ) : (
        <Link className="wv3-side__view" to="/work" preventScrollReset>
          Featured <span aria-hidden="true">↑</span>
        </Link>
      )}
    </aside>
  );
}
