import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { FEATURED, findProject } from "../../data/workProjects";

/* Work V2 featured composition — WORKv2.svg y0..1192.53 (1536 artboard).
   Left: the CCDV identity column (gear, pixel lockup, `COLLAPSE CREATIVE` /
   `DEV. UNIT` set sideways, three meta lines, `View all projects`). Right: the
   five-tile ADG-ARC collage, its caption and five indicator marks.

   D5: ADG-ARC is the only featured case. The marks are static decoration
   (`aria-hidden`), not a carousel. The caption links to the existing
   `/work/adg-arc` case. The artboard's `- ADG-FAD` client suffix is left out
   (D7: client is not confirmed in project data). */

export function WorkHero() {
  const project = findProject(FEATURED.projectId);
  const caption = project ? `${project.name} - ${project.tag}` : null;

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
        <a className="work-hero__all" href="#work-index">
          View all projects
          <span className="work-hero__all-icon" aria-hidden="true">
            ↓
          </span>
        </a>
      </div>

      <figure className="work-feature" aria-labelledby={caption ? "work-feature-caption" : undefined}>
        <div className="work-feature__tiles">
          {FEATURED.tiles.map((tile, index) => (
            <div key={index} className={`work-feature__tile work-feature__tile--${index + 1}`}>
              <img src={tile.src} alt={tile.alt} decoding="async" />
            </div>
          ))}
        </div>
        {caption && (
          <figcaption className="work-feature__caption" id="work-feature-caption">
            {project?.href ? <Link to={project.href}>{caption}</Link> : caption}
          </figcaption>
        )}
      </figure>

      <span className="work-feature__marks" aria-hidden="true">
        <i />
        <i className="work-feature__mark--open" />
        <i />
        <i />
        <i />
      </span>
    </section>
  );
}
