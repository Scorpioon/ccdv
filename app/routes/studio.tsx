import { useEffect, useLayoutEffect, useRef } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { StudioCover } from "../components/studio/StudioCover";
import { ApproachPanel } from "../components/studio/ApproachPanel";
import { BuildScene } from "../components/studio/BuildScene";
import { CcosScene } from "../components/studio/CcosScene";
import { StudioConnectors } from "../components/studio/studioMarks";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* Studio page, R3 OPUS CORR01: the V2 originals' sequence of scenes in one
   natively scrolling document (no scroll snap, no nested scroller, no hijack).

     thin masthead (sticky, takes no height; slides in as the cover's lockup
     leaves, see below)
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
   position is one geometric response to one edge, the cover lockup's bottom:
   --nav-in = clamp((navH - lockupBottom) / navH), so the bar is pushed in
   exactly as the identity it repeats scrolls out, and nothing else (no black
   boundary, no timer) moves it. Without JS the bar stays tucked away and shows
   whenever focus is inside it (CSS). Phones keep the operator's M1 bar. */
export default function Studio() {
  const { reduced } = useMotionPolicy();

  const rootRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);

  useSceneReveal(rootRef, reduced);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const lockup = lockupRef.current;
    const nav = root?.querySelector<HTMLElement>(".masthead--studio");
    if (!root || !lockup || !nav) return;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      // reads
      const navH = nav.offsetHeight;
      const bottom = lockup.getBoundingClientRect().bottom;
      // write (navH is 0 on phones, where the bar is not rendered)
      const p = navH > 0 ? clamp01((navH - bottom) / navH).toFixed(4) : "1";
      if (p !== last) {
        last = p;
        root.style.setProperty("--nav-in", p);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      root.style.removeProperty("--nav-in");
    };
  }, []);

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      {/* M1: operator-designed phone header + menu; hidden from 768px up, where
          the thin masthead below takes over (and is hidden on phones). */}
      <StudioMobileMenu />
      <SiteMasthead variant="studio" />

      <StudioCover lockupRef={lockupRef} />

      <section className="studio-approach" aria-labelledby="studio-approach-title">
        <ApproachPanel reduced={reduced} titleId="studio-approach-title" />
      </section>

      <div className="studio-lilac studio-grid">
        <BuildScene reduced={reduced} />
        <CcosScene reduced={reduced} />
        <StudioConnectors />
      </div>

      <SiteFooter />
    </div>
  );
}
