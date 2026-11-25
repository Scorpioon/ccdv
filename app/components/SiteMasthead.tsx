import type { ReactNode } from "react";
import { Link } from "react-router";
import type { TransitionTarget } from "../motion/transitionCoordinator";
import { useTransitionLink } from "./GlobalShell";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { StudioWheelTile } from "./marks/StudioWheelTile";
import { ServicesArrowTile } from "./marks/ServicesArrowTile";
import { ProductsMarkTile } from "./marks/ProductsMarkTile";
import { ContactMarkTile } from "./marks/ContactMarkTile";

/* N4 H6: one component for every section route. The mark is a Link to "/"
   through useTransitionLink, and the five cells are Links through the same
   hook (the current cell is a span with aria-current, and CELL_ROUTES gives the
   others' targets). The shared bar is rendered once by GlobalShell, which
   passes `compact` for /studio, /services, /products and /contact. Work
   (/work and its sub-routes) renders no shared bar; Home and CC.OS have no
   shared bar either (CC.OS has no masthead at all).
   N5 BH1: Home has its own identity panel, so there is no home variant. */
/* NAV-T3 (OPERATOR): section order is Studio, Services, Work, Products,
   Contact everywhere (masthead, Home bands, footer, M1 menu). */
const CELLS = ["[Studio]", "[Services]", "[Work]", "[Products]", "[Contact]"] as const;
const CELL_ROUTES: readonly TransitionTarget[] = ["/studio", "/services", "/work", "/products", "/contact"];

/* N4 P-I A-05: Work has no bar (N3), so it is not a variant; its cell is a
   plain link to /work */
type SectionVariant = "studio" | "services" | "products" | "contact";

const SECTION_NAV: Record<SectionVariant, { index: number; Tile: (props: { className?: string }) => ReactNode }> = {
  studio: { index: 0, Tile: StudioWheelTile },
  services: { index: 1, Tile: ServicesArrowTile },
  products: { index: 3, Tile: ProductsMarkTile },
  contact: { index: 4, Tile: ContactMarkTile },
};

export function SiteMasthead({ variant, compact = false }: { variant: SectionVariant; compact?: boolean }) {
  const link = useTransitionLink();
  const nav = SECTION_NAV[variant];

  /* N4 H6: the collapsed markup (inline pixel lockup, `masthead--collapsing`)
     is used for the `studio` variant and for any variant rendered with
     `compact`, which GlobalShell passes to the shared bar. The `--mh-p` (0..1)
     custom property that sizes it is no longer written by any script; global.css
     sets it to 1 in its own rules, so no scroll-driven collapse happens. The
     placement CSS for the compact bar is scoped to its route. */
  const collapsing = variant === "studio" || compact;

  const mark = (
    <>
      {/* Studio: the centre disc matches the #F2F2F2 light surface (feedback
          "change white"); the other routes keep #D9D9D9. */}
      <GearMark
        className="masthead__gear"
        fill="#141414"
        dotFill={collapsing ? "#F2F2F2" : "#D9D9D9"}
      />
      <CcdvPixelMark variant="stack" className="masthead__pixel" fill="#141414" />
      {collapsing && (
        <CcdvPixelMark variant="inline" className="masthead__pixel-inline" fill="#141414" />
      )}
    </>
  );

  return (
    <header className={`masthead masthead--${variant}${collapsing ? " masthead--collapsing" : ""}`}>
      <Link className="masthead__mark" aria-label="CCDV — Home" {...link("/")}>
        {mark}
      </Link>

      <nav className="cells" aria-label="Sections">
        {CELLS.map((label, i) => {
          const current = i === nav.index;
          const Tile = nav.Tile;
          const to = CELL_ROUTES[i];
          const content = (
            <>
              <span className="cell__label">{label}</span>
              {current && <Tile className="cell__tile" />}
              <span className="cell__dot" aria-hidden="true" />
            </>
          );
          /* N4 P-I A-06: every cell routes, so only the current one is a span.
             N5 BH2 (OPERATOR): the other cells go through the coordinator */
          if (!current) {
            return (
              <Link key={label} className="cell" {...link(to)}>
                {content}
              </Link>
            );
          }
          return (
            <span key={label} className="cell" aria-current="page">
              {content}
            </span>
          );
        })}
      </nav>
    </header>
  );
}
