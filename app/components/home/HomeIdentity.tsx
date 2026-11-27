import { CcdvPixelMark } from "../marks/CcdvPixelMark";
import { GearMark } from "../marks/GearMark";

/* N5 BH1 (OPERATOR): the Home identity panel contents (the section wrapper
   lives in home.tsx). Home is the destination, so the gear and the inline pixel
   mark are decoration, not links. The page h1 names the unit, so the marks are
   aria-hidden (their svgs carry aria-hidden too).
   (R3 S5: the two corner squares are gone.) */
export function HomeIdentity() {
  return (
    <>
      <div className="hi__mark">
        <GearMark className="hi__gear" fill="#141414" dotFill="#F2F2F2" />
        <CcdvPixelMark variant="inline" className="hi__pixel" fill="#141414" />
      </div>

      <h1 className="hi__title">
        <span>Collapse Creative:</span>
        <span>Development Unit</span>
      </h1>

      <div className="hi__meta">
        <div>[ Part of Collapse Creative ]</div>
        <div>[ hello[@]collapsecreative.com ]</div>
      </div>
    </>
  );
}
