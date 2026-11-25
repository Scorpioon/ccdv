import { ARCHIVE_ROWS, V3_ARCHIVE_CATEGORIES, V3_YEARS } from "../../data/workProjects";

/* N4 P-J: the archive's Year and Category filters, shared by the desktop rail
   (WorkSidebar) and the phone / tablet filters (WorkPhoneFilters); moved out
   of WorkSidebar unchanged. AND between the lists; a head clears its list.
   Fills: yellow is the active choice of a list (a head when nothing is
   chosen); white marks the year and category of the project in view. A
   value without rows is drawn but inert. */

const hasRows = (field: "year" | "category", value: string) => ARCHIVE_ROWS.some((entry) => entry[field] === value);

export function WorkFilterLists({
  marked,
  year,
  category,
  onYear,
  onCategory,
}: {
  marked: { year: string | null; category: string | null };
  year: string | null;
  category: string | null;
  onYear: (value: string | null) => void;
  onCategory: (value: string | null) => void;
}) {
  const head = (field: "year" | "category") => {
    const none = (field === "year" ? year : category) === null;
    const set = field === "year" ? onYear : onCategory;
    return (
      <li>
        <button type="button" className="wv3-side__item wv3-side__head" aria-pressed={none} onClick={() => set(null)}>
          {field === "year" ? "[ YEAR ]" : "[ CATEGORY ]"}
        </button>
      </li>
    );
  };

  const entry = (field: "year" | "category", value: string) => {
    const text = field === "year" ? `[ ${value} ]` : value === "WEBSITE" ? `[${value}]` : `[ ${value} ]`;
    if (!hasRows(field, value)) {
      return (
        <span className="wv3-side__item" aria-disabled="true">
          {text}
        </span>
      );
    }
    const active = (field === "year" ? year : category) === value;
    const set = field === "year" ? onYear : onCategory;
    return (
      <button
        type="button"
        className="wv3-side__item"
        aria-pressed={active}
        data-marked={marked[field] === value && !active ? "" : undefined}
        onClick={() => set(active ? null : value)}
      >
        {text}
      </button>
    );
  };

  return (
    <>
      <ul className="wv3-side__list" aria-label="Year">
        {head("year")}
        {V3_YEARS.map((value) => (
          <li key={value}>{entry("year", value)}</li>
        ))}
      </ul>
      <ul className="wv3-side__list" aria-label="Category">
        {head("category")}
        {V3_ARCHIVE_CATEGORIES.map((value) => (
          <li key={value}>{entry("category", value)}</li>
        ))}
      </ul>
    </>
  );
}
