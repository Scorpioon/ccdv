/* Services cover (Services R1 S1). The Studio V2 identity-cover grammar
   (StudioCover.tsx, FB_R4_5.svg y0..1118 / STUDIO_resp3-1.svg y0..1118) on the
   Services red: the same identity lockup, meta lines, "collapse" label and
   loose squares at the same artboard positions; the Whatis\\ chip and the
   three OPERATOR draft paragraphs in the Whois column; and the Rubik cube
   (RubikCube) in the box. Services has no V2 artboard of its own, so these
   are system positions, not a Services drawing.

   Heading: one h1 at every width. Phones show it as the large [Services] label
   (the Studio phone title role); desktop keeps the identity title as drawn and
   carries the h1 for assistive tech only (visually hidden), since the desktop
   cover grammar has no page label. NAV-T3 (OPERATOR): the thin masthead
   appears once the lockup's lower edge has scrolled past the top; `collapse`
   is a link Home (global); the pieces spawn in reading order as on Studio.
   A8 (OPERATOR): the lockup, `collapse` and squares a / b are Masthead V3
   (CoverMasthead). */
import { Fragment } from "react";
import { CoverMasthead } from "../CoverMasthead";
import { Chip } from "../studio/studioMarks";
import { RubikCube } from "./RubikCube";
import { SERVICES_WHATIS } from "../../data/servicesScenes";
import { indexGrids } from "../../data/servicesVoxels";
import { index } from "../../motion/studioMotion";

/* the cover's cube: the strategy category's grids (front, top, right), at a
   fixed rest pose; its pointer zone is the cover, not the Service Index */
const COVER_GRIDS = indexGrids("strategy");
const COVER_REST = { rx: 0.45, ry: -0.6 };

export function ServicesCover({ reduced }: { reduced: boolean }) {
  return (
    <section className="sv-cv sv-grid" aria-labelledby="services-title">
      {/* R1 CORR01: the 1440 x 1118 frame; on desktop it scales to fit the
          screen height and centres (global.css, "fit") */}
      <div className="sv-cv__frame">
        <CoverMasthead page="Services" />
        <span className="sv-cv__sq sv-cv__sq--c" aria-hidden="true" data-spawn style={index(2)} />
        <span className="sv-cv__sq sv-cv__sq--d" aria-hidden="true" data-spawn style={index(2)} />
        <span className="sv-cv__sq sv-cv__sq--e" aria-hidden="true" data-spawn style={index(2)} />

        <div className="sv-cv__art" data-spawn style={index(4)}>
          <RubikCube
            className="rc--outline"
            front={COVER_GRIDS[0]}
            top={COVER_GRIDS[1]}
            right={COVER_GRIDS[2]}
            category={0}
            reduced={reduced}
            rest={COVER_REST}
            zone=".sv-cv"
          />
        </div>

        <h1 className="sv-cv__services" id="services-title">
          [Services]
        </h1>

        <div className="sv-cv__whatis-col">
          <div className="sv-cv__whatis" data-spawn style={index(3)}>
            <Chip tone="ink" as="p" className="sv-cv__chip">
              {"Whatis\\\\"}
            </Chip>
            {/* N4 P-M: the first paragraph is the step-1 copy; the rest stage in
                on desktop (data-later, --i stagger; see studioMotion useCoverStage) */}
            {SERVICES_WHATIS.map((runs, i) => (
              <p key={i} data-later={i >= 1 || undefined} style={i >= 1 ? index(i - 1) : undefined}>
                {runs.map((run, j) =>
                  typeof run === "string" ? <Fragment key={j}>{run}</Fragment> : <strong key={j}>{run.strong}</strong>,
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
