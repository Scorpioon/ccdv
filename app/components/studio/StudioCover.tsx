/* Studio cover (R3 OPUS CORR01 OC01-01): the V2 identity cover replaces the
   legacy "[Studio] :P" hero and the three black intro beats.

   Desktop (FB_R4_5.svg y0..1118, the 1536 x 864 first frame of E11): the
   identity lockup (gear 220, vertical pixel mark, "Collapse Creative /
   Development Unit", three meta lines), the "collapse" label and the loose
   squares, the Whois chip and copy on the left, and the panoramic sphere on the
   right (713 box at 694, 349). The Whois block is sticky inside a column that
   ends at the sphere's lower edge, so the copy travels down beside the sphere
   as the page scrolls and stops where it ends (E11 arrow).
   N4 P-M: on desktop the Whois copy is staged. Only the first paragraph shows
   at step 1; the second and third (`data-later`, `--i` stagger) appear once the
   root carries `data-stage2` (studioMotion useCoverStage). CSS owns the hide.
   Phones (STUDIO_resp3-1.svg y0..1118): the lockup at 0.699, the meta lines and
   a square, the sphere, the large [Studio] label, then Whois. One sphere
   component (StudioMobileOrbit) serves both: its geometry is the same drawing.

   NAV-T3 (OPERATOR): the thin masthead appears once the lockup's lower edge
   has scrolled past the top (studio.tsx). `collapse` is a link Home (global),
   and the cover's pieces spawn in reading order: lockup, `collapse`, squares,
   Whois, sphere (after the page's rise when arriving from Home).

   A8 (OPERATOR): the lockup, `collapse` and squares a / b are Masthead V3
   (CoverMasthead); the h1 is [Studio] at every width (visually hidden on
   desktop, as on Services). */
import { CoverMasthead } from "../CoverMasthead";
import { StudioMobileOrbit } from "../marks/StudioMobileOrbit";
import { Chip } from "./studioMarks";
import { index } from "../../motion/studioMotion";

export function StudioCover() {
  return (
    <section className="cv studio-grid" aria-label="Studio">
      {/* Services R1 CORR01 addendum (fit): the 1440 x 1118 frame; on desktop
          it scales to fit the screen height and centres (global.css) */}
      <div className="cv__frame">
        <CoverMasthead page="Studio" />
        <span className="cv__sq cv__sq--c" aria-hidden="true" data-spawn style={index(2)} />
        <span className="cv__sq cv__sq--d" aria-hidden="true" data-spawn style={index(2)} />
        <span className="cv__sq cv__sq--e" aria-hidden="true" data-spawn style={index(2)} />

        <div className="cv__orbit" data-spawn style={index(4)}>
          <StudioMobileOrbit className="cv__sphere" />
        </div>

        {/* phones: the large page label of STUDIO_resp3-1 (desktop shows the
            identity title above as the page heading instead) */}
        <h1 className="sr-only">[Studio]</h1>

        <div className="cv__whois-col">
          <div className="cv__whois" data-spawn style={index(3)}>
            <Chip tone="ink" as="p" className="cv__chip">
              {"Whois\\\\"}
            </Chip>
            <p>The CCDV. is a technical studio working across design, software development and applied research.</p>
            <p data-later style={index(0)}>
              Our background <strong>is in visual design and digital experiences.</strong> Today, we use that
              knowledge to <strong>build web applications</strong>, custom <strong>tools</strong> and{" "}
              <strong>software</strong> around how people actually work.
            </p>
            <p data-later style={index(1)}>We approach development and strategy through the interface, the underlying logic and the people who will use it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
