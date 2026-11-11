import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { Link } from "react-router";
import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ClippedHeading } from "../components/ClippedHeading";
import { PrincipleCardStatic } from "../components/PrincipleCard";
import { HexCube } from "../components/marks/HexCube";
import { StudioMobileMenu } from "../components/StudioMobileMenu";
import { StudioMobileOrbit } from "../components/marks/StudioMobileOrbit";
import { useMotionPolicy } from "../motion/reducedMotion";
import { STUDIO_PRINCIPLES } from "../data/studioPrinciples";

export function meta() {
  return [{ title: "CCDV — Studio" }];
}

/* R4-B06: the ink-tone principle (Build with WrkOps™) is no longer the fourth
   accordion row; it is the standalone chapter after Studio Approach. The cards
   still list all four principles. */
const WRKOPS_PRINCIPLE = STUDIO_PRINCIPLES.find((principle) => principle.fanTone === "ink")!;
const ACCORDION_PRINCIPLES = STUDIO_PRINCIPLES.filter((principle) => principle.fanTone !== "ink");

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const delay = (seconds: number) => ({ "--rd": `${seconds}s` }) as CSSProperties;

/* Masthead states (R4-B05). A = expanded lilac (--mh-p 0), B = compact light
   (--mh-p 1). The state flips on where the first intro text sits in the
   viewport (fraction of the viewport height, measured from the top): below
   MH_ENTER it goes to B, back above MH_LEAVE it returns to A. The gap between
   the two is the hysteresis, wider than the text's own 40u entry offset. The
   change then runs for MH_SECONDS on its own and always ends on 0 or 1. */
const MH_ENTER = 0.88;
const MH_LEAVE = 0.95;
const MH_SECONDS = 0.35;

/* WrkOps -> CC.OS ground (R4-B07). WO_ON: fraction of the viewport height the
   CC.OS block's top must reach (from the top) before the change starts, so the
   last black beat gets room (was 0.95: started as the block entered). WO_SPAN:
   scroll distance of the change itself, as a fraction of the viewport (was 0.75).
   WO_TAU: smoothing time constant in seconds (was 0.16). */
const WO_ON = 0.6;
const WO_SPAN = 0.3;
const WO_TAU = 0.1;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* All strokes in the Studio illustrations are 0.5 (MTG05 R4-B03, B03-09). */
const STROKE = 0.5;
const LILAC = "#A864E2";

/* Orbit illustration (Frame 44 in work_assets/feedback_r4_2): two rounded rings,
   a Y of spokes and four lilac nodes. Rings are the reference outlines drawn as
   plain 0.5 strokes (Figma's masked inner-stroke trick is not reproduced). */
/* viewBox x starts at -0.5: the rings and the centre node are centred on
   x=148.0 (rings 19.37..275.77, node 148.035) while the box centre is 148.5, so
   the shift puts the visible centre on the wrapper centre (0.43u at 256u wide). */
function OrbitMark() {
  const id = `orbit-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const ramp = (n: number, x1: number, y1: number, x2: number, y2: number) => (
    <linearGradient id={`${id}-${n}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop stopColor="#D4D4D4" />
      <stop offset="1" stopColor={LILAC} />
    </linearGradient>
  );
  return (
    <svg className="studio-art" viewBox="-0.5 0 297 297" fill="none" aria-hidden="true" focusable="false">
      <defs>
        {ramp(0, 228.837, 203.373, 272.235, 210.626)}
        {ramp(1, 148.035, 118, 148.035, 178)}
        {ramp(2, 148.535, 52, 148.535, 8)}
        {ramp(3, 66.7864, 201.306, 24.2857, 212.694)}
      </defs>
      <path
        d="M19.3681 148.035C19.3681 102.233 43.8034 59.9098 83.4693 37.0086C123.135 14.1075 172.006 14.1075 211.672 37.0086C251.337 59.9097 275.773 102.233 275.773 148.035C275.773 193.837 251.337 236.16 211.672 259.062C172.006 281.963 123.135 281.963 83.4693 259.062C43.8034 236.16 19.3681 193.837 19.3681 148.035Z"
        stroke="#CACAC8"
        strokeWidth={STROKE}
      />
      <path
        d="M45.4015 148.035C45.4015 111.393 64.9497 77.5345 96.6824 59.2136C128.415 40.8927 167.511 40.8927 199.244 59.2136C230.977 77.5345 250.525 111.393 250.525 148.035C250.525 184.677 230.977 218.535 199.244 236.856C167.512 255.177 128.415 255.177 96.6824 236.856C64.9497 218.535 45.4015 184.677 45.4015 148.035Z"
        stroke="#CACAC8"
        strokeWidth={STROKE}
      />
      <path d="M45.7949 207.143L148.034 148.035L250.275 207.143" stroke="#CACAC8" strokeWidth={STROKE} />
      <path d="M148.535 148.035V30.0894" stroke="#CACAC8" strokeWidth={STROKE} />
      <circle cx="251.8" cy="206.7" r="19" fill={`url(#${id}-0)`} />
      <circle cx="148.035" cy="148" r="25.5" fill={`url(#${id}-1)`} />
      <circle cx="148.5" cy="30" r="19" fill={`url(#${id}-2)`} />
      <circle cx="45.5" cy="207" r="19" fill={`url(#${id}-3)`} />
    </svg>
  );
}

/* Gear illustration (Frame 327): the eight-tooth outline with a lilac core.
   The core follows the 2026-11-06 re-export: a rounded shape centred on
   (148, 148) with a vertical grey -> lilac ramp. */
function GearOutlineMark() {
  const id = `gear-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className="studio-art" viewBox="0 0 297 297" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="148" y1="170" x2="148" y2="126">
          <stop stopColor="#D4D4D4" />
          <stop offset="1" stopColor={LILAC} />
        </linearGradient>
      </defs>
      <path
        d={GEAR_OUTLINE}
        stroke="#D9D9D9"
        strokeWidth={STROKE}
      />
      <path
        d={GEAR_CORE}
        fill={`url(#${id})`}
      />
    </svg>
  );
}

/* --- R1-FB001: scroll-reel figures (phones, <768px) ---------------------------
   Geometry is read from the OPERATOR's local STUDIO_resp3.svg (390 wide
   artboard) and kept in artboard coordinates: every viewBox below is a window
   on that artboard. Each figure is hidden by CSS from 768px up (desktop keeps
   its existing composition) and is driven by exactly one loop that runs only
   while the figure is on screen. The verbatim drawing is what renders on the
   server, without JS and under reduced motion; motion only adds attributes. */

type Wave = [amp: number, freq: number];
const wave = (waves: Wave[], t: number) => waves.reduce((sum, [a, w]) => sum + a * Math.sin(w * t), 0);
const smooth = (value: number) => {
  const v = clamp01(value);
  return v * v * (3 - 2 * v);
};
/* the same ellipse-in-its-own-frame squash for every ring: major axis along
   `deg`, minor axis scaled by `k`, pivoting on the ring's own centre */
const tilt = (cx: number, cy: number, deg: number, k: number) =>
  `translate(${cx} ${cy}) rotate(${deg}) scale(1 ${k.toFixed(4)}) rotate(${-deg}) translate(${-cx} ${-cy})`;

/* Phones only; false on the server and until mounted. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return narrow;
}

/* One rAF driver per figure. `step(clock)` gets the running time in seconds
   (time spent off screen never counts, so leaving and returning never jumps)
   and writes attributes straight to the DOM; it is called once with 0 on mount
   so a figure's first painted state is its start state. `rest()` puts the
   verbatim drawing back (cleanup, or motion switched off). */
