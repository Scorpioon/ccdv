import { useRef } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { StudioCover } from "../components/studio/StudioCover";
import { ApproachPanel } from "../components/studio/ApproachPanel";
import { BuildScene } from "../components/studio/BuildScene";
import { CcosScene } from "../components/studio/CcosScene";
import { StudioConnectors } from "../components/studio/studioMarks";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useCoverStage, useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle, usePinTop } from "../motion/routeNav";
import { useStepScroll } from "../motion/stepScroll";

export function meta() {
  return [
    { title: "CCDV — Studio" },
    { name: "description", content: "How CCDV works: approach, build process and the CC.OS system behind it." },
  ];
}

/* Studio page, R3 OPUS CORR01: the V2 originals' sequence of scenes in one
   natively scrolling document (no scroll snap, no nested scroller, no hijack).

     thin masthead (sticky, takes no height; pushed in by the black Approach
     section's top edge, see below)
     S1  lilac cover     identity lockup, Whois, panoramic sphere      .cv
     S2  black Approach  bars, layered sphere, strip + slots, copy     .ap
     S3  lilac Build     joined chip, copy, three cards                .bu
     S4  lilac CC.OS     title row, copy, globe, graph card, link      .cs
     footer

   S3 and S4 share one lilac mega-section with the square grid (the cover is the
   other); on desktop the V2 hairlines join them (StudioConnectors). Modules live
   in components/studio; motion presets and the reveal observer in
   motion/studioMotion.ts; the asset/component registry is in the R3 report.

   Masthead (OC01-02): only the thin "to be" state exists (E10, CSS). Its
   position is one geometric response to one edge. Addendum A3 moved that edge
   from the cover lockup's bottom to the black Approach section's top:
   --nav-in = clamp((navH - approachTop) / navH). The bar's lower edge rides the
   lilac/black boundary, so the bar first appears over the Approach section's
   empty top band and stays hidden over the whole cover. Scrolling back up over
   the cover hides it again. Without JS the bar stays tucked away and shows
   whenever focus is inside it (CSS). Phones keep the operator's M1 bar.

   Bar hide (A1, then A9, OPERATOR: summon-only): `data-nav-idle` on the shared
   chrome slides the bar (thin masthead and phone M1 bar alike) up out of view
   while the reader steps or scrolls down; up (or the page's end) brings it
   back. There is no idle timer. The hide uses the CSS `translate` property, so
   it stacks on the --nav-in transform with its own easing. CSS keeps the bar
   while it holds focus, the pointer or (phones) the open menu. */
export default function Studio() {
  const { reduced } = useMotionPolicy();

  const rootRef = useRef<HTMLDivElement>(null);
  const approachRef = useRef<HTMLElement>(null);
  const lilacRef = useRef<HTMLDivElement>(null);

  useSceneReveal(rootRef, reduced);
  useCoverStage(rootRef, ".cv", reduced);
  usePinTop(approachRef, lilacRef);
  // NAV-T3 (OPERATOR, supersedes A3's edge): the bar appears once the cover
  // lockup's lower edge has scrolled past, or when the Approach arrives on a
  // screen tall enough that the lockup never leaves. N1: the bar itself is the
  // shared GlobalShell chrome; this page only drives it (motion/routeNav.ts).
  // A8: the lockup is the V3 card (.cmh)
  useBoundaryNav(rootRef, approachRef, ".masthead--studio", ".cmh");
  useNavIdle(rootRef);
  // A3: one gesture, one rise; stops at the markers and the CC.OS scene
  useStepScroll(rootRef, ".pin-snap, .cs", reduced);

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      {/* NAV-T3 curtain + PIN-T1 pin (desktop, global.css): the cover pins
          while the Approach rises over it; the Approach then pins, one screen
          tall, while the lilac rises over it. The in-flow markers (`pin-snap`)
          are the stepper's stops (motion/stepScroll.ts, A3), since a sticky
          element's own position moves with it. N4 P-H A-14: the curtain is
          the main landmark, so the footer is the page's contentinfo */}
      <main className="scene-curtain">
        <StudioCover />

        <span className="pin-snap" aria-hidden="true" />
        <section className="studio-approach" aria-labelledby="studio-approach-title" ref={approachRef}>
          <ApproachPanel reduced={reduced} titleId="studio-approach-title" />
        </section>

        <span className="pin-snap" aria-hidden="true" />
        <div className="studio-lilac studio-grid" ref={lilacRef}>
          <BuildScene reduced={reduced} />
          <CcosScene reduced={reduced} />
          <StudioConnectors />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
