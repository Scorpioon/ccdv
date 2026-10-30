import { useState } from "react";
import { CcosOverviewIcon } from "./marks/CcosArtwork";

/* The CCOS detail section (`PCC-013`, `PCC-DEC-002`). Initial state is
   expanded, matching the R1.1 reference; the toggle folds the whole block
   — overview panel, four-column rail, features/roadmap rail — back to the
   base CCOS presentation and keeps the route mounted throughout, reusing
   the exact height-collapse mechanism Studio's own disclosures already
   established (`.section--columns`/`.section--wrkops`'s `data-collapsed`
   height transition, zeroed under reduced-motion by the same global rule)
   rather than inventing a new transition. The visible "collapse" label is
   the one sourced string (R1.1 never shows a sourced "expand" counterpart);
   `aria-expanded`/`aria-label` carry the accessible open/closed state
   instead of inventing new display copy.

   All body copy below — the overview statement, the four detail columns,
   version/release values, Features/Roadmap lists — is the exact R1.1
   placeholder text/values, explicitly NOT verified release facts
   (`PCC` "Important version disclaimer" in the decision matrix). The top
   header's own `collapse` (`PCC-006`) is a separate, still-undecided
   control and is not wired to this one.

   GF09-F (FBI-039): strip and overview fidelity are hub-only CSS under
   `.ccos-detail--hub` (the leaves share the base `.ccos-detail__*` rules and
   are untouched). The strip label reads "[CC.OS]" with ASCII brackets, as the
   hub SVG and the Home band labels do; the toggle's state, label and
   behaviour are unchanged. */

const DETAIL_COLUMNS = [
  {
    heading: "[ Wrkops Description ]",
    body: "We build our own tools and develop project specific tools. We take special care with UX/UI design",
  },
  {
    heading: "[ Use block 2 ]",
    body: "We put care into creating systems that gives ownership over automated tasks, leverages cognitive fatigue of repeating tasks.",
  },
  { heading: "[ Version details ]", body: "v. 1.9.0" },
  // GF09-F: "2027" has no editorial source; neutral dash, column kept.
  { heading: "[ Release ]", body: "-" },
];

const OVERVIEW_LINES = ["Law Protocols", "Suite compatibility", "Control", "Overview", "Architecture"];
const PLACEHOLDER_ITEMS = ["-", "-", "-", "-"];

export function CcosDetailPanel() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="ccos-detail ccos-detail--hub" data-collapsed={!expanded}>
      <div className="section section--stripe ccos-detail__lead-stripe" />

      <section className="section section--hero ccos-detail__strip">
        <h2 className="ccos-detail__wordmark">[CC.OS]</h2>
        <span className="ccos-detail__version">0.3.0</span>
        <button
          type="button"
          className="ccos-detail__toggle"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse CCOS detail" : "Expand CCOS detail"}
          onClick={() => setExpanded((value) => !value)}
        >
          collapse
        </button>
      </section>

      <div className="ccos-detail__body">
        <section className="section ccos-detail__overview">
          <p className="ccos-detail__overview-statement">CCOS is out daily work system.</p>
          <ul className="ccos-detail__overview-list">
            {OVERVIEW_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <CcosOverviewIcon className="ccos-detail__overview-icon" />
        </section>

        <div className="section--stripe section--stripe--light" />

        <section className="section ccos-detail__columns">
          {DETAIL_COLUMNS.map((column) => (
            <div className="ccos-detail__column" key={column.heading}>
              <p className="ccos-detail__column-heading">{column.heading}</p>
              <p className="ccos-detail__column-body">{column.body}</p>
            </div>
          ))}
        </section>

        <div className="section--stripe section--stripe--light" />

        <section className="section ccos-detail__lists">
          <div className="ccos-detail__list">
            <p className="ccos-detail__column-heading">[ Wrkops Features Actual ]</p>
            <ul>
              {PLACEHOLDER_ITEMS.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ccos-detail__list">
            <p className="ccos-detail__column-heading">[ Roadmap ]</p>
            <ul>
              {PLACEHOLDER_ITEMS.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
