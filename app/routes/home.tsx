import { useRef } from "react";
import { SiteFooter } from "../components/SiteFooter";
import { HomeIdentity } from "../components/home/HomeIdentity";
import { HomeSections } from "../components/home/HomeSections";
import { useMotionPolicy } from "../motion/reducedMotion";
import { index, useSceneReveal } from "../motion/studioMotion";
import { useStepScroll } from "../motion/stepScroll";

export function meta() {
  return [
    { title: "CCDV — Collapse Creative Development Unit" },
    { name: "description", content: "Collapse Creative Development Unit — UX/UI, code and motion studio, part of Collapse Creative." },
  ];
}

/* N5 BH1 (OPERATOR): Home rebuilt to the BetterHome design. Two light panels on
   the grey ground: the identity panel (the page h1) and the section cards. The
   masthead and the five NavBand bands are gone from Home. The identity panel
   sits inside <main> because it carries the h1; the footer (contentinfo) stays
   outside it (N4 P-H A-14).

   Round 2 (t_20261125_ccdvn5home): the two panels take the shared spawn reveal
   (data-spawn, staggered by index) and the step scroll runs with no stops, so
   the page pages on the wheel like the other routes. */
export default function Home() {
  const { reduced } = useMotionPolicy();

  const rootRef = useRef<HTMLDivElement>(null);

  useSceneReveal(rootRef, reduced);
  useStepScroll(rootRef, null, reduced);

  return (
    <div className="r11 r11--home" ref={rootRef}>
      <main className="hm fit-frame">
        <section className="hm__panel hm__panel--id" data-spawn style={index(0)}>
          <HomeIdentity />
        </section>
        <section className="hm__panel hm__panel--nav" data-spawn style={index(1)}>
          <HomeSections />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
