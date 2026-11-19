import type { CSSProperties } from "react";

/* P2 line illustrations for the CC.OS deck, both in a 680 x 582 box (the
   source's 640 x 548 art boxes, x1.0625). Decorative. They move only while
   their slide is the current one and stand still under reduced motion (CSS:
   global.css, CC.OS deck block).

   CcosEcosystemArt — slide 4, PRODUCTS/CCOS.svg's cube cluster: a large
   wireframe cube with six smaller modules on its vertex directions, behind
   it. On arrival the modules come in from further out and join the core
   (staggered); then each breathes out and back on its own phase.

   CcosLocalArt — slide 5 (OPERATOR: "Illustration required", to follow the
   text beside it): the local core inside a ring of security gates, under a
   dashed oversight perimeter that keeps scanning; an optional LLM node
   outside sends an operation through the gate (the gate opens, the core
   takes it), and the history of operations scrolls on the left. */

type Point = [number, number];

function vertex(cx: number, cy: number, r: number, k: number): Point {
  const angle = (Math.PI / 3) * k - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function hex(cx: number, cy: number, r: number) {
  return `M${Array.from({ length: 6 }, (_, k) => vertex(cx, cy, r, k).map((n) => n.toFixed(2)).join(" ")).join("L")}Z`;
}

/* the visible Y of an isometric cube seen from above */
function wye(cx: number, cy: number, r: number) {
  return [5, 1, 3]
    .map((k) => {
      const [x, y] = vertex(cx, cy, r, k);
      return `M${cx.toFixed(2)} ${cy.toFixed(2)}L${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join("");
}

function Cube({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <path d={hex(cx, cy, r)} className="cc-art__face" />
      <path d={wye(cx, cy, r)} className="cc-art__line" />
    </>
  );
}

const ECO_C: Point = [340, 291];
const ECO_CORE = 120;
const ECO_MOD = 62;
const ECO_REACH = 167;
/* back to front, so the lower modules overlap the upper ones; the core last */
const ECO_ORDER = [5, 0, 1, 4, 3, 2];

export function CcosEcosystemArt() {
  return (
    <svg className="cc-art cc-eco" viewBox="0 0 680 582" aria-hidden="true" focusable="false">
      {ECO_ORDER.map((k, i) => {
        const [dx, dy] = vertex(0, 0, 1, k);
        const [cx, cy] = vertex(ECO_C[0], ECO_C[1], ECO_REACH, k);
        const style = {
          "--i": i,
          "--x": `${(dx * 70).toFixed(2)}px`,
          "--y": `${(dy * 70).toFixed(2)}px`,
          "--bx": `${(dx * 12).toFixed(2)}px`,
          "--by": `${(dy * 12).toFixed(2)}px`,
          "--phase": `${(-i * 0.9).toFixed(1)}s`,
        } as CSSProperties;
        return (
          <g key={k} className="cc-eco__join" style={style}>
            <g className="cc-eco__breathe">
              <Cube cx={cx} cy={cy} r={ECO_MOD} />
            </g>
          </g>
        );
      })}
      <g className="cc-eco__core">
        <Cube cx={ECO_C[0]} cy={ECO_C[1]} r={ECO_CORE} />
      </g>
    </svg>
  );
}

const CORE: Point = [330, 291];
const GATE_R = 132;
const RIM_R = 186;
const NODE: Point = [598, 291];
const NODE_R = 32;
const LOG_ROWS = [0.72, 0.48, 0.86, 0.6, 0.38, 0.8, 0.54, 0.68];

/* the gate ring, open on its right edge (between vertices 1 and 2) */
function gateRing() {
  const pts = [2, 3, 4, 5, 0, 1].map((k) => vertex(CORE[0], CORE[1], GATE_R, k).map((n) => n.toFixed(2)).join(" "));
  return `M${pts.join("L")}`;
}

export function CcosLocalArt() {
  const [gx1, gy1] = vertex(CORE[0], CORE[1], GATE_R, 1);
  const [gx2, gy2] = vertex(CORE[0], CORE[1], GATE_R, 2);
  const gateMid = (gy1 + gy2) / 2;
  const doorLen = (gy2 - gy1) / 2;
  const [nodeLeft] = vertex(NODE[0], NODE[1], NODE_R, 4);
  const logs = [...LOG_ROWS, ...LOG_ROWS];

  return (
    <svg className="cc-art cc-local" viewBox="0 0 680 582" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="cc-local-log">
          <rect x="36" y="150" width="120" height="282" />
        </clipPath>
      </defs>

      {/* history of operations */}
      <text className="cc-art__label" x="36" y="134">
        [ history ]
      </text>
      <g clipPath="url(#cc-local-log)">
        <g className="cc-local__log">
          {logs.map((w, i) => (
            <g key={i}>
              <rect className="cc-art__dot" x="36" y={156 + i * 24} width="6" height="6" />
              <rect className="cc-art__bar" x="50" y={158 + i * 24} width={(106 * w).toFixed(1)} height="2" />
            </g>
          ))}
        </g>
      </g>

      {/* oversight perimeter */}
      <path className="cc-local__rim" d={hex(CORE[0], CORE[1], RIM_R)} />

      {/* security gates: the ring, its open edge and the two doors */}
      <path className="cc-art__line" d={gateRing()} />
      <g className="cc-local__door cc-local__door--a">
        <path className="cc-art__gate" d={`M${gx1.toFixed(2)} ${gy1.toFixed(2)}V${(gy1 + doorLen).toFixed(2)}`} />
      </g>
      <g className="cc-local__door cc-local__door--b">
        <path className="cc-art__gate" d={`M${gx2.toFixed(2)} ${gy2.toFixed(2)}V${(gy2 - doorLen).toFixed(2)}`} />
      </g>
      <text className="cc-art__label" x={gx1 + 10} y={gy1 - 10}>
        [ gate ]
      </text>

      {/* the local core */}
      <g className="cc-local__core">
        <Cube cx={CORE[0]} cy={CORE[1]} r={58} />
      </g>
      <text className="cc-art__label" x={CORE[0]} y={CORE[1] + 86} textAnchor="middle">
        [ local ]
      </text>

      {/* the optional LLM, its link to the gate and one operation */}
      <g className="cc-local__node">
        <path className="cc-local__link" d={`M${nodeLeft.toFixed(2)} ${gateMid.toFixed(2)}H${gx1.toFixed(2)}`} />
        <path d={hex(NODE[0], NODE[1], NODE_R)} className="cc-art__face" />
        <text className="cc-art__label cc-art__label--node" x={NODE[0]} y={NODE[1]} textAnchor="middle">
          LLM
        </text>
      </g>
      <rect className="cc-local__token" x={nodeLeft - 14} y={gateMid - 4} width="8" height="8" />
    </svg>
  );
}
