import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTransitionLink } from "./GlobalShell";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { StudioWheelTile } from "./marks/StudioWheelTile";
import { ServicesArrowTile } from "./marks/ServicesArrowTile";
import { ProductsMarkTile } from "./marks/ProductsMarkTile";
import { ContactMarkTile } from "./marks/ContactMarkTile";

/* N4 H6: one component for every route. Home gets the identity lockup only,
   with the mark as a non-link span. Each section variant adds the five-cell
   nav: the mark is a Link to "/" through useTransitionLink, and the five cells
   are plain react-router Links (the current cell is a span with aria-current,
   and CELL_ROUTES gives the others' targets). The shared bar is rendered once
   by GlobalShell, which passes `compact` for /studio, /services, /products and
   /contact. Work (/work and its sub-routes) renders no shared bar; Home and CC.OS
   have no shared bar either (CC.OS has no masthead at all). */
/* NAV-T3 (OPERATOR): section order is Studio, Services, Work, Products,
   Contact everywhere (masthead, Home bands, footer, M1 menu). */
const CELLS = ["[Studio]", "[Services]", "[Work]", "[Products]", "[Contact]"] as const;
const CELL_ROUTES = ["/studio", "/services", "/work", "/products", "/contact"] as const;

/* N4 P-I A-05: Work has no bar (N3), so it is not a variant; its cell is a
   plain link to /work */
type SectionVariant = "studio" | "services" | "products" | "contact";

const SECTION_NAV: Record<SectionVariant, { index: number; Tile: (props: { className?: string }) => ReactNode }> = {
  studio: { index: 0, Tile: StudioWheelTile },
  services: { index: 1, Tile: ServicesArrowTile },
  products: { index: 3, Tile: ProductsMarkTile },
  contact: { index: 4, Tile: ContactMarkTile },
};

export function SiteMasthead({ variant, compact = false }: { variant: "home" | SectionVariant; compact?: boolean }) {
  const link = useTransitionLink();
  const isHome = variant === "home";
  const nav = !isHome ? SECTION_NAV[variant as SectionVariant] : null;

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
      {isHome ? (
        <span className="masthead__mark" aria-current="page">
          {mark}
        </span>
      ) : (
        <Link className="masthead__mark" aria-label="CCDV — Home" {...link("/")}>
          {mark}
        </Link>
      )}

      {isHome ? (
        <>
          <h1 className="masthead__title">
            <span>Collapse Creative</span>
            <span>Development Unit</span>
          </h1>

          <div className="masthead__meta">
            <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
            <div>[ hello[@]collapsecreative.com ]</div>
            <div>
              [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
            </div>
          </div>

          <div className="masthead__lang">[ english ]</div>
          <span className="masthead__dot masthead__dot--a" aria-hidden="true" />
          <span className="masthead__dot masthead__dot--b" aria-hidden="true" />
        </>
      ) : (
        <nav className="cells" aria-label="Sections">
          {CELLS.map((label, i) => {
            const current = i === nav!.index;
            const Tile = nav!.Tile;
            const to = CELL_ROUTES[i];
            const content = (
              <>
                <span className="cell__label">{label}</span>
                {current && <Tile className="cell__tile" />}
                <span className="cell__dot" aria-hidden="true" />
              </>
            );
            /* N4 P-I A-06: every cell routes, so only the current one is a span */
            if (!current) {
              return (
                <Link key={label} className="cell" to={to}>
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
      )}
    </header>
  );
}
