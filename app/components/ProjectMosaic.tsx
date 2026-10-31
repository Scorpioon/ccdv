import type { WorkProject } from "./ProjectList";

/* Work's Mosaic view (`CCDV-FBI-021`, media contract PARTIAL). Presentational
   only: it renders exactly the `projects` it is handed — the same filtered
   collection, in the same source order, that the List renders — so there is no
   second data source and no second filter state.

   Cards are deliberately NOT interactive: no link, no button, no tabIndex, no
   handler (Workcase is FBI-022, out of scope). Each card is a media area plus a
   caption below it (name, type tag, WIP).

   No project media exists in the workspace, so the media area is a
   typography-only composition built from the project's own sourced name; it
   is `aria-hidden` because the caption already carries that name. `media` is
   an optional extension so authorised assets can be supplied later without
   editing ProjectList.tsx; nothing in the source sets it today. */

export type MosaicProject = WorkProject & {
  media?: { src: string; alt: string };
};

export interface ProjectMosaicProps {
  projects: MosaicProject[];
}

export function ProjectMosaic({ projects }: ProjectMosaicProps) {
  return (
    <div className="work-mosaic">
      {projects.length === 0 ? (
        <p className="project-list__empty" role="status">
          [ no matches ]
        </p>
      ) : (
        <ul className="work-mosaic__grid" aria-label="Projects">
          {projects.map((project) => (
            <li key={project.id} className="work-mosaic__card">
              {project.media ? (
                <img className="work-mosaic__media" src={project.media.src} alt={project.media.alt} />
              ) : (
                <div className="work-mosaic__media work-mosaic__media--type" aria-hidden="true">
                  <span className="work-mosaic__title">{project.name}</span>
                </div>
              )}
              <div className="work-mosaic__caption">
                <span className="work-mosaic__name">{project.name}</span>
                <span className="project-row__tags">
                  <span className="project-row__tag">{project.tag}</span>
                  {project.wip && <span className="project-row__wip">(WIP)</span>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