function useVisibleLoop(
  ref: RefObject<Element | null>,
  enabled: boolean,
  step: (clock: number) => void,
  rest: () => void,
) {
  const latest = useRef({ step, rest });
  latest.current = { step, rest };
  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    let frame = 0;
    let clock = 0;
    let last = 0;
    const tick = (now: number) => {
      clock += Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      latest.current.step(clock);
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    latest.current.step(0);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    if (observer) observer.observe(node);
    else start();
    return () => {
      observer?.disconnect();
      stop();
      latest.current.rest();
    };
  }, [ref, enabled]);
}

const GYRO_RING_A =
  "M146.877 2801.93C145.997 2802.45 145.112 2802.96 144.223 2803.47C143.334 2803.99 142.446 2804.5 141.56 2805M152.143 2798.81C153.905 2797.75 155.647 2796.68 157.369 2795.62M162.554 2792.36C164.292 2791.26 166.006 2790.15 167.696 2789.04M172.791 2785.65C174.502 2784.5 176.184 2783.35 177.838 2782.19M182.844 2778.65C184.527 2777.44 186.176 2776.24 187.79 2775.04M192.67 2771.34C194.314 2770.07 195.915 2768.81 197.472 2767.56M202.212 2763.67C203.815 2762.32 205.363 2760.99 206.852 2759.67M211.377 2755.56C212.92 2754.11 214.386 2752.68 215.769 2751.29M219.986 2746.84C221.432 2745.23 222.755 2743.68 223.946 2742.17M227.52 2737.2C228.746 2735.29 229.708 2733.48 230.387 2731.8M231.56 2725.86C231.479 2724.78 231.194 2723.81 230.696 2722.95C230.197 2722.09 229.498 2721.35 228.611 2720.75M222.873 2718.79C221.081 2718.54 219.038 2718.47 216.765 2718.57M210.676 2719.19C208.776 2719.46 206.765 2719.83 204.653 2720.28M198.692 2721.71C196.791 2722.21 194.825 2722.77 192.799 2723.38M186.971 2725.24C185.086 2725.87 183.158 2726.54 181.19 2727.26M175.449 2729.42C173.588 2730.14 171.695 2730.9 169.775 2731.69M164.134 2734.06C162.287 2734.86 160.417 2735.69 158.528 2736.54M152.959 2739.1C151.136 2739.96 149.295 2740.84 147.44 2741.74M141.959 2744.46C140.154 2745.37 138.338 2746.3 136.512 2747.26M131.101 2750.12C129.317 2751.08 127.525 2752.05 125.726 2753.05M120.386 2756.05C119.5 2756.55 118.612 2757.06 117.723 2757.57C116.834 2758.09 115.949 2758.6 115.068 2759.12M109.803 2762.24C108.041 2763.3 106.299 2764.37 104.577 2765.43M99.3916 2768.69C97.6542 2769.79 95.9399 2770.9 94.2498 2772.01M89.1547 2775.4C87.4442 2776.55 85.7613 2777.7 84.1075 2778.85M79.1023 2782.39C77.4189 2783.61 75.7695 2784.81 74.1555 2786.01M69.2756 2789.71C67.6321 2790.98 66.0308 2792.24 64.4739 2793.49M59.734 2797.38C58.1307 2798.73 56.5831 2800.06 55.0937 2801.38M50.5691 2805.49C49.0256 2806.94 47.5601 2808.37 46.1763 2809.76M41.96 2814.21C40.5136 2815.82 39.1912 2817.37 37.9994 2818.88M34.4263 2823.85C33.1995 2825.76 32.238 2827.57 31.5589 2829.24M30.3863 2835.19C30.467 2836.26 30.7519 2837.24 31.2503 2838.1C31.7487 2838.96 32.4478 2839.7 33.3353 2840.3M39.0731 2842.26C40.8644 2842.51 42.9076 2842.58 45.1804 2842.47M51.2694 2841.86C53.1701 2841.59 55.1806 2841.22 57.2924 2840.77M63.2538 2839.34C65.155 2838.84 67.1209 2838.28 69.1468 2837.67M74.9745 2835.81C76.8594 2835.18 78.7875 2834.51 80.7556 2833.79M86.4965 2831.63C88.3581 2830.91 90.2504 2830.15 92.1707 2829.36M97.8123 2826.99C99.6591 2826.19 101.528 2825.36 103.418 2824.51M108.986 2821.95C110.81 2821.09 112.651 2820.21 114.506 2819.31M119.987 2816.59C121.791 2815.68 123.607 2814.75 125.434 2813.79M130.845 2810.93C132.629 2809.97 134.421 2808.99 136.22 2808";

