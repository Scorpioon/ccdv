/* CCDV gear mark.
   Path transcribed verbatim from the manifest-pinned pages_index_home.svg
   (path 1, the masthead gear); the same outline appears at footer scale in
   footer.svg, so one component serves both by viewBox scaling rather than
   carrying a second copy.

   The centre disc is a separate circle in the reference: #D9D9D9 against the
   dark masthead gear, and knocked out in the footer's own background ink
   (#202020) rather than being light. Hence `dotFill` is explicit, never
   assumed from `fill`. */

const GEAR_PATH =
  "M155.711 67.6089C155.711 72.7668 161.947 75.3498 165.594 71.7027L192.337 44.96C194.598 42.6991 198.264 42.6991 200.524 44.96L223.041 67.4765C225.302 69.7375 225.302 73.4032 223.041 75.6641L196.298 102.407C192.651 106.054 195.234 112.29 200.392 112.29H238.211C241.409 112.29 244.001 114.882 244.001 118.08V149.921C244.001 153.119 241.409 155.711 238.211 155.711H200.392C195.234 155.711 192.651 161.947 196.298 165.594L223.041 192.337C225.302 194.598 225.302 198.264 223.041 200.524L200.524 223.04C198.263 225.301 194.598 225.301 192.337 223.04L165.594 196.297C161.947 192.65 155.711 195.233 155.711 200.391V238.211C155.711 241.409 153.119 244.001 149.921 244.001H118.08C114.882 244.001 112.29 241.409 112.29 238.211V200.391C112.29 195.233 106.054 192.65 102.407 196.297L75.6641 223.04C73.4032 225.301 69.7375 225.301 67.4765 223.04L44.961 200.524C42.7 198.264 42.7 194.598 44.961 192.337L71.7036 165.594C75.3508 161.947 72.7677 155.711 67.6099 155.711H29.7895C26.592 155.711 24 153.119 24 149.921V118.08C24 114.882 26.592 112.29 29.7895 112.29H67.6099C72.7677 112.29 75.3508 106.054 71.7036 102.407L44.9609 75.664C42.7 73.4031 42.7 69.7375 44.9608 67.4765L67.4765 44.9601C69.7375 42.6991 73.4032 42.6991 75.6642 44.9601L102.407 71.7027C106.054 75.3498 112.29 72.7668 112.29 67.6089V29.7895C112.29 26.592 114.882 24 118.08 24H149.921C153.119 24 155.711 26.592 155.711 29.7895V67.6089Z";

export interface GearMarkProps {
  fill?: string;
  dotFill?: string;
  className?: string;
}

export function GearMark({
  fill = "#202020",
  dotFill = "#D9D9D9",
  className,
}: GearMarkProps) {
  return (
    <svg
      className={className}
      viewBox="24 24 220 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d={GEAR_PATH} fill={fill} />
      <circle cx="133.931" cy="133.931" r="22.9312" fill={dotFill} />
    </svg>
  );
}
