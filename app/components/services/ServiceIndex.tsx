/* Services R1 S2: the black \\Service Index, the Studio Approach mechanic
   (ApproachPanel.tsx, FB_R4_5.svg y1118..2164) applied to the approved
   Services data.

     bars     an 18 square + one progress bar per category; the active
              category's bar is lit red
     sphere   the Approach sphere's exact geometry (exported from
              ApproachPanel): circle, "+" hairlines, dotted axis, three discs on
              that axis. Category -> sphere pose (each category turns the
              figure to its own orientation; the middle category is the drawn
              pose). Disc i <-> service i of the category: the selected
              service's disc is lit red. Any switch gives the sphere an impulse.
     panel    red \\Service Index strip over one slot per category (tabs), then
              the "//" category lead, the category's services (tabs), the
              approved description and its two Focus values as light chips.

   Everything is read from SERVICE_CATEGORIES (servicesContent.ts): five
   categories and their services are rendered from the data, nothing is copied.
   The sphere has three discs, so a category with more than three services
   would leave the extra ones without a disc (none does; see the report).
   Each category remembers its selected service; a new category opens on its
   remembered (else first) service. Arrow/Home/End move inside either tab
   list. The sphere takes a drag only inside its circle (CSS hit circle). */
import { useId, useRef, useState } from "react";
import type { KeyboardEvent, MutableRefObject } from "react";
import { mul, rotY, rotZ, useSphereMotion, wobble, writeEllipse, writeLine } from "../marks/StudioMobileOrbit";
import type { Mat3, SphereControl } from "../marks/StudioMobileOrbit";
import { SPHERE, ellipseProps, lineProps, sphereGeometry } from "../studio/ApproachPanel";
import { Chip } from "../studio/studioMarks";
import { DEFAULT_SERVICE_CATEGORY_ID, SERVICE_CATEGORIES } from "../../data/servicesContent";
import { SERVICE_CATEGORY_LEADS } from "../../data/servicesScenes";
import { STUDIO_MOTION, index } from "../../motion/studioMotion";

const DISCS = 3;
const DEFAULT_INDEX = Math.max(
  0,
  SERVICE_CATEGORIES.findIndex((category) => category.id === DEFAULT_SERVICE_CATEGORY_ID),
);

/* category i turns the sphere by s = i - middle steps about screen z and y; the
   middle category (s = 0) is the drawn (identity) pose */
const MIDDLE = (SERVICE_CATEGORIES.length - 1) / 2;
const poseAt = (s: number): Mat3 => mul(rotZ(s * 0.24), rotY(s * 0.38));
const POSE_RATE = 5; // 1/s: the running loop eases s toward the category's

function IndexSphere({
  reduced,
  step,
  lit,
  control,
}: {
  reduced: boolean;
  step: number;
  lit: number;
  control: MutableRefObject<SphereControl | null>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const discRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const axisRef = useRef<SVGLineElement>(null);
  const target = useRef(step);
  target.current = step;
  const eased = useRef({ s: step, clock: 0 });
  const write = (m: Mat3) => {
    const g = sphereGeometry(m);
    g.discs.forEach((disc, i) => writeEllipse(discRefs.current[i], disc));
    g.lines.forEach((line, i) => writeLine(lineRefs.current[i], line));
    writeLine(axisRef.current, g.axis);
  };

  useSphereMotion(svgRef, {
    reduced,
    interactive: true,
    control,
    draw: (drag, clock) => {
      const e = eased.current;
      /* reduced motion (clock stays 0) or a restarted loop: no easing */
      const dt = clock - e.clock;
      e.s = reduced || dt <= 0 ? target.current : e.s + (target.current - e.s) * (1 - Math.exp(-POSE_RATE * Math.min(dt, 0.1)));
      e.clock = clock;
      write(mul(wobble(clock), mul(drag, poseAt(e.s))));
    },
    rest: () => {
      eased.current = { s: target.current, clock: 0 };
      write(poseAt(target.current));
    },
  });

  /* the server render, the reduced-motion drawing and a category change while
     no loop runs (off screen): React writes the category's pose */
  const rest = sphereGeometry(poseAt(step));
  return (
    <svg
      ref={svgRef}
      className="sv-ix__sphere studio-sphere"
      viewBox="129 1398 486 486"
      fill="none"
      role="group"
      aria-roledescription="rotatable sphere"
      aria-label="Service Index sphere: one disc per service of the selected category. Drag, or use the arrow keys, to turn it."
      tabIndex={0}
    >
      <g>
        {rest.discs.map((disc, i) => (
          <ellipse
            key={i}
            ref={(node) => {
              discRefs.current[i] = node;
            }}
            className="sv-ix__disc"
            data-active={lit === i}
            {...ellipseProps(disc)}
          />
        ))}
        {rest.lines.map((line, i) => (
          <line
            key={i}
            ref={(node) => {
              lineRefs.current[i] = node;
            }}
            className="sv-ix__line"
            {...lineProps(line)}
          />
        ))}
        <line ref={axisRef} className="sv-ix__axis" {...lineProps(rest.axis)} />
      </g>
      <circle className="sv-ix__line" cx={SPHERE.cx} cy={SPHERE.cy} r={SPHERE.r} />
      <circle className="studio-sphere__hit" cx={SPHERE.cx} cy={SPHERE.cy} r={SPHERE.r} fill="transparent" />
    </svg>
  );
}

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
  const control = useRef<SphereControl | null>(null);
  const categoryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const serviceRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const category = SERVICE_CATEGORIES[active];
  const services = category.services;
  const selected = Math.min(chosen[category.id] ?? 0, Math.max(0, services.length - 1));
  const service = services[selected];
  const lead = SERVICE_CATEGORY_LEADS[category.id];

  const kick = (dir: number, gain = 1) =>
    control.current?.kick(STUDIO_MOTION.impulse.x * dir * gain, STUDIO_MOTION.impulse.y * dir * gain);

  const selectCategory = (next: number, focus = false) => {
    if (next !== active) {
      kick(next > active ? 1 : -1);
      setActive(next);
    }
    if (focus) categoryRefs.current[next]?.focus();
  };
  const selectService = (next: number, focus = false) => {
    if (next !== selected) {
      kick(next > selected ? 1 : -1, 0.6);
      setChosen((current) => ({ ...current, [category.id]: next }));
    }
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
    <div className="sv-ix" data-scene data-category-id={category.id} data-active-service-id={service?.id}>
      <div className="sv-ix__bars" aria-hidden="true" data-spawn style={index(0)}>
        <span className="sv-ix__mark" />
        {SERVICE_CATEGORIES.map((c, i) => (
          <span key={c.id} className="sv-ix__bar" data-active={active === i} />
        ))}
      </div>

      <div className="sv-ix__art">
        <IndexSphere reduced={reduced} step={active - MIDDLE} lit={selected < DISCS ? selected : -1} control={control} />
      </div>

      <div className="sv-ix__panel">
        <div className="sv-ix__head" data-spawn style={index(1)}>
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

        {/* wrapper takes the scene spawn; the keyed panel replays the CSS
            spawn on a new category (lead + services first, then the copy) */}
        <div className="sv-ix__body" data-spawn style={index(3)}>
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
