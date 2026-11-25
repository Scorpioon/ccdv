import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { ARCHIVE_GROUP_YEARS, FUTURE_YEARS, workcaseHref, type ArchiveRow } from "../../data/workProjects";

/* N3 Work V3 archive table (OPERATOR, WORK V3 _ archive.svg x284-1199).
   The gray (N4 P-K) `Work` bar, the column head, then one group per year (2027
   first, subdued) with row separators; the selected row is gray.

   Mandatory column alignment (OPERATOR annotation): the head, every row and
   every group use ONE grid definition (`--wv3-cols` on .wv3-table, global.css)
   with the same padding and gap, and every text cell starts at its column's
   leading edge; the trailing glyph is the last column, at the right. Long
   text is cut on one line with an ellipsis (one rule for every cell), so no
   state moves a column. The artboard's centred placement is NOT reproduced.
   N4 (OPERATOR): the columns are proportional, so they spread across the
   whole table instead of bunching at its left.

   Rows are buttons: hover, focus or a press selects the row and fills the
   preview (WorkArchivePreview), so a keyboard reaches every project.

   N4 glyphs (OPERATOR): `[+]` opens the project's case study (only where a
   Workcase exists), `[↗]` goes to the page that explains the project
   (`explainerHref`, /products/ccos for CC.OS), `[x]` is inert. A live glyph is
   a control laid over the row's last column, a sibling of the row button, so
   no interactive element is nested and the grid does not move. */

function Cells({ entry, live }: { entry: Pick<ArchiveRow, "year" | "category" | "responsibility" | "name" | "client" | "glyph">; live: boolean }) {
  /* N4 P-H B-04 (OPERATOR): a `[+]` with no case yet is drawn dimmed, as "not available (yet)" */
  const soon = entry.glyph === "[+]" && !live;
  return (
    <>
      <span className="wv3-cell">{entry.year}</span>
      <span className="wv3-cell">{entry.category}</span>
      <span className="wv3-cell">{entry.responsibility}</span>
      <span className="wv3-cell">{entry.name}</span>
      <span className="wv3-cell">{entry.client}</span>
      <span
        className="wv3-cell wv3-cell--glyph"
        data-off={entry.glyph === "[x]" ? "" : undefined}
        data-soon={soon ? "" : undefined}
        title={soon ? "Case study not available yet" : undefined}
        aria-hidden={live ? "true" : undefined}
      >
        {live ? "" : entry.glyph}
      </span>
    </>
  );
}

export function WorkArchiveTable({
  rows,
  selectedId,
  onSelect,
  onOpenCase,
}: {
  rows: ArchiveRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenCase: (href: string) => void;
}) {
  const groups = ARCHIVE_GROUP_YEARS.map((year) => ({ year, rows: rows.filter((entry) => entry.year === year) })).filter(
    (group) => group.rows.length > 0,
  );

  return (
    <div className="wv3-table">
      <p className="wv3-table__bar">
        <GearMark className="wv3-table__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
        Work
      </p>
      <div className="wv3-row wv3-row--head" aria-hidden="true">
        <span className="wv3-cell">[ YEAR ]</span>
        <span className="wv3-cell">[ CATEG. ]</span>
        <span className="wv3-cell">[ ROLE ]</span>
        <span className="wv3-cell">[ PROJECT NAME]</span>
        <span className="wv3-cell">[CLIENT]</span>
        <span className="wv3-cell wv3-cell--glyph">[+]</span>
      </div>

      {groups.length === 0 ? (
        <p className="wv3-table__empty">[ No projects for this filter ]</p>
      ) : (
        groups.map((group) => (
          <ul
            key={group.year}
            className="wv3-group"
            aria-label={group.year}
            data-future={FUTURE_YEARS.includes(group.year) ? "" : undefined}
          >
            {group.rows.map((entry) => {
              const caseHref = entry.glyph === "[+]" && entry.projectId ? workcaseHref(entry.projectId) : undefined;
              const explainer = entry.glyph === "[↗]" ? entry.explainerHref : undefined;
              const live = Boolean(caseHref || explainer);
              return (
                <li key={entry.id} className="wv3-item" onPointerEnter={() => onSelect(entry.id)}>
                  <button
                    type="button"
                    className="wv3-row"
                    aria-pressed={entry.id === selectedId}
                    aria-label={`${entry.year}, ${entry.category}, ${entry.responsibility}, ${entry.name}, ${entry.client}`}
                    onFocus={() => onSelect(entry.id)}
                    onClick={() => onSelect(entry.id)}
                  >
                    <Cells entry={entry} live={live} />
                  </button>
                  {caseHref ? (
                    <button
                      type="button"
                      className="wv3-item__glyph"
                      aria-label={`Open case study: ${entry.name}`}
                      onClick={() => {
                        onSelect(entry.id);
                        onOpenCase(caseHref);
                      }}
                    >
                      {entry.glyph}
                    </button>
                  ) : explainer ? (
                    <Link className="wv3-item__glyph" to={explainer} aria-label={`See ${entry.name} in Products`} onFocus={() => onSelect(entry.id)}>
                      {entry.glyph}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ))
      )}
    </div>
  );
}