const GYRO_RING_B =
  "M213.272 2911.88C212.434 2912.37 211.592 2912.85 210.749 2913.34C209.905 2913.83 209.062 2914.31 208.219 2914.8M218.273 2908.94C219.949 2907.95 221.614 2906.95 223.267 2905.95M228.233 2902.93C229.89 2901.91 231.534 2900.89 233.164 2899.87M238.078 2896.76C239.724 2895.71 241.355 2894.67 242.972 2893.62M247.83 2890.43C249.454 2889.36 251.061 2888.28 252.651 2887.21M257.459 2883.93C259.071 2882.82 260.663 2881.72 262.237 2880.61M266.975 2877.25C268.562 2876.11 270.128 2874.97 271.672 2873.84M276.328 2870.38C277.899 2869.2 279.445 2868.03 280.965 2866.86M285.555 2863.28C287.098 2862.06 288.611 2860.85 290.095 2859.65M294.58 2855.95C296.092 2854.69 297.568 2853.44 299.008 2852.19M303.371 2848.35C304.844 2847.03 306.275 2845.72 307.66 2844.43M311.864 2840.42C313.288 2839.02 314.655 2837.65 315.964 2836.3M319.934 2832.06C321.279 2830.58 322.546 2829.12 323.733 2827.7M327.357 2823.12C328.577 2821.48 329.675 2819.89 330.646 2818.36M333.498 2813.28C334.423 2811.35 335.097 2809.54 335.51 2807.85M335.8 2802.09C335.611 2801.11 335.279 2800.21 334.801 2799.38C334.322 2798.55 333.706 2797.81 332.958 2797.16M327.823 2794.53C326.153 2794.04 324.245 2793.72 322.114 2793.56M316.285 2793.49C314.473 2793.56 312.55 2793.72 310.522 2793.96M304.741 2794.8C302.914 2795.12 301.02 2795.49 299.062 2795.91M293.41 2797.23C291.584 2797.69 289.711 2798.19 287.794 2798.73M282.215 2800.36C280.402 2800.91 278.555 2801.5 276.674 2802.11M271.169 2803.97C269.371 2804.6 267.547 2805.25 265.696 2805.93M260.253 2807.96C258.469 2808.64 256.663 2809.35 254.837 2810.08M249.445 2812.26C247.672 2813 245.881 2813.75 244.075 2814.52M238.754 2816.82C237.001 2817.59 235.234 2818.38 233.454 2819.19M228.172 2821.61C226.428 2822.42 224.672 2823.24 222.906 2824.08M217.665 2826.61C215.94 2827.45 214.206 2828.31 212.464 2829.17M207.276 2831.79C205.559 2832.66 203.834 2833.55 202.102 2834.45M196.958 2837.16C195.259 2838.06 193.554 2838.97 191.843 2839.9M186.741 2842.69C185.05 2843.62 183.355 2844.56 181.656 2845.52M176.61 2848.38C175.768 2848.86 174.925 2849.34 174.081 2849.83C173.237 2850.32 172.396 2850.81 171.557 2851.29M166.557 2854.23C164.88 2855.23 163.215 2856.22 161.562 2857.22M156.597 2860.25C154.94 2861.27 153.296 2862.29 151.665 2863.31M146.752 2866.41C145.106 2867.46 143.474 2868.51 141.858 2869.56M136.999 2872.74C135.376 2873.82 133.768 2874.89 132.178 2875.97M127.37 2879.24C125.759 2880.35 124.166 2881.46 122.593 2882.56M117.855 2885.93C116.267 2887.07 114.701 2888.2 113.158 2889.34M108.501 2892.79C106.93 2893.97 105.384 2895.14 103.864 2896.31M99.2745 2899.89C97.7318 2901.11 96.2183 2902.32 94.7349 2903.52M90.2491 2907.22C88.7378 2908.48 87.2617 2909.74 85.8217 2910.98M81.4588 2914.82C79.985 2916.14 78.5547 2917.45 77.1693 2918.74M72.9653 2922.76C71.5416 2924.15 70.1742 2925.52 68.8651 2926.87M64.8958 2931.11C63.5508 2932.59 62.2834 2934.05 61.0963 2935.47M57.4722 2940.06C56.2524 2941.69 55.1544 2943.28 54.1832 2944.81M51.3318 2949.9C50.4069 2951.82 49.7319 2953.64 49.3191 2955.33M49.029 2961.09C49.2188 2962.06 49.5505 2962.96 50.0288 2963.79C50.5071 2964.62 51.1233 2965.36 51.8716 2966.01M57.0059 2968.64C58.676 2969.13 60.5844 2969.45 62.7152 2969.61M68.5442 2969.69C70.3567 2969.61 72.2798 2969.45 74.3073 2969.22M80.0886 2968.37C81.9154 2968.05 83.8096 2967.68 85.7679 2967.26M91.4192 2965.94C93.2452 2965.48 95.1182 2964.98 97.0359 2964.45M102.614 2962.81C104.427 2962.26 106.275 2961.68 108.155 2961.06M113.66 2959.2C115.458 2958.58 117.283 2957.93 119.133 2957.25M124.576 2955.21C126.361 2954.53 128.167 2953.82 129.993 2953.1M135.385 2950.91C137.158 2950.18 138.948 2949.43 140.755 2948.66M146.075 2946.35C147.828 2945.58 149.595 2944.79 151.375 2943.99M156.658 2941.57C158.402 2940.76 160.157 2939.93 161.924 2939.09M167.165 2936.56C168.889 2935.72 170.623 2934.87 172.366 2934M177.553 2931.38C179.271 2930.51 180.996 2929.62 182.727 2928.72M187.872 2926.02C189.571 2925.12 191.276 2924.2 192.986 2923.28M198.089 2920.49C199.779 2919.56 201.475 2918.61 203.174 2917.66";

const BUILD_RING =
  "M134 4131.38C133.039 4131.54 132.083 4131.7 131.131 4131.86M268.021 4094C268.934 4093.64 269.841 4093.28 270.743 4092.92M125.41 4132.77C123.48 4133.06 121.571 4133.34 119.682 4133.61M113.948 4134.38C112.002 4134.63 110.082 4134.86 108.188 4135.08M102.423 4135.69C100.469 4135.89 98.547 4136.06 96.6572 4136.22M90.8859 4136.65C88.9136 4136.78 86.9813 4136.88 85.0906 4136.97M79.3138 4137.16C77.3242 4137.2 75.3878 4137.22 73.507 4137.21M67.7255 4137.08C65.721 4137 63.7921 4136.89 61.9422 4136.74M56.1781 4136.12C54.1537 4135.85 52.251 4135.52 50.4764 4135.14M44.8773 4133.62C42.8585 4132.93 41.0946 4132.15 39.6022 4131.26M35.305 4127.45C34.742 4126.63 34.3287 4125.77 34.0712 4124.85C33.8137 4123.92 33.7167 4122.97 33.7748 4121.98M35.487 4116.47C36.3067 4114.93 37.4111 4113.34 38.7856 4111.71M42.8106 4107.49C44.1321 4106.25 45.5897 4104.98 47.178 4103.7M51.827 4100.16C53.3307 4099.08 54.9199 4097.98 56.5915 4096.88M61.4882 4093.76C63.0923 4092.78 64.758 4091.79 66.483 4090.79M71.5524 4087.95C73.2156 4087.04 74.9259 4086.13 76.6816 4085.22M81.8611 4082.58C83.5651 4081.73 85.3067 4080.89 87.0846 4080.04M92.3478 4077.57C94.0838 4076.77 95.8507 4075.98 97.6476 4075.18M102.982 4072.86C104.745 4072.1 106.534 4071.35 108.349 4070.59M113.718 4068.4C115.495 4067.69 117.294 4066.98 119.114 4066.27M124.539 4064.19C126.338 4063.51 128.156 4062.83 129.992 4062.16M135.463 4060.18C137.271 4059.53 139.094 4058.89 140.934 4058.25M146.431 4056.38C148.258 4055.76 150.099 4055.15 151.954 4054.54M157.484 4052.76C159.317 4052.17 161.163 4051.59 163.021 4051.02M168.582 4049.32C170.431 4048.77 172.292 4048.21 174.163 4047.67M179.737 4046.06C180.67 4045.8 181.606 4045.53 182.545 4045.27C183.483 4045.01 184.42 4044.75 185.356 4044.49M190.954 4042.97C192.837 4042.47 194.714 4041.98 196.583 4041.5M202.218 4040.06C204.105 4039.59 205.983 4039.13 207.853 4038.68M213.508 4037.34C215.409 4036.89 217.3 4036.46 219.181 4036.04M224.856 4034.8C226.76 4034.39 228.652 4033.99 230.531 4033.61M236.235 4032.46C238.155 4032.08 240.061 4031.72 241.951 4031.37M247.67 4030.34C249.594 4030 251.501 4029.67 253.39 4029.36M259.117 4028.45C261.058 4028.16 262.979 4027.87 264.878 4027.6M270.645 4026.82C272.594 4026.57 274.519 4026.34 276.417 4026.12M282.195 4025.5C284.156 4025.31 286.085 4025.13 287.981 4024.97M293.776 4024.54C295.751 4024.41 297.686 4024.3 299.579 4024.21M305.388 4024.02C307.379 4023.97 309.317 4023.96 311.2 4023.97M317.002 4024.09C319.004 4024.17 320.93 4024.28 322.778 4024.43M328.589 4025.04C330.612 4025.32 332.514 4025.64 334.288 4026.02M339.916 4027.54C341.94 4028.23 343.709 4029.01 345.205 4029.9M349.525 4033.72C350.088 4034.54 350.502 4035.41 350.759 4036.33C351.019 4037.26 351.115 4038.22 351.055 4039.22M349.327 4044.74C348.501 4046.28 347.389 4047.87 346.005 4049.51M341.966 4053.73C340.633 4054.98 339.163 4056.26 337.56 4057.55M332.912 4061.08C331.395 4062.17 329.791 4063.27 328.104 4064.38M323.188 4067.5C321.573 4068.49 319.896 4069.49 318.159 4070.49M313.08 4073.33C311.407 4074.24 309.686 4075.16 307.92 4076.08M302.723 4078.71C301.013 4079.56 299.264 4080.41 297.48 4081.26M292.191 4083.74C290.445 4084.54 288.669 4085.34 286.863 4086.14M281.519 4088.46C279.754 4089.21 277.962 4089.97 276.145 4090.72";

