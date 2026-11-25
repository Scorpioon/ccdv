import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { FEATURED_PROJECTS, workcaseHref, type V3Image } from "../../data/workProjects";
import { index } from "../../motion/studioMotion";

/* N3 Work V3 Featured canvas (OPERATOR, WORK V3.svg). The artboard's black
   boxes are only its compositional language: the tiles are the real ADG-ARC
   captures (FEATURED_PROJECTS). W-A1 (OPERATOR): one composition per featured
   project. N4 P-L (OPERATOR, desktop >= 1024): tiles keep their natural
   aspect ratio (`--ar`, no crop) with 12u corners; the two rows (the Tt icon
   and the landing on top, four phone captures below) scroll sideways inside
   the frame (`data-deck-hscroll`), and the Work deck's wheel handling moves
   the mosaic first, the deck only at its end or start. The icon tile
   (`data-icon`) is a small app icon, not a full tile. One square per featured
   project; the open square is the one shown, and a switch fades the canvas
   out and brings the new tiles up in order (instant under reduced motion).
   For now ADG-ARC is the only featured project. The caption opens its case. */

const SWITCH_OUT_MS = 250;

function Tile({ image, eager, i }: { image: V3Image; eager: boolean; i: number }) {
  /* N4 P-L: the tile's box takes the image's own ratio, so the image is never cropped */
  const style = {
    ...index(i),
    "--ar": `${image.width} / ${image.height}`,
    ...(image.ground ? { "--ground": image.ground } : null),
  } as CSSProperties;
  return (
    <div
      className="wv3-mosaic__tile"
      data-specimen={image.specimen ? "" : undefined}
      data-icon={image.icon ? "" : undefined}
      style={style}
    >
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
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

  const project = FEATURED_PROJECTS[shown];
  const caseHref = workcaseHref(project.projectId);

  return (
    <section className="wv3-feature" aria-label="Featured">
      <figure className="wv3-mosaic" data-phase={phase} data-deck-hscroll aria-labelledby="wv3-caption">
        <div className="wv3-mosaic__grid" key={project.id}>
          <div className="wv3-mosaic__row wv3-mosaic__row--top">
            {project.top.map((image, i) => (
              <Tile key={image.src} image={image} eager i={i} />
            ))}
          </div>
          <div className="wv3-mosaic__row wv3-mosaic__row--bottom">
            {project.bottom.map((image, i) => (
              <Tile key={image.src} image={image} eager={false} i={i + 2} />
            ))}
          </div>
        </div>
      </figure>

      <div className="wv3-feature__foot">
        <p className="wv3-feature__caption" id="wv3-caption">
          {caseHref ? (
            <Link to={caseHref} preventScrollReset>
              {project.caption}
            </Link>
          ) : (
            project.caption
          )}
        </p>
        <div className="wv3-feature__pages" role="group" aria-label="Featured projects">
          {FEATURED_PROJECTS.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              className="wv3-feature__page"
              aria-pressed={i === active}
              aria-label={`Show ${entry.caption}`}
              onClick={() => select(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
