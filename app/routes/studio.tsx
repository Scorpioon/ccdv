import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ClippedHeading } from "../components/ClippedHeading";
import { PrincipleCardStatic, PrincipleSelectCard } from "../components/PrincipleCard";
import { useTransitionLink } from "../components/GlobalShell";
import { HexCube } from "../components/marks/HexCube";
import { useMotionPolicy } from "../motion/reducedMotion";
import { STUDIO_PRINCIPLES } from "../data/studioPrinciples";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

const WRKOPS_INDEX = STUDIO_PRINCIPLES.findIndex((principle) => principle.fanTone === "ink");

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const delay = (seconds: number) => ({ "--rd": `${seconds}s` }) as CSSProperties;

/* Studio scroll choreography (MTG05 R4-B01, FBI-040..047). Studio only.

   Page flow, all in the document (no nested scroller, no pinned mode):

     masthead (scrolls away) · sticky compact Studio strip · black intro
     (text, then cube) · accordion stage · footer

   The accordion stage is the composed view of FB_R4_6 / FB_R4_7: the four CP
   squares ("four-square selector") and the four FAN headers. With nothing
   selected the squares come first and the four headers follow (FB_R4_6). When
   a row is selected its header moves above the squares and the other three
   stay below in their own order (FB_R4_7). The DOM is reordered rather than
   CSS-reordered so tab order matches what is on screen; focus is handed back
   to the control that was used. Every selection re-anchors the document to
   the top of the stage, under the sticky strip.

   Selection model is the GF09-E one, unchanged (STD-DEC-012..016):

     selected   0..3 | null   the open fan; null = all four closed (initial)
     hovered    0..3 | null   pointer is over a CP square (mouse/pen only)
     focused    0..3 | null   keyboard focus (:focus-visible) is on a CP square

   Build with WrkOps™ is the one deliberately long section: its panel carries
   the protocols line, the cube, the WrkOps explanation and then CC.OS with its
   Read dev notes link. The panel background runs black -> lilac from where the
   CC.OS block sits in the viewport (`--wo`), so it is reversible and follows
   the content rather than a fixed scrollY.

   Reveals are presentation only: all copy is always in the DOM, and the hidden
   starting state exists only once `data-motion="on"` is set from an effect,
   i.e. never without JS, IntersectionObserver or when reduced motion is set. */
