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

/* N6 R1 B5: `hideUnavailable` (phone cards and Featured only) leaves out the
   disabled View Case Study / Open Live Site instead of drawing them greyed,
   and renders no list when neither action is left. Desktop passes nothing. */
export function WorkActions({
  entry,
  className,
  hideUnavailable = false,
}: {
  entry: ArchiveRow;
  className?: string;
  hideUnavailable?: boolean;
}) {
  const caseHref = entry.projectId ? workcaseHref(entry.projectId) : undefined;

  const caseItem = caseHref ? (
    <Link className="wv3-preview__action" to={caseHref} preventScrollReset>
      <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
      <span>View Case Study</span>
      <span className="wv3-preview__glyph">[+]</span>
    </Link>
  ) : hideUnavailable ? null : (
    <span className="wv3-preview__action" aria-disabled="true">
      <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
      <span>View Case Study</span>
      <span className="wv3-preview__glyph">[+]</span>
    </span>
  );

  const liveItem = entry.explainerHref ? (
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
  ) : hideUnavailable ? null : (
    <span className="wv3-preview__action" aria-disabled="true" title="No live site on record">
      <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#FFFFFF" />
      <span>Open Live Site</span>
      <span className="wv3-preview__glyph">[↗]</span>
    </span>
  );

  if (!caseItem && !liveItem) return null;

  return (
    <ul className={`wv3-preview__actions${className ? ` ${className}` : ""}`}>
      {caseItem ? <li>{caseItem}</li> : null}
      {liveItem ? <li>{liveItem}</li> : null}
    </ul>
  );
}
