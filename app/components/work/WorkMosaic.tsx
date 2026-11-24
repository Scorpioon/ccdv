import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { FEATURED_CAPTION, FEATURED_PAGES, workcaseHref, type V3Image } from "../../data/workProjects";
import { index } from "../../motion/studioMotion";

/* N3 Work V3 Featured canvas (OPERATOR, WORK V3.svg, x284-1485 / y51-1115).
   The artboard's black boxes are only its compositional language: the tiles
   here are the real ADG-ARC captures, sized from their own ratios
   (FEATURED_PAGES): a wide capture across the canvas over a row of four
   phone captures (page 3: the desktop passport and two type specimens). The
   tight 8 gutter, the caption on its light label and the squares beneath are
   the artboard's. Each square is a page of ADG-ARC; the open square is the one
   shown. A switch fades the canvas out and brings the new tiles up in order
   (the V2 hub's timing); reduced motion switches at once. */

const SWITCH_OUT_MS = 250;

function Tile({ image, eager, i }: { image: V3Image; eager: boolean; i: number }) {
  return (
    <div className="wv3-mosaic__tile" data-specimen={image.specimen ? "" : undefined} style={index(i)}>
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      />
    </div>
  );
}

export function WorkMosaic({ reduced }: { reduced: boolean }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const select = (next: number) => {
    if (next === active) return;
    setActive(next);
    window.clearTimeout(timer.current);
    if (reduced) {
      setShown(next);
      return;
    }
    setPhase("out");
    timer.current = window.setTimeout(() => {
      setShown(next);
      setPhase("in");
    }, SWITCH_OUT_MS);
  };

  const page = FEATURED_PAGES[shown];
  const caseHref = workcaseHref("adg-arc");

  return (
    <section className="wv3-feature" aria-labelledby="work-title">
      <figure className="wv3-mosaic" data-phase={phase} data-layout={page.layout} aria-labelledby="wv3-caption">
        <div className="wv3-mosaic__grid" key={page.id}>
          <Tile image={page.top} eager i={0} />
          {page.bottom.map((image, i) => (
            <Tile key={image.src} image={image} eager={shown === 0} i={i + 1} />
          ))}
        </div>
      </figure>

      <div className="wv3-feature__foot">
        <p className="wv3-feature__caption" id="wv3-caption">
          {caseHref ? <Link to={caseHref}>{FEATURED_CAPTION}</Link> : FEATURED_CAPTION}
        </p>
        <div className="wv3-feature__pages" role="group" aria-label="ADG-ARC pages">
          {FEATURED_PAGES.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              className="wv3-feature__page"
              aria-pressed={i === active}
              aria-label={`Show ADG-ARC page ${i + 1} of ${FEATURED_PAGES.length}`}
              onClick={() => select(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
