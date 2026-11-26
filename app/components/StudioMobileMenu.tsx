import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link, useLocation } from "react-router";
import type { TransitionTarget } from "../motion/transitionCoordinator";
import { useTransitionLink } from "./GlobalShell";
import { GearMark } from "./marks/GearMark";
import { CcdvPixelMark } from "./marks/CcdvPixelMark";
import { CollapseCreativeLogo } from "./marks/CollapseCreativeLogo";
import { ProductsCcosIcon } from "./marks/CcosArtwork";

/* Operator-designed /studio mobile header + menu (M1: Frame 322 closed, Frame
   331 open; STUDIO_resp1/resp2). Studio only, phones only: both elements are
   display:none from 768px up (see the STUDIO-RESP M1 block in global.css), where
   the existing masthead stays in charge.

   Route order is the order drawn in Frame 331 (not the masthead's CELLS order).
   P2 (OPERATOR): the six CC.OS names are one "CC.OS" entry now — the core
   pages are gone and the CC.OS deck holds all six. Contact and
   legal lines are plain text exactly as in SiteFooter (no legal page exists, so
   none is linked). The gear is the open/close toggle; the pixel mark is Home. */

const ROUTES: { label: string; to: TransitionTarget }[] = [
  { label: "[Studio]", to: "/studio" },
  { label: "[Services]", to: "/services" },
  { label: "[Work]", to: "/work" },
  { label: "[Products]", to: "/products" },
  { label: "[Contact]", to: "/contact" },
];

const SYSTEMS: { label: string; to: string }[] = [
  { label: "CC.OS", to: "/products/ccos" },
];

/* N4 P-M (OPERATOR): Onlyfans is an inside joke. It links out and is attenuated
   to 50% in CSS (`.smm__joke`), so it reads as an easter egg. */
const LEGAL: { label: string; href?: string }[] = [
  { label: "Privacy" },
  { label: "Terms of use" },
  { label: "Legal" },
  { label: "Onlyfans", href: "https://matias.me/nsfw/" },
];

const LIGHT = "#F2F2F2";
const INK = "#141414";

/* Services R1: `current` marks another route as the page (default /studio, so
   Studio renders exactly as before). */
export function StudioMobileMenu({ current: currentRoute = "/studio" }: { current?: string } = {}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const location = useLocation();
  const link = useTransitionLink();
  const closedByRoute = useRef(false);

  /* focus: into the menu when it opens, back on the gear when it closes
     (not when a route change closed it: the new page takes focus) */
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    } else if (wasOpen.current && !closedByRoute.current) {
      toggleRef.current?.focus();
    }
    wasOpen.current = open;
    closedByRoute.current = false;
  }, [open]);

  /* N4 P-I A-03: any route change closes the menu, Back / Forward included
     (the bar outlives a swap between section pages) */
  useEffect(() => {
    closedByRoute.current = true;
    setOpen(false);
  }, [location.key]);

  /* N6 G1 F-M-06: a resize or rotation across the bar's breakpoint closes the
     menu, focus not sent back (the gear may be hidden). The section bar shows
     below 768; Work's (its .wv3p copy in global.css) below 1024. */
  useEffect(() => {
    const work = toggleRef.current?.closest(".wv3p");
    const query = window.matchMedia(work ? "(min-width: 1024px)" : "(min-width: 768px)");
    const onChange = () => {
      closedByRoute.current = true;
      setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

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
        {/* N5 BH2 (OPERATOR): menu links go through the coordinator; onNavigate closes the menu */}
        <Link className="smm__home" aria-label="CCDV — Home" {...link("/", { onNavigate: close })}>
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
            const current = to === currentRoute;
            const content = (
              <>
                <span>{label}</span>
                <span className="smm__square" aria-hidden="true" />
              </>
            );
            /* N4 P-I A-20: the current page is a plain entry, as in the desktop bar */
            return (
              <li key={to}>
                {current ? (
                  <span className="smm__route" aria-current="page">
                    {content}
                  </span>
                ) : (
                  <Link className="smm__route" {...link(to, { onNavigate: close })}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* P2 CORR03 (OPERATOR): the legacy "CC.OS" heading is gone — one
            CC.OS entry, the negative cube (black outer, for the light panel)
            beside it */}
        <section className="smm__ccos" aria-label="CC.OS">
          <ul className="smm__systems">
            {SYSTEMS.map(({ label, to }) => (
              <li key={to}>
                <Link className="smm__system" to={to} onClick={close}>
                  <ProductsCcosIcon className="smm__system-icon" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="smm__foot">
          {/* R2-FB003-16: the footer identity is Collapse Creative's mark (not the
              CCDV mark in the bar), small, in the light ink. R3 A5: the operator's
              own lockup (CollapseCreativeLogo.tsx, verbatim paths) replaces the
              approximate rings, in the logo box the M1 frame draws (x48, 144 wide). */}
          <CollapseCreativeLogo className="smm__brand" />
          <div className="smm__contact">
            <div>[ COLLAPSE CREATIVE : DEV UNIT ]</div>
            <div>[ hello[@]collapsecreative.com ]</div>
            <div>
              [ Part of <a href="https://collapsecreative.com">collapsecreative.com</a> ]
            </div>
          </div>
          <ul className="smm__legal">
            {LEGAL.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <a className="smm__joke" href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </li>
            ))}
          </ul>
          <div className="smm__year">[ © 2026 ]</div>
        </div>
        </nav>
      </header>
    </>
  );
}
