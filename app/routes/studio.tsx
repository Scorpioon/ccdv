import { useId, useState } from "react";
import type { CSSProperties } from "react";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ClippedHeading } from "../components/ClippedHeading";
import { PrincipleCardStatic, PrincipleSelectCard } from "../components/PrincipleCard";
import { HexCube } from "../components/marks/HexCube";
import { STUDIO_PRINCIPLES } from "../data/studioPrinciples";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

/* Studio flows from the masthead down: 31 stripe · 177 hero · intro · 31
   stripe · four CP squares · four FAN rows (each followed by its own panel) ·
   CC.OS · footer. The fixed artboard heights of R1.1 (392 intro, 389 cards,
   692 CC.OS) are kept as minimums; the corrected editorial copy is longer
   than the draft it replaces, so those sections grow with their text.

   GF09-E (FBI-017/018) — Core Principles state model (STD-DEC-012..016):

     selected   0..3 | null   the open fan; null = all four closed (initial)
     hovered    0..3 | null   pointer is over a CP square (mouse/pen only)
     focused    0..3 | null   keyboard focus (:focus-visible) is on a CP square

   Clicking CPn or FANn toggles `selected` between n and null, so one square
   is selected exactly when one fan is open. Hover and focus never touch
   `selected`; they only move the single lilac square, whose target is
   hovered ?? focused ?? selected, and which is not drawn when that is null. */
export default function Studio() {
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const baseId = useId();

  const lilac = hovered ?? focused ?? selected;
  const toggle = (index: number) => setSelected((current) => (current === index ? null : index));
  const panelId = (index: number) => `${baseId}-fan-${index}`;

  return (
    <div className="r11 r11--studio">
      <SiteMasthead variant="studio" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="studio-hero">
        <h1 className="band__label" id="studio-hero">
          [Studio]
        </h1>
        {/* origin, as on Home: ink 982.44 less the ":" bearing at 90 */}
        <span className="band__suffix" style={{ left: "calc(963 * var(--u))" }}>
          :P
        </span>
        <span className="hero__watermark" aria-hidden="true">
          collapse
        </span>
      </section>

      <section className="section section--intro">
        <div className="intro__copy">
          <p>
            Collapse Creative Dev. Unit is a technical studio working across design, software
            development and applied research.
          </p>
          <p>
            Our background is in visual design and digital experiences. Today, we use that knowledge
            to build web applications, custom tools and software around how people actually work.
          </p>
          <p>
            We approach development through the interface, the underlying logic and the people who
            will use it.
          </p>
        </div>
        <HexCube
          className="intro__figure"
          variant="interior"
          gradientFrom="#A864E2"
          gradientTo="#5C377C"
          lineColor="#6E6E6E"
        />
      </section>

      <div className="section section--stripe" />

      <section className="section section--cards" aria-label="Core principles">
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
            <span
              className="cards__lilac"
              style={{ "--i": lilac } as CSSProperties}
              aria-hidden="true"
            />
          )}
          {STUDIO_PRINCIPLES.map((principle, index) => (
            <PrincipleSelectCard
              key={principle.key}
              label={principle.label}
              body={principle.summary}
              selected={selected === index}
              panelId={panelId(index)}
              onSelect={() => toggle(index)}
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

      <div className="fans">
        {STUDIO_PRINCIPLES.map((principle, index) => {
          const open = selected === index;
          return (
            <div className="fan" key={principle.fanKey} data-tone={principle.fanTone}>
              <ClippedHeading
                label={principle.fanLabel}
                expanded={open}
                onToggle={() => toggle(index)}
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
                    {principle.fanTone === "ink" && (
                      <HexCube
                        className="fan__figure"
                        variant="ring"
                        gradientFrom="#FFFFFF"
                        gradientTo="#8654B3"
                        lineColor="#D9D9D9"
                        outerFill="#D9D9D9"
                        middleFill="#202020"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="section section--ccos" aria-labelledby="ccos-title">
        <HexCube
          className="ccos__figure"
          variant="solid"
          gradientFrom="#FFFFFF"
          gradientTo="#8654B3"
          lineColor="#D9D9D9"
          outerFill="#202020"
        />
        <h2 className="ccos__wordmark" id="ccos-title">
          CC.OS
        </h2>
        <div className="ccos__copy">
          <p>We build tools for the way we work.</p>
          <p>
            CC.OS is the developing software environment behind our studio. Its components address
            different parts of our operations, including work management, project intelligence,
            information, security and business coordination.
          </p>
          <p>
            We use these projects to explore new ways of connecting software, automation and AI with
            everyday work.
          </p>
        </div>
        <span className="ccos__action" aria-disabled="true">
          Read dev notes →
        </span>
        <span className="ccos__dot" aria-hidden="true" />
      </section>

      <SiteFooter />
    </div>
  );
}
