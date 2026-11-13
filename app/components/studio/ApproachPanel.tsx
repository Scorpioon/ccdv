/* Studio Approach (R3 M03/M04, rebuilt in OPUS CORR01 OC01-03/04 from
   FB_R4_5.svg y1118..2164 and STUDIO_resp3-1.svg y1118..2636).

     frames   three progress bars (desktop: led by an 18 x 18 square); bar i is
              lit for slot i
     sphere   circle, "+" hairlines, a dotted axis and THREE discs strung on
              that axis: the middle one is the great circle (largest), the
              upper and lower ones are parallel latitude discs (smaller, higher
              and lower in depth, E12). The active slot's disc is lit lilac.
     panel    one lilac strip "\\Studio Approach" sitting on three equal slots
              Resolution / Efficiency / Creativity (E05), then the copy ("//"
              lead + paragraphs) and two compact Toolbelt chips with a line of
              text each. No titles, no tiles.

   Exactly three slots, one always active (the middle one on load, as drawn).
   Switching a slot lights that disc, gives the sphere a short impulse and
   replays the copy/toollet spawn (keyed panel). Arrow/Home/End move between
   slots. The sphere owns a drag only inside its circle (hit circle, CSS). */
import { useId, useRef, useState } from "react";
import type { KeyboardEvent, MutableRefObject } from "react";
import { IDENT, apply, axisLine, mul, ringEllipse, useSphereMotion, wobble, writeEllipse, writeLine } from "../marks/StudioMobileOrbit";
import type { Mat3, SphereControl, Vec3 } from "../marks/StudioMobileOrbit";
import { Chip } from "./studioMarks";
import { APPROACH_DEFAULT_SLOT, APPROACH_SLOTS } from "../../data/studioApproach";
import { STUDIO_MOTION, index } from "../../motion/studioMotion";

/* FB_R4_5 artboard: circle (372, 1641) r242.624; the clip box 129..615 x
   1398..1884 is the viewBox. The lit disc is the original's ellipse rx 53.86 /
   ry 242.43 turned by matrix(0.50293 0.864327 -0.867707 0.497075): a great
   circle whose normal projects along (0.503, 0.864) with |n.z| = 53.86 / 242.43. */
/* SPHERE, sphereGeometry, ellipseProps and lineProps are exported (unchanged)
   so the Services R1 index sphere reuses this exact geometry. */
export const SPHERE = { cx: 372, cy: 1641, r: 242.624 };
const AXIS_N0: Vec3 = [0.4905, 0.8425, 0.222];
/* latitude of the outer discs, as a fraction of r along the axis: fitted to the
   original's two dashed discs (bbox centres (279.5, 1488.9) and (455.6, 1793.0),
   widths 295.6) */
const DISC_AT = [-0.72, 0, 0.72];

export function sphereGeometry(m: Mat3) {
  const n = apply(m, AXIS_N0);
  return {
    discs: DISC_AT.map((at) =>
      ringEllipse(n, SPHERE.cx, SPHERE.cy, SPHERE.r * Math.sqrt(1 - at * at), at * SPHERE.r),
    ),
    axis: axisLine(n, SPHERE.cx, SPHERE.cy, SPHERE.r),
    lines: [
      axisLine(apply(m, [0, 1, 0]), SPHERE.cx, SPHERE.cy, SPHERE.r),
      axisLine(apply(m, [1, 0, 0]), SPHERE.cx, SPHERE.cy, SPHERE.r),
    ],
  };
}

