import { useRef } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { WorkHero } from "../components/work/WorkHero";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle } from "../motion/routeNav";

export function meta() {
  return [{ title: "CCDV — Work" }];
}

/* Work hub (WORK-T2, OPERATOR): /work is an overview of the studio's work, not
   the index. The R1.1 five-cell masthead is gone; the thin masthead (shared
   with Studio / Services, motion/routeNav.ts) sits over the hub, and phones
   get the M1 bar. The hub's `View all projects` opens the archive
   (routes/work.archive.tsx), which carries the filters, the project list and
   the Workcase return context. */
export default function Work() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);

  useSceneReveal(rootRef, reduced);
  useBoundaryNav(rootRef, hubRef, ".masthead--work");
  useNavIdle(rootRef);

  return (
    <div className="r11 r11--work r11--work-hub" ref={rootRef}>
      <StudioMobileMenu current="/work" />
      <SiteMasthead variant="work" compact />

      <div ref={hubRef}>
        <WorkHero reduced={reduced} />
      </div>

      <SiteFooter />
    </div>
  );
}
