import { useEffect, useLayoutEffect, useRef } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { HexCube } from "../components/marks/HexCube";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { StudioMobileOrbit } from "../components/marks/StudioMobileOrbit";
import { WordReveal } from "../components/studio/WordReveal";
import { ApproachPanel } from "../components/studio/ApproachPanel";
import { BuildScene } from "../components/studio/BuildScene";
import { CcosScene } from "../components/studio/CcosScene";
import { GearOutlineMark, LILAC, OrbitMark, STROKE } from "../components/studio/artworks";
import { useMotionPolicy } from "../motion/reducedMotion";
import { useSceneReveal } from "../motion/studioMotion";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* Studio page, R3: a sequence of scenes in one native-scrolling document (no
   nested scroller, no scroll hijack; scene starts are proximity snap points,
   global.css "STUDIO R3").

     masthead (sticky, lilac -> compact light)
     S1  lilac cover      [Studio] + sphere, square grid           .studio-hero
     S2  black intro      three editorial beats                    .studio-intro
     S3  black Approach   interactive editorial panel              .studio-approach
     S4  lilac Build      intro + three active cards               .studio-lilac > .bu
     S5  lilac CC.OS      title, sphere, 7-node graph, link        .studio-lilac > .cs
     footer

   S4 and S5 are one lilac mega-section with the square grid (the cover is the
   other). Modules live in components/studio; motion presets and the reveal
   observer in motion/studioMotion.ts; the inventory is in the R3 report.

   Masthead collapse (R1-FB002-01): A = expanded lilac (--mh-p 0), B = compact
   light (--mh-p 1). The black intro's top edge is the controlling geometry; a
   pure function of that edge's position, no timers, no scroll ownership.
   `data-collapse="on"` is set from an effect: without JS the masthead is the
   plain full-size lilac one and scrolls away. */
export default function Studio() {
  const { reduced } = useMotionPolicy();

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);

  useSceneReveal(rootRef, reduced);

  /* Scroll-linked state, written straight to the DOM (no re-render per frame):
     the masthead collapse progress from the black intro's top edge and, on
     phones, the [Studio] title's ride-up. Reads happen before writes. */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    if (!root || !intro) return;
    /* the masthead's two heights in px, resolved from the same CSS variables the
       layout uses (they are calc() in --u, so they are measured, not parsed) */
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;width:0;height:0";
    root.appendChild(probe);
    let mhFull = 0;
    let mhRange = 0;
    const measure = () => {
      probe.style.height = "var(--mh-full)";
      mhFull = probe.getBoundingClientRect().height;
      probe.style.height = "var(--mh-range)";
      mhRange = probe.getBoundingClientRect().height;
    };

    let frame = 0;
    let lastP = "";
    let lastTuck = "";

    const update = () => {
      frame = 0;
      // reads
      const edgeTop = intro.getBoundingClientRect().top;
      const hero = heroRef.current;
      const heroH = hero ? hero.offsetHeight : 0;
      const scrolled = window.scrollY;

      // masthead progress from the black edge (0 where there is no range: phones)
      const mhNow = mhRange > 0 ? clamp01((mhFull - edgeTop) / mhRange) : 0;

      // writes
      const p = mhNow.toFixed(5);
      if (p !== lastP) {
        lastP = p;
        root.style.setProperty("--mh-p", p);
      }

      /* R1-FB001 (phones): [Studio] rides up with the page instead of being
         covered by the black edge: the distance scrolled, capped at the hero's
         height. Exact, never smoothed; unused by CSS from 768px up, and left at
         0 under reduced motion. */
      if (hero) {
        const tuck = reduced ? "0" : Math.min(Math.max(scrolled, 0), heroH).toFixed(1);
        if (tuck !== lastTuck) {
          lastTuck = tuck;
          hero.style.setProperty("--tuck", `${tuck}px`);
        }
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };

    root.setAttribute("data-collapse", "on");
    measure();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      probe.remove();
      if (frame) cancelAnimationFrame(frame);
      root.removeAttribute("data-collapse");
      root.style.removeProperty("--mh-p");
      heroRef.current?.style.removeProperty("--tuck");
    };
  }, [reduced]);

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      {/* M1: operator-designed phone header + menu; hidden from 768px up, where
          the masthead below stays as is (and is hidden on phones). */}
      <StudioMobileMenu />
      <SiteMasthead variant="studio" />

      <div className="studio-top">
        {/* S1: the lilac cover. It stays pinned while the black intro slides over
            it; the hero ends at the baseline of [Studio], so the black edge cuts
            the brackets there. The sphere is the cover's pause object on every
            width (R3 M01). */}
        <section className="studio-hero studio-grid" aria-labelledby="studio-hero" ref={heroRef}>
          <StudioMobileOrbit className="studio-hero__orbit" />
          <h1 className="studio-hero__label" id="studio-hero">
            [Studio]
          </h1>
          <span className="studio-hero__suffix" aria-hidden="true">
            :P
          </span>
        </section>

        {/* S2: three beats, each a paragraph with its own illustration. */}
        <section className="studio-intro" ref={introRef} aria-label="About the studio">
          <div className="studio-beat">
            <WordReveal
              className="studio-beat__text"
              text="Collapse Creative Dev. Unit is a technical studio working across design, software development and applied research."
            />
            <div className="studio-beat__figure" aria-hidden="true">
              <HexCube
                className="studio-hex"
                variant="interior"
                gradientFrom={LILAC}
                gradientTo="#5C377C"
                lineColor="#6E6E6E"
                lineWidth={STROKE}
              />
            </div>
          </div>
          <div className="studio-beat" data-side="right">
            <WordReveal
              className="studio-beat__text"
              text="We come from visual design and digital experiences. Today we use that knowledge to build web applications, custom tools and software around the way people actually work."
            />
            <div className="studio-beat__figure" aria-hidden="true">
              <OrbitMark />
            </div>
          </div>
          <div className="studio-beat">
            <WordReveal
              className="studio-beat__text"
              text="We approach development through three things: the interface, the underlying logic and the people who will use it."
            />
            <div className="studio-beat__figure" aria-hidden="true">
              <GearOutlineMark />
            </div>
          </div>
        </section>
      </div>

      {/* S3: the black Approach module under its lilac strip (a heading, not a
          disclosure: the panel is always open). */}
      <section className="studio-approach" aria-labelledby="studio-approach-title">
        <div className="studio-strip">
          <h2 className="studio-strip__heading" id="studio-approach-title">
            <span className="studio-strip__title">
              <span className="studio-strip__label">[Studio Approach]</span>
            </span>
          </h2>
        </div>
        <ApproachPanel reduced={reduced} />
      </section>

      {/* S4 + S5: the second lilac mega-section, with the same square grid. */}
      <div className="studio-lilac studio-grid">
        <BuildScene reduced={reduced} />
        <CcosScene reduced={reduced} />
      </div>

      <SiteFooter />
    </div>
  );
}
