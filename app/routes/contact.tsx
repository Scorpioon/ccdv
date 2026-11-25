import { useRef } from "react";
import { CoverMasthead } from "../components/CoverMasthead";
import { ContactDirectory } from "../components/ContactDirectory";
import { useMotionPolicy } from "../motion/reducedMotion";
import { index, useSceneReveal } from "../motion/studioMotion";
import { useBoundaryNav, useNavIdle } from "../motion/routeNav";
import { useStepScroll } from "../motion/stepScroll";

export function meta() {
  return [
    { title: "CCDV — Contact" },
    { name: "description", content: "Get in touch with CCDV: hello@collapsecreative.com." },
  ];
}

/* N2 (t_20261124_ccdvn2contact, OPERATOR): one module in the Studio /
   Services grammar on the Contact blue, with no footer (N4 P-M). Replaces the R1.1
   artboard (masthead, stripe, hero, stripe, directory).

     .ct   V3 card (CCDV:Contact), the heading <3, the directory panel

   N2 A3 (OPERATOR): the heading is "You've got mail! (1)" (it was
   [Contact], a repeat of the card's title).

   The shared bar (GlobalShell, Contact current) is hidden on arrival and
   comes in once the V3 card has scrolled past (useBoundaryNav lead `.cmh`);
   input-driven idle and peek as every section page (useNavIdle). Desktop: the
   page is one screen on desktop, so there is nothing to step. ContactDirectory and
   the logo marks are reused unchanged, wording and link provenance included
   (`CTC-DEC-001`-`005`). */
export default function Contact() {
  const { reduced } = useMotionPolicy();
  const rootRef = useRef<HTMLDivElement>(null);
  const directoryRef = useRef<HTMLElement>(null);

  useSceneReveal(rootRef, reduced);
  useBoundaryNav(rootRef, directoryRef, ".masthead--contact", ".cmh");
  useNavIdle(rootRef);
  useStepScroll(rootRef, null, reduced);

  return (
    <div className="r11 r11--contact" ref={rootRef}>
      {/* N4 P-H A-14: the card is the main landmark. N4 P-M (OPERATOR): Contact has no footer. */}
      <main className="ct" aria-labelledby="contact-title">
        <div className="ct__frame">
          <CoverMasthead page="Contact" />

          <div className="ct__head" data-spawn style={index(1)}>
            <h1 className="ct__title" id="contact-title">
              You&apos;ve got mail! (1)
            </h1>
            <span className="ct__suffix">&lt;3</span>
          </div>

          <section
            className="section--contact-directory ct__directory"
            aria-label="Contact directory"
            ref={directoryRef}
            data-spawn
            style={index(2)}
          >
            <ContactDirectory />
          </section>
        </div>
      </main>
    </div>
  );
}
