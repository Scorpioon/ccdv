import { useId, useState } from "react";
import { GearMark } from "../marks/GearMark";
import { WorkActions } from "./WorkActions";
import { ARCHIVE_POSTERS, FUTURE_YEARS, archiveTitle, type ArchiveRow } from "../../data/workProjects";

/* N4 P-J (OPERATOR, WORK V3_responsive2 y862..2108): one archive row as a
   card on phones and tablets — the gray bar (N4 P-K: was yellow) with the project's name, its
   image (cropped to 341 x 143, only where the project has one; OPERATOR: no
   image block otherwise), the white facts box (Year, Type, Role, Project
   Name, Client: the row's year, category, responsibility, name and client,
   verbatim) and the two actions (WorkActions).
   N6 R1 B4: a future (greyed) project's card starts folded under its name
   bar, which carries a rotating v; the image, facts and actions fold with it.
   Its actions hide what is unavailable (B5). */

export function WorkArchiveCard({ entry }: { entry: ArchiveRow }) {
  const image = ARCHIVE_POSTERS[entry.id];
  const title = archiveTitle(entry);
  const future = FUTURE_YEARS.includes(entry.year);
  const [open, setOpen] = useState(!future);
  const bodyId = useId();
  const facts: [string, string][] = [
    ["Year", entry.year],
    ["Type", entry.category],
    ["Role", entry.responsibility],
    ["Project Name", entry.name],
    ["Client", entry.client],
  ];

  const body = (
    <>
      {image ? (
        <div className="wv3p-card__image">
          <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
        </div>
      ) : null}
      <dl className="wv3p-card__facts">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt>{label}:</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <WorkActions entry={entry} className="wv3p-actions" hideUnavailable />
    </>
  );

  return (
    <li className="wv3p-card">
      <article aria-label={title}>
        {future ? (
          <>
            <h3 className="wv3p-bar">
              <button
                type="button"
                className="wv3p-card__toggle"
                aria-expanded={open}
                aria-controls={bodyId}
                onClick={() => setOpen((value) => !value)}
              >
                <GearMark className="wv3p-bar__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
                <span>{title}</span>
                <span className="wv3p-v" aria-hidden="true">
                  v
                </span>
              </button>
            </h3>
            <div className="wv3p-disclosure" id={bodyId} data-open={open ? "" : undefined} inert={!open}>
              <div className="wv3p-disclosure__inner">{body}</div>
            </div>
          </>
        ) : (
          <>
            <h3 className="wv3p-bar">
              <GearMark className="wv3p-bar__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
              {title}
            </h3>
            {body}
          </>
        )}
      </article>
    </li>
  );
}
