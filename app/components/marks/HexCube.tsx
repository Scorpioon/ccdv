import { useId } from "react";

/* The hexagon-and-cube figure, first componentised for the three Studio
   placements of pages_studio.svg and now drawn only by the CC.OS marks
   (CcosArtwork).

   Sharing is justified by verified path equivalence, not by resemblance. All
   three Studio instances are the same three-ring regular pointy-top hexagon
   (half-height / half-width = 1.15465 = 2/sqrt(3) in every case) with an
   isometric Y drawn at the middle ring, differing only by a uniform scale and
   by how the two outer rings are filled:

     placement  centre                outer half-width  rings (normalised)
     intro      (1088.19,  672.16)    127.94            1 / 0.7996 / 0.5211
     wrkops     (1088.19, 2313.20)    171.54            1 / 0.7999 / 0.5200
     ccos       ( 124.73, 2505.35)     66.45            1 / 0.8000 / 0.5200

   In all three the innermost ring carries the gradient, confirmed by each
   linearGradient's y-extent matching that path's bounding box exactly. The
   geometry below is transcribed from the intro instance (scale 1.0); the
   other two are the same shape and are reproduced by viewBox scaling.

   N4 P-I (C-08): only the two looks the CC.OS marks draw remain. The
   outlined "interior" look (Studio intro, retired) and the GF09-F "thin"
   KRON / KAIRON look (its last caller, the CC.OS rail family, went with the
   removed icons) are gone. */

const OUTER =
  "M1216.13 598.292V746.02L1088.19 819.884L960.257 746.021V598.292L1088.19 524.428L1216.13 598.292Z";
const MIDDLE =
  "M1190.49 613.096V731.217L1088.19 790.277L985.896 731.218V613.095L1088.19 554.035L1190.49 613.096Z";
const INNER =
  "M1088.19 595.179L1154.86 633.668V710.646L1088.19 749.135L1021.53 710.646V633.668L1088.19 595.179Z";
const Y_UPPER = "M985.952 613.049L1088.19 672.157L1190.43 613.049";
const Y_STEM = "M1088.19 672.157V790.103";

export type HexCubeVariant = "ring" | "solid";

export interface HexCubeProps {
  /** ring = filled outer hexagon with a filled middle ring (CC.OS cores) ·
   *  solid = filled outer hexagon only (CC.OS) */
  variant: HexCubeVariant;
  gradientFrom: string;
  gradientTo: string;
  lineColor?: string;
  outerFill?: string;
  middleFill?: string;
  /** Stroke width of the Y, in this file's scale-1 viewBox units. 1.2 is the
   *  Studio value; the CC.OS marks draw a heavier line at a smaller scale. */
  lineWidth?: number;
  className?: string;
}

export function HexCube({
  variant,
  gradientFrom,
  gradientTo,
  lineColor = "#D9D9D9",
  outerFill = "#D9D9D9",
  middleFill = "#202020",
  lineWidth = 1.2,
  className,
}: HexCubeProps) {
  // React's generated ids carry delimiter characters that are not safe inside
  // a url(#...) reference, so reduce to an alphanumeric slug.
  const gradientId = `hexcube-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      className={className}
      viewBox="960.257 524.428 255.873 295.456"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* userSpaceOnUse so the ramp spans exactly the inner hexagon's
            y-extent, as it does in the reference */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1="1088.19"
          y1="595.179"
          x2="1088.19"
          y2="749.135"
        >
          <stop stopColor={gradientFrom} />
          <stop offset="1" stopColor={gradientTo} />
        </linearGradient>
      </defs>

      <path d={OUTER} fill={outerFill} stroke="none" />
      <path d={MIDDLE} fill={variant === "ring" ? middleFill : "none"} stroke="none" />
      <path d={INNER} fill={`url(#${gradientId})`} />
      <path d={Y_UPPER} fill="none" stroke={lineColor} strokeWidth={lineWidth} />
      <path d={Y_STEM} fill="none" stroke={lineColor} strokeWidth={lineWidth} />
    </svg>
  );
}
