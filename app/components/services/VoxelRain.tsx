/* Services R1 CORR01: the cube rain. One engine for the Toolmaking card (it
   cycles its three assemblies) and the Formation pile (it follows the selected
   card). A pool of cube elements is assigned to the active formation's slots.

     retarget  a cube already standing on a slot of the new formation stays; the
               others drop a little and fade (staggered), then the missing cubes
               fall in from above, lowest first, each easing onto its slot with
               one soft settle (no bouncing, no rigid-body jitter). Every value
               is a timed tween from the value it has now, so a new target in
               the middle of a transition starts from what is on screen; the
               pool is twice the largest formation, so a cube that is still
               leaving is never reused.
     order     cubes are re-stacked in the formation's back-to-front order
               when a transition starts (leaving cubes go to the back).
     cycle     (card) after `hold` seconds the next formation of `cycle` is
               set; the clock only runs while the figure is on screen.
     morph     (pile, R1 CORR01 round 2) the shapes list the SAME cubes by
               identity: the first formation rains in once, then a new target
               scrambles them: every cube glides (a lifted spring arc, staggered)
               from where it is to its slot in the new arrangement, and the
               stack is re-sorted by the arrangement's depth `d`.
     throw     (pile, optional stretch) a mouse or pen picks one standing cube
               up; it follows the pointer, drawn on top. On release it keeps
               its (capped) velocity on a damped spring back to its slot; a cube
               it hits is pushed aside and springs home too, so the formation
               always recovers (no free rigid bodies). Esc, a lost capture, a
               new formation or the figure stopping cancel the drag. Touch never
               picks up (the CSS keeps the pile pointer-transparent there, so
               the page scrolls).
     reduced   no loop: the active formation is drawn at rest, and a new
               target replaces it at once; a dragged cube still follows the
               pointer but goes straight home on release (no throw, no hits).
   React renders the first formation; afterwards the engine owns the cube
   attributes (and React never re-renders the pool). */
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { useVisibleLoop } from "../studio/artworks";
import { CUBE_HEX, CUBE_Y } from "./voxelShapes";
import type { VoxelShape, VoxelSlot } from "./voxelShapes";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeIn = (v: number) => v * v;
/* ease-out with one soft settle (a gentle back curve, 3% overshoot) */
const settle = (v: number) => {
  const c = 0.9;
  const t = v - 1;
  return 1 + (c + 1) * t * t * t + c * t * t;
};

const OUT_DUR = 0.5;
const OUT_STAGGER = 0.035;
const IN_DUR = 0.75;
const IN_STAGGER = 0.07;

/* throw: spring home (1/s^2, 1/s), velocity cap (viewBox units/s), hit radius
   as a share of the cube's half width, the push a hit gives */
const HOME = { k: 30, c: 8 };
const THROW_MAX = 1200;
const HIT_R = 0.9;
const HIT_PUSH = 6;
const MOVING = 60;
const HALF_W = 37.373;
const MID_Y = 42.857;
/* morph: the stagger between cubes and the upward kick that lifts each glide */
const MORPH_STAGGER = 0.045;
const MORPH_LIFT = 420;

interface Cube {
  slot: VoxelSlot | null;
  /* [drop, alpha] */
  from: [number, number];
  to: [number, number];
  t0: number;
  dur: number;
  ease: (v: number) => number;
  last: string;
  /* throw offset from the slot and its velocity */
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  /* morph: hold the old place until this clock time */
  wait: number;
  /* thrown by the pointer: only a dragged or thrown cube hits others */
  thrown: boolean;
}

interface Drag {
  i: number;
  pointer: number;
  x: number;
  y: number;
  baseDx: number;
  baseDy: number;
  samples: { x: number; y: number; t: number }[];
}

const valueAt = (c: Cube, clock: number): [number, number] => {
  const p = c.ease(clamp01((clock - c.t0) / c.dur));
  return [c.from[0] + (c.to[0] - c.from[0]) * p, c.from[1] + (c.to[1] - c.from[1]) * p];
};
/* round 3: the colour counts too, so a standing cube never keeps the wrong one */
const sameSlot = (a: VoxelSlot, b: VoxelSlot) =>
  Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.s - b.s) < 0.01 && !a.ghost === !b.ghost;
