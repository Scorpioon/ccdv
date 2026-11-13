/* Studio marks (R3 OPUS CORR01). Every path below is copied verbatim from the
   V2 originals in work_assets/webdesign_responsive_v2 and kept in that
   artboard's coordinates (each viewBox is a window on the artboard):
     FB_R4_5.svg         desktop, 1440 x 4060
     STUDIO_resp3-1.svg  mobile, 390 x 4968
   Nothing here is redrawn by eye. Sizes come from CSS (global.css, "STUDIO R3
   OPUS CORR01"), which places each mark at its artboard position in --u (desktop)
   or px (phones). */
import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useFrameSpread } from "../../motion/frameSpread";

/* The small eight-tooth gear of the chips (Whois, \\Studio Approach, Toolbelt):
   FB_R4_5 Whois chip, box 60..73.19 x 318..331.19. The centre dot is the chip's
   own ground, so it is drawn in `--chip-ground`. */
const CHIP_GEAR =
  "M67.8955 320.614C67.8955 320.923 68.2692 321.078 68.4879 320.859L70.0905 319.257C70.2261 319.122 70.4458 319.122 70.5813 319.257L71.9304 320.606C72.0659 320.742 72.0659 320.961 71.9304 321.097L70.3278 322.7C70.1092 322.918 70.264 323.292 70.5732 323.292H72.8405C73.0321 323.292 73.1875 323.447 73.1875 323.639V325.548C73.1875 325.74 73.0321 325.896 72.8405 325.896H70.5742C70.265 325.896 70.1101 326.269 70.3288 326.488L71.9313 328.09C72.0669 328.226 72.0668 328.446 71.9312 328.581L70.5813 329.931C70.4458 330.066 70.2261 330.066 70.0906 329.93L68.4879 328.328C68.2693 328.109 67.8955 328.264 67.8955 328.573V330.84C67.8955 331.032 67.7401 331.188 67.5485 331.188H65.639C65.4474 331.188 65.292 331.032 65.292 330.84V328.573C65.292 328.264 64.9181 328.109 64.6995 328.328L63.097 329.931C62.9614 330.067 62.7417 330.067 62.6061 329.931L61.2561 328.581C61.1206 328.446 61.1206 328.226 61.2561 328.091L62.8587 326.488C63.0774 326.269 62.9225 325.896 62.6133 325.896H60.347C60.1554 325.896 60 325.74 60 325.548V323.639C60 323.447 60.1554 323.292 60.347 323.292H62.6133C62.9225 323.292 63.0774 322.918 62.8587 322.7L61.2561 321.097C61.1206 320.961 61.1206 320.742 61.2561 320.606L62.6062 319.256C62.7417 319.121 62.9614 319.121 63.097 319.256L64.6996 320.859C64.9182 321.077 65.292 320.923 65.292 320.613V318.347C65.292 318.155 65.4474 318 65.639 318H67.5485C67.7401 318 67.8955 318.155 67.8955 318.347V320.614Z";

export function ChipGear({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="60 318 13.1875 13.1875" aria-hidden="true" focusable="false">
      <path d={CHIP_GEAR} fill="currentColor" />
      <circle cx="66.6896" cy="324.598" r="0.959088" fill="var(--chip-ground)" />
    </svg>
  );
}

/* A label chip: gear + text on a solid plate. `ink` is the Whois chip (black
   plate, light text), `light` the Toolbelt chips (light plate, black text),
   `lilac` the \\Studio Approach strip. `red` is the Services R1 strip (the same
   strip in the Services accent; its CSS lives in the SERVICES R1 block). */
export function Chip({
  tone,
  as: Tag = "span",
  className,
  id,
  children,
}: {
  tone: "ink" | "light" | "lilac" | "red";
  as?: "span" | "p" | "h2" | "h3" | "h4";
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={`chip chip--${tone}${className ? ` ${className}` : ""}`} id={id}>
      <ChipGear className="chip__gear" />
      <span className="chip__text">{children}</span>
    </Tag>
  );
}

/* [Build with WrkOps™]: the joined gear tab + label pill, one black silhouette
   with concave fillets where the two meet (E04). Desktop FB_R4_5 x48..365.07,
   y2212..2311; mobile STUDIO_resp3-1 x48..342, y2684.25..2776.05. The gear is
   the chip gear at the drawing's own size (CSS). */
const BUILD_CHIP_D =
  "M48 2253.41C48 2258.93 52.4771 2263.41 58 2263.41H87C92.5229 2263.41 97 2267.89 97 2273.41V2301C97 2306.52 101.477 2311 107 2311H355.066C360.589 2311 365.066 2306.52 365.066 2301V2269C365.066 2263.48 360.589 2259 355.066 2259H109.41C103.887 2259 99.4102 2254.52 99.4102 2249V2222C99.4102 2216.48 94.933 2212 89.4102 2212H58C52.4771 2212 48 2216.48 48 2222V2253.41Z";
