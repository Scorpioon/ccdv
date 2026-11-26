import { useId, useState } from "react";
import { V3_ARCHIVE_CATEGORIES, V3_YEARS, hasRows } from "../../data/workProjects";

/* N4 P-J: the archive's Year and Category filters, shared by the desktop rail
   (WorkSidebar) and the phone / tablet filters (WorkPhoneFilters); moved out
   of WorkSidebar unchanged. AND between the lists; a head clears its list.
   N4 P-K: ONE highlight per list (gray, the Work V3 fill): the pressed
   option, or the head ([ YEAR ] / [ CATEGORY ], "all") when nothing is
   chosen. The "project in view" mark (`marked`) is gone. A value without
   rows is drawn but inert.
   N6 R1 B2/B3 (phones and tablets only, the `collapsible` prop, passed by
   WorkPhoneFilters and never by the desktop rail): each head is a disclosure
   (aria-expanded, a rotating v) that folds its options, closed by default;
   the options lose their brackets. A head there does not clear its list; a
   pressed option still clears itself when chosen again. */

export function WorkFilterLists({
  year,
  category,
  onYear,
  onCategory,
  collapsible = false,
}: {
  year: string | null;
  category: string | null;
  onYear: (value: string | null) => void;
  onCategory: (value: string | null) => void;
  /** N6 R1 B2/B3: phones and tablets; only WorkPhoneFilters passes it */
  collapsible?: boolean;
}) {
  const [yearOpen, setYearOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const yearPanelId = useId();
  const categoryPanelId = useId();

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
    const bracketed = field === "year" ? `[ ${value} ]` : value === "WEBSITE" ? `[${value}]` : `[ ${value} ]`;
    const text = collapsible ? value : bracketed;
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
        onClick={() => set(active ? null : value)}
      >
        {text}
      </button>
    );
  };

  if (collapsible) {
    const group = (
      field: "year" | "category",
      label: string,
      values: string[],
      open: boolean,
      setOpen: (next: boolean) => void,
      panelId: string,
    ) => (
      <div className="wv3p-disclosure-group">
        <button
          type="button"
          className="wv3-side__item wv3-side__head wv3p-head"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          {field === "year" ? "[ YEAR ]" : "[ CATEGORY ]"}
          {/* N6 R1 B2 (OPERATOR): a folded head still shows its chosen value */}
          {(field === "year" ? year : category) ? (
            <span className="wv3p-head__value">{field === "year" ? year : category}</span>
          ) : null}
          <span className="wv3p-v" aria-hidden="true">
            v
          </span>
        </button>
        <div className="wv3p-disclosure" id={panelId} data-open={open ? "" : undefined} inert={!open}>
          <div className="wv3p-disclosure__inner">
            <ul className="wv3-side__list" aria-label={label}>
              {values.map((value) => (
                <li key={value}>{entry(field, value)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );

    return (
      <>
        {group("year", "Year", V3_YEARS, yearOpen, setYearOpen, yearPanelId)}
        {group("category", "Category", V3_ARCHIVE_CATEGORIES, categoryOpen, setCategoryOpen, categoryPanelId)}
      </>
    );
  }

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
