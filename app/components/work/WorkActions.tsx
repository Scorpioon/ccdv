import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { workcaseHref, type ArchiveRow } from "../../data/workProjects";

/* N4 P-J: a project's two actions, shared by the desktop preview
   (WorkArchivePreview) and the phone / tablet cards (WorkArchiveCard,
   WorkPhoneFeatured); moved out of WorkArchivePreview unchanged.
   Honest states only: `View Case Study` opens a case where a Workcase exists
   (ADG-ARC); `Open Live Site` opens the live site in a new tab where the
   OPERATOR gave its URL, and is disabled elsewhere; a row with an
   `explainerHref` (CC.OS) shows `See in Products [↗]` in its place, linking
   to that page in the same tab. */

export function WorkActions({ entry, className }: { entry: ArchiveRow; className?: string }) {
  const caseHref = entry.projectId ? workcaseHref(entry.projectId) : undefined;
  return (
    <ul className={`wv3-preview__actions${className ? ` ${className}` : ""}`}>
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
        {entry.explainerHref ? (
          <Link className="wv3-preview__action" to={entry.explainerHref}>
            <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
            <span>See in Products</span>
            <span className="wv3-preview__glyph">[↗]</span>
          </Link>
        ) : entry.liveUrl ? (
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
  );
}
