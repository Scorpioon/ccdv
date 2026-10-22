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
   the indicator is then author-chosen, not state-derived. */

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
    return (
      <div className="clip-row">
        <h2>
          <button
            type="button"
            className="clip-row__toggle"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={onToggle}
          >
            {label}
          </button>
        </h2>
        {isExpanded ? (
          <span className="clip-row__watermark" aria-hidden="true">
            collapse
          </span>
        ) : (
          <span className="clip-row__chevron" aria-hidden="true">
            v
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="clip-row">
      <h2 className="clip-row__label">{label}</h2>
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
