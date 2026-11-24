import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { ARCHIVE_POSTERS, archiveTitle, workcaseHref, type ArchiveRow } from "../../data/workProjects";

/* N3 Work V3 archive preview (OPERATOR, WORK V3 _ archive.svg x1223-1461):
   the selected row's title on the yellow bar, the two actions, the poster.
   Honest states only: `View Case Study` links where a Workcase exists
   (ADG-ARC); `Open Live Site` stays disabled, as no live URL is on record;
   a project without imagery shows an empty poster with a plain note. */

export function WorkArchivePreview({ entry, onCaseNavigate }: { entry: ArchiveRow; onCaseNavigate: () => void }) {
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
            <Link className="wv3-preview__action" to={caseHref} onClick={onCaseNavigate}>
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
          <span className="wv3-preview__action" aria-disabled="true" title="No live site on record">
            <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
            <span>Open Live Site</span>
            <span className="wv3-preview__glyph">[↗]</span>
          </span>
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
