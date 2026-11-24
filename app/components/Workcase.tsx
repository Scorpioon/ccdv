import { Link } from "react-router";
import { useTransitionLink } from "./GlobalShell";
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
   overlaid with controls.

   Work V2 (PROJECTv2.svg, 1520 artboard): same structure, re-measured — a
   127 yellow band over a 31 ink rule, a 521 hero (733 photo | metadata sheet),
   a 31 ink rule, then the 8.5-inset gallery (680 screenshot, two 311.5
   Indetail fields, two 679 screenshots). The Type value shows the project's
   own tag (the artboard's `INTERACTIVE WEBSITE`) and still links to the
   canonical Type filter. The artboard's `[live site]`, `ADG-FAD.ORG` and
   sample copy are not carried (D7).

   WORK-T2: every link back (arrow, `[Work]`, `collapse`, Year, Type) now opens
   the archive (/work/archive), which owns the filters and restore context.
   WORK-T2 (OPERATOR, WF1): every /work/:slug page gets the thin masthead too,
   as the hub and archive — `r11--work` on the root shares their bar CSS; the
   yellow band is the boundary edge, so the bar shows from the top; phones get
   the M1 bar.
   NAV-T3 (OPERATOR): `collapse` now goes Home (global rule); the arrow,
   `[Work]`, Year and Type still open the archive.
   N3 W-A1 (OPERATOR): a case is no longer a page. The Work workspace
   (WorkWorkspace) slides it in from the right beside its rail, so it has no
   bar, no footer and no scroll of its own on the window: it sits in the
   workspace's scroll area, sized to it (`--pu` is measured on that area, a
   size container). The links back move the workspace (no page load, no
   scroll reset); the archive keeps its filters across the visit. */

const RESTORE_STATE = { restore: true } as const;

function Pending() {
  return <span className="workcase-pending">[ pending ]</span>;
}

export function Workcase({ project, data }: { project: WorkProject; data: WorkcaseData }) {
  const link = useTransitionLink();

  return (
    <div className="r11 r11--workcase">
      <section className="workcase-band" aria-label="Workcase">
        <div className="workcase-title">
          <Link
            className="workcase-title__back"
            to="/work/archive"
            state={RESTORE_STATE}
            preventScrollReset
            aria-label="Back to the Work archive"
          >
            (←)
          </Link>
          <Link className="workcase-title__work" to="/work/archive" state={RESTORE_STATE} preventScrollReset>
            [Work]
          </Link>
          <span className="workcase-title__sep" aria-hidden="true">
            \
          </span>
          {/* W-A1: the workspace's h1 is the rail's `Work` */}
          <h2 className="workcase-title__slug">{data.slug}</h2>
        </div>
        {/* NAV-T3 (OPERATOR): `collapse` goes Home everywhere; (←) and [Work]
            still return to the archive */}
        <Link className="hero__watermark" aria-label="collapse — back to Home" {...link("/")}>
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
                    to="/work/archive"
                    state={{ filter: { year: project.year } }}
                    preventScrollReset
                    aria-label={`Year: ${project.year} — show in the Work archive`}
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
                  to="/work/archive"
                  state={{ filter: { type: project.typeFilter } }}
                  preventScrollReset
                  aria-label={`Type: ${project.tag} — show ${project.typeFilter} projects in the Work archive`}
                >
                  {project.tag}
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
    </div>
  );
}
