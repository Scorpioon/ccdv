import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ClippedHeading } from "../components/ClippedHeading";
import { PrincipleCardStatic } from "../components/PrincipleCard";
import { HexCube } from "../components/marks/HexCube";
import { useMotionPolicy } from "../motion/reducedMotion";
import { STUDIO_PRINCIPLES } from "../data/studioPrinciples";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

/* R4-B06: the ink-tone principle (Build with WrkOps™) is no longer the fourth
   accordion row; it is the standalone chapter after Studio Approach. The cards
   still list all four principles. */
const WRKOPS_PRINCIPLE = STUDIO_PRINCIPLES.find((principle) => principle.fanTone === "ink")!;
const ACCORDION_PRINCIPLES = STUDIO_PRINCIPLES.filter((principle) => principle.fanTone !== "ink");

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const delay = (seconds: number) => ({ "--rd": `${seconds}s` }) as CSSProperties;

/* Masthead states (R4-B05). A = expanded lilac (--mh-p 0), B = compact light
   (--mh-p 1). The state flips on where the first intro text sits in the
   viewport (fraction of the viewport height, measured from the top): below
   MH_ENTER it goes to B, back above MH_LEAVE it returns to A. The gap between
   the two is the hysteresis, wider than the text's own 40u entry offset. The
   change then runs for MH_SECONDS on its own and always ends on 0 or 1. */
const MH_ENTER = 0.88;
const MH_LEAVE = 0.95;
const MH_SECONDS = 0.35;

/* WrkOps -> CC.OS ground (R4-B07). WO_ON: fraction of the viewport height the
   CC.OS block's top must reach (from the top) before the change starts, so the
   last black beat gets room (was 0.95: started as the block entered). WO_SPAN:
   scroll distance of the change itself, as a fraction of the viewport (was 0.75).
   WO_TAU: smoothing time constant in seconds (was 0.16). */
const WO_ON = 0.6;
const WO_SPAN = 0.3;
const WO_TAU = 0.1;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* All strokes in the Studio illustrations are 0.5 (MTG05 R4-B03, B03-09). */
const STROKE = 0.5;
const LILAC = "#A864E2";

/* Orbit illustration (Frame 44 in work_assets/feedback_r4_2): two rounded rings,
   a Y of spokes and four lilac nodes. Rings are the reference outlines drawn as
   plain 0.5 strokes (Figma's masked inner-stroke trick is not reproduced). */
/* viewBox x starts at -0.5: the rings and the centre node are centred on
   x=148.0 (rings 19.37..275.77, node 148.035) while the box centre is 148.5, so
   the shift puts the visible centre on the wrapper centre (0.43u at 256u wide). */
function OrbitMark() {
  const id = `orbit-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ramp = (n: number, x1: number, y1: number, x2: number, y2: number) => (
    <linearGradient id={`${id}-${n}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop stopColor="#D4D4D4" />
      <stop offset="1" stopColor={LILAC} />
    </linearGradient>
  );
  return (
    <svg className="studio-art" viewBox="-0.5 0 297 297" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {ramp(0, 228.837, 203.373, 272.235, 210.626)}
        {ramp(1, 148.035, 118, 148.035, 178)}
        {ramp(2, 148.535, 52, 148.535, 8)}
        {ramp(3, 66.7864, 201.306, 24.2857, 212.694)}
      </defs>
      <path
        d="M19.3681 148.035C19.3681 102.233 43.8034 59.9098 83.4693 37.0086C123.135 14.1075 172.006 14.1075 211.672 37.0086C251.337 59.9097 275.773 102.233 275.773 148.035C275.773 193.837 251.337 236.16 211.672 259.062C172.006 281.963 123.135 281.963 83.4693 259.062C43.8034 236.16 19.3681 193.837 19.3681 148.035Z"
        stroke="#CACAC8"
        strokeWidth={STROKE}
      />
      <path
        d="M45.4015 148.035C45.4015 111.393 64.9497 77.5345 96.6824 59.2136C128.415 40.8927 167.511 40.8927 199.244 59.2136C230.977 77.5345 250.525 111.393 250.525 148.035C250.525 184.677 230.977 218.535 199.244 236.856C167.512 255.177 128.415 255.177 96.6824 236.856C64.9497 218.535 45.4015 184.677 45.4015 148.035Z"
        stroke="#CACAC8"
        strokeWidth={STROKE}
      />
      <path d="M45.7949 207.143L148.034 148.035L250.275 207.143" stroke="#CACAC8" strokeWidth={STROKE} />
      <path d="M148.535 148.035V30.0894" stroke="#CACAC8" strokeWidth={STROKE} />
      <circle cx="251.8" cy="206.7" r="19" fill={`url(#${id}-0)`} />
      <circle cx="148.035" cy="148" r="25.5" fill={`url(#${id}-1)`} />
      <circle cx="148.5" cy="30" r="19" fill={`url(#${id}-2)`} />
      <circle cx="45.5" cy="207" r="19" fill={`url(#${id}-3)`} />
    </svg>
  );
}

