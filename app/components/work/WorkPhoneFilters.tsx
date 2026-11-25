import { useId, useState } from "react";
import { GearMark } from "../marks/GearMark";
import { WorkFilterLists } from "./WorkFilterLists";

/* N4 P-J (OPERATOR, WORK V3_responsive / _responsive2): under the head, the
   gray `Filtros` bar (N4 P-K: was the `Work` heading; the h1 is the head's
   card now) whose ∧ folds the controls below it (open on arrival), the
   `[ Featured ] | [ All works ]` switch, then the Year and Category lists,
   full width (WorkFilterLists, shared with the rail). N4 P-K: the switch is
   two toggle buttons (aria-pressed, controlling the list) that set the list
   and let WorkWorkspace replace the URL; the pressed half is the view shown.
   The panel stays mounted and folds by grid rows (CSS); closed it is inert.
   A filter chosen on Featured opens All works (WorkWorkspace). */

export function WorkPhoneFilters({
  list,
  onList,
  year,
  category,
  onYear,
  onCategory,
}: {
  list: "featured" | "archive";
  onList: (next: "featured" | "archive") => void;
  year: string | null;
  category: string | null;
  onYear: (value: string | null) => void;
  onCategory: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  return (
    <div className="wv3p-controls">
      <button
        type="button"
        className="wv3p-bar wv3p-title__toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <GearMark className="wv3p-bar__gear" fill="#1A1A1A" dotFill="#D9D9D9" />
        Filtros
        <span className="wv3p-fold" aria-hidden="true">
          ∧
        </span>
      </button>

      <div className="wv3p-controls__panel" id={panelId} data-open={open ? "" : undefined} inert={!open}>
        <div className="wv3p-controls__inner">
          <div className="wv3p-switch" role="group" aria-label="Work views">
            <button
              type="button"
              className="wv3p-switch__item"
              aria-pressed={list === "featured"}
              aria-controls="wv3p-list"
              onClick={() => onList("featured")}
            >
              [ Featured ]
            </button>
            <button
              type="button"
              className="wv3p-switch__item"
              aria-pressed={list === "archive"}
              aria-controls="wv3p-list"
              onClick={() => onList("archive")}
            >
              [ All works ]
            </button>
          </div>
          <div className="wv3p-filters">
            <WorkFilterLists year={year} category={category} onYear={onYear} onCategory={onCategory} />
          </div>
        </div>
      </div>
    </div>
  );
}
