import { WORK_PREVIEWS, type WorkProject } from "../../data/workProjects";

/* Work V2 Work Index preview column (WORKv2 x780: 708 x 320 and 708 x 360
   frames, caption below). It follows the List's active row like the old
   single preview did. A project with no sourced imagery keeps both frames —
   so the column never jumps — with the honest `[ preview unavailable ]`
   note in the first. Images are case-study media, never live embeds. */

export function WorkPreviewPane({ project }: { project: WorkProject }) {
  const preview = WORK_PREVIEWS[project.id];
  const name = project.displayName ?? project.name;

  return (
    <div className="work-preview">
      <div className="work-preview__frame work-preview__frame--a">
        {preview ? (
          <img src={preview.frames[0].src} alt={preview.frames[0].alt} decoding="async" />
        ) : (
          <p className="work-preview__note">[ preview unavailable ]</p>
        )}
      </div>
      <div className="work-preview__frame work-preview__frame--b">
        {preview && <img src={preview.frames[1].src} alt={preview.frames[1].alt} loading="lazy" decoding="async" />}
      </div>
      <p className="work-preview__caption" role="status" aria-live="polite">
        {preview ? `${name}\\${preview.caption}` : name}
      </p>
    </div>
  );
}
