import { useState } from "react";
import type { ServiceCategory } from "../data/servicesContent";

/* Services' nested service selector + bound description (`SVC-DEC-002/004`).

   One panel per SELECTED category (never 5 x 3 panels). `category.services`
   is rendered as-is, so the row count is whatever the data holds.

   State model (MTG03 D1/D4, supersedes `SVC-DEC-003`'s "brackets = active"):
   - hover / keyboard focus -> `[ brackets ]`, purely CSS (`:hover`,
     `:focus-visible`), so they vanish on mouse-leave and never commit;
   - selection -> `aria-pressed` + a provisional red square marker
     (D16, final persistent cue still pending OPERATOR visual decision).

   Right pane (MTG04): context line, approved description (one <p> per
   paragraph, MTG04 CORR01), then the typed `focus` pair as
   `[ Focus ] · first / second`. `[ pending ]` renders only for
   a record whose `pending` flag is true; none of the 15 sourced records is.

   Selection is stored as a service id. Ids are category-scoped, so after a
   category change the stored id matches nothing and the first service of the
   new category is active — no effect, no stale frame, no cross-category
   bleed. Returning to a category restores its last selected service. */

export interface ServiceDetailPanelProps {
  category: ServiceCategory;
  panelId?: string;
}

export function ServiceDetailPanel({ category, panelId }: ServiceDetailPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { services } = category;
  const active = services.find((service) => service.id === selectedId) ?? services[0];

  return (
    <div id={panelId} className="svc-detail" data-category-id={category.id} data-active-service-id={active?.id}>
      <div className="svc-detail__blocks" role="group" aria-label={`${category.label} services`}>
        {services.map((service) => {
          const selected = service.id === active?.id;
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={selected}
              data-service-id={service.id}
              className="svc-detail__block"
              onClick={() => setSelectedId(service.id)}
            >
              <span className="svc-detail__mark" aria-hidden="true" />
              <span className="svc-detail__bracket" aria-hidden="true">
                [&nbsp;
              </span>
              <span className="svc-detail__label">{service.label}</span>
              <span className="svc-detail__bracket" aria-hidden="true">
                &nbsp;]
              </span>
            </button>
          );
        })}
        <span className="svc-detail__dot" aria-hidden="true" />
      </div>
      <div className="svc-detail__description" aria-live="polite">
        {active ? (
          <>
            <p className="svc-detail__context">
              [ {category.label} / {active.label} ]
            </p>
            {active.paragraphs.map((paragraph, index) => (
              <p key={`${active.id}-${index}`}>{paragraph}</p>
            ))}
            <p className="svc-detail__focus">
              [ Focus ] · {active.focus[0]} / {active.focus[1]}
            </p>
            {active.pending ? (
              <p className="svc-detail__pending">[ pending ] · content slot {active.id}</p>
            ) : null}
          </>
        ) : null}
        <span className="svc-detail__dot svc-detail__dot--accent" aria-hidden="true" />
      </div>
    </div>
  );
}
