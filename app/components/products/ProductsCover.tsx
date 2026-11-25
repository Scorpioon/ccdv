import { CoverMasthead } from "../CoverMasthead";
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
   the cube shows the current lit pattern (LitCube).

   A8 (OPERATOR): the lockup, `collapse` and squares a / b are Masthead V3
   (CoverMasthead), the light card on the ink. Phones now show the cover for
   the card alone (global.css). */
export function ProductsCover({ pattern, reduced }: { pattern: LitPattern; reduced: boolean }) {
  return (
    <section className="pv-cover" aria-label="CCDV">
      {/* P1b CORR03: the 1536 x 1243.73 frame; on desktop it scales to fit
          the screen height and centres, as the Studio / Services cover frames
          (global.css) */}
      <div className="pv-cover__frame">
        <CoverMasthead page="Products" />
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
          {/* N4 P-M: the text is staged over the cover's two pages; the first
              paragraph is on the first, the rest arrive with the second
              (data-later, global.css, read with the root's data-stage2) */}
          {PRODUCTS_INTRO.map((line, i) => (
            <p key={line} {...(i >= 1 ? { "data-later": "", style: index(i - 1) } : {})}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
