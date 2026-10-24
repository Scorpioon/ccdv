/* The thin-outline cog in the Work masthead's active cell.

   Transcribed from pages_work.svg's own active-cell icon: the reference draws
   it as a filled silhouette duplicated into a thin ring via a mask (an
   Illustrator/Figma stroke-emulation trick), but the silhouette path itself
   (the mask's own source shape) is usable directly as a stroked outline, so
   that single path is reproduced here with `fill="none"` instead of carrying
   the doubled mask geometry. The centre hole is the reference's own circle,
   same stroke colour and the same 0.5 width as its explicit stroke-width
   (the doubled-path offset measured ~0.36 either side, i.e. ~0.72 total;
   0.5 is the nearest value the reference states explicitly, used for both
   shapes here rather than two slightly different guessed widths). */

const GEAR_OUTLINE =
  "M680.472 81.0711C680.472 85.1067 685.379 87.0967 688.19 84.2009L708.854 62.913C710.619 61.0947 713.537 61.0947 715.302 62.913L732.87 81.0113C734.562 82.7547 734.562 85.5275 732.87 87.271L711.7 109.081C708.934 111.931 710.953 116.705 714.924 116.705H744.506C746.988 116.705 749 118.717 749 121.198L748.999 146.931C748.999 149.413 746.987 151.424 744.506 151.424H714.928C710.957 151.424 708.938 156.198 711.704 159.048L732.87 180.854C734.562 182.597 734.562 185.37 732.87 187.114L715.302 205.213C713.537 207.031 710.618 207.031 708.853 205.213L688.19 183.925C685.379 181.029 680.472 183.019 680.472 187.054V217.524C680.472 220.006 678.46 222.018 675.978 222.018H651.263C648.781 222.018 646.77 220.006 646.77 217.524V187.053C646.77 183.018 641.862 181.028 639.052 183.923L618.389 205.21C616.624 207.028 613.706 207.028 611.941 205.21L594.372 187.111C592.68 185.367 592.68 182.595 594.372 180.851L615.536 159.048C618.303 156.198 616.283 151.424 612.312 151.424H582.737C580.255 151.424 578.243 149.412 578.243 146.931V121.198C578.243 118.716 580.255 116.705 582.737 116.705H612.318C616.289 116.705 618.309 111.931 615.543 109.081L594.374 87.2729C592.682 85.5295 592.682 82.7567 594.374 81.0133L611.943 62.9141C613.708 61.0957 616.626 61.0957 618.391 62.9141L639.052 84.1986C641.862 87.0945 646.77 85.1045 646.77 81.0688V50.5976C646.77 48.1159 648.781 46.104 651.263 46.104H675.978C678.46 46.104 680.472 48.1159 680.472 50.5976V81.0711Z";

export function WorkGearTile({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="578.243 46.104 170.757 175.914"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d={GEAR_OUTLINE} fill="none" stroke="#202020" strokeWidth="0.5" />
      <circle cx="663.931" cy="133.932" r="22.6812" fill="none" stroke="#202020" strokeWidth="0.5" />
    </svg>
  );
}
