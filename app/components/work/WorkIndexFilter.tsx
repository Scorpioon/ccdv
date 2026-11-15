/* Work V2 Work Index filter row (WORKv2 y1246 / y1290): four equal bordered
   cells, one option per cell. Same semantics as the FilterGroup it replaces
   on /work: native buttons with `aria-pressed`, clicking the selected option
   clears it, and `disabledOptions` (years with no records, D3) render native
   `disabled` — present as drawn, never selectable, out of the Tab order.

   The white selection band sits behind the option text only (the artboard's
   68 x 11 / 76 x 11 rects), so it is a CSS background on the label span, not
   a measured overlay. Hover and keyboard focus preview the same band.

   `formatLabel` is presentation only (D2): `value` / `onChange` always carry
   the canonical option. */

export interface WorkIndexFilterProps {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabledOptions?: readonly string[];
  formatLabel?: (option: string) => string;
}

export function WorkIndexFilter({
  label,
  options,
  value,
  onChange,
  disabledOptions,
  formatLabel = (option) => option,
}: WorkIndexFilterProps) {
  return (
    <div className="work-filter" role="group" aria-label={label}>
      {options.map((option) => {
        const disabled = disabledOptions?.includes(option) ?? false;
        const selected = !disabled && value === option;
        const text = formatLabel(option);
        return (
          <button
            key={option}
            type="button"
            className="work-filter__option"
            disabled={disabled}
            aria-pressed={disabled ? undefined : selected}
            aria-label={disabled ? `${text} (no projects)` : text}
            onClick={disabled ? undefined : () => onChange(selected ? null : option)}
          >
            <span className="work-filter__text" aria-hidden="true">
              [ {text} ]
            </span>
          </button>
        );
      })}
    </div>
  );
}
