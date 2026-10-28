import { CcdvLongMark } from "./CcdvLongMark";

/* Contact's two oversized directory identities (`CTC-012`, `CTC-014`).

   CCDV: the long-format lockup (CCDV_Long.svg, gear + horizontal pixel
   wordmark), approved for CTC-012 in GF09-A2 D4. Inert: no anchor, no
   handler (`CTC-DEC-004`).

   Collapse Creative: pages_contact.svg's own mark is two overlapping ring
   forms with a wordmark beneath. The two rings are reproduced geometrically
   (two offset thick-stroke circles, each ring inner edge clipped by an
   opening the way the source silhouette separates them) rather than by
   tracing the source's compound letterform path set, which this pass did
   not walk point-by-point — approximate geometry, not a verified path
   transcription; flagged as such in the implementation report. "COLLAPSE" /
   "CREATIVE" are set in the site's one loaded face (Victor Mono SemiBold)
   rather than inventing a second display face for a two-word lockup. */

export function CcdvIdentityMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <CcdvLongMark className="identity-mark__long" />
    </span>
  );
}

export function CollapseCreativeMark({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg
        className="identity-mark__rings"
        viewBox="0 0 220 140"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M95 20C58.7 20 29 49.7 29 86c0 15.1 5.1 29 13.7 40.1 7-3.9 12.6-10 15.8-17.4C52.7 100.7 49 93.8 49 86c0-25.4 20.6-46 46-46 9.2 0 17.7 2.7 24.9 7.3 4.4-6.3 10.9-11 18.5-13.2C126.9 24.7 111.6 20 95 20Z"
          fill="#202020"
        />
        <path
          d="M125 14C88.7 14 59 43.7 59 80c0 36.3 29.7 66 66 66 25.4 0 47.5-14.4 58.5-35.5-7.5-1.2-14.1-4.9-19-10.2C156 112.8 141.4 122 125 122c-23.2 0-42-18.8-42-42s18.8-42 42-42c7.3 0 14.2 1.9 20.1 5.1 2.9-6.6 7.6-12.2 13.5-16.2C148.4 18.6 137.1 14 125 14Z"
          fill="#202020"
        />
      </svg>
      <span className="identity-mark__word">
        <span>Collapse</span>
        <span>Creative</span>
      </span>
    </span>
  );
}