export default function Studio() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const baseId = useId();
  const { reduced } = useMotionPolicy();
  const link = useTransitionLink();

  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const woRef = useRef<HTMLDivElement>(null);
  const ccosRef = useRef<HTMLElement>(null);
  const pending = useRef<{ kind: "row" | "card"; index: number } | null>(null);

  const lilac = hovered ?? focused ?? selected;
  const select = (index: number, kind: "row" | "card") => {
    pending.current = { kind, index };
    setSelected((current) => (current === index ? null : index));
  };
  const panelId = (index: number) => `${baseId}-fan-${index}`;

  /* After a selection commits: give focus back to the control that was used
     (the reorder moved its node), then re-anchor the stage under the strip. */
  useEffect(() => {
    const request = pending.current;
    const root = rootRef.current;
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!request || !root || !stage || !strip) return;
    pending.current = null;

    const target =
      request.kind === "row"
        ? root.querySelector<HTMLElement>(`[data-fan="${request.index}"] .clip-row__toggle`)
        : root.querySelectorAll<HTMLElement>(".cards .card--select")[request.index];
    target?.focus({ preventScroll: true });

    const top = stage.getBoundingClientRect().top + window.scrollY - strip.offsetHeight;
    if (Math.abs(top - window.scrollY) > 2) {
      window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
    }
  }, [selected, reduced]);

  /* Progressive reveals: one observer, one-way (seen stays seen). */
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
     the strip colour once the stage reaches it, and the WrkOps black->lilac
     progress from the CC.OS block's position in the viewport. */
  useEffect(() => {
    const strip = stripRef.current;
    const stage = stageRef.current;
    if (!strip || !stage) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const atStage = stage.getBoundingClientRect().top <= strip.offsetHeight + 1;
      const next = atStage ? "stage" : "intro";
      if (strip.dataset.stage !== next) strip.dataset.stage = next;

      const wo = woRef.current;
      const ccos = ccosRef.current;
      if (!wo || !ccos || reduced) return;
      const vh = window.innerHeight;
      const t = clamp01((vh * 0.9 - ccos.getBoundingClientRect().top) / (vh * 0.5));
      wo.style.setProperty("--wo", t.toFixed(3));
      // text flips late, once the ground is lilac enough to carry dark type
      wo.style.setProperty("--wo-text", clamp01((t - 0.7) / 0.15).toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [selected, reduced]);

  const cardsBlock = (
    <section className="section section--cards" aria-label="Core principles" key="cards">
      {/* The pointer region is the whole row of squares, gaps included, so the
          lilac square glides between squares instead of vanishing in the gap
          and is only released when the pointer leaves all four. */}
      <div
        className="cards"
        onPointerLeave={() => setHovered(null)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
        }}
      >
        {lilac !== null && (
          <span className="cards__lilac" style={{ "--i": lilac } as CSSProperties} aria-hidden="true" />
        )}
        {STUDIO_PRINCIPLES.map((principle, index) => (
          <PrincipleSelectCard
            key={principle.key}
            label={principle.label}
            body={principle.summary}
            selected={selected === index}
            panelId={panelId(index)}
            onSelect={() => select(index, "card")}
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") setHovered(index);
            }}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible")) setFocused(index);
            }}
          />
        ))}
      </div>
    </section>
  );

  const fan = (index: number): ReactNode => {
    const principle = STUDIO_PRINCIPLES[index];
    const open = selected === index;
    const wrkops = index === WRKOPS_INDEX;
    const [lead, how, daily] = principle.fanBody;
    return (
      <div className="fan" key={principle.fanKey} data-tone={principle.fanTone} data-fan={index}>
        <ClippedHeading
          label={principle.fanLabel}
          expanded={open}
          onToggle={() => select(index, "row")}
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
              {wrkops ? (
                <div className="wo" ref={woRef} data-reduced={reduced ? "true" : undefined}>
                  <div className="wo__lead">
                    <p data-reveal>{lead}</p>
                    <div className="wo__cube" data-reveal style={delay(0.25)}>
                      <HexCube
                        className="studio-hex"
                        variant="ring"
                        gradientFrom="#FFFFFF"
                        gradientTo="#8654B3"
                        lineColor="#D9D9D9"
                        outerFill="#D9D9D9"
                        middleFill="#202020"
                      />
                    </div>
                  </div>
                  <div className="wo__explain">
                    <p data-reveal>{how}</p>
                    <p data-reveal style={delay(0.12)}>
                      {daily}
                    </p>
                  </div>

                  <section className="wo__ccos" ref={ccosRef} aria-labelledby="ccos-title">
                    <div className="wo__ccos-head" data-reveal>
                      <HexCube
                        className="studio-hex wo__ccos-cube"
                        variant="solid"
                        gradientFrom="#FFFFFF"
                        gradientTo="#8654B3"
                        lineColor="#D9D9D9"
                        outerFill="#202020"
                      />
                      <h3 className="ccos__wordmark" id="ccos-title">
                        CC.OS
                      </h3>
                    </div>
                    <div className="wo__ccos-copy">
                      <p data-reveal>We build tools for the way we work.</p>
                      <p data-reveal style={delay(0.12)}>
                        CC.OS is the developing software environment behind our studio. Its
                        components address different parts of our operations, including work
                        management, project intelligence, information, security and business
                        coordination.
                      </p>
                      <p data-reveal style={delay(0.24)}>
                        We use these projects to explore new ways of connecting software,
                        automation and AI with everyday work.
                      </p>
                    </div>
                    <Link className="ccos__action" to="/products/ccos" data-reveal>
                      Read dev notes <span aria-hidden="true">→</span>
                    </Link>
                    <span className="ccos__dot" aria-hidden="true" />
                  </section>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const order = STUDIO_PRINCIPLES.map((_, index) => index);
  const stack: ReactNode[] =
    selected === null
      ? [cardsBlock, ...order.map(fan)]
      : [fan(selected), cardsBlock, ...order.filter((index) => index !== selected).map(fan)];

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      <SiteMasthead variant="studio" />

      <div className="studio-strip" ref={stripRef} data-stage="intro">
        <h1 className="studio-strip__label" id="studio-hero">
          [Studio]
        </h1>
        <span className="studio-strip__suffix" aria-hidden="true">
          :P
        </span>
        <Link
          className="studio-strip__collapse"
          aria-label="collapse — back to Home"
          {...link("/")}
        >
          collapse
        </Link>
      </div>

      <section className="studio-intro" aria-labelledby="studio-hero">
        <div className="studio-intro__copy">
          <p data-reveal>
            Collapse Creative Dev. Unit is a technical studio working across design, software
            development and applied research.
          </p>
          <p data-reveal style={delay(0.12)}>
            Our background is in visual design and digital experiences. Today, we use that knowledge
            to build web applications, custom tools and software around how people actually work.
          </p>
          <p data-reveal style={delay(0.24)}>
            We approach development through the interface, the underlying logic and the people who
            will use it.
          </p>
        </div>
        <div className="studio-intro__figure" data-reveal style={delay(0.6)}>
          <HexCube
            className="studio-hex"
            variant="interior"
            gradientFrom="#A864E2"
            gradientTo="#5C377C"
            lineColor="#6E6E6E"
          />
        </div>
      </section>

      <div className="studio-stage" ref={stageRef}>
        <div className="studio-stage__stack">{stack}</div>
      </div>

      <SiteFooter />
    </div>
  );
}
