import { WORK_PREVIEWS, type WorkProject } from "../../data/workProjects";

/* Archive preview column, following the List's active row. WORK-T3 (OPERATOR
   retouch): a wide lead image over three cards, then the caption. A project
   with no sourced imagery keeps the same four boxes — so the column never
   jumps — with the honest `[ preview unavailable ]` note in the lead. Images
   are case-study media, never live embeds. The caption is plain text:
   announcing it on every row hover was noise (it is the active row's own
   name). */

export function WorkPreviewPane({ project }: { project: WorkProject }) {
  const preview = WORK_PREVIEWS[project.id];
  const name = project.displayName ?? project.name;

  return (
    <div className="work-preview">
      <div className="work-preview__lead">
        {preview ? (
          <img src={preview.lead.src} alt={preview.lead.alt} decoding="async" />
        ) : (
          <p className="work-preview__note">[ preview unavailable ]</p>
        )}
      </div>
      <div className="work-preview__cards">
        {[0, 1, 2].map((slot) => {
          const image = preview?.cards[slot];
          return (
            <div key={slot} className="work-preview__card">
              {image && <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />}
            </div>
          );
        })}
      </div>
      <p className="work-preview__caption">{preview ? `${name}\\${preview.caption}` : name}</p>
    </div>
  );
}