/* Gear illustration (Frame 327): the eight-tooth outline with a lilac core.
   The core follows the 2026-11-06 re-export: a rounded shape centred on
   (148, 148) with a vertical grey -> lilac ramp. */
function GearOutlineMark() {
  const id = `gear-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className="studio-art" viewBox="0 0 297 297" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="148" y1="170" x2="148" y2="126">
          <stop stopColor="#D4D4D4" />
          <stop offset="1" stopColor={LILAC} />
        </linearGradient>
      </defs>
      <path
        d="M169.454 0H126.602C122.299 0 118.811 3.48828 118.811 7.79129V58.6648C118.811 65.6061 110.418 69.0823 105.51 64.1741L69.5347 28.1988C66.492 25.1561 61.5588 25.1561 58.5161 28.1989L28.2152 58.5005C25.1726 61.5432 25.1726 66.4763 28.2153 69.519L64.2131 105.517C69.1213 110.425 65.6451 118.817 58.7038 118.817H7.79129C3.48828 118.817 0 122.306 0 126.609V169.461C0 173.764 3.48828 177.252 7.79129 177.252H58.6902C65.6315 177.252 69.1077 185.644 64.1994 190.553L28.2046 226.547C25.1619 229.59 25.1619 234.523 28.2046 237.566L58.5054 267.867C61.5481 270.909 66.4812 270.909 69.5239 267.867L105.51 231.881C110.418 226.972 118.811 230.449 118.811 237.39V288.278C118.811 292.581 122.299 296.069 126.602 296.069H169.454C173.757 296.069 177.245 292.581 177.245 288.278V237.359C177.245 230.417 185.637 226.941 190.546 231.849L226.548 267.852C229.591 270.895 234.524 270.895 237.567 267.852L267.869 237.551C270.911 234.509 270.911 229.575 267.869 226.533L231.888 190.553C226.98 185.644 230.456 177.252 237.398 177.252H288.277C292.58 177.252 296.068 173.764 296.068 169.461V126.609C296.068 122.306 292.58 118.817 288.277 118.817H237.383C230.442 118.817 226.966 110.425 231.874 105.517L267.858 69.5327C270.901 66.49 270.901 61.5568 267.858 58.5142L237.557 28.2134C234.514 25.1707 229.581 25.1707 226.539 28.2134L190.546 64.2063C185.637 69.1145 177.245 65.6383 177.245 58.697V7.79129C177.245 3.48828 173.757 0 169.454 0Z"
        stroke="#D9D9D9"
        strokeWidth={STROKE}
      />
      <path
        d="M138.474 164.5C144.369 167.903 151.631 167.903 157.526 164.5C163.421 161.097 167.053 154.807 167.053 148C167.053 141.193 163.421 134.903 157.526 131.5C151.631 128.097 144.369 128.097 138.474 131.5C132.579 134.903 128.947 141.193 128.947 148C128.947 154.807 132.579 161.097 138.474 164.5Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}

/* Studio page, MTG05 R4-B03 (supersedes the R4-B01/B02 order; FBI-040..055).
   Studio only.

   Page flow, all in the document (no nested scroller, no scroll hijack):

     masthead (sticky, full lilac at first, compact white later)
     · lilac [Studio] hero, pinned while the black intro slides over it
     · black intro: three text beats, each with its own illustration
     · lilac [Studio Approach] strip (sticky within its section)
     · four static principle squares + four accordion rows · footer

   Header (R4-B05, supersedes the black-edge trigger). The masthead is sticky
   and has two resting states: A, full lilac, and B, compact light. `--mh-p`
   only travels between 0 (A) and 1 (B) during a short animation; it is never
   left in between. The black intro first shows an empty breathing interval at
   A; the switch to B starts when the first intro text nears the viewport
   (MH_ENTER / MH_LEAVE above). A margin keeps the masthead's flow footprint at
   full height, so content never moves faster than the page.
   `data-collapse="on"` is set from an effect: without JS the masthead is the
   plain full-size lilac one and scrolls away.

   Accordion (R4-B03, supersedes R4-B02). Fixed order, all closed on load; a
   click opens a closed row, a click on the open row closes it, so zero or one
   row is open. Nothing reorders and nothing scrolls the page.

   R4-B06: the group is [Studio Approach], a disclosure button that holds the
   four squares and three rows (closing it clears the open row). Build with
   WrkOps™ is no longer a row: it is its own chapter after it, with its own
   sticky strip and its own independent disclosure. Both open by default.

   Build with WrkOps™ is the one deliberately long section. The panel
   background runs black -> lilac from where the CC.OS block sits in the
   viewport (`--wo`), damped with a time-corrected exponential, reversible.

   Per-frame work is one rAF updater that writes CSS custom properties straight
   to the DOM (no React state). Reveals are presentation only: all copy is
   always in the DOM; hidden start states exist only where CSS scroll timelines
   apply or once `data-motion="on"` is set from an effect, i.e. never without
   JS, IntersectionObserver, or when reduced motion is set. */
export default function Studio() {
  const [selected, setSelected] = useState<number | null>(null);
  const [approachOpen, setApproachOpen] = useState(true);
  const [wrkopsOpen, setWrkopsOpen] = useState(true);
  const baseId = useId();
  const { reduced } = useMotionPolicy();

  const rootRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const woRef = useRef<HTMLDivElement>(null);
  const ccosRef = useRef<HTMLElement>(null);

  const panelId = (index: number) => `${baseId}-fan-${index}`;

  /* Progressive reveals: one observer, one-way (seen stays seen). Used where
     scroll timelines are unavailable; see the @supports block in global.css. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-seen", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    root.setAttribute("data-motion", "on");
    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
      root.querySelectorAll("[data-seen]").forEach((node) => node.removeAttribute("data-seen"));
    };
  }, [reduced]);

  /* Scroll-linked state, written straight to the DOM (no re-render per frame):
     the masthead collapse progress from the black intro's top edge, and the
     WrkOps black->lilac progress from the CC.OS block's position. All geometry
     reads happen before any write in a frame. The masthead progress is exact
     (it must stay glued to the black edge); only the WrkOps ground is damped,
     with a frame-rate independent factor, and never touches window.scrollY. */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    if (!root || !intro) return;
    const firstText = intro.querySelector<HTMLElement>(".studio-beat__text");

    let frame = 0;
    let active = false;
    let last = 0;
    let primed = false;
    let woNow = 0;
    let lastWo = "";
    let lastP = "";
    let mhTarget = 0;
    let mhNow = 0;
    let mhPrimed = false;

    const update = () => {
      frame = 0;
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;

      // reads
      const textTop = firstText ? firstText.getBoundingClientRect().top : Infinity;
      const wo = woRef.current;
      const ccos = ccosRef.current;
      const ccosTop = wo && ccos && !reduced ? ccos.getBoundingClientRect().top : 0;
      const vh = window.innerHeight;

      // masthead state: a threshold with hysteresis picks A or B (never a
      // scroll-proportional value); the move between them is time-based and
      // always completes, so it cannot park between the two.
      if (mhTarget === 0 && textTop < vh * MH_ENTER) mhTarget = 1;
      else if (mhTarget === 1 && textTop > vh * MH_LEAVE) mhTarget = 0;
      if (!mhPrimed || reduced) {
        mhNow = mhTarget; // first frame (restored scroll) and reduced motion: no animation
        mhPrimed = true;
      } else if (mhNow !== mhTarget) {
        const step = dt / MH_SECONDS;
        mhNow = Math.abs(mhTarget - mhNow) <= step ? mhTarget : mhNow + Math.sign(mhTarget - mhNow) * step;
      }

      // writes
      const p = (mhNow * mhNow * (3 - 2 * mhNow)).toFixed(5);
      if (p !== lastP) {
        lastP = p;
        root.style.setProperty("--mh-p", p);
      }

      let settled = mhNow === mhTarget;
      if (wo && ccos && !reduced) {
        /* B07-05: dwell and change are separate. Nothing happens until the CC.OS
           block's top has risen to WO_ON of the viewport (the preceding WrkOps
           beat keeps its black ground until then); the black -> lilac change
           then runs over the short WO_SPAN, eased at both ends (smoothstep). */
        const raw = clamp01((vh * WO_ON - ccosTop) / (vh * WO_SPAN));
        const target = raw * raw * (3 - 2 * raw);
        if (!primed) {
          woNow = target;
          primed = true;
        } else {
          woNow += (target - woNow) * (1 - Math.exp(-dt / WO_TAU));
          if (Math.abs(target - woNow) < 0.002) woNow = target;
          else settled = false;
        }
        const value = woNow.toFixed(3);
        if (value !== lastWo) {
          lastWo = value;
          wo.style.setProperty("--wo", value);
          /* B07-05: type flips in a narrow window around the point where light and
             dark type have equal contrast on the blended ground (~0.65), so the
             grey mid-tone on purple never lingers */
          wo.style.setProperty("--wo-text", clamp01((woNow - 0.6) / 0.12).toFixed(3));
        }
      }
      active = !settled;
      if (!settled) frame = requestAnimationFrame(update);
    };

    const schedule = () => {
      if (frame) return;
      if (!active) last = performance.now();
      frame = requestAnimationFrame(update);
    };
    const onResize = () => schedule();

    root.setAttribute("data-collapse", "on");
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      root.removeAttribute("data-collapse");
      root.style.removeProperty("--mh-p");
    };
  }, [reduced]);

  /* four informational squares: plain articles in a plain section */
  const cardsBlock = (
    <section className="section section--cards" aria-label="Core principles" key="cards">
      <div className="cards">
        {STUDIO_PRINCIPLES.map((principle) => (
          <PrincipleCardStatic
            key={principle.key}
            label={principle.label}
            body={principle.summary}
          />
        ))}
      </div>
    </section>
  );

  const fan = (index: number): ReactNode => {
    const principle = ACCORDION_PRINCIPLES[index];
    const open = selected === index;
    return (
      <div className="fan" key={principle.fanKey} data-tone={principle.fanTone} data-fan={index}>
        <ClippedHeading
          label={principle.fanLabel}
          expanded={open}
          onToggle={() => setSelected((current) => (current === index ? null : index))}
          panelId={panelId(index)}
        />
        <div
          id={panelId(index)}
          className="fan__panel"
          role="region"
          aria-label={principle.fanLabel}
          data-open={open}
          aria-hidden={open ? undefined : "true"}
        >
          <div className="fan__inner">
            <div className="fan__body">
              <div className="fan__copy">
                {principle.fanBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {principle.fanSteps && (
                <div className="columns">
                  {principle.fanSteps.map((step) => (
                    <PrincipleCardStatic key={step.label} {...step} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Build with WrkOps™ chapter body (R4-B06): the former fourth row's panel,
     content unchanged, now under its own sticky heading. */
  const [woLead, woHow, woDaily] = WRKOPS_PRINCIPLE.fanBody;
  const woBlock = (
    <div className="wo" ref={woRef} data-reduced={reduced ? "true" : undefined}>
      <div className="wo__lead">
        <p data-reveal>{woLead}</p>
        <div className="wo__cube" data-reveal style={delay(0.25)}>
          <HexCube
            className="studio-hex"
            variant="ring"
            gradientFrom="#FFFFFF"
            gradientTo={LILAC}
            lineColor="#D9D9D9"
            outerFill="#D9D9D9"
            middleFill="#1A1A1A"
            lineWidth={STROKE}
          />
        </div>
      </div>
      <div className="wo__explain">
        <p data-reveal>{woHow}</p>
        <p data-reveal style={delay(0.12)}>
          {woDaily}
        </p>
      </div>

      <section className="wo__ccos" ref={ccosRef} aria-labelledby="ccos-title">
        <div className="wo__ccos-head" data-reveal>
          <HexCube
            className="studio-hex wo__ccos-cube"
            variant="solid"
            gradientFrom="#FFFFFF"
            gradientTo={LILAC}
            lineColor="#D9D9D9"
            outerFill="#1A1A1A"
            lineWidth={STROKE}
          />
          <h3 className="ccos__wordmark" id="ccos-title">
            CC.OS
          </h3>
        </div>
        <div className="wo__ccos-copy">
          <p data-reveal>We build tools for the way we work.</p>
          <p data-reveal style={delay(0.12)}>
            CC.OS is the developing software environment behind our studio. Its components
            address different parts of our operations, including work management, project
            intelligence, information, security and business coordination.
          </p>
          <p data-reveal style={delay(0.24)}>
            We use these projects to explore new ways of connecting software, automation and AI
            with everyday work.
          </p>
        </div>
        <Link className="ccos__action" to="/products/ccos" data-reveal>
          Read dev notes <span aria-hidden="true">→</span>
        </Link>
        <span className="ccos__dot" aria-hidden="true" />
      </section>
    </div>
  );

  /* B06-02: closing the group also clears the open row, so reopening shows all
     three rows closed. Nothing scrolls and no focus moves. */
  const toggleApproach = () => {
    if (approachOpen) setSelected(null);
    setApproachOpen(!approachOpen);
  };

  /* fixed order: the squares, then the three rows as authored */
  const stack: ReactNode[] = [cardsBlock, ...ACCORDION_PRINCIPLES.map((_, index) => fan(index))];
  const approachId = `${baseId}-approach`;
  const wrkopsId = `${baseId}-wrkops`;

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      <SiteMasthead variant="studio" />

      <div className="studio-top">
        {/* B03-01: the page opens on the full-lilac hero. It stays pinned while
            the black intro slides over it. B04-02: the hero ends at the
            baseline of [Studio], so the black edge cuts the brackets there. */}
        <section className="studio-hero" aria-labelledby="studio-hero">
          <h1 className="studio-hero__label" id="studio-hero">
            [Studio]
          </h1>
          <span className="studio-hero__suffix" aria-hidden="true">
            :P
          </span>
        </section>

        {/* B03-04: three beats, each a paragraph with its own illustration.
            Plain visible content; the scroll-linked fade is CSS-only and
            applies only where scroll timelines exist and motion is allowed. */}
        <section className="studio-intro" ref={introRef} aria-label="About the studio">
          <div className="studio-beat">
            <p className="studio-beat__text">
              Collapse Creative Dev. Unit is a technical studio working across design, software
              development and applied research.
            </p>
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
            <p className="studio-beat__text">
              Our background is in visual design and digital experiences. Today, we use that
              knowledge to build web applications, custom tools and software around how people
              actually work.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <OrbitMark />
            </div>
          </div>
          <div className="studio-beat">
            <p className="studio-beat__text">
              We approach development through the interface, the underlying logic and the people
              who will use it.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <GearOutlineMark />
            </div>
          </div>
        </section>
      </div>

      {/* B06-02: the lilac strip is the group's disclosure button (not a link).
          B06-04: Build with WrkOps™ below is its own chapter with the same
          strip and the same independent disclosure. Each strip is sticky
          inside its own section only, so the two never stack. */}
      <section className="studio-approach" aria-label="Studio Approach">
        <div className="studio-strip" data-open={approachOpen}>
          <h2 className="studio-strip__heading">
            <button
              type="button"
              className="studio-strip__toggle"
              aria-expanded={approachOpen}
              aria-controls={approachId}
              onClick={toggleApproach}
            >
              <span className="studio-strip__title">
                <span className="studio-strip__label">[Studio Approach]</span>
                <span className="studio-strip__suffix" aria-hidden="true">
                  :P
                </span>
              </span>
              <span className="studio-strip__chevron" aria-hidden="true">
                v
              </span>
            </button>
          </h2>
        </div>

        <div
          id={approachId}
          className="studio-disc studio-stage"
          data-open={approachOpen}
          aria-hidden={approachOpen ? undefined : "true"}
        >
          <div className="studio-disc__inner">
            <div className="studio-disc__body">
              <div className="studio-stage__stack">{stack}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-wrkops" aria-label={WRKOPS_PRINCIPLE.fanLabel}>
        <div className="studio-strip" data-open={wrkopsOpen}>
          <h2 className="studio-strip__heading">
            <button
              type="button"
              className="studio-strip__toggle"
              aria-expanded={wrkopsOpen}
              aria-controls={wrkopsId}
              onClick={() => setWrkopsOpen((current) => !current)}
            >
              <span className="studio-strip__title">
                <span className="studio-strip__label">{WRKOPS_PRINCIPLE.fanLabel}</span>
              </span>
              <span className="studio-strip__chevron" aria-hidden="true">
                v
              </span>
            </button>
          </h2>
        </div>

        <div
          id={wrkopsId}
          className="studio-disc"
          data-open={wrkopsOpen}
          aria-hidden={wrkopsOpen ? undefined : "true"}
        >
          <div className="studio-disc__inner">
            <div className="studio-disc__body">{woBlock}</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
