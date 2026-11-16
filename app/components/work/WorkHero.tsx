import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { FEATURED, findProject } from "../../data/workProjects";
import { index } from "../../motion/studioMotion";

/* Work hub (WORK-T2, OPERATOR sketch over WORKv2). Left: the CCDV identity
   column (gear, pixel lockup, `COLLAPSE CREATIVE` / `DEV. UNIT` set sideways,
   three meta lines, `View all projects`), pinned and sized to fit the viewport
   at every height. Right: the ADG-ARC collage, three columns that drift at
   different rates as the page scrolls (parallax) while each tile fades in on
   arrival (`data-spawn`, the shared reveal observer). `View all projects` opens
   the archive (/work/archive).

   D5: ADG-ARC is the only featured case; the caption links to its Workcase.
   The images are OPERATOR placeholders (see FEATURED). Reduced motion: no
   drift, no fade — plain content. */

/* Parallax: one rAF-throttled scroll listener writes `--t` (-1..1, the
   collage's centre against the viewport's) on the figure; each column's CSS
   turns it into its own offset (`--dir` x `--amp`), so JS never touches the
   columns. Idle off screen (early-out), cleaned up on unmount. */
function useCollageDrift(ref: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    const node = ref.current;
    if (!node || reduced) return;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const view = window.innerHeight;
      if (rect.bottom < 0 || rect.top > view || rect.height === 0) return;
      const travel = (rect.height + view) / 2;
      const t = Math.min(1, Math.max(-1, (view / 2 - (rect.top + rect.height / 2)) / travel)).toFixed(4);
      if (t !== last) {
        last = t;
        node.style.setProperty("--t", t);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      node.style.removeProperty("--t");
    };
  }, [ref, reduced]);
}

export function WorkHero({ reduced }: { reduced: boolean }) {
  const project = findProject(FEATURED.projectId);
  const caption = project ? `${project.name} - ${project.tag}` : null;
  const featureRef = useRef<HTMLElement>(null);

  useCollageDrift(featureRef, reduced);

  return (
    <section className="work-hero" aria-labelledby="work-title">
      <h1 className="work-visually-hidden" id="work-title">
        Work
      </h1>

      <div className="work-hero__identity">
        <GearMark className="work-hero__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
        <CcdvPixelMark variant="inline" className="work-hero__pixel" fill="#1A1A1A" />
        <p className="work-hero__words">
          <span className="work-hero__word work-hero__word--collapse">COLLAPSE CREATIVE</span>{" "}
          <span className="work-hero__word work-hero__word--unit">DEV. UNIT</span>
        </p>
        <div className="work-hero__meta">
          <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
          <div>[ hello[@]collapsecreative.com ]</div>
          <div>
            [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
          </div>
        </div>
        <span className="work-hero__square" aria-hidden="true" />
        <Link className="work-hero__all" to="/work/archive">
          View all projects
          <span className="work-hero__all-icon" aria-hidden="true">
            →
          </span>
        </Link>
      </div>

      <figure
        className="work-feature"
        ref={featureRef}
        aria-labelledby={caption ? "work-feature-caption" : undefined}
      >
        <div className="work-feature__columns">
          {FEATURED.columns.map((column, c) => (
            <div key={c} className={`work-feature__col work-feature__col--${c + 1}`}>
              {column.map((tile, i) => (
                <div key={i} className="work-feature__tile" data-spawn style={index(i)}>
                  <img
                    src={tile.src}
                    alt={tile.alt}
                    width={tile.width}
                    height={tile.height}
                    loading={c === 0 && i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        {caption && (
          <figcaption className="work-feature__caption" id="work-feature-caption">
            {project?.href ? <Link to={project.href}>{caption}</Link> : caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
