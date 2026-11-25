import { useState } from "react";
import { GearMark } from "../marks/GearMark";
import { WorkActions } from "./WorkActions";
import { ARCHIVE_ROWS, FEATURED_PROJECTS, WORK_INTRO, archiveTitle } from "../../data/workProjects";

/* N4 P-J (OPERATOR, WORK V3_responsive y764..1672): Featured on phones and
   tablets. Between two rules, the `FEATURED` label and one square per
   featured project (OPERATOR: the squares are the projects; today one,
   ADG-ARC; the open one is white; N4 P-K: always five squares, the unused
   ones empty and dimmed). Then the project: its gray bar, the Work line and
   its description, its two actions (WorkActions: the same honest states as
   the archive; N4 P-K: above the image), then its one image (the phone
   landing, whole). The project's actions are its archive row's. */

const SLOTS = 5;

export function WorkPhoneFeatured() {
  const [active, setActive] = useState(0);
  const project = FEATURED_PROJECTS[active] ?? FEATURED_PROJECTS[0];
  const row = ARCHIVE_ROWS.find((entry) => entry.projectId === project.projectId);
  const title = row ? archiveTitle(row) : project.caption;

  return (
    <section className="wv3p-section" aria-labelledby="wv3p-featured-title">
      <div className="wv3p-label">
        <h2 className="wv3p-label__box" id="wv3p-featured-title">
          FEATURED
        </h2>
        <div className="wv3p-pages" role="group" aria-label="Featured projects">
          {FEATURED_PROJECTS.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              className="wv3p-pages__page"
              aria-pressed={i === active}
              aria-label={`Show ${entry.caption}`}
              onClick={() => setActive(i)}
            />
          ))}
          {Array.from({ length: Math.max(0, SLOTS - FEATURED_PROJECTS.length) }, (_, i) => (
            <span key={`empty-${i}`} className="wv3p-pages__page" data-empty="" aria-hidden="true" />
          ))}
        </div>
      </div>

      <article className="wv3p-feature" aria-labelledby="wv3p-feature-name">
        <h3 className="wv3p-bar" id="wv3p-feature-name">
          <GearMark className="wv3p-bar__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
          {title}
        </h3>
        <div className="wv3p-feature__copy">
          <p>{WORK_INTRO}</p>
          <p>{project.description}</p>
        </div>
        {row ? <WorkActions entry={row} className="wv3p-actions" /> : null}
        <div className="wv3p-feature__image">
          <img
            src={project.poster.src}
            alt={project.poster.alt}
            width={project.poster.width}
            height={project.poster.height}
            decoding="async"
          />
        </div>
      </article>
    </section>
  );
}
