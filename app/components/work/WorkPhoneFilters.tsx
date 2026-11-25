import { useId, useState } from "react";
import { Link } from "react-router";
import { GearMark } from "../marks/GearMark";
import { WorkFilterLists } from "./WorkFilterLists";

/* N4 P-J (OPERATOR, WORK V3_responsive / _responsive2): under the head, the
   yellow `Work` bar (the page heading) whose ∧ folds the controls below it
   (open on arrival), the `[ Featured ] | [ All works ]` switch (the /work and
   /work/archive URLs, the yellow half is the view shown), then the Year and
   Category lists, full width (WorkFilterLists, shared with the rail). A
   filter chosen on Featured opens All works (WorkWorkspace). */

export function WorkPhoneFilters({
  list,
  marked,
  year,
  category,
  onYear,
  onCategory,
}: {
  list: "featured" | "archive";
  marked: { year: string | null; category: string | null };
  year: string | null;
  category: string | null;
  onYear: (value: string | null) => void;
  onCategory: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  return (
    <div className="wv3p-controls">
      <h1 className="wv3p-title">
        <button
          type="button"
          className="wv3p-bar wv3p-title__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <GearMark className="wv3p-bar__gear" fill="#1A1A1A" dotFill="#FEF36A" />
          Work
          <span className="wv3p-title__fold" aria-hidden="true">
            {open ? "∧" : "∨"}
          </span>
        </button>
      </h1>

      <div className="wv3p-controls__panel" id={panelId} hidden={!open}>
        <nav className="wv3p-switch" aria-label="Work views">
          <Link
            className="wv3p-switch__item"
            to="/work"
            preventScrollReset
            aria-current={list === "featured" ? "page" : undefined}
          >
            [ Featured ]
          </Link>
          <Link
            className="wv3p-switch__item"
            to="/work/archive"
            preventScrollReset
            aria-current={list === "archive" ? "page" : undefined}
          >
            [ All works ]
          </Link>
        </nav>
        <div className="wv3p-filters">
          <WorkFilterLists marked={marked} year={year} category={category} onYear={onYear} onCategory={onCategory} />
        </div>
      </div>
    </div>
  );
}
