import { useRef } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { ServicesCover } from "../components/services/ServicesCover";
import { ServiceIndex } from "../components/services/ServiceIndex";
import { WorkWithScene } from "../components/services/WorkWithScene";
import { FormationScene } from "../components/services/FormationScene";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle, usePinTop } from "../motion/routeNav";
import { useStepScroll } from "../motion/stepScroll";

export function meta() {
  return [
    { title: "CCDV — Services" },
    { name: "description", content: "CCDV services: UX & information architecture, development, motion and formation." },
  ];
}

/* Services R1 (t_20261113_servicesr1): the Studio scene grammar on the Services
   red, in one natively scrolling document (no scroll snap, no nested vertical
   scroller, no hijack). Replaces the R1.1 layout (stripe / hero / intro /
   CategorySelector + ServiceDetailPanel).

     thin masthead (sticky, takes no height; pushed in by the black Service
     Index's top edge, as Studio A3)
     S1  red cover       identity lockup, Whatis\\, Arrow Trace           .sv-cv
     S2  black index     categories + voxel face left, editorial right    .sv-ix
     S3  red Work with   joined chip, copy, three animated cards          .sv-ww
     S4  red Formation   title, copy, cube formation, four cards          .sv-fm
     footer

   R1 CORR01 (SERVICES_v2): S2 is the 15-state voxel index, S3 the Diagnose /
   intelligence / modular cards, S4 the Formation scene (it replaces R1's Next
   step). S3 and S4 share one red mega-section with the square grid; S3's cards
   hang on one desktop bus. Service data stays in data/servicesContent.ts (the one
   canonical source); scene copy is the provisional OPERATOR draft in
   data/servicesScenes.ts. Masthead: as Studio (A1/A3/A4), via
   motion/routeNav.ts; phones get the M1 bar and menu with Services current. */
export default function Services() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const redRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement>(null);

  useSceneReveal(rootRef, reduced);
  // NAV-T3: the bar appears once the cover lockup (A8: the V3 card) has scrolled past
  useBoundaryNav(rootRef, indexRef, ".masthead--services", ".cmh");
  useNavIdle(rootRef);
  usePinTop(indexRef, redRef);
  usePinTop(pageRef); // N4 P-K D: the page holds at its end while the footer rises over it
  // A3: one gesture, one rise; stops at the markers and the Formation scene
  useStepScroll(rootRef, ".pin-snap, .sv-fm", reduced);

  return (
    <div className="r11 r11--services" ref={rootRef}>
      {/* NAV-T3 curtain + PIN-T1 pin (desktop, global.css): the cover pins
          while the index rises over it; the index then pins, one screen tall,
          while the red rises over it. The in-flow markers (`pin-snap`) are the
          stepper's stops (motion/stepScroll.ts, A3), since a sticky element's
          own position moves with it. N4 P-H A-14: the curtain is the main
          landmark, so the footer is the page's contentinfo. N4 P-K D
          (OPERATOR): `page-pin` makes the main hold at the page end (desktop)
          while the footer rises over it */}
      <main className="scene-curtain page-pin" ref={pageRef}>
        <ServicesCover reduced={reduced} />

        <span className="pin-snap" aria-hidden="true" />
        <section className="sv-index" aria-labelledby="services-index-title" ref={indexRef}>
          <ServiceIndex reduced={reduced} titleId="services-index-title" />
        </section>

        <span className="pin-snap" aria-hidden="true" />
        <div className="sv-red sv-grid" ref={redRef}>
          <WorkWithScene reduced={reduced} />
          <FormationScene reduced={reduced} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
