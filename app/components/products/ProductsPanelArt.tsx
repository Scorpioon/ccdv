import type { CSSProperties } from "react";
import { CcosGraph } from "../studio/CcosScene";
import type { ProductsPanel } from "../../data/productsContent";

/* The art of a product panel (P1b CORR03). CC.OS: Studio's CcosGraph,
   decorative (OPERATOR D3). LS / iDS: `Project LS.svg` / `Project iDS.svg`
   (2026-11-19); each viewBox is the source's dark art box (487.336, 58.121;
   909.932 x 502.879 / 463, rx 10 — the box itself is CSS), so the source
   coordinates are used unchanged. All art is decorative. */

/* LS: the source's disc of light dots (20 rows on a 21.4275 pitch about
   942.3, 309.56, r 5.952) with its 6 x 6 centre of outlined dots (r 5.357,
   1.19 stroke) around a filled 2 x 2 core — recreated, not pasted. OPERATOR:
   the dots pulse outward in a smooth loop. Each dot runs one CSS pulse
   (global.css `.pv-ls`), delayed by its distance from the centre (--d, 0 at
   the centre to 1 at the rim), so the wave travels out; it runs only while
   the panel is open and stops under reduced motion. */
const LS = { cx: 942.3, cy: 309.56, pitch: 21.4275 };
const LS_ROWS = [6, 10, 14, 16, 16, 18, 18, 20, 20, 20, 20, 20, 20, 18, 18, 16, 16, 14, 10, 6];
const LS_DOTS = LS_ROWS.flatMap((n, row) => {
  const v = row - (LS_ROWS.length - 1) / 2;
  return Array.from({ length: n }, (_, col) => {
    const u = col - (n - 1) / 2;
    const hollow = Math.abs(u) <= 2.5 && Math.abs(v) <= 2.5 && !(Math.abs(u) <= 0.5 && Math.abs(v) <= 0.5);
    return {
      x: Math.round((LS.cx + u * LS.pitch) * 100) / 100,
      y: Math.round((LS.cy + v * LS.pitch) * 100) / 100,
      d: Math.round((Math.hypot(u, v) / 10.6) * 1000) / 1000,
      hollow,
    };
  });
});

function LsArt() {
  return (
    <svg className="pv-panel__svg pv-ls" viewBox="487.336 58.121 909.932 502.879" fill="none" aria-hidden="true" focusable="false">
      {LS_DOTS.map((dot) =>
        dot.hollow ? (
          <circle
            key={`${dot.x}-${dot.y}`}
            className="pv-ls__dot"
            cx={dot.x}
            cy={dot.y}
            r="5.35676"
            stroke="#F2F2F2"
            strokeWidth="1.19039"
            style={{ "--d": dot.d } as CSSProperties}
          />
        ) : (
          <circle
            key={`${dot.x}-${dot.y}`}
            className="pv-ls__dot"
            cx={dot.x}
            cy={dot.y}
            r="5.95196"
            fill="#F2F2F2"
            style={{ "--d": dot.d } as CSSProperties}
          />
        ),
      )}
    </svg>
  );
}

/* iDS: the source mark, static (OPERATOR) — two hexagons (inside strokes, as
   exported), three ticks and the name, set as live text */
function IdsArt() {
  const outer = "M942.302 197.422L1022.15 243.523V335.724L942.302 381.825L862.454 335.724V243.523L942.302 197.422Z";
  const inner = "M942.323 215.855L1006.2 252.736V326.497L942.323 363.378L878.445 326.497V252.736L942.323 215.855Z";
  return (
    <svg className="pv-panel__svg" viewBox="487.336 58.121 909.932 463" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <mask id="pv-ids-m0" fill="white"><path d={outer} /></mask>
        <mask id="pv-ids-m1" fill="white"><path d={inner} /></mask>
      </defs>
      <path d={outer} strokeWidth="2.79397" stroke="#F2F2F2" mask="url(#pv-ids-m0)" />
      <path d={inner} strokeWidth="2.79397" stroke="#F2F2F2" mask="url(#pv-ids-m1)" />
      <path d="M878.617 252.805L890.289 259.544M994.351 259.544L1005.15 253.307" strokeWidth="1.39699" stroke="#F2F2F2" />
      <path d="M942.305 350.41V363.091" strokeWidth="1.39699" stroke="#F2F2F2" />
      <text className="pv-ids__name" x="942.3" y="302.65" textAnchor="middle" fill="#F2F2F2">
        iDS
      </text>
    </svg>
  );
}

export function ProductsPanelArt({ art }: { art: ProductsPanel["art"] }) {
  if (art === "ccos") return <CcosGraph decorative />;
  if (art === "ls") return <LsArt />;
  return <IdsArt />;
}
