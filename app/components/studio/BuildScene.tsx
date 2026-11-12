/* Build with WrkOps™ (R3 M05/M06): a lilac scene with an editorial intro and
   three active cards that behave as one system: the same shell (black art tile
   on top, white caption pane below), the same reveal, the same responsive rule.
   Phones: a one-card-at-a-time swipe carousel (scroll-snap track, three dots,
   Left/Right on the focused track). From 768px: a plain three-up row, dots
   hidden. The drawings are the existing artworks, unchanged. */
import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { WordReveal } from "./WordReveal";
import { GearConveyor, ThreeCubes, WritingDiagram } from "./artworks";
import { BUILD_CARDS, BUILD_INTRO } from "../../data/studioApproach";
import { index } from "../../motion/studioMotion";

export function BuildScene({ reduced }: { reduced: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const art: Record<(typeof BUILD_CARDS)[number]["key"], ReactNode> = {
    scope: <ThreeCubes reduced={reduced} />,
    trace: <WritingDiagram reduced={reduced} />,
    review: <GearConveyor reduced={reduced} />,
  };

  const step = () => {
    const track = trackRef.current;
    const [a, b] = track ? [track.children[0], track.children[1]] : [];
    return a instanceof HTMLElement && b instanceof HTMLElement ? b.offsetLeft - a.offsetLeft : 0;
  };
  const go = (to: number) => {
    const track = trackRef.current;
    const size = step();
    if (!track || !size) return;
    const next = Math.min(BUILD_CARDS.length - 1, Math.max(0, to));
    track.scrollTo({ left: next * size, behavior: reduced ? "auto" : "smooth" });
    setCurrent(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    go(current + delta);
  };

  return (
    <section className="bu" aria-labelledby="studio-build" data-scene>
      <div className="bu__intro">
        <h2 className="bu__chip" id="studio-build" data-spawn style={index(0)}>
          Build with WrkOps<sup className="bu__tm">™</sup>
        </h2>
        <div className="bu__copy">
          {BUILD_INTRO.map((text) => (
            <WordReveal key={text} text={text} />
          ))}
        </div>
      </div>

      <div className="bu__cards-wrap">
        <div
          ref={trackRef}
          className="bu__cards"
          role="group"
          aria-roledescription="carousel"
          aria-label="WrkOps practice"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onScroll={(event) => {
            const size = step();
            if (size) setCurrent(Math.round(event.currentTarget.scrollLeft / size));
          }}
        >
          {BUILD_CARDS.map((card, i) => (
            <article
              key={card.key}
              className="bu__card"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${BUILD_CARDS.length}`}
              data-spawn
              style={index(i + 1)}
            >
              <div className="bu__art" aria-hidden="true">
                {art[card.key]}
              </div>
              <div className="bu__caption">
                <h3 className="bu__card-title">{card.title}</h3>
                <p>{card.caption}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="bu__dots">
          {BUILD_CARDS.map((card, i) => (
            <button
              key={card.key}
              type="button"
              className="bu__dot"
              aria-label={`Show card ${i + 1}: ${card.title}`}
              aria-current={current === i ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
