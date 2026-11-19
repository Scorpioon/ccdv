import { useId, useRef } from "react";
import { useVisibleLoop } from "../studio/artworks";
import { CCOS_CORES, type CcosCoreId } from "../../data/ccosContent";

/* P2 CORR03 (OPERATOR): the two CC.OS statement animations, in the site's
   voxel language (the /services and /products isometric cube: CUBE_HEX's
   37.373 / 21.427 / 42.857 lattice) and in black and white — only a core's
   own colour, on its top face, is not.

     vault    (slide 5, "Always local") cubes fall and pile into a 5 x 5 x 5
              block; the centre of the top opens, a white package travels in
              and drops through, the hole closes; three packages, then the
              block fades and the loop starts again.
     modular  (slide 4) a white CC.OS cube; each core docks on one side
              (arrives, lights up, works in two small pulses, dims, leaves),
              each on its own phase, so cores come and go around the centre.

   One loop per figure (useVisibleLoop): it runs only while the figure is on
   screen and `active` (its slide is the current one), and starts from the
   beginning on each arrival. The step writes transform / opacity straight to
   the pool React rendered once. Reduced motion: the closed block, and the
   centre with every core docked and lit. Decorative (aria-hidden). */

const DX = 37.373;
const DY = 21.427;
const DZ = 42.857;
const TOP = `M0 0L${DX} ${DY}L0 ${2 * DY}L${-DX} ${DY}Z`;
const LEFT = `M${-DX} ${DY}L0 ${2 * DY}V${2 * DY + DZ}L${-DX} ${DY + DZ}Z`;
const RIGHT = `M0 ${2 * DY}L${DX} ${DY}V${DY + DZ}L0 ${2 * DY + DZ}Z`;
const EDGE = "#7A7A7A";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};
const easeIn = (v: number) => clamp01(v) ** 2;
/* ease-out with one soft settle (VoxelRain's curve) */
const settle = (v: number) => {
  const t = clamp01(v) - 1;
  return 1 + 1.9 * t * t * t + 0.9 * t * t;
};
const fmt = (n: number) => Math.round(n * 100) / 100;

/* a lattice point (x right-down, y left-down, z up) on screen */
function iso(x: number, y: number, z: number): [number, number] {
  return [(x - y) * DX, (x + y) * DY - z * DZ];
}

function place(node: SVGGElement | null, x: number, y: number, z: number, alpha: number) {
  if (!node) return;
  const [sx, sy] = iso(x, y, z);
  node.setAttribute("transform", `translate(${fmt(sx)} ${fmt(sy)})`);
  node.setAttribute("opacity", `${fmt(clamp01(alpha))}`);
}

/* a cube's three faces, edged in grey */
function CubeFaces({ id, top, left, right }: { id: string; top: string; left: string; right: string }) {
  return (
    <g id={id} stroke={EDGE} strokeWidth="0.6" strokeLinejoin="round">
      <path d={LEFT} fill={left} />
      <path d={RIGHT} fill={right} />
      <path d={TOP} fill={top} />
    </g>
  );
}

const INK_FACES = { top: "#1F1F1F", left: "#1A1A1A", right: "#151515" };
const WHITE_FACES = { top: "#F2F2F2", left: "#D9D9D9", right: "#BDBDBD" };

export interface VoxelArtProps {
  active: boolean;
  reduced: boolean;
  className?: string;
}

/* --- slide 5: the vault ----------------------------------------------------- */

interface Cell {
  x: number;
  y: number;
  z: number;
}
const N = 5;
/* back to front (x + y + z, then height), as voxelShapes' build() */
const VAULT: Cell[] = Array.from({ length: N * N * N }, (_, i) => ({
  x: i % N,
  y: Math.floor(i / N) % N,
  z: Math.floor(i / (N * N)),
})).sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z) || a.z - b.z);
const HOLE = VAULT.findIndex((c) => c.x === 2 && c.y === 2 && c.z === N - 1);

