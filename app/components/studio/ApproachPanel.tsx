/* Studio Approach (R3 M03/M04): the black interactive editorial panel.

   Structure, top to bottom on phones, sphere left / copy right from 768px:
     progress strip (three segments, the active slot's is lilac)
     panoramic sphere  .  slot selector (Resolution / Efficiency / Creativity)
                          editorial copy
                          two supporting toollet cards
   Exactly three slots; one is always active (the first on load). Switching a
   slot lights that slot's lilac layer in the sphere, gives the sphere a light
   impulse, and re-spawns the copy and cards (CSS spawn on the keyed panel:
   copy first, cards after). The sphere is one hit area that owns its drag
   (touch-action none on the svg only, pointer capture in useSphereMotion);
   everywhere else the page scrolls natively. */
import { useId, useRef, useState } from "react";
import type { KeyboardEvent, MutableRefObject } from "react";
import {
  IDENT,
  apply,
  axisLine,
  mul,
  ringEllipse,
  useSphereMotion,
  wobble,
  writeEllipse,
  writeLine,
} from "../marks/StudioMobileOrbit";
import type { Mat3, SphereControl, Vec3 } from "../marks/StudioMobileOrbit";
import { APPROACH_SLOTS } from "../../data/studioApproach";
import { STUDIO_MOTION, index } from "../../motion/studioMotion";

const SPHERE = { cx: 200, cy: 200, r: 180 };
/* one great circle per slot; its projected ellipse is the slanted lilac layer */
const LAYER_NORMALS: Vec3[] = [
  [0.48, 0.85, 0.22],
  [-0.62, 0.72, 0.3],
  [0.92, -0.2, 0.34],
];

function sphereGeometry(m: Mat3) {
  return {
    layers: LAYER_NORMALS.map((n) => ringEllipse(apply(m, n), SPHERE.cx, SPHERE.cy, SPHERE.r)),
    lines: [
      axisLine(apply(m, [0, 1, 0]), SPHERE.cx, SPHERE.cy, SPHERE.r),
      axisLine(apply(m, [1, 0, 0]), SPHERE.cx, SPHERE.cy, SPHERE.r),
    ],
  };
}

const ellipseProps = (g: ReturnType<typeof ringEllipse>) => ({
  cx: g.cx.toFixed(2),
  cy: g.cy.toFixed(2),
  rx: g.rx.toFixed(2),
  ry: g.ry.toFixed(2),
  transform: `rotate(${g.angle.toFixed(2)} ${g.cx.toFixed(2)} ${g.cy.toFixed(2)})`,
});

function ApproachSphere({
  reduced,
  active,
  control,
}: {
  reduced: boolean;
  active: number;
  control: MutableRefObject<SphereControl | null>;
}) {
  const clip = `aps-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const write = (m: Mat3) => {
    const g = sphereGeometry(m);
    g.layers.forEach((layer, i) => writeEllipse(layerRefs.current[i], layer));
    g.lines.forEach((line, i) => writeLine(lineRefs.current[i], line));
  };

  useSphereMotion(svgRef, {
    reduced,
    interactive: true,
    control,
    draw: (drag, clock) => write(mul(wobble(clock), drag)),
    rest: () => write(IDENT),
  });

  const rest = sphereGeometry(IDENT);
  return (
    <svg
      ref={svgRef}
      className="ap__sphere studio-sphere"
      viewBox="0 0 400 400"
      fill="none"
      role="group"
      aria-roledescription="rotatable sphere"
      aria-label="Studio Approach sphere. Drag, or use the arrow keys, to turn it."
      tabIndex={0}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx={SPHERE.cx} cy={SPHERE.cy} r={SPHERE.r + 0.6} />
        </clipPath>
      </defs>
      <circle className="ap__outline" cx={SPHERE.cx} cy={SPHERE.cy} r={SPHERE.r} />
      <g clipPath={`url(#${clip})`}>
        {rest.layers.map((layer, i) => (
          <ellipse
            key={i}
            ref={(node) => {
              layerRefs.current[i] = node;
            }}
            className="ap__layer"
            data-active={active === i}
            {...ellipseProps(layer)}
          />
        ))}
        {rest.lines.map((line, i) => (
          <line
            key={i}
            ref={(node) => {
              lineRefs.current[i] = node;
            }}
            className="ap__axis"
            x1={line.x1.toFixed(2)}
            y1={line.y1.toFixed(2)}
            x2={line.x2.toFixed(2)}
            y2={line.y2.toFixed(2)}
          />
        ))}
      </g>
    </svg>
  );
}

export function ApproachPanel({ reduced }: { reduced: boolean }) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const control = useRef<SphereControl | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const slot = APPROACH_SLOTS[active];

  const select = (next: number, focus = false) => {
    const target = (next + APPROACH_SLOTS.length) % APPROACH_SLOTS.length;
    if (target !== active) {
      const dir = target > active ? 1 : -1;
      control.current?.kick(STUDIO_MOTION.impulse.x * dir, STUDIO_MOTION.impulse.y * dir);
      setActive(target);
    }
    if (focus) tabRefs.current[target]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const to =
      event.key === "ArrowRight" ? active + 1
      : event.key === "ArrowLeft" ? active - 1
      : event.key === "Home" ? 0
      : event.key === "End" ? APPROACH_SLOTS.length - 1
      : null;
    if (to === null) return;
    event.preventDefault();
    select(to, true);
  };

  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = `${baseId}-panel`;

  return (
    <div className="ap" data-scene data-slot={slot.key}>
      <div className="ap__progress" aria-hidden="true" data-spawn style={index(0)}>
        {APPROACH_SLOTS.map((s, i) => (
          <span key={s.key} className="ap__seg" data-active={active === i} />
        ))}
      </div>

      <div className="ap__stage">
        <div className="ap__art" data-spawn style={index(1)}>
          <ApproachSphere reduced={reduced} active={active} control={control} />
        </div>

        <div className="ap__panel">
          <div
            className="ap__slots"
            role="tablist"
            aria-label="Studio approach"
            onKeyDown={onKeyDown}
            data-spawn
            style={index(2)}
          >
            {APPROACH_SLOTS.map((s, i) => (
              <button
                key={s.key}
                ref={(node) => {
                  tabRefs.current[i] = node;
                }}
                type="button"
                role="tab"
                id={tabId(i)}
                className="ap__slot"
                aria-selected={active === i}
                aria-controls={panelId}
                tabIndex={active === i ? 0 : -1}
                onClick={() => select(i)}
              >
                <span className="ap__slot-dot" aria-hidden="true" />
                {s.label}
              </button>
            ))}
          </div>

          {/* keyed: a new slot remounts the panel, which replays the CSS spawn */}
          <div
            key={slot.key}
            id={panelId}
            className="ap__content"
            role="tabpanel"
            aria-labelledby={tabId(active)}
          >
            <h3 className="ap__title">{slot.title}</h3>
            <div className="ap__copy">
              {slot.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="ap__toollets">
              {slot.toollets.map((toollet) => (
                <article key={toollet.label} className="ap__toollet">
                  <h4 className="ap__toollet-label">{toollet.label}</h4>
                  <p>{toollet.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
