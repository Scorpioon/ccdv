import { WORK_PREVIEWS, type WorkProject } from "../../data/workProjects";

/* Archive preview column (WORK-T2): three cards in the Studio card proportions
   (284.667 x 450, the same corner radius, ink ground), each holding an image,
   following the List's active row. A project with no sourced imagery keeps the
   three cards — so the column never jumps — with the honest
   `[ preview unavailable ]` note in the first. Images are case-study media,
   never live embeds. The caption is plain text: announcing it on every row
   hover was noise (it is the active row's own name). */

export function WorkPreviewPane({ project }: { project: WorkProject }) {
  const preview = WORK_PREVIEWS[project.id];
  const name = project.displayName ?? project.name;

  return (
    <div className="work-preview">
      <div className="work-preview__cards">
        {[0, 1, 2].map((slot) => {
          const image = preview?.cards[slot];
          return (
            <div key={slot} className="work-preview__card">
              {image ? (
                <img src={image.src} alt={image.alt} loading={slot === 0 ? "eager" : "lazy"} decoding="async" />
              ) : (
                slot === 0 && <p className="work-preview__note">[ preview unavailable ]</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="work-preview__caption">{preview ? `${name}\\${preview.caption}` : name}</p>
    </div>
  );
}
