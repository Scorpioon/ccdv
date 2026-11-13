/* Services R1 S3: Work with CCDV. The Studio Build scene grammar (BuildScene.tsx,
   FB_R4_5.svg y2164..2662 / STUDIO_resp3-1.svg y2636..3705) with Services copy:
   the joined gear/label silhouette (JoinedChip: the verbatim Build chip paths),
   the intro copy, and three black 284.67 x 450 cards whose figures are the
   existing card artworks (cubes = Diagnose, five-column writing panel = Build,
   gear = Hand over; the gear core takes the Services red) with a light caption
   capsule inside the lower edge.

   Desktop: a row at the Studio cards' x. Below 1024px: a one-card carousel
   (the track is exactly one card wide and snaps per card; it scrolls only
   sideways, so vertical page scrolling is never caught), Left/Right on the
   focused track, and three 44px dot buttons. The page never scrolls sideways. */
import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { BUILD_FRAMES, CARD_GEAR_PITCH, GearConveyor, ThreeCubes, WritingDiagram } from "../studio/artworks";
import { JoinedChip } from "../studio/studioMarks";
import { WORK_WITH_CARDS, WORK_WITH_INTRO } from "../../data/servicesScenes";
import { index } from "../../motion/studioMotion";

const RED = "#F64848";

export function WorkWithScene({ reduced }: { reduced: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const art: Record<(typeof WORK_WITH_CARDS)[number]["key"], ReactNode> = {
    cubes: <ThreeCubes reduced={reduced} frame={BUILD_FRAMES.cubes} />,
    panel: <WritingDiagram reduced={reduced} frame={BUILD_FRAMES.panel} />,
    gear: <GearConveyor reduced={reduced} frame={BUILD_FRAMES.gear} pitch={CARD_GEAR_PITCH} accent={RED} />,
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
    const next = Math.min(WORK_WITH_CARDS.length - 1, Math.max(0, to));
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
    <section className="sv-ww" aria-labelledby="services-work-with" data-scene>
      <JoinedChip id="services-work-with" className="sv-ww__chip">
        Work with CCDV.
      </JoinedChip>
      <div className="sv-ww__copy" data-spawn style={index(1)}>
        {WORK_WITH_INTRO.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>

      <div className="sv-ww__cards-wrap">
        <div
          ref={trackRef}
          className="sv-ww__cards"
          role="group"
          aria-roledescription="carousel"
          aria-label="How an engagement runs"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onScroll={(event) => {
            const size = step();
            if (size) setCurrent(Math.round(event.currentTarget.scrollLeft / size));
          }}
        >
          {WORK_WITH_CARDS.map((card, i) => (
            <article
              key={card.key}
              className="sv-ww__card"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${WORK_WITH_CARDS.length}: ${card.step}`}
              data-spawn
              style={index(i + 2)}
            >
              <div className="sv-ww__art" aria-hidden="true">
                {art[card.key]}
              </div>
              <div className="sv-ww__caption">
                <h3 className="sv-ww__step">{card.step}</h3>
                <p>{card.caption}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="sv-ww__dots">
          {WORK_WITH_CARDS.map((card, i) => (
            <button
              key={card.key}
              type="button"
              className="sv-ww__dot"
              aria-label={`Show card ${i + 1} of ${WORK_WITH_CARDS.length}: ${card.step}`}
              aria-current={current === i ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
