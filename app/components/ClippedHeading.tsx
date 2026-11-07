/* A Studio heading row: bare page ground, a rule across the top, and an
   oversized bracketed heading that runs past the rule exactly as the Home band
   labels run past their stripe. Rows sit at a 98 pitch (1288.12, 1386.12,
   1484.12 and 1970.12 on the artboard).

   The chevron and the faint "collapse" watermark are not decoration added
   here — each row in the reference carries one or the other at x1411.04 and
   x1361.82 respectively, so which one appears is passed in per row.

   GF07-D: a row becomes a real disclosure control only when `onToggle` is
   supplied. Rows with no associated panel content (B1-a) keep calling this
   with just `chevron`/`watermark` and get byte-identical output to before —
   the indicator is then author-chosen, not state-derived.

   GF09-E: the 99 size fits 24 characters before the label reaches the
   indicator column (x1358); the corrected editorial labels run to 28. Longer
   labels are scaled down by `--fit` (CSS recomputes the baseline offset from
   it); labels of 24 or fewer are untouched. */

import type { CSSProperties } from "react";

const FIT_CHARS = 24;

function fitStyle(label: string): CSSProperties | undefined {
  const fit = Math.min(1, FIT_CHARS / label.length);
  return fit < 1 ? ({ "--fit": fit.toFixed(4) } as CSSProperties) : undefined;
}

export interface ClippedHeadingProps {
  label: string;
  chevron?: boolean;
  watermark?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  panelId?: string;
}

export function ClippedHeading({
  label,
  chevron = false,
  watermark = false,
  expanded,
  onToggle,
  panelId,
}: ClippedHeadingProps) {
  if (onToggle) {
    const isExpanded = expanded === true;
    /* STUDIO-RESP T1 (O08): the chevron is always rendered and `data-expanded`
       mirrors the state for CSS only. At >=768 CSS hides the chevron while the
       row is open, so desktop still shows the watermark OR the chevron as
       before; on phones the watermark is hidden and the chevron flips. */
    return (
      <div className="clip-row" data-expanded={isExpanded}>
        <h2>
          <button
            type="button"
            className="clip-row__toggle"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={onToggle}
            style={fitStyle(label)}
          >
            {/* the label is wrapped so hover/focus can scale the text alone
                without changing the row's hit area */}
            <span className="clip-row__text">{label}</span>
          </button>
        </h2>
        {isExpanded && (
          <span className="clip-row__watermark" aria-hidden="true">
            collapse
          </span>
        )}
        <span className="clip-row__chevron" aria-hidden="true">
          v
        </span>
      </div>
    );
  }

  return (
    <div className="clip-row">
      <h2 className="clip-row__label" style={fitStyle(label)}>
        {label}
      </h2>
      {chevron && (
        <span className="clip-row__chevron" aria-hidden="true">
          v
        </span>
      )}
      {watermark && (
        <span className="clip-row__watermark" aria-hidden="true">
          collapse
        </span>
      )}
    </div>
  );
}
