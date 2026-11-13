/* Services R1 S2: the black \\Service Index. R1 CORR01: the SERVICES_v2
   composition (y1192..2308 there): the interactive index is LEFT, the editorial
   text RIGHT.

     left     red \\Service Index strip over one slot per category (tabs), then
              the voxel face (IndexVoxel): one pattern per service, 15 states
              from data/servicesVoxels.ts; the face recomposes on every switch
     right    a red strip (the strip's gear only), the "//" category lead, the
              category's services (tabs), the approved description and its two
              Focus values as light chips

   Everything is read from SERVICE_CATEGORIES (servicesContent.ts): five
   categories and their services are rendered from the data, nothing is copied
   (the right column is the corrected editorial panel of capture 09 because the
   data already holds that wording). Each category remembers its selected
   service; a new category opens on its remembered (else first) service.
   Arrow/Home/End move inside either tab list. */
import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChipGear, Chip } from "../studio/studioMarks";
import { IndexVoxel } from "./IndexVoxel";
import { DEFAULT_SERVICE_CATEGORY_ID, SERVICE_CATEGORIES } from "../../data/servicesContent";
import { SERVICE_CATEGORY_LEADS } from "../../data/servicesScenes";
import { indexPattern } from "../../data/servicesVoxels";
import { index } from "../../motion/studioMotion";

const DEFAULT_INDEX = Math.max(
  0,
  SERVICE_CATEGORIES.findIndex((category) => category.id === DEFAULT_SERVICE_CATEGORY_ID),
);

/* roving-tab keys shared by both tab lists */
const keyTarget = (key: string, current: number, count: number) =>
  key === "ArrowRight" || key === "ArrowDown" ? (current + 1) % count
  : key === "ArrowLeft" || key === "ArrowUp" ? (current - 1 + count) % count
  : key === "Home" ? 0
  : key === "End" ? count - 1
  : null;

export function ServiceIndex({ reduced, titleId }: { reduced: boolean; titleId: string }) {
  const baseId = useId();
  const [active, setActive] = useState(DEFAULT_INDEX);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const serviceRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const category = SERVICE_CATEGORIES[active];
  const services = category.services;
  const selected = Math.min(chosen[category.id] ?? 0, Math.max(0, services.length - 1));
  const service = services[selected];
  const lead = SERVICE_CATEGORY_LEADS[category.id];

  const selectCategory = (next: number, focus = false) => {
    if (next !== active) setActive(next);
    if (focus) categoryRefs.current[next]?.focus();
  };
  const selectService = (next: number, focus = false) => {
    if (next !== selected) setChosen((current) => ({ ...current, [category.id]: next }));
    if (focus) serviceRefs.current[next]?.focus();
  };

  const onCategoryKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const to = keyTarget(event.key, active, SERVICE_CATEGORIES.length);
    if (to === null) return;
    event.preventDefault();
    selectCategory(to, true);
  };
  const onServiceKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const to = keyTarget(event.key, selected, services.length);
    if (to === null) return;
    event.preventDefault();
    selectService(to, true);
  };

  const categoryTab = (i: number) => `${baseId}-cat-${i}`;
  const categoryPanel = `${baseId}-cat-panel`;
  const serviceTab = (i: number) => `${baseId}-svc-${i}`;
  const servicePanel = `${baseId}-svc-panel`;
  const servicesLabel = `${baseId}-svc-label`;

  return (
    <div
      className="sv-ix"
      data-scene
      data-category-id={category.id}
      data-active-service-id={service?.id}
      data-pattern={`${category.id}:${selected + 1}`}
    >
      <div className="sv-ix__head" data-spawn style={index(0)}>
        <Chip tone="red" as="h2" className="sv-ix__title" id={titleId}>
          {"\\\\Service Index"}
        </Chip>
        <div className="sv-ix__slots" role="tablist" aria-labelledby={titleId} onKeyDown={onCategoryKey}>
          {SERVICE_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              ref={(node) => {
                categoryRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={categoryTab(i)}
              className="sv-ix__slot"
              aria-selected={active === i}
              aria-controls={categoryPanel}
              tabIndex={active === i ? 0 : -1}
              onClick={() => selectCategory(i)}
            >
              <span className="sv-ix__slot-dot" aria-hidden="true" />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sv-ix__art" data-spawn style={index(1)}>
        <IndexVoxel pattern={indexPattern(category.id, selected)} reduced={reduced} />
      </div>

      <div className="sv-ix__panel">
        <span className="sv-ix__strip chip chip--red" aria-hidden="true" data-spawn style={index(1)}>
          <ChipGear className="chip__gear" />
        </span>

        {/* wrapper takes the scene spawn; the keyed panel replays the CSS
            spawn on a new category (lead + services first, then the copy) */}
        <div className="sv-ix__body" data-spawn style={index(2)}>
          <div key={category.id} id={categoryPanel} className="sv-ix__content" role="tabpanel" aria-labelledby={categoryTab(active)}>
            {lead ? (
              <p className="sv-ix__lead">
                <span aria-hidden="true">{"// "}</span>
                {lead}
              </p>
            ) : null}

            <h3 className="sv-visually-hidden" id={servicesLabel}>
              {category.label} services
            </h3>
            <div className="sv-ix__services" role="tablist" aria-labelledby={servicesLabel} onKeyDown={onServiceKey}>
              {services.map((s, i) => (
                <button
                  key={s.id}
                  ref={(node) => {
                    serviceRefs.current[i] = node;
                  }}
                  type="button"
                  role="tab"
                  id={serviceTab(i)}
                  className="sv-ix__service"
                  data-service-id={s.id}
                  aria-selected={selected === i}
                  aria-controls={servicePanel}
                  tabIndex={selected === i ? 0 : -1}
                  onClick={() => selectService(i)}
                >
                  <span className="sv-ix__service-mark" aria-hidden="true" />
                  {s.label}
                </button>
              ))}
            </div>

            {service ? (
              <div key={service.id} id={servicePanel} className="sv-ix__detail" role="tabpanel" aria-labelledby={serviceTab(selected)}>
                <div className="sv-ix__copy">
                  {service.paragraphs.map((paragraph, i) => (
                    <p key={`${service.id}-${i}`}>{paragraph}</p>
                  ))}
                  {service.pending ? <p className="sv-ix__pending">[ pending ] · content slot {service.id}</p> : null}
                </div>
                <div className="sv-ix__focus">
                  <h4 className="sv-visually-hidden">Focus</h4>
                  <ul className="sv-ix__chips">
                    {service.focus.map((value) => (
                      <li key={value}>
                        <Chip tone="light">{value}</Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
