import { useLayoutEffect, useRef, useState } from "react";

/* Work's Year/Type filter groups (`WRK-DEC-001/002`): each group is a row of
   bracketed options sharing ONE moving highlight. Hovering another option
   previews the highlight there without touching the persisted selection;
   clicking commits it. Clicking the already-selected option clears it
   (`WRK-PEND-002` is explicitly undecided — deselect-to-none is this build's
   minimal, reversible reading, not a confirmed OPERATOR decision).

   The highlight's left/width are measured off the hovered-or-selected
   option's own rendered box rather than hardcoded, because option text widths
   differ ("2026" vs "DIGITAL PRODUCT") the same way the R1.1 export's own
   highlight rects are sized per-label, not uniform.

   GF08-A4 CORRECTION 01: `disabled` is a genuine non-interactive mode, not a
   visual-only dimming. No project in the workspace carries a sourced release
   year (work.tsx), so Work's Year group is mounted `disabled` — its four
   bracketed options stay visible (geometry unchanged) but take native
   `disabled` semantics: no hover/focus preview, no highlight ever renders, no
   click reaches `onChange`. This must not read as a working filter that
   happens to do nothing, so the group itself carries `aria-disabled` and its
   accessible name says so.

   MTG02 CORR02: `disabledOptions` is an optional per-option variant of the
   same idea. Listed options render a native `disabled` button (out of the Tab
   order, no focus/hover preview, no click) while the rest of the group stays
   live. Omitted, behavior is identical to before. */

export interface FilterGroupProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  align?: "start" | "end";
  disabled?: boolean;
  disabledOptions?: readonly string[];
}

export function FilterGroup({
  label,
  options,
  value,
  onChange,
  align = "start",
  disabled = false,
  disabledOptions,
}: FilterGroupProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const displayed = disabled ? null : hovered ?? value;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [highlight, setHighlight] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!displayed || !container) {
      setHighlight(null);
      return;
    }
    const node = buttonRefs.current[displayed];
    if (!node) return;
    const containerRect = container.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    setHighlight({ left: nodeRect.left - containerRect.left, width: nodeRect.width });
  }, [displayed, options]);

  return (
    <div
      ref={containerRef}
      className={disabled ? `filter-group filter-group--${align} filter-group--disabled` : `filter-group filter-group--${align}`}
      role="group"
      aria-label={disabled ? `${label} (unavailable)` : label}
      aria-disabled={disabled ? "true" : undefined}
      onMouseLeave={disabled ? undefined : () => setHovered(null)}
    >
      {highlight && !disabled && (
        <span
          className="filter-group__highlight"
          style={{ left: `${highlight.left}px`, width: `${highlight.width}px` }}
          aria-hidden="true"
        />
      )}
      {options.map((option) => {
        const optionDisabled = disabled || (disabledOptions?.includes(option) ?? false);
        const selected = !optionDisabled && value === option;
        return (
          <button
            key={option}
            type="button"
            ref={(node) => {
              buttonRefs.current[option] = node;
            }}
            className="filter-group__option"
            disabled={optionDisabled}
            aria-pressed={optionDisabled ? undefined : selected}
            onMouseEnter={optionDisabled ? undefined : () => setHovered(option)}
            onFocus={optionDisabled ? undefined : () => setHovered(option)}
            onBlur={optionDisabled ? undefined : () => setHovered(null)}
            onClick={optionDisabled ? undefined : () => onChange(selected ? null : option)}
          >
            [ {option} ]
          </button>
        );
      })}
    </div>
  );
}
