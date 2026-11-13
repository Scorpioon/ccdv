/* Services cover artwork (Services R1 S1): the Arrow Trace, enlarged.

   Geometry: the one path of work_assets/ccos_icons_r2/Arrow Trace.svg (191 x 163),
   copied verbatim and kept in that file's own coordinates. The same outline is
   the masthead's ServicesArrowTile (pages_services.svg), offset. The source draws
   it as an inside stroke (a 1-unit stroke masked by its own fill); here it is a
   plain hairline at the design-nominal 0.5 px (CSS, non-scaling stroke).

   Interaction: a drag on the arrow turns it about its centre (the angle follows
   the pointer around that centre, so it feels like turning a dial). On release
   it settles back to its drawn pose, pointing north-east, on a lightly damped
   spring (one short overshoot). Arrow keys give it a turn that settles the same
   way. Only the arrow's hit circle takes pointers (`.studio-sphere`), so a touch
   elsewhere scrolls the page. Reduced motion: a drag still turns it, one write
   per event, and it returns without animation on release (keys: a step that
   returns after a short hold). Transforms are written to the DOM, no React state. */
import { useEffect, useRef } from "react";

export const ARROW =
  "M176.276 31.3594V162.121H147.118V49.5684L34.7383 161.948L14.1191 141.33L126.293 29.1582H14.1543V0H144.916L176.276 31.3594Z";
/* centre of the arrow's bounding box (x 14.12..176.28, y 0..162.12) */
const CX = 95.2;
const CY = 81.06;
/* a square window centred on it, large enough for the arrow at any angle
   (bounding-box diagonal 239 < 241) */
const VIEWBOX = `${CX - 120.5} ${CY - 120.5} 241 241`;
const HIT_R = 112;

const STIFFNESS = 90; // 1/s^2
const DAMPING = 11; // 1/s, a little under critical (2 * sqrt(90) = 19)
const KEY_KICK = 420; // deg/s
const KEY_STEP = 15; // deg, reduced motion
const REDUCED_HOLD = 900; // ms

const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

export function ArrowTrace({ reduced, className }: { reduced: boolean; className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const turnRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const node = svgRef.current;
    const turn = turnRef.current;
    if (!node || !turn) return;
    let angle = 0;
    let velocity = 0;
    let dragging = false;
    let pointer = -1;
    let grab = 0; // pointer angle minus arrow angle at grab time
    let frame = 0;
    let last = 0;
    let hold = 0;

    const write = () => turn.setAttribute("transform", `rotate(${angle.toFixed(2)} ${CX} ${CY})`);
    const pointerAngle = (e: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const x = e.clientX - (box.left + box.width / 2);
      const y = e.clientY - (box.top + box.height / 2);
      return (Math.atan2(y, x) * 180) / Math.PI;
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      velocity += (-STIFFNESS * angle - DAMPING * velocity) * dt;
      angle += velocity * dt;
      write();
      if (Math.abs(angle) < 0.05 && Math.abs(velocity) < 0.5) {
        angle = 0;
        velocity = 0;
        write();
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    const settle = () => {
      angle = wrap(angle);
      if (reduced) {
        angle = 0;
        velocity = 0;
        write();
        return;
      }
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const onDown = (event: Event) => {
      const e = event as PointerEvent;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (dragging) return;
      dragging = true;
      pointer = e.pointerId;
      stop();
      velocity = 0;
      grab = pointerAngle(e) - angle;
      try {
        node.setPointerCapture(e.pointerId);
      } catch {
        /* capture is a convenience */
      }
      node.setAttribute("data-dragging", "true");
    };
    const onMove = (event: Event) => {
      const e = event as PointerEvent;
      if (!dragging || e.pointerId !== pointer) return;
      /* shortest way from the current angle to the pointer's, so crossing the
         +-180 seam never flips the arrow */
      angle += wrap(pointerAngle(e) - grab - angle);
      write();
    };
    const onUp = (event: Event) => {
      const e = event as PointerEvent;
      if (!dragging || e.pointerId !== pointer) return;
      dragging = false;
      node.removeAttribute("data-dragging");
      try {
        node.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      settle();
    };
    const onKey = (event: Event) => {
      const e = event as KeyboardEvent;
      const dir =
        e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1
        : e.key === "ArrowRight" || e.key === "ArrowUp" ? 1
        : 0;
      if (!dir || dragging) return;
      e.preventDefault();
      if (reduced) {
        angle = wrap(angle + dir * KEY_STEP);
        write();
        window.clearTimeout(hold);
        hold = window.setTimeout(settle, REDUCED_HOLD);
        return;
      }
      velocity += dir * KEY_KICK;
      settle();
    };

    node.addEventListener("pointerdown", onDown);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerup", onUp);
    node.addEventListener("pointercancel", onUp);
    node.addEventListener("lostpointercapture", onUp);
    node.addEventListener("keydown", onKey);
    return () => {
      stop();
      window.clearTimeout(hold);
      node.removeEventListener("pointerdown", onDown);
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerup", onUp);
      node.removeEventListener("pointercancel", onUp);
      node.removeEventListener("lostpointercapture", onUp);
      node.removeEventListener("keydown", onKey);
      node.removeAttribute("data-dragging");
      turn.removeAttribute("transform");
    };
  }, [reduced]);

  return (
    <svg
      ref={svgRef}
      className={`${className ?? ""} studio-sphere`}
      viewBox={VIEWBOX}
      fill="none"
      role="group"
      aria-roledescription="rotatable arrow"
      aria-label="Arrow Trace. Drag, or use the arrow keys, to turn it; it settles back to north-east."
      tabIndex={0}
    >
      <g ref={turnRef}>
        <path className="sv-arrow__line" d={ARROW} />
      </g>
      <circle className="studio-sphere__hit" cx={CX} cy={CY} r={HIT_R} fill="transparent" />
    </svg>
  );
}