const BUILD_RING_FRONT =
  "M268.02 4094C267.13 4094.35 266.234 4094.7 265.333 4095.05M133.999 4131.38C134.953 4131.22 135.911 4131.06 136.874 4130.89M142.619 4129.85C144.516 4129.5 146.428 4129.14 148.354 4128.76M154.078 4127.61C155.97 4127.23 157.874 4126.83 159.791 4126.42M165.493 4125.17C167.38 4124.75 169.278 4124.31 171.186 4123.87M176.865 4122.52C178.746 4122.07 180.636 4121.61 182.535 4121.13M188.192 4119.69C190.067 4119.21 191.949 4118.71 193.838 4118.21M199.472 4116.68C200.408 4116.42 201.346 4116.16 202.285 4115.9C203.214 4115.64 204.141 4115.38 205.066 4115.12M210.617 4113.52C212.474 4112.98 214.32 4112.43 216.156 4111.88M221.681 4110.2C223.53 4109.62 225.368 4109.05 227.193 4108.47M232.69 4106.69C234.532 4106.09 236.359 4105.48 238.173 4104.87M243.64 4103.01C245.473 4102.37 247.29 4101.74 249.09 4101.1M254.523 4099.13C256.346 4098.46 258.151 4097.79 259.938 4097.12";

/* the intro gear (GearOutlineMark) outline and lilac core, shared with the conveyor */
const GEAR_OUTLINE =
  "M169.454 0H126.602C122.299 0 118.811 3.48828 118.811 7.79129V58.6648C118.811 65.6061 110.418 69.0823 105.51 64.1741L69.5347 28.1988C66.492 25.1561 61.5588 25.1561 58.5161 28.1989L28.2152 58.5005C25.1726 61.5432 25.1726 66.4763 28.2153 69.519L64.2131 105.517C69.1213 110.425 65.6451 118.817 58.7038 118.817H7.79129C3.48828 118.817 0 122.306 0 126.609V169.461C0 173.764 3.48828 177.252 7.79129 177.252H58.6902C65.6315 177.252 69.1077 185.644 64.1994 190.553L28.2046 226.547C25.1619 229.59 25.1619 234.523 28.2046 237.566L58.5054 267.867C61.5481 270.909 66.4812 270.909 69.5239 267.867L105.51 231.881C110.418 226.972 118.811 230.449 118.811 237.39V288.278C118.811 292.581 122.299 296.069 126.602 296.069H169.454C173.757 296.069 177.245 292.581 177.245 288.278V237.359C177.245 230.417 185.637 226.941 190.546 231.849L226.548 267.852C229.591 270.895 234.524 270.895 237.567 267.852L267.869 237.551C270.911 234.509 270.911 229.575 267.869 226.533L231.888 190.553C226.98 185.644 230.456 177.252 237.398 177.252H288.277C292.58 177.252 296.068 173.764 296.068 169.461V126.609C296.068 122.306 292.58 118.817 288.277 118.817H237.383C230.442 118.817 226.966 110.425 231.874 105.517L267.858 69.5327C270.901 66.49 270.901 61.5568 267.858 58.5142L237.557 28.2134C234.514 25.1707 229.581 25.1707 226.539 28.2134L190.546 64.2063C185.637 69.1145 177.245 65.6383 177.245 58.697V7.79129C177.245 3.48828 173.757 0 169.454 0Z";

const GEAR_CORE =
  "M138.474 164.5C144.369 167.903 151.631 167.903 157.526 164.5C163.421 161.097 167.053 154.807 167.053 148C167.053 141.193 163.421 134.903 157.526 131.5C151.631 128.097 144.369 128.097 138.474 131.5C132.579 134.903 128.947 141.193 128.947 148C128.947 154.807 132.579 161.097 138.474 164.5Z";

const INK = "#1A1A1A";
const LIGHT = "#F2F2F2";

/* Approach gyroscope (artboard y 2573..3169). Fixed: outer circle, vertical and
   horizontal axis. Moving: the needle (a dotted diameter, 30 deg off vertical)
   swings about the centre and carries the three elliptical rings, so they can
   only ever move with it. Rings 1 and 2 are the same drawing 233.4 apart along
   the needle; ring 3 sits on the centre. Each ring also breathes (its minor
   axis scales) on its own incommensurate sines, so the motion reads as
   irregular without any per-frame randomness. All terms are 0 at t = 0, and
   a short ramp avoids a start jolt. */
const GYRO_C = { x: 192.415, y: 2881.59 };
const NEEDLE_WAVES: Wave[] = [[0.6, 0.37], [0.3, 0.61], [0.1, 0.97]];
const GYRO_RINGS: { cx: number; cy: number; breath: Wave[] }[] = [
  { cx: 133.9, cy: 2780.6, breath: [[0.35, 0.53], [0.15, 0.89]] },
  { cx: 250.9, cy: 2982.6, breath: [[0.3, 0.71], [0.15, 1.07]] },
  { cx: GYRO_C.x, cy: GYRO_C.y, breath: [[0.18, 0.43], [0.1, 0.83]] },
];

