import { useId, useState } from "react";
import { WorkArchiveCard } from "./WorkArchiveCard";
import { ARCHIVE_GROUP_YEARS, DEFAULT_OPEN_YEAR, FUTURE_YEARS, type ArchiveRow } from "../../data/workProjects";

/* N4 P-J (OPERATOR, WORK V3_responsive2 y764..2108): All works on phones and
   tablets. Between two rules, the full-width `All works` label; then one
   group per year, in the archive's order (2027 first, dimmed as on desktop):
   the year's white box with its trailing rule, between two rules, then its
   cards (WorkArchiveCard). Every group carries its year (the artboard's first
   group has none; read as an omission). The filters are the archive's.
   N4 P-K: the year boxes stay white; the label box is gray (CSS).
   N6 R1 B2: each year's box is a disclosure with a rotating v; its cards fold
   under it. R3 S9: only DEFAULT_OPEN_YEAR (2026) starts open; 2027 (FUTURE_YEARS) stays
   dimmed but its toggle works like any other. The box's trailing rule is gone. */

function YearGroup({ year, rows }: { year: string; rows: ArchiveRow[] }) {
  const future = FUTURE_YEARS.includes(year);
  const [open, setOpen] = useState(year === DEFAULT_OPEN_YEAR);
  const panelId = useId();

  return (
    <section className="wv3p-year" aria-labelledby={`wv3p-year-${year}`} data-future={future ? "" : undefined}>
      <div className="wv3p-year__head">
        <h3 className="wv3p-year__box" id={`wv3p-year-${year}`}>
          <button
            type="button"
            className="wv3p-year__toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            <span>{year}</span>
            <span className="wv3p-v" aria-hidden="true">
              v
            </span>
          </button>
        </h3>
      </div>
      <div className="wv3p-disclosure" id={panelId} data-open={open ? "" : undefined} inert={!open}>
        <div className="wv3p-disclosure__inner">
          <ul className="wv3p-cards">
            {rows.map((entry) => (
              <WorkArchiveCard key={entry.id} entry={entry} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function WorkPhoneWorks({ rows }: { rows: ArchiveRow[] }) {
  const groups = ARCHIVE_GROUP_YEARS.map((year) => ({ year, rows: rows.filter((entry) => entry.year === year) })).filter(
    (group) => group.rows.length > 0,
  );

  return (
    <section className="wv3p-section" aria-labelledby="wv3p-works-title">
      <div className="wv3p-label">
        <h2 className="wv3p-label__box wv3p-label__box--wide" id="wv3p-works-title">
          All works
        </h2>
      </div>

      {groups.length === 0 ? (
        <p className="wv3p-empty">[ No projects for this filter ]</p>
      ) : (
        groups.map((group) => <YearGroup key={group.year} year={group.year} rows={group.rows} />)
      )}
    </section>
  );
}