export const ellipseProps = (g: ReturnType<typeof ringEllipse>) => ({
  cx: g.cx.toFixed(2),
  cy: g.cy.toFixed(2),
  rx: g.rx.toFixed(2),
  ry: g.ry.toFixed(2),
  transform: `rotate(${g.angle.toFixed(2)} ${g.cx.toFixed(2)} ${g.cy.toFixed(2)})`,
});
export const lineProps = (g: ReturnType<typeof axisLine>) => ({
  x1: g.x1.toFixed(2),
  y1: g.y1.toFixed(2),
  x2: g.x2.toFixed(2),
  y2: g.y2.toFixed(2),
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
  const svgRef = useRef<SVGSVGElement>(null);
  const discRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const axisRef = useRef<SVGLineElement>(null);
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
    draw: (drag, clock) => write(mul(wobble(clock), drag)),
    rest: () => write(IDENT),
  });

  const rest = sphereGeometry(IDENT);
  return (
    <svg
      ref={svgRef}
      className="ap__sphere studio-sphere"
      viewBox="129 1398 486 486"
      fill="none"
      role="group"
      aria-roledescription="rotatable sphere"
      aria-label="Studio Approach sphere. Drag, or use the arrow keys, to turn it."
      tabIndex={0}
    >
      {/* no clip group: every disc is a circle on the sphere and every line a
          chord, so all stay inside the outline */}
      <g>
        {/* original order: the discs, then the hairlines over them */}
        {rest.discs.map((disc, i) => (
          <ellipse
            key={i}
            ref={(node) => {
              discRefs.current[i] = node;
            }}
            className="ap__disc"
            data-active={active === i}
            {...ellipseProps(disc)}
          />
        ))}
        {rest.lines.map((line, i) => (
          <line
            key={i}
            ref={(node) => {
              lineRefs.current[i] = node;
            }}
            className="ap__line"
            {...lineProps(line)}
          />
        ))}
        <line ref={axisRef} className="ap__axis" {...lineProps(rest.axis)} />
      </g>
      <circle className="ap__line" cx={SPHERE.cx} cy={SPHERE.cy} r={SPHERE.r} />
      <circle className="studio-sphere__hit" cx={SPHERE.cx} cy={SPHERE.cy} r={SPHERE.r} fill="transparent" />
    </svg>
  );
}

export function ApproachPanel({ reduced, titleId }: { reduced: boolean; titleId: string }) {
  const baseId = useId();
  const [active, setActive] = useState(APPROACH_DEFAULT_SLOT);
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
      event.key === "ArrowRight" || event.key === "ArrowDown" ? active + 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? active - 1
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
    <div className="ap" data-scene>
      <div className="ap__bars" aria-hidden="true" data-spawn style={index(0)}>
        <span className="ap__mark" />
        {APPROACH_SLOTS.map((s, i) => (
          <span key={s.key} className="ap__bar" data-active={active === i} />
        ))}
      </div>

      {/* the sphere is the scene's rest point: it is there from the start and
          only its lit disc fades in when the scene is first seen (CSS) */}
      <div className="ap__art">
        <ApproachSphere reduced={reduced} active={active} control={control} />
      </div>

      <div className="ap__panel">
        <div className="ap__head" data-spawn style={index(1)}>
          <Chip tone="lilac" as="h2" className="ap__title" id={titleId}>
            {"\\\\Studio Approach"}
          </Chip>
          <div className="ap__slots" role="tablist" aria-labelledby={titleId} onKeyDown={onKeyDown}>
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
        </div>

        {/* the wrapper takes the scene spawn (the reveal observer only knows
            nodes that exist on mount); the keyed panel inside remounts on a
            new slot, which replays the CSS spawn: copy first, then toollets */}
        <div className="ap__body" data-spawn style={index(3)}>
        <div
          key={slot.key}
          id={panelId}
          className="ap__content"
          role="tabpanel"
          aria-labelledby={tabId(active)}
        >
          <div className="ap__copy">
            <p>
              <span aria-hidden="true">{"// "}</span>
              {slot.lead}
            </p>
            {slot.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="ap__toollets">
            {slot.toollets.map((toollet) => (
              <div key={toollet.label} className="ap__toollet">
                <Chip tone="light" as="h3">
                  {toollet.label}
                </Chip>
                <p>{toollet.body}</p>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
