import { WorkArchiveCard } from "./WorkArchiveCard";
import { ARCHIVE_GROUP_YEARS, FUTURE_YEARS, type ArchiveRow } from "../../data/workProjects";

/* N4 P-J (OPERATOR, WORK V3_responsive2 y764..2108): All works on phones and
   tablets. Between two rules, the full-width `All works` label; then one
   group per year, in the archive's order (2027 first, dimmed as on desktop):
   the year's white box with its trailing rule, between two rules, then its
   cards (WorkArchiveCard). Every group carries its year (the artboard's first
   group has none; read as an omission). The filters are the archive's.
   N4 P-K: the year boxes stay white; the label box is gray (CSS). */

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
        groups.map((group) => (
          <section
            key={group.year}
            className="wv3p-year"
            aria-labelledby={`wv3p-year-${group.year}`}
            data-future={FUTURE_YEARS.includes(group.year) ? "" : undefined}
          >
            <div className="wv3p-year__head">
              <h3 className="wv3p-year__box" id={`wv3p-year-${group.year}`}>
                {group.year}
              </h3>
              <span className="wv3p-year__rule" aria-hidden="true" />
            </div>
            <ul className="wv3p-cards">
              {group.rows.map((entry) => (
                <WorkArchiveCard key={entry.id} entry={entry} />
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}
