import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { WorkPixelBlock } from "./WorkPixelBlock";
import { ARCHIVE_ROWS, V3_ARCHIVE_CATEGORIES, V3_FEATURED_CATEGORIES, V3_YEARS } from "../../data/workProjects";

/* N3 Work V3 (OPERATOR, WORK V3.svg / WORK V3 _ archive.svg): the light rail
   on the left of both Work views. It replaces the shared bar and the footer on
   /work and /work/archive:
     - the gear and the 2 x 2 pixel mark (WorkPixelBlock): Home;
     - the `Work` box (the page heading): white on Featured, yellow on Archive;
     - Year and Category: on Featured each entry opens the archive with that
       one filter (the state Workcase sends); on Archive the lists ARE the
       filters (the `[ YEAR ]` / `[ CATEGORY ]` heads clear their group);
     - CC: DEV UNIT and the four other sections;
     - the view switch: `All projects` / `Featured`.
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

type Marked = { year: string | null; category: string | null };

type SidebarProps =
  | { view: "featured"; marked: Marked }
  | {
      view: "archive";
      marked: Marked;
      year: string | null;
      category: string | null;
      onYear: (value: string | null) => void;
      onCategory: (value: string | null) => void;
    };

function ViewLink({ to, label, up }: { to: string; label: string; up: boolean }) {
  return (
    <Link className="wv3-side__view" to={to}>
      <span>{label}</span>
      <svg className="wv3-side__view-icon" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect x="0.5" y="0.5" width="11" height="11" fill="none" stroke="currentColor" />
        <path d={up ? "M6 9V3.5M3.5 6 6 3.5 8.5 6" : "M6 3v5.5M3.5 6 6 8.5 8.5 6"} fill="none" stroke="currentColor" />
      </svg>
    </Link>
  );
}

export function WorkSidebar(props: SidebarProps) {
  const link = useTransitionLink();
  const { view, marked } = props;
  const categories = view === "featured" ? V3_FEATURED_CATEGORIES : V3_ARCHIVE_CATEGORIES;

  const entry = (field: "year" | "category", value: string) => {
    const text = field === "year" ? `[ ${value} ]` : value === "WEBSITE" ? `[${value}]` : `[ ${value} ]`;
    const available = hasRows(field, value);
    const isMarked = marked[field] === value;
    if (!available) {
      return (
        <span className="wv3-side__item" aria-disabled="true">
          {text}
        </span>
      );
    }
    if (props.view === "featured") {
      return (
        <Link
          className="wv3-side__item"
          to="/work/archive"
          state={{ filter: { [field]: value } }}
          data-marked={isMarked ? "" : undefined}
          aria-label={`${field === "year" ? "Year" : "Category"} ${value}: show in the archive`}
        >
          {text}
        </Link>
      );
    }
    const active = (field === "year" ? props.year : props.category) === value;
    const set = field === "year" ? props.onYear : props.onCategory;
    return (
      <button
        type="button"
        className="wv3-side__item"
        aria-pressed={active}
        data-marked={isMarked && !active ? "" : undefined}
        onClick={() => set(active ? null : value)}
      >
        {text}
      </button>
    );
  };

  const head = (field: "year" | "category") => {
    if (props.view !== "archive") return null;
    const none = (field === "year" ? props.year : props.category) === null;
    const set = field === "year" ? props.onYear : props.onCategory;
    return (
      <li>
        <button type="button" className="wv3-side__item wv3-side__head" aria-pressed={none} onClick={() => set(null)}>
          {field === "year" ? "[ YEAR ]" : "[ CATEGORY ]"}
        </button>
      </li>
    );
  };

  return (
    <aside className="wv3-side" data-view={view} aria-label="Work">
      <Link className="wv3-side__home" aria-label="CCDV — Home" {...link("/")}>
        <GearMark className="wv3-side__gear" fill="#1A1A1A" dotFill="#F2F2F2" />
        <WorkPixelBlock className="wv3-side__pixel" />
      </Link>

      <h1 className="wv3-side__title" id="work-title">
        <GearMark className="wv3-side__title-gear" fill="#1A1A1A" dotFill={view === "archive" ? "#FEF36A" : "#FFFFFF"} />
        Work
      </h1>

      <ul className="wv3-side__list wv3-side__list--years" aria-label="Year">
        {head("year")}
        {V3_YEARS.map((value) => (
          <li key={value}>{entry("year", value)}</li>
        ))}
      </ul>

      <ul className="wv3-side__list wv3-side__list--categories" aria-label="Category">
        {head("category")}
        {categories.map((value) => (
          <li key={value}>{entry("category", value)}</li>
        ))}
      </ul>

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
        <ViewLink to="/work/archive" label="All projects" up={false} />
      ) : (
        <ViewLink to="/work" label="Featured" up />
      )}
    </aside>
  );
}
