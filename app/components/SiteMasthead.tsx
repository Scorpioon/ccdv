import type { ReactNode } from "react";
import { Link } from "react-router";
import { useTransitionLink } from "./GlobalShell";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { StudioWheelTile } from "./marks/StudioWheelTile";
import { WorkGearTile } from "./marks/WorkGearTile";
import { ServicesArrowTile } from "./marks/ServicesArrowTile";

/* R1.1 gives Home one masthead and every other page the shared five-cell nav
   (Studio, Work and Services each export their own copy of it with a
   different cell filled and a different tile inside that cell — confirmed
   identical cell geometry across all three pages' SVGs). Only the identity
   lockup is common with Home. */

/* Work, Services, Products and Contact exist in R1.1 but Products/Contact
   have no route in this build, and GF07-C does not authorise inventing URLs.

   GF08-A4 CORRECTION 02 (supersedes the GF08-A2 "all five stay inert" note
   above): Studio/Work/Services are now the three *implemented* sections, so
   their cells route to one another — only Products/Contact (no route yet)
   stay present-but-inert. A plain `react-router` `Link` is used rather than
   `useTransitionLink`, deliberately: the transition coordinator's
   `TransitionTarget` union is narrowly `"/" | "/studio"` and this movement
   must not widen it or give the masthead new page-transition choreography —
   see NavBand's identical reasoning for its own Work/Services links. */
const CELLS = ["[Studio]", "[Work]", "[Services]", "[Products]", "[Contact]"] as const;
const CELL_ROUTES: Partial<Record<number, string>> = { 0: "/studio", 1: "/work", 2: "/services" };

type SectionVariant = "studio" | "work" | "services";

const SECTION_NAV: Record<SectionVariant, { index: number; Tile: (props: { className?: string }) => ReactNode }> = {
  studio: { index: 0, Tile: StudioWheelTile },
  work: { index: 1, Tile: WorkGearTile },
  services: { index: 2, Tile: ServicesArrowTile },
};

export function SiteMasthead({ variant }: { variant: "home" | SectionVariant }) {
  const link = useTransitionLink();
  const isHome = variant === "home";
  const nav = !isHome ? SECTION_NAV[variant as SectionVariant] : null;

  const mark = (
    <>
      <GearMark className="masthead__gear" fill="#202020" dotFill="#D9D9D9" />
      <CcdvPixelMark variant="stack" className="masthead__pixel" fill="#202020" />
    </>
  );

  return (
    <header className={`masthead masthead--${variant}`}>
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
            <span>Developent Unit</span>
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
            if (!current && to) {
              return (
                <Link key={label} className="cell" to={to}>
                  {content}
                </Link>
              );
            }
            return (
              <span
                key={label}
                className="cell"
                aria-current={current ? "page" : undefined}
                aria-disabled={current ? undefined : "true"}
              >
                {content}
              </span>
            );
          })}
        </nav>
      )}
    </header>
  );
}
