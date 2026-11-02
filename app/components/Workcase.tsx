import { Link } from "react-router";
import { SiteMasthead } from "./SiteMasthead";
import { SiteFooter } from "./SiteFooter";
import { AVAILABLE_YEARS, type WorkProject, type WorkcaseData } from "../data/workProjects";

/* Reusable Workcase page (MTG02 / `CCDV-FBI-022`), composed per R1.1
   `pages_workcase.png`: shared masthead, full-width yellow title band, hero
   photo + metadata panel, divider, static showcase screenshots, shared
   footer. Every field but the project identity and `showcase` is optional and
   is simply not rendered when absent — no placeholder copy is invented.

   The three title-band controls are three separate links to Work
   (`WKC-DEC-001/002/003`): left arrow, `[Work]`, `collapse`. All carry
   `state.restore`, which Work reads to restore the prior Type filter,
   desktop List/Mosaic choice and scroll (MTG02 scope choice for `[Work]` /
   `collapse`; the arrow is `WKC-DEC-001`). The Type value links back to Work
   with the canonical Type selected (`WKC-DEC-005`) — `state.filter`, which
   Work applies without restoring stale scroll. CORR01: the metadata box keeps
   R1.1's five rows (Project Name, Client, Year, Type, Description) and the two
   `Indetail 0N:` slots always render. Year (OPERATOR-approved, from the shared
   project record) and Type are links; an unsourced Client / Description /
   Indetail body shows a neutral "[ pending ]" state — never invented text.

   Screenshots are single static <img>s (`WKC-PEND-003`): never split, never
   overlaid with controls. */

const RESTORE_STATE = { restore: true } as const;

function Pending() {
  return <span className="workcase-pending">[ pending ]</span>;
}

export function Workcase({ project, data }: { project: WorkProject; data: WorkcaseData }) {
  return (
    <div className="r11 r11--workcase">
      <SiteMasthead variant="work" />

      <section className="workcase-band" aria-label="Workcase">
        <div className="workcase-title">
          <Link className="workcase-title__back" to="/work" state={RESTORE_STATE} aria-label="Back to Work">
            (←)
          </Link>
          <Link className="workcase-title__work" to="/work" state={RESTORE_STATE}>
            [Work]
          </Link>
          <span className="workcase-title__sep" aria-hidden="true">
            \
          </span>
          <h1 className="workcase-title__slug">{data.slug}</h1>
        </div>
        <Link className="hero__watermark" to="/work" state={RESTORE_STATE} aria-label="collapse — back to Work">
          collapse
        </Link>
      </section>
      <div className="workcase-rule" />

      <section className="workcase-summary" aria-label="Project summary">
        {data.hero && (
          <div className="workcase-summary__photo">
            <img
              src={data.hero.src}
              alt={data.hero.alt}
              width={data.hero.width}
              height={data.hero.height}
              decoding="async"
            />
          </div>
        )}
        <div className="workcase-summary__panel">
          <dl className="workcase-meta">
            <div className="workcase-meta__row">
              <dt>Project Name:</dt>
              <dd>{project.name}</dd>
            </div>
            <div className="workcase-meta__row">
              <dt>Client:</dt>
              <dd>{data.client ?? <Pending />}</dd>
            </div>
            <div className="workcase-meta__row">
              <dt>Year:</dt>
              <dd>
                {project.year && AVAILABLE_YEARS.includes(project.year) ? (
                  <Link
                    className="workcase-meta__year"
                    to="/work"
                    state={{ filter: { year: project.year } }}
                    aria-label={`Year: ${project.year} — show in Work`}
                  >
                    {project.year}
                  </Link>
                ) : (
                  (project.year ?? <Pending />)
                )}
              </dd>
            </div>
            <div className="workcase-meta__row">
              <dt>Type:</dt>
              <dd>
                <Link
                  className="workcase-meta__type"
                  to="/work"
                  state={{ filter: { type: project.typeFilter } }}
                  aria-label={`Type: ${project.typeFilter} — show in Work`}
                >
                  {project.typeFilter}
                </Link>
              </dd>
            </div>
            <div className="workcase-meta__row workcase-meta__row--text">
              <dt>Description:</dt>
              <dd>{data.description ?? <Pending />}</dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="workcase-rule" />

      <section className="workcase-media" aria-label="Project screenshots">
        {data.showcase.slice(0, 1).map((image) => (
          <img key={image.src} src={image.src} alt={image.alt} width={image.width} height={image.height} decoding="async" />
        ))}

        <div className="workcase-details">
          {Array.from({ length: Math.max(2, data.details?.length ?? 0) }, (_, index) => {
            const label = `Indetail ${String(index + 1).padStart(2, "0")}:`;
            const body = data.details?.[index];
            return (
              <article key={label} className="workcase-details__col" aria-label={label}>
                <h2>{label}</h2>
                <p>{body ?? <Pending />}</p>
              </article>
            );
          })}
        </div>

        {data.showcase.slice(1).map((image) => (
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading="lazy"
            decoding="async"
          />
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
