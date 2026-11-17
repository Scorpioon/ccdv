import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import {
  AVAILABLE_TYPES,
  AVAILABLE_YEARS,
  FEATURED,
  TYPES,
  YEARS,
  findProject,
  typeLabel,
} from "../../data/workProjects";
import { index } from "../../motion/studioMotion";

/* Work hub (WORK-T2, OPERATOR sketch over WORKv2). Left: the CCDV identity
   column (gear, pixel lockup), drawn on the viewport-fit unit. Right: the
   featured project's collage, each tile fading in on arrival (`data-spawn`,
   the shared reveal observer).

   WORK-T2 foot (OPERATOR, Figma): `View all projects`, the caption and the
   five squares share one row under the collage, on one line and at one size.

   WORK-T3 (OPERATOR): the five squares are a project switcher (FEATURED): the
   open square is the shown project; a switch fades the collage out and brings
   the new tiles up in order. Projects other than ADG-ARC show its captures as
   placeholders (see FEATURED). Reduced motion: instant switch.

   WORK-T4 (OPERATOR to-be): the hub is one screen tall on desktop.
     - The sideways `COLLAPSE CREATIVE` / `DEV. UNIT` words and their square
       left the identity column. Under the lockup: the `\\Work` section label
       (the page's heading) and two lists, Year and Type, each entry a link to
       the archive with that one filter applied (the Workcase links' state).
       A Year or Type without projects is drawn but inert.
     - The collage is a fixed mosaic (FEATURED tiles): a wide image and a tall
       card on top, three below, filling the space between the lockup's top
       and the foot row. The scroll-linked column sync is gone with the
       columns. */

const SWITCH_OUT_MS = 250;

function ArchiveLinks({
  label,
  options,
  available,
  filter,
  format = (value) => value,
}: {
  label: string;
  options: string[];
  available: string[];
  filter: "year" | "type";
  format?: (value: string) => string;
}) {
  return (
    <ul className="work-hero__list" aria-label={label}>
      {options.map((option) => {
        const text = `[ ${format(option)} ]`;
        return (
          <li key={option}>
            {available.includes(option) ? (
              <Link
                className="work-hero__link"
                to="/work/archive"
                state={{ filter: { [filter]: option } }}
                aria-label={`${label}: ${format(option)} — show in the Work archive`}
              >
                <span className="work-hero__link-text">{text}</span>
              </Link>
            ) : (
              <span className="work-hero__link" aria-disabled="true">
                <span className="work-hero__link-text">{text}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function WorkHero({ reduced }: { reduced: boolean }) {
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

  const featured = FEATURED[shown];
  const project = findProject(featured.projectId);
  const caption = project ? `${project.displayName ?? project.name} - ${project.tag}` : null;
  // the first collage spawns with the page (reveal observer); after a switch
  // the new tiles mount already in view and play their own entry (CSS)
  const spawn = phase === "idle";

  return (
    <section className="work-hero" aria-labelledby="work-title">
      <div className="work-hero__body">
        <div className="work-hero__identity">
          <GearMark className="work-hero__gear" fill="#141414" dotFill="#D9D9D9" />
          <CcdvPixelMark variant="inline" className="work-hero__pixel" fill="#141414" />
          <nav className="work-hero__links" aria-labelledby="work-title">
            <h1 className="work-hero__title" id="work-title">
              <GearMark className="work-hero__title-gear" fill="#141414" dotFill="#FEF36A" />
              {"\\\\Work"}
            </h1>
            <ArchiveLinks label="Year" options={YEARS} available={AVAILABLE_YEARS} filter="year" />
            <ArchiveLinks
              label="Type"
              options={TYPES}
              available={AVAILABLE_TYPES}
              filter="type"
              format={typeLabel}
            />
          </nav>
        </div>

        <figure className="work-feature" data-phase={phase} aria-labelledby={caption ? "work-feature-caption" : undefined}>
          <div className="work-feature__grid" key={shown}>
            {featured.tiles.map((tile, i) => (
              <div
                key={i}
                className="work-feature__tile"
                data-spawn={spawn ? "" : undefined}
                style={{ ...index(i), ...(tile.focus ? { "--focus": tile.focus } : null) } as CSSProperties}
              >
                <img
                  src={tile.src}
                  alt={tile.alt}
                  width={tile.width}
                  height={tile.height}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </figure>
      </div>

      <div className="work-hero__foot">
        <Link className="work-hero__all" to="/work/archive">
          View all projects
          <span className="work-hero__all-icon" aria-hidden="true">
            →
          </span>
        </Link>
        {caption && (
          <p className="work-feature__caption" id="work-feature-caption">
            {project?.href ? <Link to={project.href}>{caption}</Link> : caption}
          </p>
        )}
        <div className="work-hero__marks" role="group" aria-label="Featured projects">
          {FEATURED.map((entry, m) => {
            const name = findProject(entry.projectId);
            return (
              <button
                key={entry.projectId}
                type="button"
                className="work-hero__mark"
                aria-pressed={m === active}
                aria-label={`Show ${name ? (name.displayName ?? name.name) : entry.projectId}`}
                onClick={() => select(m)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
