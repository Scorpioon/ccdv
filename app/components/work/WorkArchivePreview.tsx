import { GearMark } from "../marks/GearMark";
import { WorkActions } from "./WorkActions";
import { ARCHIVE_POSTERS, archiveTitle, type ArchiveRow } from "../../data/workProjects";

/* N3 Work V3 archive preview (OPERATOR, WORK V3 _ archive.svg x1223-1461):
   the selected row's title on the gray bar (N4 P-K), the two actions, the poster.
   The actions and their honest states live in WorkActions (N4 P-J, shared
   with the phone cards). W-A1: a case slides in beside the rail, it does not
   load a page. A project without imagery shows an empty poster with a plain
   note. */

export function WorkArchivePreview({ entry }: { entry: ArchiveRow }) {
  const poster = ARCHIVE_POSTERS[entry.id];
  const title = archiveTitle(entry);

  return (
    <section className="wv3-preview" aria-label={`Preview: ${title}`} aria-live="polite">
      <p className="wv3-preview__bar">
        <GearMark className="wv3-preview__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
        {title}
      </p>

      <WorkActions entry={entry} />

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
