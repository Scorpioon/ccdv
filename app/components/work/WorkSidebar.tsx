import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { WorkPixelBlock } from "./WorkPixelBlock";
import { WorkFilterLists } from "./WorkFilterLists";
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
   The two filter lists are WorkFilterLists (N4 P-J, shared with the phone /
   tablet layout). Desktop (>= 1024) only since P-J. */

const SECTIONS = [
  { label: "STUDIO", to: "/studio" },
  { label: "SERVICES", to: "/services" },
  { label: "PRODUCTS", to: "/products" },
  { label: "CONTACT", to: "/contact" },
];

export function WorkSidebar({
  view,
  marked,
  year,
  category,
  onYear,
  onCategory,
}: {
  view: WorkView;
  marked: { year: string | null; category: string | null };
  year: string | null;
  category: string | null;
  onYear: (value: string | null) => void;
  onCategory: (value: string | null) => void;
}) {
  const link = useTransitionLink();
  /* N4 P-J: the rail is desktop only (phones and tablets: WorkPhoneFilters) */
  const filtersShown = view !== "featured";

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
          <WorkFilterLists marked={marked} year={year} category={category} onYear={onYear} onCategory={onCategory} />
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