const BUILD_CHIP_M =
  "M48 2722.65C48 2727.77 52.1514 2731.92 57.2725 2731.92H84.163C89.2841 2731.92 93.4355 2736.07 93.4355 2741.19V2766.77C93.4355 2771.9 97.587 2776.05 102.708 2776.05H332.727C337.849 2776.05 342 2771.9 342 2766.77V2737.1C342 2731.98 337.849 2727.83 332.727 2727.83H104.942C99.8214 2727.83 95.6699 2723.68 95.6699 2718.56V2693.52C95.6699 2688.4 91.5185 2684.25 86.3974 2684.25H57.2725C52.1514 2684.25 48 2688.4 48 2693.52V2722.65Z";

export function BuildChip({ id }: { id: string }) {
  return (
    <h2 className="bc" id={id} data-spawn>
      <svg className="bc__shape bc__shape--d" viewBox="48 2212 317.066 99" aria-hidden="true" focusable="false">
        <path d={BUILD_CHIP_D} fill="currentColor" />
      </svg>
      <svg className="bc__shape bc__shape--m" viewBox="48 2684.25 294 91.8" aria-hidden="true" focusable="false">
        <path d={BUILD_CHIP_M} fill="currentColor" />
      </svg>
      <ChipGear className="bc__gear" />
      <span className="bc__text">
        [Build with WrkOps<span className="bc__tm">™</span>]
      </span>
    </h2>
  );
}

/* Services R1: the same joined gear tab + label pill (verbatim BUILD_CHIP_D /
   BUILD_CHIP_M silhouettes, unchanged geometry) carrying another label. Shares
   the `.bc` CSS of BuildChip; BuildChip itself is untouched. */
export function JoinedChip({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <h2 className={`bc${className ? ` ${className}` : ""}`} id={id} data-spawn>
      <svg className="bc__shape bc__shape--d" viewBox="48 2212 317.066 99" aria-hidden="true" focusable="false">
        <path d={BUILD_CHIP_D} fill="currentColor" />
      </svg>
      <svg className="bc__shape bc__shape--m" viewBox="48 2684.25 294 91.8" aria-hidden="true" focusable="false">
        <path d={BUILD_CHIP_M} fill="currentColor" />
      </svg>
      <ChipGear className="bc__gear" />
      <span className="bc__text">{children}</span>
    </h2>
  );
}

/* CC.OS title mark: the light hexagon, the black ring, the light -> lilac
   gradient core and the light Y (FB_R4_5 x680.49..764.45, y2809..2905.94; the
   mobile drawing is the same size). The gradient stops are the original's. */
export function CcosHexMark({ id }: { id: string }) {
  return (
    <svg className="cs__mark" viewBox="680.494 2809 83.951 96.94" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="722.47" y1="2832.27" x2="722.47" y2="2882.67" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2F2F2" />
          <stop offset="1" stopColor="#8654B3" />
        </linearGradient>
      </defs>
      <path d="M722.469 2809L764.445 2833.23V2881.7L722.469 2905.94L680.494 2881.7V2833.23L722.469 2809Z" fill="#F2F2F2" />
      <path d="M722.471 2818.7L756.051 2838.08V2876.86L722.471 2896.25L688.89 2876.86V2838.08L722.471 2818.7Z" fill="#1A1A1A" />
      <path d="M722.47 2832.27L744.297 2844.87V2870.07L722.47 2882.67L700.642 2870.07V2844.87L722.47 2832.27Z" fill={`url(#${id})`} />
      <path d="M688.539 2838.08L722.468 2857.47L756.396 2838.08" stroke="#F2F2F2" strokeWidth="1.67542" fill="none" />
      <path d="M722.469 2857.47V2896.24" stroke="#F2F2F2" strokeWidth="1.67542" fill="none" />
    </svg>
  );
}

/* Desktop only: the hairlines that join Build to CC.OS (FB_R4_5, 0.5 #1A1A1A):
   the bus under the three cards, the run from card 1 to the CC.OS title row,
   the two arms of that row, and the dev-notes return to the graph card. The SVG
   covers the lilac mega-section exactly (y2164..3900), so these are the
   original coordinates. Each line draws itself once (pathLength 1).
   Services R1 CORR01 round 3 (spread): with the columns spread by g (1440
   units, useFrameSpread) the cards, the CC.OS copy / card / cta move right and
   the Build copy left, so the lines follow: the card drops and the bus end at
   +g, the down-run to the title row stays at x585.5 (never under the centred
   CC.OS title) and the bus reaches back to it, the run to the copy ends at
   215 - g, the arm to the CC.OS card at 1391.5 + g. g = 0 is the original. */
const connectors = (g: number) => [
  `M${585.5 + g} 2661.5V2698M${921.5 + g} 2661.5V2698M${1269 + g} 2661.5V2698M585.5 2698H${1269 + g}M585.5 2698V2858.5`,
  `M646.5 2858.5H${215 - g}V2676`,
  `M1193 2858.5H${1391.5 + g}V3009`,
  `M${1241.5 + g} 3709H${1042 + g}V3672.5`,
];

export function StudioConnectors() {
  const svgRef = useRef<SVGSVGElement>(null);
  const g = useFrameSpread(svgRef, 1440);
  return (
    <svg ref={svgRef} className="sc" viewBox="0 2164 1440 1736" fill="none" aria-hidden="true" focusable="false" data-scene>
      {connectors(g).map((d, i) => (
        <path key={i} className="sc__line" d={d} pathLength={1} style={{ "--i": i } as CSSProperties} />
      ))}
    </svg>
  );
}
