/* The orbit/wheel diagram in the Studio masthead's active cell.

   This one needs no asset promotion: pages_studio.svg defines it entirely as
   five primitives inside a 159.174 square clip at (369.141, 54.474), so it is
   reconstructed from published numbers rather than transcribed path data.
   The two ellipses are the same 79.5869 semi-minor circle seen at 90 and 60
   degrees, which is what reads as a wireframe sphere.

   R1-FB002-01: on desktop and tablet this tile is where the Studio orbit lives
   (the phone hero draws it large instead), so it is animated here, with the same
   sphere model and idle sway as the phone hero (StudioMobileOrbit.tsx). The two
   rings are great circles with normals fitted to the published ellipses
   (minor/major 49.2408/79.5869 = 0.619 and 17.7496/79.5869 = 0.223), which
   reproduces the drawing at rest; the "+" is the sphere's x and y diameters. The
   tile is not interactive (it is a navigation cell); motion stops under reduced
   motion and while the tile is off screen. */
import { useRef } from "react";
import { useMotionPolicy } from "../../motion/reducedMotion";
import { IDENT, apply, axisLine, mul, ringEllipse, useSphereMotion, wobble, writeEllipse, writeLine } from "./StudioMobileOrbit";
import type { Mat3, Vec3 } from "./StudioMobileOrbit";

const CX = 448.728;
const CY = 134.061;
const R = 79.5869;
const STROKE = "#202020";
const WIDTH = 0.286284;

const RINGS: Vec3[] = [
  [0, 0.7855, 0.6188],
  [0.4723, 0.8529, 0.223],
];
const ellipseAttrs = (g: ReturnType<typeof ringEllipse>) => ({
  cx: g.cx.toFixed(3),
  cy: g.cy.toFixed(3),
  rx: g.rx.toFixed(3),
  ry: g.ry.toFixed(3),
  transform: `rotate(${g.angle.toFixed(2)} ${g.cx.toFixed(3)} ${g.cy.toFixed(3)})`,
});

export function StudioWheelTile({ className }: { className?: string }) {
  const { reduced } = useMotionPolicy();
  const svgRef = useRef<SVGSVGElement>(null);
  const ringRefs = useRef<(SVGEllipseElement | null)[]>([]);
  const axisRefs = useRef<(SVGLineElement | null)[]>([]);

  const write = (m: Mat3) => {
    RINGS.forEach((n, i) => writeEllipse(ringRefs.current[i], ringEllipse(apply(m, n), CX, CY, R)));
    writeLine(axisRefs.current[0], axisLine(apply(m, [0, 1, 0]), 448.871, CY, R));
    writeLine(axisRefs.current[1], axisLine(apply(m, [1, 0, 0]), 448.725, 134.207, R));
  };
  useSphereMotion(svgRef, {
    reduced,
    interactive: false,
    draw: (drag, clock) => write(mul(wobble(clock), drag)),
    rest: () => write(IDENT),
  });

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="369.141 54.4741 159.174 159.174"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={CX} cy={CY} r="79.4438" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
      {RINGS.map((n, i) => (
        <ellipse
          key={i}
          ref={(node) => {
            ringRefs.current[i] = node;
          }}
          {...ellipseAttrs(ringEllipse(n, CX, CY, R))}
          fill="none"
          stroke={STROKE}
          strokeWidth={WIDTH}
          strokeLinecap="round"
          strokeDasharray="2.86 2.86"
        />
      ))}
      <line
        ref={(node) => {
          axisRefs.current[0] = node;
        }}
        x1="448.871"
        y1="54.4741"
        x2="448.871"
        y2="213.648"
        stroke={STROKE}
        strokeWidth={WIDTH}
      />
      <line
        ref={(node) => {
          axisRefs.current[1] = node;
        }}
        x1="528.312"
        y1="134.207"
        x2="369.138"
        y2="134.207"
        stroke={STROKE}
        strokeWidth={WIDTH}
      />
    </svg>
  );
}
