/* Studio cover (R3 OPUS CORR01 OC01-01): the V2 identity cover replaces the
   legacy "[Studio] :P" hero and the three black intro beats.

   Desktop (FB_R4_5.svg y0..1118, the 1536 x 864 first frame of E11): the
   identity lockup (gear 220, vertical pixel mark, "Collapse Creative /
   Development Unit", three meta lines), the "collapse" label and the loose
   squares, the Whois chip and copy on the left, and the panoramic sphere on the
   right (713 box at 694, 349). The Whois block is sticky inside a column that
   ends at the sphere's lower edge, so the copy travels down beside the sphere
   as the page scrolls and stops where it ends (E11 arrow).
   Phones (STUDIO_resp3-1.svg y0..1118): the lockup at 0.699, the meta lines and
   a square, the sphere, the large [Studio] label, then Whois. One sphere
   component (StudioMobileOrbit) serves both: its geometry is the same drawing.

   The thin masthead stays hidden over the whole cover. It is revealed by the
   Approach section's top edge (studio.tsx, addendum A3). */
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { StudioMobileOrbit } from "../marks/StudioMobileOrbit";
import { Chip } from "./studioMarks";
import { INK, LIGHT } from "./artworks";
import { index } from "../../motion/studioMotion";

export function StudioCover() {
  return (
    <section className="cv studio-grid" aria-label="Studio">
      <div className="cv__lockup">
        <GearMark className="cv__gear" fill={INK} dotFill={LIGHT} />
        <CcdvPixelMark variant="stack" className="cv__pixel" fill={INK} />
        <h1 className="cv__title">
          <span>Collapse Creative</span> <span>Development Unit</span>
        </h1>
        <div className="cv__meta">
          <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
          <div>[ hello[@]collapsecreative.com ]</div>
          <div>
            [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
          </div>
        </div>
      </div>
      <span className="cv__label" aria-hidden="true">
        collapse
      </span>
      <span className="cv__sq cv__sq--a" aria-hidden="true" />
      <span className="cv__sq cv__sq--b" aria-hidden="true" />
      <span className="cv__sq cv__sq--c" aria-hidden="true" />
      <span className="cv__sq cv__sq--d" aria-hidden="true" />
      <span className="cv__sq cv__sq--e" aria-hidden="true" />

      <div className="cv__orbit">
        <StudioMobileOrbit className="cv__sphere" />
      </div>

      {/* phones: the large page label of STUDIO_resp3-1 (desktop shows the
          identity title above as the page heading instead) */}
      <h1 className="cv__studio">[Studio]</h1>

      <div className="cv__whois-col">
        <div className="cv__whois" data-spawn style={index(0)}>
          <Chip tone="ink" as="p" className="cv__chip">
            {"Whois\\\\"}
          </Chip>
          <p>The CCDV. is a technical studio working across design, software development and applied research.</p>
          <p>
            Our background <strong>is in visual design and digital experiences.</strong> Today, we use that
            knowledge to <strong>build web applications</strong>, custom <strong>tools</strong> and{" "}
            <strong>software</strong> around how people actually work.
          </p>
          <p>We approach development and strategy through the interface, the underlying logic and the people who will use it.</p>
        </div>
      </div>
    </section>
  );
}
