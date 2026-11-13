/* Services cover (Services R1 S1). The Studio V2 identity-cover grammar
   (StudioCover.tsx, FB_R4_5.svg y0..1118 / STUDIO_resp3-1.svg y0..1118) on the
   Services red: the same identity lockup, meta lines, "collapse" label and
   loose squares at the same artboard positions; the Whatis\\ chip and the
   three OPERATOR draft paragraphs in the Whois column; and the enlarged Arrow
   Trace in the sphere's box. Services has no V2 artboard of its own, so these
   are system positions, not a Services drawing.

   Heading: one h1 at every width. Phones show it as the large [Services] label
   (the Studio phone title role); desktop keeps the identity title as drawn and
   carries the h1 for assistive tech only (visually hidden), since the desktop
   cover grammar has no page label. The masthead stays hidden over the cover. */
import { Fragment } from "react";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { Chip } from "../studio/studioMarks";
import { INK, LIGHT } from "../studio/artworks";
import { ArrowTrace } from "./ArrowTrace";
import { SERVICES_WHATIS } from "../../data/servicesScenes";
import { index } from "../../motion/studioMotion";

export function ServicesCover({ reduced }: { reduced: boolean }) {
  return (
    <section className="sv-cv sv-grid" aria-labelledby="services-title">
      <div className="sv-cv__lockup">
        <GearMark className="sv-cv__gear" fill={INK} dotFill={LIGHT} />
        <CcdvPixelMark variant="stack" className="sv-cv__pixel" fill={INK} />
        <p className="sv-cv__title">
          <span>Collapse Creative</span> <span>Development Unit</span>
        </p>
        <div className="sv-cv__meta">
          <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
          <div>[ hello[@]collapsecreative.com ]</div>
          <div>
            [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
          </div>
        </div>
      </div>
      <span className="sv-cv__label" aria-hidden="true">
        collapse
      </span>
      <span className="sv-cv__sq sv-cv__sq--a" aria-hidden="true" />
      <span className="sv-cv__sq sv-cv__sq--b" aria-hidden="true" />
      <span className="sv-cv__sq sv-cv__sq--c" aria-hidden="true" />
      <span className="sv-cv__sq sv-cv__sq--d" aria-hidden="true" />
      <span className="sv-cv__sq sv-cv__sq--e" aria-hidden="true" />

      <div className="sv-cv__art">
        <ArrowTrace reduced={reduced} className="sv-arrow" />
      </div>

      <h1 className="sv-cv__services" id="services-title">
        [Services]
      </h1>

      <div className="sv-cv__whatis-col">
        <div className="sv-cv__whatis" data-spawn style={index(0)}>
          <Chip tone="ink" as="p" className="sv-cv__chip">
            {"Whatis\\\\"}
          </Chip>
          {SERVICES_WHATIS.map((runs, i) => (
            <p key={i}>
              {runs.map((run, j) =>
                typeof run === "string" ? <Fragment key={j}>{run}</Fragment> : <strong key={j}>{run.strong}</strong>,
              )}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
