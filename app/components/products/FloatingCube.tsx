/* A6.1 (OPERATOR): the Products persistent cube, the phone cube (LitCube)
   rebuilt in 3D and moved by the Studio sphere system. Three nested cubes,
   orthographic, posed M = wobble(clock) · kick · ISO:
   - the idle wobble is StudioMobileOrbit's (wobble);
   - a step landing gives the cube a kick, which settles back to iso on a
     damped spring (ArrowTrace's: stiffness 90, damping 11), so the lit faces
     stay top / left / right;
   - one shared driver draws every copy (cover / module / rail) on the same
     clock, so the curtain shows no seam.
   Not interactive. The loop follows useSphereMotion's rules: it runs only while
   a copy is on screen and not under a curtain (routeNav data-covered), it pauses
   otherwise, and the attributes are written straight to the DOM (no React state
   per frame). The still iso pose is the server render, the first paint and the
   reduced-motion drawing; phones and tablets keep it too. */
import { useEffect, useId, useRef } from "react";
import { apply, mul, rotX, rotY, wobble, type Mat3, type Vec3 } from "../marks/StudioMobileOrbit";
import { onCoverChange } from "../../motion/routeNav";
import { index } from "../../motion/studioMotion";
import { LIT_TONES, type LitPattern } from "./LitCube";

/* hexagon circumradius per layer: outer, middle, inner (the phone cube's radii) */
const RADII = [100, 80, 52] as const;
/* half-size of each nested cube */
const H = RADII.map((r) => (r * Math.sqrt(1.5)) / 2);

const ISO: Mat3 = mul(rotX(Math.atan(1 / Math.SQRT2)), rotY(-Math.PI / 4));

const fmt = (n: number) => Math.round(n * 100) / 100;

const project = (m: Mat3, v: Vec3): [number, number] => {
  const p = apply(m, v);
  return [p[0], -p[1]];
};

/* closed or open polyline through the projected points */
function outline(m: Mat3, pts: Vec3[], closed: boolean) {
  const d = pts
    .map((v, k) => {
      const [x, y] = project(m, v);
      return `${k === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`;
    })
    .join(" ");
  return closed ? `${d} Z` : d;
}

/* the three visible faces of a cube of half-size h, [top, left, right] */
const faceCorners = (h: number): Vec3[][] => [
  [
    [-h, h, -h],
    [h, h, -h],
    [h, h, h],
    [-h, h, h],
  ],
  [
    [-h, h, h],
    [h, h, h],
    [h, -h, h],
    [-h, -h, h],
  ],
  [
    [h, h, -h],
    [h, h, h],
    [h, -h, h],
    [h, -h, -h],
  ],
];

/* the hexagon outline of a cube of half-size h (its silhouette) */
const silhouetteCorners = (h: number): Vec3[] => [
  [-h, h, -h],
  [h, h, -h],
  [h, -h, -h],
  [h, -h, h],
  [-h, -h, h],
  [-h, h, h],
];

/* every path's d for the pose m, in the order of the JSX refs:
   0-8 lit (layer * 3 + face), 9-11 silhouettes (outer, middle, inner),
   12 the green Y, 13 the light vertical */
function drawing(m: Mat3): string[] {
  const faces = H.map(faceCorners);
  const out: string[] = [];
  for (let layer = 0; layer < 3; layer++) {
    for (let face = 0; face < 3; face++) {
      out.push(
        outline(m, faces[layer][face], true) + (layer < 2 ? outline(m, faces[layer + 1][face], true) : ""),
      );
    }
  }
  for (const h of H) out.push(outline(m, silhouetteCorners(h), true));
  const mid = H[1];
  const front: Vec3 = [mid, mid, mid];
  out.push(outline(m, [[-mid, mid, mid], front, [mid, mid, -mid]], false));
  out.push(outline(m, [front, [mid, -mid, mid]], false));
  return out;
}

/* the still pose: the server render, the first paint and reduced motion */
const REST = drawing(ISO);

const LIT = [0, 1, 2].flatMap((layer) =>
  [0, 1, 2].map((face) => ({ layer, face, k: layer * 3 + face })),
);

