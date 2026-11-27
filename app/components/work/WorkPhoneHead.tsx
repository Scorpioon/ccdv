import { useIsPresent } from "motion/react";
import { useRetype } from "../../motion/retype";
import { useMotionPolicy } from "../../motion/reducedMotion";
import { useRouteArrival } from "../GlobalShell";
import { StudioMobileMenu } from "../StudioMobileMenu";

/* N4 P-K (OPERATOR): the Work head on phones and tablets is the M1 menu bar
   (the gear opens the menu, the pixel mark is Home; the same bar as the other
   sections, Work current) over a rounded light card with the page's one h1.
   It replaces the P-J card (gear, mark, `CC: DEV UNIT -> WORK`, section links).
   The desktop rail (WorkSidebar) is not used below 1024.
   R3 S9 (OPERATOR): the title is `WORK` (was `CCDV:WORK`) and it is typed in on
   arrival like the masthead's (useRetype, its own handover id so it never
   shares the masthead card's); the caret is the masthead's (data-typing). The
   screen-reader text is the whole word at once. */
const TITLE = "WORK";

export function WorkPhoneHead() {
  const arrival = useRouteArrival();
  const { reduced } = useMotionPolicy();
  const present = useIsPresent();
  const shown = useRetype(TITLE, { mode: arrival.kind, reduced, active: present, id: "work-head", from: "" });
  return (
    <>
      <StudioMobileMenu current="/work" />
      <div className="wv3p-head__card" data-typing={shown !== TITLE || undefined}>
        <h1 className="wv3p-head__title">
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{TITLE}</span>
        </h1>
      </div>
    </>
  );
}