function ApproachGyro({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const ramp = smooth(clock / 1.5);
      const swing = ramp * 9 * wave(NEEDLE_WAVES, clock);
      needleRef.current?.setAttribute("transform", `rotate(${swing.toFixed(3)} ${GYRO_C.x} ${GYRO_C.y})`);
      GYRO_RINGS.forEach((ring, i) => {
        const k = 1 + ramp * wave(ring.breath, clock);
        ringRefs.current[i]?.setAttribute("transform", tilt(ring.cx, ring.cy, -30, k));
      });
    },
    () => {
      needleRef.current?.removeAttribute("transform");
      ringRefs.current.forEach((node) => node?.removeAttribute("transform"));
    },
  );

  const ring = (i: number) => ({
    ref: (node: SVGGElement | null) => {
      ringRefs.current[i] = node;
    },
  });
  const line = { stroke: INK, strokeWidth: STROKE } as const;
  return (
    <svg ref={svgRef} className="studio-art" viewBox="0 2573 390 596" fill="none" aria-hidden="true" focusable="false">
      <circle cx={GYRO_C.x} cy={GYRO_C.y} r="164.163" {...line} />
      <path d="M192.662 2717.17V3046" {...line} />
      <path d="M356.824 2881.84H27.998" {...line} />
      <g ref={needleRef}>
        <path d="M110.422 2739.07L274.835 3023.85" {...line} strokeDasharray="0.5 0.5" />
        <g {...ring(0)}>
          <path d={GYRO_RING_A} {...line} strokeLinecap="round" />
        </g>
        <g {...ring(1)}>
          <path d={GYRO_RING_A} transform="translate(117 202)" {...line} strokeLinecap="round" />
        </g>
        <g {...ring(2)}>
          <path d={GYRO_RING_B} {...line} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/* Build w/ WrkOps™ gyroscope (artboard y 3831..4427). A cube is fixed on a
   vertical axis (a diameter of the circle) and the axis swings like a heavy
   pendulum: small and slow. The Saturn ring follows the same swing a beat later
   (RING_LAG), with a larger angle and an extra faster component, so it reads as
   coupled to the axis yet livelier. The ring is one dotted path split in two so
   its near arc passes in front of the cube. */
const BUILD_C = { x: 192.415, y: 4080.59 };
const AXIS_WAVES: Wave[] = [[0.7, 0.62], [0.3, 1.05]];
const RING_LAG = 0.6;

function BuildGyro({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const axisRef = useRef<SVGGElement>(null);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const ramp = smooth(clock / 1.5);
      const axis = ramp * 7 * wave(AXIS_WAVES, clock);
      axisRef.current?.setAttribute("transform", `rotate(${axis.toFixed(3)} ${BUILD_C.x} ${BUILD_C.y})`);
      const swing = ramp * (13 * wave(AXIS_WAVES, clock - RING_LAG) + 2 * Math.sin(1.7 * clock));
      const k = 1 + ramp * (0.22 * Math.sin(0.62 * (clock - 0.9)) + 0.08 * Math.sin(1.7 * clock));
      const transform = `rotate(${swing.toFixed(3)} ${BUILD_C.x} ${BUILD_C.y}) ${tilt(BUILD_C.x, BUILD_C.y, -15, k)}`;
      ringRefs.current.forEach((node) => node?.setAttribute("transform", transform));
    },
    () => {
      axisRef.current?.removeAttribute("transform");
      ringRefs.current.forEach((node) => node?.removeAttribute("transform"));
    },
  );

  const ring = (i: number) => ({
    ref: (node: SVGGElement | null) => {
      ringRefs.current[i] = node;
    },
  });
  const line = { stroke: INK, strokeWidth: STROKE } as const;
  const hex = "M192.807 4004.04L259.491 4042.54V4119.54L192.807 4158.04L126.123 4119.54V4042.54L192.807 4004.04Z";
  return (
    <svg ref={svgRef} className="studio-art" viewBox="0 3831 390 596" fill="none" aria-hidden="true" focusable="false">
      <g {...ring(0)}>
        <path d={BUILD_RING} {...line} strokeLinecap="round" />
      </g>
      <circle cx={BUILD_C.x} cy={BUILD_C.y} r="164.163" {...line} />
      <g ref={axisRef}>
        <path d="M192.25 3916V4043" {...line} />
        <path d={hex} fill={LILAC} stroke={INK} strokeWidth="1.065" />
        <path d="M125.807 4043.04L192.306 4081.04L258.807 4043.04" {...line} />
        <path d="M193 4081V4245" {...line} />
      </g>
      <g {...ring(1)}>
        <path d={BUILD_RING_FRONT} {...line} strokeLinecap="round" />
      </g>
    </svg>
  );
}

/* Black chapter 2, beat 1: three cubes (artboard y 4824..5144). The two lower
   cubes are fixed; the upper one starts nested in the notch between them (19u
   lower: its lower vertex rests on the notch) and, when the figure first
   reaches the middle of the screen, rises to the drawn position, then floats
   gently. Separation is a transition on the outer group, the float an
   animation on the inner one (see global.css), so nothing fights over one
   transform. The observer only writes data attributes. */
const CUBE_OUTLINE = "M0 0L75 43L74.927 129.36L0 172L-74 129V43Z";
const CUBE_STEM = "M0 171.89V86C29.289 69.21 45.211 59.79 74.5 43M0 85.99L-73.5 43";

function CubeDrawing({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={CUBE_OUTLINE} stroke={LIGHT} strokeWidth="0.77554" />
      <path d={CUBE_STEM} stroke={LIGHT} strokeWidth={STROKE} />
    </g>
  );
}

function ThreeCubes({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const node = svgRef.current;
    if (!node || reduced || typeof IntersectionObserver === "undefined") return;
    node.setAttribute("data-armed", "true");
    const observer = new IntersectionObserver(
      ([entry]) => {
        node.setAttribute("data-live", entry.isIntersecting ? "true" : "false");
        if (entry.isIntersecting && entry.intersectionRatio >= 0.4) node.setAttribute("data-sep", "true");
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      node.removeAttribute("data-armed");
      node.removeAttribute("data-live");
      node.removeAttribute("data-sep");
    };
  }, [reduced]);

  return (
    <svg ref={svgRef} className="studio-art wo-cubes" viewBox="0 4800 390 360" fill="none" aria-hidden="true" focusable="false">
      <CubeDrawing x={120} y={4972.1} />
      <CubeDrawing x={269} y={4972.1} />
      <g className="wo-cubes__top">
        <g className="wo-cubes__float">
          <CubeDrawing x={194} y={4824.1} />
        </g>
      </g>
    </svg>
  );
}

/* Black chapter 2, beat 2: the five-column writing diagram (artboard y
   5494..5688), one deterministic timeline, T seconds long, looped:

     S0 anchors   the five upper segments and the lower baseline only
     S1 columns   each column writes its own stack of compact lines, top down,
                  at its own rhythm (COL_PACE) and start (COL_STAGGER)
     S2 route     the rising line draws left -> right: level, diagonal, level
     hold         everything shown
     S3 reset     the written lines and the route fade together, the anchors and
                  baseline never leave; the loop restarts at S0

   Lines draw with pathLength 1 + dashoffset, so one code path serves every
   segment; no random numbers, and the reset is invisible because every written
   line is already at progress 0 when the fade ends. */
const COL_TOPS: [number, number][] = [
  [28.5488, 75.7147],
  [98.75, 145.916],
  [168.949, 216.115],
  [239.15, 286.316],
  [309.35, 356.515],
];
const COL_LINE_Y = [5519.88, 5529.75, 5539.62, 5549.49, 5559.36, 5569.24, 5579.11, 5588.98, 5598.85, 5608.72, 5618.6];
const COL_LINES = [11, 6, 6, 6, 6];
const COL_PACE = [0.105, 0.09, 0.12, 0.098, 0.112];
const COL_STAGGER = 0.18;
const LINE_DRAW = 0.2;
const S1_AT = 0.9;
const S2_AT = 2.7;
const S2_FOR = 1.9;
const HOLD_UNTIL = 6.1;
const FADE_FOR = 0.45;
const LOOP_FOR = HOLD_UNTIL + FADE_FOR;
const easeOut = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);

const WRITTEN = COL_LINES.flatMap((count, col) =>
  Array.from({ length: count }, (_, row) => ({
    col,
    row,
    x1: col === 0 ? 28 : COL_TOPS[col][0],
    x2: col === 0 ? 75.1658 : COL_TOPS[col][1],
    y: COL_LINE_Y[row],
  })),
);

