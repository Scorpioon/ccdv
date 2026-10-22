import { Link } from "react-router";
import { useTransitionLink } from "./GlobalShell";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { StudioWheelTile } from "./marks/StudioWheelTile";

/* R1.1 gives the two pages different mastheads on a shared 268.12 band:
   Home carries the wordmark, contact lines and two loose squares; Studio
   replaces all of that with five nav cells, the first of which is filled and
   holds the wheel tile. Only the identity lockup is common. */

/* Work, Services, Products and Contact exist in R1.1 but have no route in this
   build, and GF07-C does not authorise inventing URLs. They render as present
   but inert affordances rather than as links to nowhere. */
const CELLS = ["[Studio]", "[Work]", "[Services]", "[Products]", "[Contact]"] as const;

export function SiteMasthead({ variant }: { variant: "home" | "studio" }) {
  const link = useTransitionLink();
  const isHome = variant === "home";

  const mark = (
    <>
      <GearMark className="masthead__gear" fill="#202020" dotFill="#D9D9D9" />
      <CcdvPixelMark variant="stack" className="masthead__pixel" fill="#202020" />
    </>
  );

  return (
    <header className="masthead">
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
            const current = i === 0;
            return (
              <span
                key={label}
                className="cell"
                aria-current={current ? "page" : undefined}
                aria-disabled={current ? undefined : "true"}
              >
                <span className="cell__label">{label}</span>
                {current && <StudioWheelTile className="cell__tile" />}
                <span className="cell__dot" aria-hidden="true" />
              </span>
            );
          })}
        </nav>
      )}
    </header>
  );
}
