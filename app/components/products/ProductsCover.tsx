import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { Chip } from "../studio/studioMarks";
import { FloatingCube } from "./FloatingCube";
import type { LitPattern } from "./LitCube";
import { PRODUCTS_INTRO } from "../../data/productsContent";
import { index } from "../../motion/studioMotion";

/* Products V2 cover (PRODUCTS_v2.svg y0..1243.73). The identity lockup,
   `collapse`, the loose squares and the Whois chip sit exactly where
   StudioCover puts them (same 1440 geometry, x1.0667 on this 1536 artboard),
   here light-on-ink with the green accent; the wireframe cube replaces
   Studio's sphere. Phones (PRODUCTS_responsive_v2.svg y50..557) keep only the
   cube: the M1 bar carries the identity, and the Whois block has no phone
   slot in the source.

   The lockup is not a link (as on Studio); `collapse` goes Home (NAV-T3). Its
   title is brand text, not the page heading — the route's h1 is "Products".
   P1b: the pieces spawn in reading order, as on Studio / Services (the cube
   last), so a swap into Products no longer paints the cube before the page;
   the cube shows the current lit pattern (LitCube). */
export function ProductsCover({ pattern, reduced }: { pattern: LitPattern; reduced: boolean }) {
  const link = useTransitionLink();
  return (
    <section className="pv-cover" aria-label="CCDV">
      {/* P1b CORR03: the 1536 x 1243.73 frame; on desktop it scales to fit
          the screen height and centres, as the Studio / Services cover frames
          (global.css) */}
      <div className="pv-cover__frame">
        <div className="pv-cover__lockup" data-spawn style={index(0)}>
          <GearMark className="pv-cover__gear" fill="#F2F2F2" dotFill="#5AE36F" />
          <CcdvPixelMark variant="stack" className="pv-cover__pixel" fill="#F2F2F2" />
          <p className="pv-cover__title">
            <span>Collapse Creative</span> <span>Development Unit</span>
          </p>
          <div className="pv-cover__meta">
            <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
            <div>[ hello[@]collapsecreative.com ]</div>
            <div>
              [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
            </div>
          </div>
        </div>
        <Link className="pv-cover__label" aria-label="collapse — back to Home" data-spawn style={index(1)} {...link("/")}>
          collapse
        </Link>
        <span className="pv-cover__sq pv-cover__sq--a" aria-hidden="true" data-spawn style={index(2)} />
        <span className="pv-cover__sq pv-cover__sq--b" aria-hidden="true" data-spawn style={index(2)} />
        <span className="pv-cover__sq pv-cover__sq--c" aria-hidden="true" data-spawn style={index(2)} />
        <span className="pv-cover__sq pv-cover__sq--d" aria-hidden="true" data-spawn style={index(2)} />
        <span className="pv-cover__sq pv-cover__sq--e" aria-hidden="true" data-spawn style={index(2)} />

        {/* A5: on desktop the cover's copy of the persistent cube (pv-float);
            A6: that copy is the 3D FloatingCube */}
        <FloatingCube className="pv-cover__cube pv-float" pattern={pattern} reduced={reduced} spawn={4} />

        <div className="pv-cover__whois" data-spawn style={index(3)}>
          <Chip tone="ink" as="p" className="pv-chip pv-cover__chip">
            {"Whois\\\\"}
          </Chip>
          {PRODUCTS_INTRO.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
