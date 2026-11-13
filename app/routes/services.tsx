import { useRef } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { ServicesCover } from "../components/services/ServicesCover";
import { ServiceIndex } from "../components/services/ServiceIndex";
import { WorkWithScene } from "../components/services/WorkWithScene";
import { NextStepScene, ServicesConnectors } from "../components/services/NextStepScene";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle } from "../motion/routeNav";

export function meta() {
  return [{ title: "CCDV — Services" }];
}

/* Services R1 (t_20261113_servicesr1): the Studio scene grammar on the Services
   red, in one natively scrolling document (no scroll snap, no nested vertical
   scroller, no hijack). Replaces the R1.1 layout (stripe / hero / intro /
   CategorySelector + ServiceDetailPanel).

     thin masthead (sticky, takes no height; pushed in by the black Service
     Index's top edge, as Studio A3)
     S1  red cover       identity lockup, Whatis\\, Arrow Trace           .sv-cv
     S2  black index     bars, 3-disc sphere, categories, services, Focus  .sv-ix
     S3  red Work with   joined chip, copy, three cards                   .sv-ww
     S4  red Next step   title, copy, /contact card, /work link           .sv-ns
     footer

   S3 and S4 share one red mega-section with the square grid, joined on desktop
   by ServicesConnectors. Service data stays in data/servicesContent.ts (the one
   canonical source); scene copy is the provisional OPERATOR draft in
   data/servicesScenes.ts. Masthead: as Studio (A1/A3/A4), via
   motion/routeNav.ts; phones get the M1 bar and menu with Services current. */
export default function Services() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLElement>(null);

  useSceneReveal(rootRef, reduced);
  useBoundaryNav(rootRef, indexRef, ".masthead--services");
  useNavIdle(rootRef);

  return (
    <div className="r11 r11--services" ref={rootRef}>
      <StudioMobileMenu current="/services" />
      <SiteMasthead variant="services" compact />

      <ServicesCover reduced={reduced} />

      <section className="sv-index" aria-labelledby="services-index-title" ref={indexRef}>
        <ServiceIndex reduced={reduced} titleId="services-index-title" />
      </section>

      <div className="sv-red sv-grid">
        <WorkWithScene reduced={reduced} />
        <NextStepScene />
        <ServicesConnectors />
      </div>

      <SiteFooter />
    </div>
  );
}
