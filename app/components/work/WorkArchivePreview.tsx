import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { ARCHIVE_POSTERS, archiveTitle, workcaseHref, type ArchiveRow } from "../../data/workProjects";

/* N3 Work V3 archive preview (OPERATOR, WORK V3 _ archive.svg x1223-1461):
   the selected row's title on the yellow bar, the two actions, the poster.
   Honest states only: `View Case Study` opens a case where a Workcase exists
   (ADG-ARC) — W-A1: it slides in beside the rail, it does not load a page;
   `Open Live Site` opens the live site in a new tab where the OPERATOR gave
   its URL (N3 C1: ADG-ARC), and is disabled elsewhere; a project without
   imagery shows an empty poster with a plain note. */

export function WorkArchivePreview({ entry }: { entry: ArchiveRow }) {
  const caseHref = entry.projectId ? workcaseHref(entry.projectId) : undefined;
  const poster = ARCHIVE_POSTERS[entry.id];
  const title = archiveTitle(entry);

  return (
    <section className="wv3-preview" aria-label={`Preview: ${title}`} aria-live="polite">
      <p className="wv3-preview__bar">
        <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FEF36A" />
        {title}
      </p>

      <ul className="wv3-preview__actions">
        <li>
          {caseHref ? (
            <Link className="wv3-preview__action" to={caseHref} preventScrollReset>
              <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
              <span>View Case Study</span>
              <span className="wv3-preview__glyph">[+]</span>
            </Link>
          ) : (
            <span className="wv3-preview__action" aria-disabled="true">
              <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
              <span>View Case Study</span>
              <span className="wv3-preview__glyph">[+]</span>
            </span>
          )}
        </li>
        <li>
          {entry.liveUrl ? (
            <a className="wv3-preview__action" href={entry.liveUrl} target="_blank" rel="noopener noreferrer">
              <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
              <span>Open Live Site</span>
              <span className="wv3-preview__glyph">[↗]</span>
            </a>
          ) : (
            <span className="wv3-preview__action" aria-disabled="true" title="No live site on record">
              <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
              <span>Open Live Site</span>
              <span className="wv3-preview__glyph">[↗]</span>
            </span>
          )}
        </li>
      </ul>

      <div className="wv3-preview__poster" data-empty={poster ? undefined : ""}>
        {poster ? (
          <img src={poster.src} alt={poster.alt} width={poster.width} height={poster.height} decoding="async" />
        ) : (
          <p>[ No preview yet ]</p>
        )}
      </div>
    </section>
  );
}
