import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { CollapseCreativeMark } from "./marks/ContactIdentityMarks";

/* Operator-designed /studio mobile header + menu (M1: Frame 322 closed, Frame
   331 open; STUDIO_resp1/resp2). Studio only, phones only: both elements are
   display:none from 768px up (see the STUDIO-RESP M1 block in global.css), where
   the existing masthead stays in charge.

   Route order is the order drawn in Frame 331 (not the masthead's CELLS order).
   The six CC.OS names go to their existing /products/ccos/* routes. Contact and
   legal lines are plain text exactly as in SiteFooter (no legal page exists, so
   none is linked). The gear is the open/close toggle; the pixel mark is Home. */

const ROUTES: { label: string; to: string }[] = [
  { label: "[Studio]", to: "/studio" },
  { label: "[Services]", to: "/services" },
  { label: "[Work]", to: "/work" },
  { label: "[Products]", to: "/products" },
  { label: "[Contact]", to: "/contact" },
];

const SYSTEMS: { label: string; to: string }[] = [
  { label: "WRKOPS", to: "/products/ccos/wrkops" },
  { label: "KRON", to: "/products/ccos/kron" },
  { label: "KAIA", to: "/products/ccos/kaia" },
  { label: "KAIRON", to: "/products/ccos/kairon" },
  { label: "AETHERNOS", to: "/products/ccos/aethernos" },
  { label: "PANOPTES", to: "/products/ccos/panoptes" },
];

const LEGAL = ["Privacy", "Terms of use", "Legal", "Onlyfans"];

const LIGHT = "#F2F2F2";
const INK = "#1A1A1A";

export function StudioMobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  /* focus: into the menu when it opens, back on the gear when it closes */
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    } else if (wasOpen.current) {
      toggleRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Tab stays inside gear -> Home -> menu links while the menu covers the page */
  const trapTab = (event: KeyboardEvent) => {
    if (!open || event.key !== "Tab") return;
    const links = panelRef.current?.querySelectorAll<HTMLElement>("a[href]");
    const toggle = toggleRef.current;
    if (!links || links.length === 0 || !toggle) return;
    const last = links[links.length - 1];
    const active = document.activeElement;
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      toggle.focus();
    } else if (event.shiftKey && active === toggle) {
      event.preventDefault();
      last.focus();
    }
  };

  const close = () => setOpen(false);
  const ground = open ? INK : LIGHT;
  const ink = open ? LIGHT : INK;

  return (
    <>
      <header className="smm__bar" data-open={open} onKeyDown={trapTab}>
        <button
          ref={toggleRef}
          type="button"
          className="smm__toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <GearMark className="smm__gear" fill={ink} dotFill={ground} />
        </button>
        <Link className="smm__home" to="/" aria-label="CCDV — Home" onClick={close}>
          <CcdvPixelMark variant="inline" className="smm__pixel" fill={ink} />
        </Link>

        {/* The panel lives inside the sticky bar and hangs from its bottom edge
            (absolute), so it needs no fixed/sticky tricks of its own and adds no
            page height. */}
        {/* R1-FB001: always mounted so it can travel; `data-open` drives the
            panel's slide/fade and the gear's turn from this one state, and a
            closed panel is visibility:hidden (out of the tab order and the
            accessibility tree) once its closing transition has run. */}
        <nav
          ref={panelRef}
          id={panelId}
          className="smm__panel"
          aria-label="Menu"
          data-open={open}
        >
        <ul className="smm__routes">
          {ROUTES.map(({ label, to }) => {
            const current = to === "/studio";
            return (
              <li key={to}>
                <Link
                  className="smm__route"
                  to={to}
                  aria-current={current ? "page" : undefined}
                  onClick={close}
                >
                  <span>{label}</span>
                  <span className="smm__square" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>

        <section className="smm__ccos" aria-labelledby={`${panelId}-ccos`}>
          <h2 className="smm__ccos-title" id={`${panelId}-ccos`}>
            CC.OS
          </h2>
          <ul className="smm__systems">
            {SYSTEMS.map(({ label, to }) => (
              <li key={to}>
                <Link className="smm__system" to={to} onClick={close}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="smm__foot">
          {/* R2-FB003-16: the footer identity is Collapse Creative's mark (not the
              CCDV mark in the bar), small, in the light ink. The mark's geometry is
              the site's existing approximation (ContactIdentityMarks.tsx); the
              original path set is an OPEN item in the R2 report. */}
          <CollapseCreativeMark className="smm__brand" />
          <div className="smm__contact">
            <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
            <div>[ hello[@]collapsecreative.com ]</div>
            <div>
              [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
            </div>
          </div>
          <ul className="smm__legal">
            {LEGAL.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="smm__year">[ © 2026 ]</div>
        </div>
        </nav>
      </header>
    </>
  );
}
