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
import { STUDIO_MOTION, useSceneReveal } from "../motion/studioMotion";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

   Addendum A1 (idle hide): once the reader stands still for
   STUDIO_MOTION.navIdle, `data-nav-idle` on the root slides the bar (thin
   masthead and phone M1 bar alike) up out of view; the next scroll, either
   direction, brings it back. The hide uses the CSS `translate` property, so it
   stacks on the --nav-in transform with its own easing. CSS keeps the bar while
   it holds focus, the pointer or (phones) the open menu. */
const NAV_IDLE_MIN_SCROLL = 50; // px: the M1 bar's height; nearer the top the bar stays
export default function Studio() {
  const { reduced } = useMotionPolicy();

  const rootRef = useRef<HTMLDivElement>(null);
  const approachRef = useRef<HTMLElement>(null);

  useSceneReveal(rootRef, reduced);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const approach = approachRef.current;
    const nav = root?.querySelector<HTMLElement>(".masthead--studio");
    if (!root || !approach || !nav) return;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      // reads
      const navH = nav.offsetHeight;
      const edge = approach.getBoundingClientRect().top;
      // write (navH is 0 on phones, where the bar is not rendered)
      const p = navH > 0 ? clamp01((navH - edge) / navH).toFixed(4) : "1";
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let timer = 0;
    const settle = () => {
      timer = 0;
      if (window.scrollY > NAV_IDLE_MIN_SCROLL) root.setAttribute("data-nav-idle", "");
    };
    const onScroll = () => {
      if (root.hasAttribute("data-nav-idle")) root.removeAttribute("data-nav-idle");
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, STUDIO_MOTION.navIdle * 1000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      root.removeAttribute("data-nav-idle");
    };
  }, []);

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      {/* M1: operator-designed phone header + menu; hidden from 768px up, where
          the thin masthead below takes over (and is hidden on phones). */}
      <StudioMobileMenu />
      <SiteMasthead variant="studio" />

      <StudioCover />

      <section className="studio-approach" aria-labelledby="studio-approach-title" ref={approachRef}>
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
