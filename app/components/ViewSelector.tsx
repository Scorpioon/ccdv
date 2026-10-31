/* Work's List / Mosaic view selector (`CCDV-FBI-020`). Two individually
   bracketed icon buttons — four rounded squares (Mosaic) and three bars (List)
   — per CCDV-SS-005. The brackets stay ink in both states; only the icon
   changes (active ink, inactive grey). Pure presentation + a callback: the
   view lives in work.tsx, and nothing here touches filters or navigation.

   Native buttons, `aria-pressed`, accessible names that do not depend on the
   icon, and the global `:where(a, button):focus-visible` ring. */

export type WorkView = "list" | "mosaic";

export interface ViewSelectorProps {
  value: WorkView;
  onChange: (view: WorkView) => void;
}

const OPTIONS: { view: WorkView; label: string }[] = [
  { view: "mosaic", label: "Mosaic view" },
  { view: "list", label: "List view" },
];

function MosaicIcon() {
  return (
    <svg className="view-selector__icon" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="6" height="6" rx="1.6" />
      <rect x="8" y="0" width="6" height="6" rx="1.6" />
      <rect x="0" y="8" width="6" height="6" rx="1.6" />
      <rect x="8" y="8" width="6" height="6" rx="1.6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="view-selector__icon" viewBox="0 0 16 14" aria-hidden="true" focusable="false">
      <rect x="0" y="1" width="16" height="2" rx="1" />
      <rect x="0" y="6" width="16" height="2" rx="1" />
      <rect x="0" y="11" width="16" height="2" rx="1" />
    </svg>
  );
}

export function ViewSelector({ value, onChange }: ViewSelectorProps) {
  return (
    <div className="view-selector" role="group" aria-label="Project view">
      {OPTIONS.map(({ view, label }) => {
        const active = value === view;
        return (
          <button
            key={view}
            type="button"
            className={active ? "view-selector__button view-selector__button--active" : "view-selector__button"}
            aria-label={label}
            aria-pressed={active}
            onClick={() => onChange(view)}
          >
            <span aria-hidden="true">[</span>
            {view === "mosaic" ? <MosaicIcon /> : <ListIcon />}
            <span aria-hidden="true">]</span>
          </button>
        );
      })}
    </div>
  );
}