const FALL = 0.6;
const LAYER = 0.7;
const SPREAD = 0.35;
const FALL_FROM = 6;
const delay = ({ x, y, z }: Cell) => z * LAYER + (((x * 7 + y * 13) % 10) / 10) * SPREAD;
const PILED = (N - 1) * LAYER + SPREAD + FALL + 0.5;
const PACKAGES = 3;
const PACKAGE_T = 2.6;
const DOOR = 0.4;
const CLOSE_AT = 1.9;
const HELD = PILED + PACKAGES * PACKAGE_T + 0.8;
const FADE = 0.8;
const VAULT_PERIOD = HELD + FADE + 0.4;
/* the package's path: in from the right above the block, then down the hole */
const PKG_FROM = 6.5;
const PKG_Z = N + 0.3;

export function CcosVaultArt({ active, reduced, className }: VoxelArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const cubes = useRef<(SVGGElement | null)[]>([]);
  const above = useRef<SVGGElement>(null);
  const inside = useRef<SVGGElement>(null);

  const rest = () => {
    VAULT.forEach((c, i) => place(cubes.current[i], c.x, c.y, c.z, 1));
    place(above.current, 2, 2, PKG_Z, 0);
    place(inside.current, 2, 2, PKG_Z, 0);
  };

  useVisibleLoop(
    svgRef,
    active && !reduced,
    (clock) => {
      const t = clock % VAULT_PERIOD;
      const fade = 1 - clamp01((t - HELD) / FADE);
      /* which package, and how far into it */
      const k = Math.floor((t - PILED) / PACKAGE_T);
      const u = k >= 0 && k < PACKAGES ? t - PILED - k * PACKAGE_T : -1;
      const open =
        u < 0 ? 0 : u < DOOR ? smooth(u / DOOR) : u < CLOSE_AT ? 1 : 1 - smooth((u - CLOSE_AT) / DOOR);

      VAULT.forEach((c, i) => {
        const p = clamp01((t - delay(c)) / FALL);
        const dz = (1 - settle(p)) * FALL_FROM - (i === HOLE ? open : 0);
        place(cubes.current[i], c.x, c.y, c.z + dz, clamp01(p / 0.25) * fade);
      });

      /* the package: travels in (0.2-1.4), drops (1.4-1.9) */
      let px = PKG_FROM;
      let pz = PKG_Z;
      let alpha = 0;
      if (u >= 0.2 && u < CLOSE_AT) {
        const travel = smooth((u - 0.2) / 1.2);
        const drop = easeIn((u - 1.4) / 0.5);
        px = PKG_FROM - (PKG_FROM - 2) * travel;
        pz = PKG_Z - 2.2 * drop;
        alpha = clamp01((u - 0.2) / 0.25) * (1 - clamp01((u - 1.75) / 0.15));
      }
      place(above.current, px, 2, pz, pz >= N ? alpha : 0);
      place(inside.current, px, 2, pz, pz < N ? alpha : 0);
    },
    rest,
  );

  return (
    <svg ref={svgRef} className={className} viewBox="-340 -291 680 582" aria-hidden="true" focusable="false">
      <defs>
        <CubeFaces id={`${uid}-ink`} {...INK_FACES} />
        <CubeFaces id={`${uid}-pkg`} {...WHITE_FACES} />
      </defs>
      <g transform={`scale(1.15) translate(0 ${-DZ})`}>
        {VAULT.map((c, i) => {
          const [sx, sy] = iso(c.x, c.y, c.z);
          return (
            <g key={`${c.x}-${c.y}-${c.z}`}>
              <g ref={(node) => void (cubes.current[i] = node)} transform={`translate(${fmt(sx)} ${fmt(sy)})`}>
                <use href={`#${uid}-ink`} />
              </g>
              {/* the package inside the hole: drawn right after the hole's
                  cube, so the cubes in front of the hole cover it */}
              {i === HOLE ? (
                <g ref={inside} opacity="0">
                  <use href={`#${uid}-pkg`} />
                </g>
              ) : null}
            </g>
          );
        })}
        <g ref={above} opacity="0">
          <use href={`#${uid}-pkg`} />
        </g>
      </g>
    </svg>
  );
}

