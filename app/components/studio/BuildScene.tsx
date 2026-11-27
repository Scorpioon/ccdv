/* Build with WrkOps™ (R3 M05/M06, rebuilt in OPUS CORR01 OC01-05 from FB_R4_5.svg
   y2164..2662 and STUDIO_resp3-1.svg y2636..3705).

   The joined gear/label chip (verbatim silhouette), the intro copy, and three
   identical black cards 284.67 x 450 (rx 16.44): the figure fills the card and
   a compact light caption capsule 260.67 x 66 (rx 10) sits 12 inside its lower
   edge. No card titles, no light lower half (E06/E07/E08). Figures: three
   cubes, the five-column info panel, the gear conveyor, each in its card
   window (artworks.tsx BUILD_FRAMES).
   Desktop: a row at the original's x (CSS). Phones: a controlled carousel
   (R3 S7: index in state, the track moved by css translate, swipe by
   useRailSwipe; the next card peeks at the edge; three dots; Left/Right on the
   focused track). The intro and the rail are two one-screen steps on phones
   (`.step`, display: contents from 1024). The page never scrolls sideways. */
import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { BUILD_FRAMES, CARD_GEAR_PITCH, GearConveyor, ThreeCubes, WritingDiagram } from "./artworks";
import { CtaChip } from "../CtaChip";
import { BuildChip } from "./studioMarks";
import { BUILD_CARDS, BUILD_INTRO } from "../../data/studioApproach";
import { index } from "../../motion/studioMotion";
import { useRailSwipe } from "../../motion/useRailSwipe";

export function BuildScene({ reduced }: { reduced: boolean }) {
  const [current, setCurrent] = useState(0);
  const go = (to: number) => setCurrent(Math.min(BUILD_CARDS.length - 1, Math.max(0, to)));
  const swipe = useRailSwipe({ count: BUILD_CARDS.length, index: current, setIndex: go, reduced });

  const art: Record<(typeof BUILD_CARDS)[number]["key"], ReactNode> = {
    cubes: <ThreeCubes reduced={reduced} frame={BUILD_FRAMES.cubes} />,
    panel: <WritingDiagram reduced={reduced} frame={BUILD_FRAMES.panel} />,
    gear: <GearConveyor reduced={reduced} frame={BUILD_FRAMES.gear} pitch={CARD_GEAR_PITCH} />,
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    go(current + delta);
  };

  return (
    <section className="bu" aria-labelledby="studio-build" data-scene>
      <div className="bu__intro step step--phone">
        <BuildChip id="studio-build" />
        <div className="bu__copy" data-spawn style={index(1)}>
          {BUILD_INTRO.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
      </div>

      <div className="bu__rail step step--phone">
      <div className="bu__cards-wrap" ref={swipe.ref} style={swipe.style}>
        <div
          className="bu__cards"
          role="group"
          aria-roledescription="carousel"
          aria-label="WrkOps practice"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {BUILD_CARDS.map((card, i) => (
            <article
              key={card.key}
              className="bu__card"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${BUILD_CARDS.length}`}
              data-spawn
              style={index(i + 2)}
            >
              <div className="bu__art" aria-hidden="true">
                {art[card.key]}
              </div>
              <p className="bu__caption">{card.caption}</p>
            </article>
          ))}
        </div>
        <div className="bu__dots">
          {BUILD_CARDS.map((card, i) => (
            <button
              key={card.key}
              type="button"
              className="bu__dot"
              aria-label={`Show card ${i + 1} of ${BUILD_CARDS.length}`}
              aria-current={current === i ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
      <CtaChip to="/services" label="See our services" />
      </div>
    </section>
  );
}