const restCube = (slot: VoxelSlot | null): Cube => ({
  slot,
  from: [0, slot ? 1 : 0],
  to: [0, slot ? 1 : 0],
  t0: 0,
  dur: 1,
  ease: settle,
  last: "",
  dx: 0,
  dy: 0,
  vx: 0,
  vy: 0,
  wait: 0,
  thrown: false,
});
const still = (c: Cube) => Math.abs(c.dx) + Math.abs(c.dy) + Math.abs(c.vx) + Math.abs(c.vy) < 0.05;
/* back-to-front order of a shape: its own order, or its depth keys */
const depthOrder = (shape: VoxelShape) =>
  shape.map((_, k) => k).sort((a, b) => (shape[a].d ?? a) - (shape[b].d ?? b));

export function VoxelRain({
  shapes,
  active,
  reduced,
  viewBox,
  tone,
  className,
  rain,
  enterDelay,
  cycle,
  throwable = false,
  morph = false,
  children,
}: {
  shapes: readonly VoxelShape[];
  /** index of the formation to show (ignored once a cycle runs) */
  active: number;
  reduced: boolean;
  viewBox: string;
  /** `card`: ink cubes with light edges; `pile`: ink cubes with red edges and
      red ghost cubes with ink edges (SERVICES_v2) */
  tone: "card" | "pile";
  className?: string;
  /** fall height, in viewBox units */
  rain: number;
  /** motion on: start empty and rain the first formation in after this many
      seconds of on-screen time (undefined: start with it standing) */
  enterDelay?: number;
  /** auto-advance through these formation indices, `hold` seconds each */
  cycle?: { order: readonly number[]; hold: number };
  /** a mouse / pen can pick a cube up and throw it (see the header) */
  throwable?: boolean;
  /** the shapes are one set of cubes by identity: scramble, don't re-rain */
  morph?: boolean;
  /** drawn under the cubes, in the same viewBox (the pile's tether lines) */
  children?: ReactNode;
}) {
  const id = `vx-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const nodes = useRef<(SVGUseElement | null)[]>([]);
  const pool = 2 * Math.max(...shapes.map((s) => s.length));
  const first = useRef(shapes[active] ?? []);
  const sim = useRef({
    cubes: [] as Cube[],
    clock: 0,
    started: false,
    step: 0,
    next: Infinity,
    shown: active,
    order: [] as number[],
    lifted: false,
    drag: null as Drag | null,
  });

  const href = (slot: VoxelSlot | null) => `#${id}-${slot?.ghost ? "ghost" : "ink"}`;
  const writeCube = (i: number, c: Cube, value: [number, number]) => {
    const node = nodes.current[i];
    if (!node || !c.slot) return;
    const [drop, alpha] = value;
    const key = `${drop.toFixed(2)}|${alpha.toFixed(3)}|${c.dx.toFixed(2)}|${c.dy.toFixed(2)}`;
    if (key === c.last) return;
    c.last = key;
    node.setAttribute(
      "transform",
      `translate(${(c.slot.x + c.dx).toFixed(2)} ${(c.slot.y + drop + c.dy).toFixed(2)}) scale(${c.slot.s})`,
    );
    node.setAttribute("opacity", alpha.toFixed(3));
  };

  /* back to front, as the formation draws */
  const restack = () => {
    const group = groupRef.current;
    if (!group) return;
    for (const i of sim.current.order) {
      const node = nodes.current[i];
      if (node) group.appendChild(node);
    }
    sim.current.lifted = false;
  };

  /* end a drag; `home` puts every offset back at once (a new formation, rest) */
  const endDrag = (home: boolean) => {
    const s = sim.current;
    const drag = s.drag;
    if (drag) {
      s.drag = null;
      const svg = svgRef.current;
      svg?.removeAttribute("data-dragging");
      try {
        svg?.releasePointerCapture(drag.pointer);
      } catch {
        /* already released */
      }
    }
    if (!home) return;
    s.cubes.forEach((c, i) => {
      if (still(c)) return;
      Object.assign(c, { dx: 0, dy: 0, vx: 0, vy: 0 });
      writeCube(i, c, valueAt(c, s.clock));
    });
    if (s.lifted) restack();
  };

  /* every cube at its final value for `shape` (reduced motion, rest) */
  const snap = (shape: VoxelShape) => {
    const s = sim.current;
    s.cubes = Array.from({ length: pool }, (_, i) => restCube(shape[i] ?? null));
    s.order = morph ? depthOrder(shape) : shape.map((_, i) => i);
    s.cubes.forEach((c, i) => {
      const node = nodes.current[i];
      if (!node) return;
      if (c.slot) node.setAttribute("href", href(c.slot));
      node.setAttribute("opacity", c.slot ? "1" : "0");
      if (c.slot) writeCube(i, c, [0, 1]);
    });
    restack();
  };

  /* morph: the first appearance, cube k falls onto slot k, lowest first */
  const rainIn = (shape: VoxelShape, clock: number, delay: number) => {
    const s = sim.current;
    const rank = new Map(
      shape
        .map((_, k) => k)
        .sort((a, b) => shape[b].y - shape[a].y)
        .map((k, r) => [k, r] as const),
    );
    shape.forEach((slot, k) => {
      const c = s.cubes[k];
      Object.assign(c, restCube(slot), {
        from: [-rain, 0],
        to: [0, 1],
        t0: clock + delay + (rank.get(k) ?? 0) * IN_STAGGER,
        dur: IN_DUR,
      });
      nodes.current[k]?.setAttribute("href", href(slot));
      writeCube(k, c, [-rain, 0]);
    });
    s.order = depthOrder(shape);
    restack();
  };

  /* morph: scramble the same cubes into `shape`, each from where it is now */
  const morphTo = (shape: VoxelShape, clock: number) => {
    const s = sim.current;
    shape.forEach((slot, k) => {
      const c = s.cubes[k];
      if (!c.slot) {
        Object.assign(c, restCube(slot));
        return;
      }
      const [drop, alpha] = valueAt(c, clock);
      Object.assign(c, {
        dx: c.slot.x + c.dx - slot.x,
        dy: c.slot.y + drop + c.dy - slot.y,
        from: [0, alpha],
        to: [0, 1],
        t0: clock,
        dur: 0.3,
        ease: settle,
        slot,
        vx: 0,
        vy: -MORPH_LIFT,
        wait: clock + k * MORPH_STAGGER,
        thrown: false,
        last: "",
      });
      nodes.current[k]?.setAttribute("href", href(slot));
    });
    s.order = depthOrder(shape);
    restack();
  };

  const retarget = (shape: VoxelShape, clock: number, delay: number) => {
    const s = sim.current;
    const kept = new Set<number>();
    const assigned: number[] = new Array(shape.length).fill(-1);
    shape.forEach((slot, j) => {
      const i = s.cubes.findIndex((c, k) => !kept.has(k) && c.slot && c.to[1] === 1 && sameSlot(c.slot, slot));
      if (i < 0) return;
      kept.add(i);
      assigned[j] = i;
      nodes.current[i]?.setAttribute("href", href(slot));
      s.cubes[i].slot = slot;
    });
    const leaving: number[] = [];
    s.cubes.forEach((c, i) => {
      if (kept.has(i) || !c.slot || c.to[1] !== 1) return;
      const now = valueAt(c, clock);
      Object.assign(c, {
        from: now,
        to: [now[0] + 0.2 * rain, 0],
        t0: clock + delay + leaving.length * OUT_STAGGER,
        dur: OUT_DUR,
        ease: easeIn,
      });
      leaving.push(i);
    });
    const inAt = clock + delay + (leaving.length ? (leaving.length - 1) * OUT_STAGGER + OUT_DUR * 0.6 : 0);
    const fresh = shape
      .map((_, j) => j)
      .filter((j) => assigned[j] < 0)
      .sort((a, b) => shape[b].y - shape[a].y);
    const taken = new Set([...kept, ...leaving]);
    fresh.forEach((j, k) => {
      let i = s.cubes.findIndex((c, n) => !taken.has(n) && c.to[1] === 0);
      if (i < 0) i = s.cubes.findIndex((_, n) => !taken.has(n));
      if (i < 0) return;
      taken.add(i);
      assigned[j] = i;
      const c = s.cubes[i];
      Object.assign(c, {
        slot: shape[j],
        from: [-rain, 0],
        to: [0, 1],
        t0: inAt + k * IN_STAGGER,
        dur: IN_DUR,
        ease: settle,
        last: "",
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
      });
      nodes.current[i]?.setAttribute("href", href(shape[j]));
      writeCube(i, c, [-rain, 0]);
    });
    /* back to front: leaving cubes, then the formation's own order */
    s.order = [...leaving, ...assigned.filter((i) => i >= 0)];
    restack();
    return inAt + Math.max(0, fresh.length - 1) * IN_STAGGER + IN_DUR;
  };

  /* throw: springs home and hits, one step */
  const physics = (dt: number, clock: number) => {
    const s = sim.current;
    const dragged = s.drag?.i ?? -1;
    s.cubes.forEach((c, i) => {
      if (i === dragged || !c.slot || still(c) || clock < c.wait) return;
      c.vx += (-HOME.k * c.dx - HOME.c * c.vx) * dt;
      c.vy += (-HOME.k * c.dy - HOME.c * c.vy) * dt;
      c.dx += c.vx * dt;
      c.dy += c.vy * dt;
      if (still(c)) Object.assign(c, { dx: 0, dy: 0, vx: 0, vy: 0, thrown: false });
    });
    /* a dragged or thrown (still fast) cube pushes any standing cube it
       overlaps; a scramble's gliding cubes never hit each other */
    const centre = (c: Cube) => [c.slot!.x + c.dx, c.slot!.y + c.dy + MID_Y * c.slot!.s] as const;
    s.cubes.forEach((a, i) => {
      if (!a.slot || a.to[1] !== 1) return;
      if (i !== dragged && (!a.thrown || Math.hypot(a.vx, a.vy) < MOVING)) return;
      const [ax, ay] = centre(a);
      const ra = HALF_W * HIT_R * a.slot.s;
      s.cubes.forEach((b, j) => {
        if (j === i || j === dragged || !b.slot || b.to[1] !== 1) return;
        const [bx, by] = centre(b);
        const rb = HALF_W * HIT_R * b.slot.s;
        const d = Math.hypot(bx - ax, by - ay) || 0.001;
        const overlap = ra + rb - d;
        if (overlap <= 0) return;
        const nx = (bx - ax) / d;
        const ny = (by - ay) / d;
        b.dx += nx * overlap * 0.5;
        b.dy += ny * overlap * 0.5;
        b.vx += nx * overlap * HIT_PUSH;
        b.vy += ny * overlap * HIT_PUSH;
        if (i !== dragged) {
          a.vx *= 0.85;
          a.vy *= 0.85;
        }
      });
    });
    if (s.lifted && !s.drag && s.cubes.every(still)) restack();
  };

  /* a new selection (the pile) */
  useEffect(() => {
    const s = sim.current;
    if (cycle || active === s.shown || !shapes[active]) return;
    s.shown = active;
    if (reduced || !s.started) {
      endDrag(true);
      snap(shapes[active]);
    } else if (morph) {
      endDrag(false);
      morphTo(shapes[active], s.clock);
    } else {
      endDrag(true);
      retarget(shapes[active], s.clock, 0);
    }
  }, [active, reduced]);

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const s = sim.current;
      const dt = Math.min(0.05, Math.max(0, clock - s.clock));
      s.clock = clock;
      if (!s.started) {
        s.started = true;
        snap(shapes[s.shown] ?? []);
        if (enterDelay !== undefined) {
          snap([]);
          if (morph) rainIn(shapes[s.shown] ?? [], clock, enterDelay);
          else retarget(shapes[s.shown] ?? [], clock, enterDelay);
        }
        if (cycle) s.next = clock + (enterDelay ?? 0) + cycle.hold;
      }
      if (cycle && clock >= s.next) {
        s.step = (s.step + 1) % cycle.order.length;
        s.shown = cycle.order[s.step];
        s.next = retarget(shapes[s.shown] ?? [], clock, 0) + cycle.hold;
      }
      if (throwable || morph) physics(dt, clock);
      s.cubes.forEach((c, i) => writeCube(i, c, valueAt(c, clock)));
    },
    () => {
      const s = sim.current;
      endDrag(false);
      s.started = false;
      s.step = 0;
      s.next = Infinity;
      if (cycle) s.shown = cycle.order[0];
      snap(shapes[s.shown] ?? []);
    },
  );

  /* pick up / drag / throw (mouse and pen only) */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !throwable) return;
    const s = sim.current;
    const toView = (e: PointerEvent) => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || (e.pointerType === "mouse" && e.button !== 0) || s.drag) return;
      const node = (e.target as Element | null)?.closest("use");
      const i = node ? Number(node.getAttribute("data-i")) : NaN;
      const c = s.cubes[i];
      const p = toView(e);
      if (!c || !c.slot || !p || c.to[1] !== 1 || valueAt(c, s.clock)[1] < 0.9) return;
      e.preventDefault();
      s.drag = { i, pointer: e.pointerId, x: p.x, y: p.y, baseDx: c.dx, baseDy: c.dy, samples: [{ ...p, t: e.timeStamp }] };
      c.vx = 0;
      c.vy = 0;
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a convenience */
      }
      svg.setAttribute("data-dragging", "true");
      if (node) groupRef.current?.appendChild(node);
      s.lifted = true;
    };
    const onMove = (e: PointerEvent) => {
      const drag = s.drag;
      if (!drag || e.pointerId !== drag.pointer) return;
      const p = toView(e);
      if (!p) return;
      const c = s.cubes[drag.i];
      c.dx = drag.baseDx + p.x - drag.x;
      c.dy = drag.baseDy + p.y - drag.y;
      drag.samples.push({ ...p, t: e.timeStamp });
      if (drag.samples.length > 6) drag.samples.shift();
      if (reduced) writeCube(drag.i, c, [0, 1]);
    };
    const onUp = (e: PointerEvent) => {
      const drag = s.drag;
      if (!drag || e.pointerId !== drag.pointer) return;
      const c = s.cubes[drag.i];
      const recent = drag.samples.filter((q) => e.timeStamp - q.t < 80);
      const a = recent[0];
      const b = recent[recent.length - 1];
      const span = a && b ? (b.t - a.t) / 1000 : 0;
      let vx = span > 0 ? (b.x - a.x) / span : 0;
      let vy = span > 0 ? (b.y - a.y) / span : 0;
      const speed = Math.hypot(vx, vy);
      if (speed > THROW_MAX) {
        vx = (vx * THROW_MAX) / speed;
        vy = (vy * THROW_MAX) / speed;
      }
      endDrag(reduced);
      if (!reduced) Object.assign(c, { vx, vy, thrown: true });
    };
    const onLost = (e: PointerEvent) => {
      if (s.drag && e.pointerId === s.drag.pointer) endDrag(reduced);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !s.drag) return;
      const c = s.cubes[s.drag.i];
      endDrag(reduced);
      Object.assign(c, { vx: 0, vy: 0 });
    };
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onLost);
    svg.addEventListener("lostpointercapture", onLost);
    window.addEventListener("keydown", onKey);
    return () => {
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onLost);
      svg.removeEventListener("lostpointercapture", onLost);
      window.removeEventListener("keydown", onKey);
      endDrag(true);
    };
  }, [throwable, reduced]);

  const ink = tone === "card" ? "var(--ccdv-panel)" : "var(--ccdv-red)";
  return (
    <svg ref={svgRef} className={`sv-vx sv-vx--${tone}${className ? ` ${className}` : ""}`} viewBox={viewBox} fill="none" aria-hidden="true" focusable="false">
      <defs>
        <g id={`${id}-ink`}>
          <path d={CUBE_HEX} fill="var(--ccdv-ink)" stroke={ink} />
          <path d={CUBE_Y} stroke={ink} />
        </g>
        <g id={`${id}-ghost`}>
          <path d={CUBE_HEX} fill="var(--ccdv-red)" stroke="var(--ccdv-ink)" />
          <path d={CUBE_Y} stroke="var(--ccdv-ink)" />
        </g>
      </defs>
      {children}
      <g ref={groupRef}>
        {Array.from({ length: pool }, (_, i) => {
          const slot = first.current[i] ?? null;
          return (
            <use
              key={i}
              ref={(node) => {
                nodes.current[i] = node;
              }}
              data-i={i}
              href={`#${id}-${slot?.ghost ? "ghost" : "ink"}`}
              transform={slot ? `translate(${slot.x.toFixed(2)} ${slot.y.toFixed(2)}) scale(${slot.s})` : undefined}
              opacity={slot ? 1 : 0}
            />
          );
        })}
      </g>
    </svg>
  );
}
