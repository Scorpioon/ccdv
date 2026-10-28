/* Work's six-row project list (`WRK-DEC-004/006`). Hovering (or focusing) a
   row moves the small arrow-in-a-box to it and updates the preview pane;
   clicking never navigates — Workcase is out of GF08-A's scope
   (`GF08_A_REFERENCE_AND_IMPLEMENTATION_GATE.md` names only Work + Services
   for this movement), so every row's click is a no-op this round, ADG-ARC
   included, rather than a route to a page that does not exist yet.

   The arrow tracks `activeId` (default ADG-ARC, moves on hover/focus) — that
   is the whole of `WRK-DEC-004`. GF09-C (FBI-019): the underline now follows
   the same `activeId` as the arrow, so both always sit on one row. ADG-ARC
   still carries both by default (it is the default `activeId`); `leading`
   stays on the data shape but no longer drives a static underline. */

export interface WorkProject {
  id: string;
  name: string;
  tag: string;
  typeFilter: string;
  /** no project in the source carries a sourced release year (see work.tsx) */
  year: string | null;
  wip: boolean;
  leading?: boolean;
}

export interface ProjectListProps {
  projects: WorkProject[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
}

export function ProjectList({ projects, activeId, onActiveChange }: ProjectListProps) {
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
        return (
          <li key={project.id} className="project-row">
            <button
              type="button"
              className="project-row__button"
              aria-current={isActive ? "true" : undefined}
              onMouseEnter={() => onActiveChange(project.id)}
              onFocus={() => onActiveChange(project.id)}
              onClick={(event) => event.preventDefault()}
            >
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
            </button>
          </li>
        );
      })}
    </ul>
  );
}