/* --- slide 4: modular ------------------------------------------------------- */

/* the docks around the centre, back to front; each core keeps its own side */
const DOCKS: { core: CcosCoreId; v: [number, number, number] }[] = [
  { core: "panoptes", v: [0, 0, -1] },
  { core: "wrkops", v: [-1, 0, 0] },
  { core: "kaia", v: [0, -1, 0] },
  { core: "aethernos", v: [1, 0, 0] },
  { core: "kron", v: [0, 1, 0] },
  { core: "kairon", v: [0, 0, 1] },
];
/* the centre is drawn after the back docks and before the front ones */
const BACK = 3;
const DOCK_PERIOD = 6.6;
const DOCK_STEP = 1.1;
const AWAY = 2.2;
const WORK = [1.8, 3.0];

/* one dock at time u into its cycle: distance out, opacity, lit */
function dockAt(u: number): [number, number, number] {
  if (u < 0) return [AWAY, 0, 0];
  const v = u % DOCK_PERIOD;
  if (v < 0.7) return [AWAY * (1 - settle(v / 0.7)), clamp01(v / 0.35), 0];
  if (v < 4.9) {
    const lit = smooth((v - 1.0) / 0.4) - smooth((v - 4.3) / 0.4);
    const pulse = WORK.reduce((sum, w) => sum + 0.14 * Math.sin(Math.PI * clamp01((v - w) / 0.5)), 0);
    return [pulse, 1, lit];
  }
  if (v < 5.7) return [AWAY * easeIn((v - 4.9) / 0.8), 1 - clamp01((v - 5.2) / 0.5), 0];
  return [AWAY, 0, 0];
}

export function CcosModularArt({ active, reduced, className }: VoxelArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const docks = useRef<(SVGGElement | null)[]>([]);
  const lights = useRef<(SVGUseElement | null)[]>([]);

  const pose = (i: number, out: number, alpha: number, lit: number) => {
    const [x, y, z] = DOCKS[i].v;
    const s = 1 + out;
    place(docks.current[i], x * s, y * s, z * s, alpha);
    lights.current[i]?.setAttribute("opacity", `${fmt(clamp01(lit))}`);
  };

  useVisibleLoop(
    svgRef,
    active && !reduced,
    (clock) => DOCKS.forEach((_, i) => pose(i, ...dockAt(clock - i * DOCK_STEP))),
    () => DOCKS.forEach((_, i) => pose(i, 0, 1, 1)),
  );

  const dock = (i: number) => {
    const { core, v } = DOCKS[i];
    const [sx, sy] = iso(...v);
    return (
      <g key={core} ref={(node) => void (docks.current[i] = node)} transform={`translate(${fmt(sx)} ${fmt(sy)})`}>
        <use href={`#${uid}-ink`} />
        <use ref={(node) => void (lights.current[i] = node)} href={`#${uid}-lit-${core}`} />
      </g>
    );
  };

  return (
    <svg ref={svgRef} className={className} viewBox="-340 -291 680 582" aria-hidden="true" focusable="false">
      <defs>
        <CubeFaces id={`${uid}-ink`} {...INK_FACES} />
        <CubeFaces id={`${uid}-core`} {...WHITE_FACES} />
        {DOCKS.map(({ core }) => {
          const color = CCOS_CORES.find((c) => c.id === core)?.color ?? "#F2F2F2";
          return (
            <g key={core}>
              <linearGradient id={`${uid}-g-${core}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={2 * DY}>
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor={color} />
              </linearGradient>
              <path id={`${uid}-lit-${core}`} d={TOP} fill={`url(#${uid}-g-${core})`} stroke={EDGE} strokeWidth="0.6" strokeLinejoin="round" />
            </g>
          );
        })}
      </defs>
      <g transform={`scale(1.4) translate(0 ${-DZ})`}>
        {DOCKS.slice(0, BACK).map((_, i) => dock(i))}
        <use href={`#${uid}-core`} />
        {DOCKS.slice(BACK).map((_, i) => dock(i + BACK))}
      </g>
    </svg>
  );
}
