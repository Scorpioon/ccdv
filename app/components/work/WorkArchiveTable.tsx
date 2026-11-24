import { GearMark } from "../marks/GearMark";
import { ARCHIVE_GROUP_YEARS, FUTURE_YEARS, type ArchiveRow } from "../../data/workProjects";

/* N3 Work V3 archive table (OPERATOR, WORK V3 _ archive.svg x284-1199).
   The yellow `Work` bar, the column head, then one group per year (2027
   first, subdued) with row separators; the selected row is gray.

   Mandatory column alignment (OPERATOR annotation): the head, every row and
   every group use ONE grid definition (`--wv3-cols` on .wv3-table, global.css)
   with the same padding and gap, and every text cell starts at its column's
   leading edge; the trailing glyph is the last column, at the right. Long
   text is cut on one line with an ellipsis (one rule for every cell), so no
   state moves a column. The artboard's centred placement is NOT reproduced.

   Rows are buttons: hover, focus or a press selects the row and fills the
   preview (WorkArchivePreview), so a keyboard reaches every project. */

function Cells({ entry }: { entry: Pick<ArchiveRow, "year" | "category" | "responsibility" | "name" | "client" | "glyph"> }) {
  return (
    <>
      <span className="wv3-cell">{entry.year}</span>
      <span className="wv3-cell">{entry.category}</span>
      <span className="wv3-cell">{entry.responsibility}</span>
      <span className="wv3-cell">{entry.name}</span>
      <span className="wv3-cell">{entry.client}</span>
      <span className="wv3-cell wv3-cell--glyph" data-off={entry.glyph === "[x]" ? "" : undefined}>
        {entry.glyph}
      </span>
    </>
  );
}

export function WorkArchiveTable({
  rows,
  selectedId,
  onSelect,
}: {
  rows: ArchiveRow[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const groups = ARCHIVE_GROUP_YEARS.map((year) => ({ year, rows: rows.filter((entry) => entry.year === year) })).filter(
    (group) => group.rows.length > 0,
  );

  return (
    <div className="wv3-table">
      <p className="wv3-table__bar">
        <GearMark className="wv3-table__gear" fill="#1A1A1A" dotFill="#FEF36A" />
        Work
      </p>
      <div className="wv3-row wv3-row--head" aria-hidden="true">
        <span className="wv3-cell">[ YEAR ]</span>
        <span className="wv3-cell">[ CATEG. ]</span>
        <span className="wv3-cell">[ RESPONSABILITY ]</span>
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
            {group.rows.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="wv3-row"
                  aria-pressed={entry.id === selectedId}
                  aria-label={`${entry.year}, ${entry.category}, ${entry.responsibility}, ${entry.name}, ${entry.client}`}
                  onPointerEnter={() => onSelect(entry.id)}
                  onFocus={() => onSelect(entry.id)}
                  onClick={() => onSelect(entry.id)}
                >
                  <Cells entry={entry} />
                </button>
              </li>
            ))}
          </ul>
        ))
      )}
    </div>
  );
}
