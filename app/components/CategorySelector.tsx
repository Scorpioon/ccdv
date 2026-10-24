import { useState } from "react";

/* Services' five top-level categories (`SVC-DEC-001`): the same hover-preview
   / click-persist family as Work's filters and Studio's own moving highlight,
   but the reference fills the WHOLE active cell solid red rather than
   underlining a value, so this reuses the masthead-cell visual language
   (`.cell[aria-current="page"]`) instead of FilterGroup's thin bar. */

export interface CategorySelectorProps {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
  panelId?: string;
}

export function CategorySelector({ categories, value, onChange, panelId }: CategorySelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const displayed = hovered ?? value;

  return (
    <div className="svc-categories" role="group" aria-label="Service categories" onMouseLeave={() => setHovered(null)}>
      {categories.map((category) => {
        const active = displayed === category;
        const selected = value === category;
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            aria-controls={panelId}
            className={active ? "svc-category svc-category--active" : "svc-category"}
            onMouseEnter={() => setHovered(category)}
            onFocus={() => setHovered(category)}
            onBlur={() => setHovered(null)}
            onClick={() => onChange(category)}
          >
            <span className="svc-category__label">[ {category} ]</span>
            <span className="svc-category__dot" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
