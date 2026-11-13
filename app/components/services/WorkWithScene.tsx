/* Services R1 S3: Work with CCDV. The Studio Build scene grammar (BuildScene.tsx,
   FB_R4_5.svg y2164..2662 / STUDIO_resp3-1.svg y2636..3705): the joined
   gear/label silhouette (JoinedChip: the verbatim Build chip paths), the intro
   copy, and three black 284.67 x 450 cards with a light caption capsule inside
   the lower edge. R1 CORR01: the cards are the SERVICES_v2 cards (Frame 348..350)
   with their own figures and motion (cardArt.tsx): Diagnose, Product
   intelligence, Modular approach.

   Desktop: a row at the Studio cards' x. Below 1024px: a one-card carousel
   (the track is exactly one card wide and snaps per card; it scrolls only
   sideways, so vertical page scrolling is never caught), Left/Right on the
   focused track, and three 44px dot buttons. The page never scrolls sideways. */
import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { JoinedChip } from "../studio/studioMarks";
import { DiagnoseArt, IntelligenceArt, ModularArt } from "./cardArt";
import { WORK_WITH_CARDS, WORK_WITH_INTRO } from "../../data/servicesScenes";
import { index } from "../../motion/studioMotion";

export function WorkWithScene({ reduced }: { reduced: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const art: Record<(typeof WORK_WITH_CARDS)[number]["key"], ReactNode> = {
    diagnose: <DiagnoseArt reduced={reduced} />,
    intelligence: <IntelligenceArt reduced={reduced} />,
    modular: <ModularArt reduced={reduced} />,
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
          aria-label="How we work with you"
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
              aria-label={`${i + 1} of ${WORK_WITH_CARDS.length}`}
              data-spawn
              style={index(i + 2)}
            >
              <div className="sv-ww__art" aria-hidden="true">
                {art[card.key]}
              </div>
              <p className="sv-ww__caption">{card.caption}</p>
            </article>
          ))}
        </div>
        <div className="sv-ww__dots">
          {WORK_WITH_CARDS.map((card, i) => (
            <button
              key={card.key}
              type="button"
              className="sv-ww__dot"
              aria-label={`Show card ${i + 1} of ${WORK_WITH_CARDS.length}`}
              aria-current={current === i ? "true" : undefined}
              onClick={() => go(i)}
            />
          ))}
        </div>
      </div>
      <WorkWithConnectors />
    </section>
  );
}

/* Desktop: the SERVICES_v2 bus under the three cards (y2839..2877 there): each
   card's centre (584.33 / 917 / 1249.67) down to one rule. The SVG covers the
   scene's 1440 x 536 box, so the coordinates are the ones the CSS places the
   cards at. Phones: none. */
const BUS = "M584.33 498V534M917 498V534M1249.67 498V534M584.33 534H1249.67";

function WorkWithConnectors() {
  return (
    <svg className="sv-sc" viewBox="0 0 1440 536" fill="none" aria-hidden="true" focusable="false" data-scene>
      <path className="sv-sc__line" d={BUS} pathLength={1} style={{ "--i": 0 } as CSSProperties} />
    </svg>
  );
}
