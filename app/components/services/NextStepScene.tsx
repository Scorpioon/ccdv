/* Services R1 S4: Next step. The CC.OS chapter's editorial grammar (CcosScene:
   large underlined title row, a copy column, a black card with a light caption
   capsule, a light underlined chip link, a loose square) without its globe or
   graph, so it reads as its own ending.

     /contact  the black card, drawing the Contact Trace (verbatim path of
               work_assets/ccos_icons_r2/Contact_Trace.svg, light hairline);
               the whole card is the link, its capsule the visible label
     /work     the light chip link

   ServicesConnectors are the desktop hairlines that join the S3 cards to this
   scene: the bus under the three cards, the run to the title row and back to
   the S3 copy column, and the title row's arm down to the Contact card. The SVG
   covers the red mega-section exactly (0..1440 x 0..1236 artboard units, S3 in
   its top 536), so every coordinate is the one the CSS places the blocks at.
   Phones: no cross-scene connectors. */
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { NEXT_STEP_COPY } from "../../data/servicesScenes";
import { index } from "../../motion/studioMotion";

const CONTACT_TRACE =
  "M35.9785 96.6973L35.9775 96.6982L14.79 75.5107L90.3008 -7.4574e-06L111.134 20.833L130.187 1.77929L156.412 28.0068L156.455 27.9639L175.604 47.1123L148.71 74.0078L175.522 100.821L156.374 119.97L156.373 119.97L129.522 146.82L110.992 128.29L89.2803 150L35.9785 96.6973ZM137.491 101.087L110.833 74.4287L110.835 74.4268L110.414 74.0059L137.013 47.4072L111.142 21.5361L58.0215 74.6553L110.973 127.606L137.491 101.087Z";

export function NextStepScene() {
  return (
    <section className="sv-ns" aria-labelledby="services-next-step" data-scene>
      <h2 className="sv-ns__title" id="services-next-step" data-spawn style={index(0)}>
        Next step
      </h2>

      <p className="sv-ns__copy" data-spawn style={index(1)}>
        {NEXT_STEP_COPY}
      </p>

      <Link className="sv-ns__card" to="/contact" data-spawn style={index(2)}>
        <span className="sv-ns__art" aria-hidden="true">
          <svg viewBox="-10 -12 200 174" fill="none" focusable="false">
            <path className="sv-ns__trace" d={CONTACT_TRACE} />
          </svg>
        </span>
        <span className="sv-ns__caption">
          [ Start a project ] <span aria-hidden="true">→</span>
        </span>
      </Link>

      <Link className="sv-ns__cta" to="/work" data-spawn style={index(3)}>
        [ See the work ] <span aria-hidden="true">→</span>
      </Link>
      <span className="sv-ns__sq" aria-hidden="true" />
    </section>
  );
}

const CONNECTORS = [
  /* bus: the three card centres (584.33 / 917 / 1249.67) down to y534, joined */
  "M584.33 498V534M917 498V534M1249.67 498V534M584.33 534H1249.67",
  /* down from card 1 to the title row's middle, then back to the S3 copy column */
  "M584.33 534V679M660 679H215V512",
  /* the title row's right arm down to the Contact card's top centre */
  "M1290 679H1249.67V798",
];

export function ServicesConnectors() {
  return (
    <svg className="sv-sc" viewBox="0 0 1440 1236" fill="none" aria-hidden="true" focusable="false" data-scene>
      {CONNECTORS.map((d, i) => (
        <path key={d} className="sv-sc__line" d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
      ))}
    </svg>
  );
}