function WritingDiagram({ reduced }: { reduced: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const writtenRef = useRef<SVGGElement>(null);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const routeRef = useRef<SVGPathElement>(null);

  const draw = (node: SVGPathElement | null | undefined, progress: number) => {
    node?.setAttribute("stroke-dashoffset", (1 - progress).toFixed(4));
  };

  useVisibleLoop(
    svgRef,
    !reduced,
    (clock) => {
      const t = clock % LOOP_FOR;
      WRITTEN.forEach((line, i) => {
        const at = S1_AT + line.col * COL_STAGGER + line.row * COL_PACE[line.col];
        draw(lineRefs.current[i], easeOut((t - at) / LINE_DRAW));
      });
      draw(routeRef.current, easeOut((t - S2_AT) / S2_FOR));
      const fade = t > HOLD_UNTIL ? 1 - (t - HOLD_UNTIL) / FADE_FOR : 1;
      writtenRef.current?.setAttribute("opacity", clamp01(fade).toFixed(3));
      routeRef.current?.setAttribute("opacity", clamp01(fade).toFixed(3));
    },
    () => {
      lineRefs.current.forEach((node) => node?.removeAttribute("stroke-dashoffset"));
      routeRef.current?.removeAttribute("stroke-dashoffset");
      writtenRef.current?.removeAttribute("opacity");
      routeRef.current?.removeAttribute("opacity");
    },
  );

  const stroke = { stroke: LIGHT, strokeWidth: 0.54844 } as const;
  const dashed = { pathLength: 1, strokeDasharray: 1 } as const;
  return (
    <svg ref={svgRef} className="studio-art wo-diagram" viewBox="0 5470 390 240" fill="none" aria-hidden="true" focusable="false">
      {COL_TOPS.map(([x1, x2], col) => (
        <path key={col} d={`M${x1} 5494.1H${x2}`} {...stroke} />
      ))}
      <path d="M28.2734 5688.03H361.725" {...stroke} />
      <g ref={writtenRef}>
        {WRITTEN.map((line, i) => (
          <path
            key={`${line.col}-${line.row}`}
            ref={(node) => {
              lineRefs.current[i] = node;
            }}
            d={`M${line.x1} ${line.y}H${line.x2}`}
            {...stroke}
            {...dashed}
          />
        ))}
      </g>
      <path ref={routeRef} d="M28 5677.06H159.626L241.892 5629.56H362" {...stroke} {...dashed} />
    </svg>
  );
}

/* Black chapter 2, beat 3: the gear conveyor (gear artwork as in beat 3 of the
   intro, scaled to the artboard's 127.66u gears at a 135u pitch). A row of gear
   slots is indexed: each cycle the gears turn together (neighbours opposite,
   as meshed gears do) while the row rests, then the row advances exactly one
   pitch and rests again. Slots are repositioned after each step, so slot 0
   (the centre, x = 195) is always a gear. A gear's identity is k = slot +
   steps, which fixes its turning direction and tooth phase, so a step never
   changes either. R only advances during the rest, one tooth (45 deg) per
   cycle, so the angle is continuous across the step. */
const GEAR_SCALE = 127.66 / 296.069;
const GEAR_PITCH = 135;
const GEAR_SLOTS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const DWELL = 1.5;
const ADVANCE = 0.8;
const INDEX_FOR = DWELL + ADVANCE;
const inOut = (value: number) => smooth(value);

function GearConveyor({ reduced }: { reduced: boolean }) {
  const id = `conv-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const slotRefs = useRef<(SVGUseElement | null)[]>([]);

  const place = (clock: number) => {
    const steps = Math.floor(clock / INDEX_FOR);
    const u = clock - steps * INDEX_FOR;
    const turn = 45 * (steps + (u < DWELL ? inOut(u / DWELL) : 1));
    const shift = u < DWELL ? 0 : inOut((u - DWELL) / ADVANCE) * GEAR_PITCH;
    GEAR_SLOTS.forEach((slot, i) => {
      const k = slot + steps;
      const odd = ((k % 2) + 2) % 2;
      const angle = (odd ? -turn : turn) + (odd ? 22.5 : 0);
      const x = 195 + slot * GEAR_PITCH - shift;
      slotRefs.current[i]?.setAttribute(
        "transform",
        `translate(${x.toFixed(3)} 65) rotate(${angle.toFixed(3)}) scale(${GEAR_SCALE.toFixed(5)}) translate(-148.034 -148.034)`,
      );
    });
  };

  useVisibleLoop(svgRef, !reduced, place, () => place(0));

  /* the verbatim state is the t = 0 state: a gear on every slot, centre at 195 */
  const initial = (slot: number) =>
    `translate(${195 + slot * GEAR_PITCH} 65) rotate(${((slot % 2) + 2) % 2 ? 22.5 : 0}) scale(${GEAR_SCALE.toFixed(5)}) translate(-148.034 -148.034)`;
  return (
    <svg ref={svgRef} className="studio-art" viewBox="0 0 390 130" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="148" y1="170" x2="148" y2="126">
          <stop stopColor="#D4D4D4" />
          <stop offset="1" stopColor={LILAC} />
        </linearGradient>
        <g id={`${id}-gear`}>
          <path d={GEAR_OUTLINE} stroke={LIGHT} strokeWidth={STROKE} />
          <path d={GEAR_CORE} fill={`url(#${id})`} />
        </g>
      </defs>
      {GEAR_SLOTS.map((slot, i) => (
        <use
          key={slot}
          href={`#${id}-gear`}
          transform={initial(slot)}
          ref={(node) => {
            slotRefs.current[i] = node;
          }}
        />
      ))}
    </svg>
  );
}

/* Studio page, MTG05 R4-B03 (supersedes the R4-B01/B02 order; FBI-040..055).
   Studio only.

   Page flow, all in the document (no nested scroller, no scroll hijack):

     masthead (sticky, full lilac at first, compact white later)
     · lilac [Studio] hero, pinned while the black intro slides over it
     · black intro: three text beats, each with its own illustration
     · lilac [Studio Approach] strip (sticky within its section)
     · four static principle squares + four accordion rows · footer

   Header (R4-B05, supersedes the black-edge trigger). The masthead is sticky
   and has two resting states: A, full lilac, and B, compact light. `--mh-p`
   only travels between 0 (A) and 1 (B) during a short animation; it is never
   left in between. The black intro first shows an empty breathing interval at
   A; the switch to B starts when the first intro text nears the viewport
   (MH_ENTER / MH_LEAVE above). A margin keeps the masthead's flow footprint at
   full height, so content never moves faster than the page.
   `data-collapse="on"` is set from an effect: without JS the masthead is the
   plain full-size lilac one and scrolls away.

   Accordion (R4-B03, supersedes R4-B02). Fixed order, all closed on load; a
   click opens a closed row, a click on the open row closes it, so zero or one
   row is open. Nothing reorders and nothing scrolls the page.

   R4-B06: the group is [Studio Approach], a disclosure button that holds the
   four squares and three rows (closing it clears the open row). Build with
   WrkOps™ is no longer a row: it is its own chapter after it, with its own
   sticky strip and its own independent disclosure. Both open by default.

   Build with WrkOps™ is the one deliberately long section. The panel
   background runs black -> lilac from where the CC.OS block sits in the
   viewport (`--wo`), damped with a time-corrected exponential, reversible.

   Per-frame work is one rAF updater that writes CSS custom properties straight
   to the DOM (no React state). Reveals are presentation only: all copy is
   always in the DOM; hidden start states exist only where CSS scroll timelines
   apply or once `data-motion="on"` is set from an effect, i.e. never without
   JS, IntersectionObserver, or when reduced motion is set. */
export default function Studio() {
  const [selected, setSelected] = useState<number | null>(null);
  const [approachOpen, setApproachOpen] = useState(true);
  const [wrkopsOpen, setWrkopsOpen] = useState(true);
  const baseId = useId();
  const { reduced } = useMotionPolicy();
  const narrow = useNarrow();

  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const woRef = useRef<HTMLDivElement>(null);
  const ccosRef = useRef<HTMLElement>(null);

  const panelId = (index: number) => `${baseId}-fan-${index}`;

  /* Progressive reveals: one observer, one-way (seen stays seen). Used where
     scroll timelines are unavailable; see the @supports block in global.css. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-seen", "true");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    root.querySelectorAll("[data-reveal]").forEach((node) => observer.observe(node));
    root.setAttribute("data-motion", "on");
    return () => {
      observer.disconnect();
      root.removeAttribute("data-motion");
      root.querySelectorAll("[data-seen]").forEach((node) => node.removeAttribute("data-seen"));
    };
  }, [reduced]);

  /* Scroll-linked state, written straight to the DOM (no re-render per frame):
     the masthead collapse progress from the black intro's top edge, and the
     WrkOps black->lilac progress from the CC.OS block's position. All geometry
     reads happen before any write in a frame. The masthead progress is exact
     (it must stay glued to the black edge); only the WrkOps ground is damped,
     with a frame-rate independent factor, and never touches window.scrollY. */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const intro = introRef.current;
    if (!root || !intro) return;
    const firstText = intro.querySelector<HTMLElement>(".studio-beat__text");

    let frame = 0;
    let active = false;
    let last = 0;
    let primed = false;
    let woNow = 0;
    let lastWo = "";
    let lastP = "";
    let mhTarget = 0;
    let mhNow = 0;
    let mhPrimed = false;
    let lastTuck = "";

    const update = () => {
      frame = 0;
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;

      // reads
      const textTop = firstText ? firstText.getBoundingClientRect().top : Infinity;
      const wo = woRef.current;
      const ccos = ccosRef.current;
      const ccosTop = wo && ccos && !reduced ? ccos.getBoundingClientRect().top : 0;
      const vh = window.innerHeight;
      const hero = heroRef.current;
      const heroH = hero ? hero.offsetHeight : 0;
      const scrolled = window.scrollY;

      // masthead state: a threshold with hysteresis picks A or B (never a
      // scroll-proportional value); the move between them is time-based and
      // always completes, so it cannot park between the two.
      if (mhTarget === 0 && textTop < vh * MH_ENTER) mhTarget = 1;
      else if (mhTarget === 1 && textTop > vh * MH_LEAVE) mhTarget = 0;
      if (!mhPrimed || reduced) {
        mhNow = mhTarget; // first frame (restored scroll) and reduced motion: no animation
        mhPrimed = true;
      } else if (mhNow !== mhTarget) {
        const step = dt / MH_SECONDS;
        mhNow = Math.abs(mhTarget - mhNow) <= step ? mhTarget : mhNow + Math.sign(mhTarget - mhNow) * step;
      }

      // writes
      const p = (mhNow * mhNow * (3 - 2 * mhNow)).toFixed(5);
      if (p !== lastP) {
        lastP = p;
        root.style.setProperty("--mh-p", p);
      }

      /* R1-FB001 (phones): [Studio] rides up with the page instead of being
         covered by the black edge: the distance scrolled, capped at the hero's
         height. Written on the hero only (not the root), so a scroll frame
         re-styles one small subtree. Exact, never smoothed; unused by CSS
         from 768px up, and left at 0 under reduced motion. */
      if (hero) {
        const tuck = reduced ? "0" : Math.min(Math.max(scrolled, 0), heroH).toFixed(1);
        if (tuck !== lastTuck) {
          lastTuck = tuck;
          hero.style.setProperty("--tuck", `${tuck}px`);
        }
      }

      let settled = mhNow === mhTarget;
      if (wo && ccos && !reduced) {
        /* B07-05: dwell and change are separate. Nothing happens until the CC.OS
           block's top has risen to WO_ON of the viewport (the preceding WrkOps
           beat keeps its black ground until then); the black -> lilac change
           then runs over the short WO_SPAN, eased at both ends (smoothstep). */
        const raw = clamp01((vh * WO_ON - ccosTop) / (vh * WO_SPAN));
        const target = raw * raw * (3 - 2 * raw);
        if (!primed) {
          woNow = target;
          primed = true;
        } else {
          woNow += (target - woNow) * (1 - Math.exp(-dt / WO_TAU));
          if (Math.abs(target - woNow) < 0.002) woNow = target;
          else settled = false;
        }
        const value = woNow.toFixed(3);
        if (value !== lastWo) {
          lastWo = value;
          wo.style.setProperty("--wo", value);
          /* B07-05: type flips in a narrow window around the point where light and
             dark type have equal contrast on the blended ground (~0.65), so the
             grey mid-tone on purple never lingers */
          wo.style.setProperty("--wo-text", clamp01((woNow - 0.6) / 0.12).toFixed(3));
        }
      }
      active = !settled;
      if (!settled) frame = requestAnimationFrame(update);
    };

    const schedule = () => {
      if (frame) return;
      if (!active) last = performance.now();
      frame = requestAnimationFrame(update);
    };
    const onResize = () => schedule();

    root.setAttribute("data-collapse", "on");
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      root.removeAttribute("data-collapse");
      root.style.removeProperty("--mh-p");
      heroRef.current?.style.removeProperty("--tuck");
    };
  }, [reduced]);

  /* four informational squares: plain articles in a plain section. On phones
     they are the Approach carousel, shown only while no row is open (R1-FB001):
     the one `selected` state drives both, so there is no second source of truth
     and a row-to-row switch (A -> B) never passes through "none". Collapsing is
     CSS-only and phones-only (global.css); the hidden carousel leaves the tab
     order and the accessibility tree via visibility, and the row that was
     activated keeps focus. */
  const carouselOpen = selected === null;
  const cardsBlock = (
    <section
      className="section section--cards"
      aria-label="Core principles"
      data-collapsed={carouselOpen ? undefined : "true"}
      key="cards"
    >
      <div className="cards__clip">
        <div
          className="cards"
          role="group"
          aria-roledescription="carousel"
          aria-label="Core principles"
          tabIndex={narrow && carouselOpen ? 0 : undefined}
        >
          {STUDIO_PRINCIPLES.map((principle) => (
            <PrincipleCardStatic
              key={principle.key}
              label={principle.label}
              body={principle.summary}
            />
          ))}
        </div>
      </div>
    </section>
  );

  const fan = (index: number): ReactNode => {
    const principle = ACCORDION_PRINCIPLES[index];
    const open = selected === index;
    return (
      <div className="fan" key={principle.fanKey} data-tone={principle.fanTone} data-fan={index}>
        <ClippedHeading
          label={principle.fanLabel}
          expanded={open}
          onToggle={() => setSelected((current) => (current === index ? null : index))}
          panelId={panelId(index)}
        />
        <div
          id={panelId(index)}
          className="fan__panel"
          role="region"
          aria-label={principle.fanLabel}
          data-open={open}
          aria-hidden={open ? undefined : "true"}
        >
          <div className="fan__inner">
            <div className="fan__body">
              <div className="fan__copy">
                {principle.fanBody.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {principle.fanSteps && (
                <div className="columns">
                  {principle.fanSteps.map((step) => (
                    <PrincipleCardStatic key={step.label} {...step} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* Build with WrkOps™ chapter body (R4-B06): the former fourth row's panel,
     content unchanged, now under its own sticky heading. */
  const [woLead, woHow, woDaily] = WRKOPS_PRINCIPLE.fanBody;
  const woBlock = (
    <div className="wo" ref={woRef} data-reduced={reduced ? "true" : undefined}>
      {/* R1-FB001: on phones each beat is text, then its drawing (cubes, writing
          diagram, gear conveyor); `.wo__figure` is display:none from 768px up,
          where the lead cube above stays the only drawing. */}
      <div className="wo__lead">
        <p data-reveal>{woLead}</p>
        <div className="wo__cube" data-reveal style={delay(0.25)}>
          <HexCube
            className="studio-hex"
            variant="ring"
            gradientFrom="#FFFFFF"
            gradientTo={LILAC}
            lineColor="#D9D9D9"
            outerFill="#D9D9D9"
            middleFill="#1A1A1A"
            lineWidth={STROKE}
          />
        </div>
        <div className="wo__figure" data-reveal style={delay(0.25)} aria-hidden="true">
          <ThreeCubes reduced={reduced} />
        </div>
      </div>
      <div className="wo__explain">
        <p data-reveal>{woHow}</p>
        <div className="wo__figure" data-reveal style={delay(0.25)} aria-hidden="true">
          <WritingDiagram reduced={reduced} />
        </div>
        <p data-reveal style={delay(0.12)}>
          {woDaily}
        </p>
        <div className="wo__figure wo__figure--gears" data-reveal style={delay(0.25)} aria-hidden="true">
          <GearConveyor reduced={reduced} />
        </div>
      </div>

      <section className="wo__ccos" ref={ccosRef} aria-labelledby="ccos-title">
        <div className="wo__ccos-head" data-reveal>
          <HexCube
            className="studio-hex wo__ccos-cube"
            variant="solid"
            gradientFrom="#FFFFFF"
            gradientTo={LILAC}
            lineColor="#D9D9D9"
            outerFill="#1A1A1A"
            lineWidth={STROKE}
          />
          <h3 className="ccos__wordmark" id="ccos-title">
            CC.OS
          </h3>
        </div>
        <div className="wo__ccos-copy">
          <p data-reveal>We build tools for the way we work.</p>
          <p data-reveal style={delay(0.12)}>
            CC.OS is the developing software environment behind our studio. Its components
            address different parts of our operations, including work management, project
            intelligence, information, security and business coordination.
          </p>
          <p data-reveal style={delay(0.24)}>
            We use these projects to explore new ways of connecting software, automation and AI
            with everyday work.
          </p>
        </div>
        <Link className="ccos__action" to="/products/ccos" data-reveal>
          Read dev notes <span aria-hidden="true">→</span>
        </Link>
        <span className="ccos__dot" aria-hidden="true" />
      </section>
    </div>
  );

  /* B06-02: closing the group also clears the open row, so reopening shows all
     three rows closed. Nothing scrolls and no focus moves. */
  const toggleApproach = () => {
    if (approachOpen) setSelected(null);
    setApproachOpen(!approachOpen);
  };

  /* fixed order: the squares, then the three rows as authored */
  const stack: ReactNode[] = [cardsBlock, ...ACCORDION_PRINCIPLES.map((_, index) => fan(index))];
  const approachId = `${baseId}-approach`;
  const wrkopsId = `${baseId}-wrkops`;

  return (
    <div className="r11 r11--studio" ref={rootRef}>
      {/* M1: operator-designed phone header + menu; hidden from 768px up, where
          the masthead below stays as is (and is hidden on phones). */}
      <StudioMobileMenu />
      <SiteMasthead variant="studio" />

      <div className="studio-top">
        {/* B03-01: the page opens on the full-lilac hero. It stays pinned while
            the black intro slides over it. B04-02: the hero ends at the
            baseline of [Studio], so the black edge cuts the brackets there. */}
        <section className="studio-hero" aria-labelledby="studio-hero" ref={heroRef}>
          <StudioMobileOrbit className="studio-hero__orbit" />
          <h1 className="studio-hero__label" id="studio-hero">
            [Studio]
          </h1>
          <span className="studio-hero__suffix" aria-hidden="true">
            :P
          </span>
        </section>

        {/* B03-04: three beats, each a paragraph with its own illustration.
            Plain visible content; the scroll-linked fade is CSS-only and
            applies only where scroll timelines exist and motion is allowed. */}
        <section className="studio-intro" ref={introRef} aria-label="About the studio">
          <div className="studio-beat">
            <p className="studio-beat__text">
              Collapse Creative Dev. Unit is a technical studio working across design, software
              development and applied research.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <HexCube
                className="studio-hex"
                variant="interior"
                gradientFrom={LILAC}
                gradientTo="#5C377C"
                lineColor="#6E6E6E"
                lineWidth={STROKE}
              />
            </div>
          </div>
          <div className="studio-beat" data-side="right">
            <p className="studio-beat__text">
              Our background is in visual design and digital experiences. Today, we use that
              knowledge to build web applications, custom tools and software around how people
              actually work.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <OrbitMark />
            </div>
          </div>
          <div className="studio-beat">
            <p className="studio-beat__text">
              We approach development through the interface, the underlying logic and the people
              who will use it.
            </p>
            <div className="studio-beat__figure" aria-hidden="true">
              <GearOutlineMark />
            </div>
          </div>
        </section>
      </div>

      {/* B06-02: the lilac strip is the group's disclosure button (not a link).
          B06-04: Build with WrkOps™ below is its own chapter with the same
          strip and the same independent disclosure. Each strip is sticky
          inside its own section only, so the two never stack. */}
      <section className="studio-approach" aria-label="Studio Approach">
        {/* R1-FB001 (phones only): the lilac gyroscope that opens the chapter */}
        <div className="studio-gyro" aria-hidden="true">
          <ApproachGyro reduced={reduced} />
        </div>
        <div className="studio-strip" data-open={approachOpen}>
          <h2 className="studio-strip__heading">
            <button
              type="button"
              className="studio-strip__toggle"
              aria-expanded={approachOpen}
              aria-controls={approachId}
              onClick={toggleApproach}
            >
              <span className="studio-strip__title">
                <span className="studio-strip__label">[Studio Approach]</span>
                <span className="studio-strip__suffix" aria-hidden="true">
                  :P
                </span>
              </span>
              <span className="studio-strip__chevron" aria-hidden="true">
                v
              </span>
            </button>
          </h2>
        </div>

        <div
          id={approachId}
          className="studio-disc studio-stage"
          data-open={approachOpen}
          aria-hidden={approachOpen ? undefined : "true"}
        >
          <div className="studio-disc__inner">
            <div className="studio-disc__body">
              <div className="studio-stage__stack">{stack}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="studio-wrkops" aria-label={WRKOPS_PRINCIPLE.fanLabel}>
        <div className="studio-gyro" aria-hidden="true">
          <BuildGyro reduced={reduced} />
        </div>
        <div className="studio-strip" data-open={wrkopsOpen}>
          <h2 className="studio-strip__heading">
            <button
              type="button"
              className="studio-strip__toggle"
              aria-expanded={wrkopsOpen}
              aria-controls={wrkopsId}
              onClick={() => setWrkopsOpen((current) => !current)}
            >
              <span className="studio-strip__title">
                <span className="studio-strip__label">{WRKOPS_PRINCIPLE.fanLabel}</span>
              </span>
              <span className="studio-strip__chevron" aria-hidden="true">
                v
              </span>
            </button>
          </h2>
        </div>

        <div
          id={wrkopsId}
          className="studio-disc"
          data-open={wrkopsOpen}
          aria-hidden={wrkopsOpen ? undefined : "true"}
        >
          <div className="studio-disc__inner">
            <div className="studio-disc__body">{woBlock}</div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