/* one driver for every copy on the page */
type Copy = { draw: (m: Mat3) => void; node: SVGSVGElement; visible: boolean };
const copies = new Set<Copy>();
let frame = 0;
let last = 0;
let clock = 0;
let kx = 0;
let ky = 0;
let vx = 0;
let vy = 0;
let reducedAll = false;

const live = (copy: Copy) => copy.visible && !copy.node.closest("[data-covered]");

const active = () => {
  for (const copy of copies) if (live(copy)) return true;
  return false;
};

function tick(now: number) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  clock += dt;
  vx += (-90 * kx - 11 * vx) * dt;
  kx += vx * dt;
  vy += (-90 * ky - 11 * vy) * dt;
  ky += vy * dt;
  const m = mul(wobble(clock), mul(mul(rotX(kx), rotY(ky)), ISO));
  for (const copy of copies) if (live(copy)) copy.draw(m);
  frame = active() ? requestAnimationFrame(tick) : 0;
}

function sync() {
  if (active() && !frame && !reducedAll) {
    last = performance.now();
    frame = requestAnimationFrame(tick);
  } else if (!active() && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

/* a step landed: a light kick about the screen's y and x, settling back to iso */
export function kickFloatingCube(direction: 1 | -1) {
  if (reducedAll || copies.size === 0) return;
  vy += direction * 1.4;
  vx += direction * 0.5;
  sync();
}

export function FloatingCube({
  pattern,
  reduced,
  className,
  spawn,
}: {
  pattern: LitPattern;
  reduced: boolean;
  className?: string;
  spawn?: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `pv-float-g-${uid}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const ref = (k: number) => (node: SVGPathElement | null) => {
    paths.current[k] = node;
  };

  useEffect(() => {
    reducedAll = reduced;
    const node = svgRef.current;
    if (reduced || !node || !window.matchMedia("(min-width: 1024px)").matches) return;

    const copy: Copy = {
      node,
      visible: false,
      draw: (m) => {
        const d = drawing(m);
        paths.current.forEach((p, k) => p?.setAttribute("d", d[k]));
      },
    };
    copies.add(copy);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            copy.visible = entry.isIntersecting;
            sync();
          });
    if (observer) observer.observe(node);
    else copy.visible = true;
    const off = onCoverChange(sync);
    sync();

    return () => {
      observer?.disconnect();
      off();
      copies.delete(copy);
      copy.draw(ISO);
      sync();
      if (copies.size === 0) {
        clock = 0;
        kx = 0;
        ky = 0;
        vx = 0;
        vy = 0;
      }
    };
  }, [reduced]);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox="-120 -120 240 240"
      fill="none"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
      data-spawn={spawn === undefined ? undefined : true}
      style={spawn === undefined ? undefined : index(spawn)}
    >
      <defs>
        <linearGradient id={gradientId} x1={0} y1={-52} x2={0} y2={100} gradientUnits="userSpaceOnUse">
          <stop stopColor="#5AE36F" />
          <stop offset="1" stopColor="#F2F2F2" />
        </linearGradient>
      </defs>
      <g className="pv-float__body">
        <g className="pv-lit">
          {LIT.map(({ layer, face, k }) => {
            const tone = LIT_TONES[pattern.tones[layer]];
            return (
              <path
                key={`lit-${k}`}
                ref={ref(k)}
                d={REST[k]}
                fillRule="evenodd"
                style={{
                  fill: tone.fill,
                  fillOpacity: pattern.faces[layer] === face ? tone.alpha : 0,
                  ...index(layer),
                }}
              />
            );
          })}
        </g>
        <g strokeWidth={1}>
          <path ref={ref(9)} d={REST[9]} stroke="#F2F2F2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path ref={ref(10)} d={REST[10]} stroke="#5AE36F" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path
            ref={ref(11)}
            d={REST[11]}
            stroke={`url(#${gradientId})`}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          <path ref={ref(12)} d={REST[12]} stroke="#5AE36F" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <path ref={ref(13)} d={REST[13]} stroke="#F2F2F2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
