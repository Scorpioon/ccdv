import { Link } from "react-router";
import type { WorkProject } from "../data/workProjects";

export type { WorkProject };

/* Work's six-row project list (`WRK-DEC-004/006`). Hovering (or focusing) a
   row moves the small arrow-in-a-box to it and updates the preview pane.
   MTG02: a row whose project carries `href` (authentic Workcase data exists —
   today only ADG-ARC) renders as a real <Link> with the identical row markup;
   every other row keeps its no-op button, so no project gets a fake link.

   The arrow tracks `activeId` (default ADG-ARC, moves on hover/focus) — that
   is the whole of `WRK-DEC-004`. GF09-C (FBI-019): the underline now follows
   the same `activeId` as the arrow, so both always sit on one row. ADG-ARC
   still carries both by default (it is the default `activeId`); `leading`
   stays on the data shape but no longer drives a static underline. */

export interface ProjectListProps {
  projects: WorkProject[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
  /** called just before a Workcase link navigates (lets Work save its scroll) */
  onCaseNavigate?: () => void;
}

export function ProjectList({ projects, activeId, onActiveChange, onCaseNavigate }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <p className="project-list__empty" role="status">
        [ no matches ]
      </p>
    );
  }

  return (
    <ul className="project-list" aria-label="Projects">
      {projects.map((project) => {
        const isActive = project.id === activeId;
        const content = (
          <>
            <span
              className={isActive ? "project-row__arrow project-row__arrow--active" : "project-row__arrow"}
              aria-hidden="true"
            >
              {isActive ? "→" : ""}
            </span>
            <span className={isActive ? "project-row__name project-row__name--underline" : "project-row__name"}>
              {project.name}
            </span>
            <span className="project-row__tags">
              <span className="project-row__tag">{project.tag}</span>
              {project.wip && <span className="project-row__wip">(WIP)</span>}
            </span>
          </>
        );
        return (
          <li key={project.id} className="project-row">
            {project.href ? (
              <Link
                to={project.href}
                className="project-row__button project-row__button--link"
                aria-current={isActive ? "true" : undefined}
                onMouseEnter={() => onActiveChange(project.id)}
                onFocus={() => onActiveChange(project.id)}
                onClick={onCaseNavigate}
              >
                {content}
              </Link>
            ) : (
              <button
                type="button"
                className="project-row__button"
                aria-current={isActive ? "true" : undefined}
                onMouseEnter={() => onActiveChange(project.id)}
                onFocus={() => onActiveChange(project.id)}
                onClick={(event) => event.preventDefault()}
              >
                {content}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
