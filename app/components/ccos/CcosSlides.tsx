import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { CcosWordmark } from "../marks/CcosWordmark";
import { CcosHeroIcon, CcosSystemIcon } from "../marks/CcosArtwork";
import { CcosCoreGlyph, CcosCoreMap } from "./CcosCoreMap";
import { CcosModularArt, CcosVaultArt } from "./CcosVoxelArt";
import {
  CCOS_CORES,
  CCOS_INTRO,
  CCOS_LOCAL,
  CCOS_MODULAR,
  getCcosCore,
  type CcosCoreId,
} from "../../data/ccosContent";

/* The CC.OS slides (P2, PRODUCTS/CCOS.svg). P2 CORR02 (OPERATOR): ground
   #141414, every fill #171717 with a soft radius (global.css); no grid; the
   content stays put while the strip slides. Slides 3 and 6 share one selected
   core; CC.OS itself is selected on load. P2 CORR03: slides 4 and 5 carry
   the operator's new voxel animations (CcosVoxelArt); slides 3 and 6 open a
   card on phones instead of scrolling under the diagram / the chips. */

/* 1 — the lockup, written in each time the hero arrives: the cube floats up,
   C C O S type in, the S's dot slides into the stop (CcosWordmark) */
export function CcosHeroSlide({ current }: { current: boolean }) {
  /* the first take plays from the first paint; each return replays it */
  const [take, setTake] = useState(current ? 1 : 0);
  const was = useRef(current);
  useEffect(() => {
    if (current && !was.current) setTake((n) => n + 1);
    was.current = current;
  }, [current]);
  return (
    <div className="cc-frame cc-hero">
      <h1 className="cc-hidden">CC.OS — Collapse Creative Operating System</h1>
      <CcosWordmark key={take} className="cc-hero__mark" play={take > 0} />
    </div>
  );
}

/* 2 — the intro, centred */
export function CcosIntroSlide() {
  return (
    <div className="cc-frame cc-intro" data-deck-scroll>
      <div className="cc-intro__copy">
        {CCOS_INTRO.map((line) => (
          <p key={line}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/* the desktop layout (>= 1024, the deck's breakpoint) */
function useWide() {
  /* N4 H2/H4: read the breakpoint on the first render; true when there is no window */
  const [wide, setWide] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setWide(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return wide;
}

/* N4 P-I C-03: a phone card is modal. What lies under it is `inert`, and Tab
   stays on its one control (the close button) instead of leaving the card */
const keepTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
  if (event.key === "Tab") event.preventDefault();
};

/* the phone card's close button (images 31, 32: a circled x) */
function CloseButton({ onClose, label }: { onClose: () => void; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  /* N4 H2/H4: the element that had focus before this button took it, and the latest close callback */
  const returnTo = useRef<Element | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  /* N4 H2/H4: an explicit close (the button or Escape) hands focus back; a plain unmount does not */
  const close = () => {
    const back = returnTo.current;
    onCloseRef.current();
    /* N4 P-I C-03: the opener sits under an `inert` layer until the card is
       gone, so focus it on the next frame, after the close has rendered */
    window.requestAnimationFrame(() => {
      if (back instanceof HTMLElement && back.isConnected) back.focus({ preventScroll: true });
    });
  };
  useEffect(() => {
    /* N4 H2/H4: remember the focus before this button takes it (keep the first value under strict-mode re-runs) */
    if (document.activeElement !== ref.current) returnTo.current = document.activeElement;
    ref.current?.focus({ preventScroll: true });
  }, []);
  /* N4 H2/H4: Escape closes while this button is mounted */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <button ref={ref} type="button" className="cc-close" aria-label={label} onClick={close}>
      <span aria-hidden="true">×</span>
    </button>
  );
}

/* P2 CORR03 (OPERATOR): on desktop the map walks the cores clockwise from
   WRKOPS while slide 3 is up — a click stops it for that visit, and each
   return starts it again from WRKOPS. The walk is the map's own; the shared
   selection (and so the explainer) changes only on a click. */
const CYCLE: CcosCoreId[] = ["wrkops", "kaia", "aethernos", "kron", "panoptes", "kairon"];
const CYCLE_MS = 4000;
/* phones: the other branches go and the two left blink, then the card */
const BLINK_MS = 1000;

/* 3 — the core map and what the selected core is for. Phones (image 32): the
   whole diagram first; a tap keeps CC.OS and that core, both blink, and a
   card opens over the slide and writes the core in, line by line; its x
   brings the diagram back. */
export function CcosMapSlide({
  current,
  reduced,
  selected,
  onSelect,
}: {
  current: boolean;
  reduced: boolean;
  selected: CcosCoreId;
  onSelect: (id: CcosCoreId) => void;
}) {
  const wide = useWide();
  const [cycling, setCycling] = useState(true);
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<"map" | "focus" | "card">("map");
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (current) {
      /* N4 P-I C-01: Tab into the map makes the slide current after the
         frame's onFocus stopped the walk; a focused map keeps it stopped */
      setCycling(!frameRef.current?.contains(document.activeElement));
      setStep(0);
    } else setStage("map");
  }, [current]);
  useEffect(() => {
    if (wide) setStage("map");
  }, [wide]);

  const walks = wide && cycling && !reduced;
  useEffect(() => {
    if (!walks || !current) return;
    const timer = window.setInterval(() => setStep((n) => (n + 1) % CYCLE.length), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [walks, current]);

  useEffect(() => {
    if (stage !== "focus") return;
    const timer = window.setTimeout(() => setStage("card"), BLINK_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);

  const pick = (id: CcosCoreId) => {
    onSelect(id);
    if (wide) setCycling(false);
    else setStage(reduced ? "card" : "focus");
  };

  const shown = walks ? CYCLE[step] : selected;
  const core = getCcosCore(wide ? shown : selected);
  const carded = !wide && stage === "card";
  /* N4 H2/H4: keyboard focus on the map stops the walk, as a click does */
  return (
    <div
      ref={frameRef}
      className="cc-frame cc-split cc-map-slide"
      data-deck-scroll
      data-stage={wide ? undefined : stage}
      onFocus={() => setCycling(false)}
    >
      <h2 className="cc-hidden" id="cc-map-title">
        The cores
      </h2>
      <div className="cc-box" inert={carded}>
        <CcosCoreMap
          selected={wide ? shown : stage === "map" ? null : selected}
          pressed={wide ? selected : undefined}
          focus={wide || stage === "map" ? null : selected}
          blink={stage === "focus"}
          onSelect={pick}
          labelledBy="cc-map-title"
        />
      </div>
      {carded ? (
        <div className="cc-card" role="dialog" aria-modal="true" aria-label={core.name} data-deck-scroll onKeyDown={keepTab}>
          <div className="cc-card__head">
            <CcosCoreGlyph id="ccos" className="cc-card__glyph" />
            {core.id === "ccos" ? null : <CcosCoreGlyph id={core.id} solid className="cc-card__glyph" />}
            <div className="cc-card__title">
              <p className="cc-info__label">Core:</p>
              <p className="cc-info__name">{core.name}</p>
            </div>
            <CloseButton label={`Close ${core.name}`} onClose={() => setStage("map")} />
          </div>
          <dl className="cc-card__body">
            {[
              ["Main Area:", core.area],
              ["Keywords:", core.keywords],
              ["What it fixes:", core.problems],
            ].map(([label, text], n) => (
              <div key={label} className="cc-card__row cc-type" style={{ "--k-line": n } as CSSProperties}>
                <dt className="cc-info__label">{label}</dt>
                <dd className={n === 0 ? "cc-info__area" : "cc-info__text"}>{text}</dd>
              </div>
            ))}
            <div className="cc-card__row cc-type" style={{ "--k-line": 3 } as CSSProperties}>
              <dt className="cc-hidden">About</dt>
              <dd className="cc-info__text">
                {core.description.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
      <div className="cc-info" inert={carded}>
        <dl className="cc-info__swap cc-info__list" key={core.id}>
          <div className="cc-info__row">
            <dt className="cc-info__label">Core</dt>
            <dd className="cc-info__name">{core.name}</dd>
          </div>
          <div className="cc-info__row">
            <dt className="cc-info__label">Keywords</dt>
            <dd className="cc-info__text">{core.keywords}</dd>
          </div>
          <div className="cc-info__row cc-info__row--lead">
            <dt className="cc-info__label">What it solves</dt>
            <dd className="cc-info__lead">{core.problems}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* 4 — modular: copy left, the art box right (P2 CORR03: the cores docking
   on CC.OS, CcosVoxelArt) */
export function CcosModularSlide({ current, reduced }: { current: boolean; reduced: boolean }) {
  return (
    <div className="cc-frame cc-split cc-statement" data-deck-scroll>
      <p className="cc-statement__copy">
        {CCOS_MODULAR}
      </p>
      <div className="cc-box cc-statement__art" aria-hidden="true">
        <CcosModularArt className="cc-statement__svg" active={current} reduced={reduced} />
      </div>
    </div>
  );
}

/* 5 — local: the art box left, copy right (the source order; P2 CORR03: the
   vault, CcosVoxelArt) */
export function CcosLocalSlide({ current, reduced }: { current: boolean; reduced: boolean }) {
  return (
    <div className="cc-frame cc-split cc-statement cc-statement--flip" data-deck-scroll>
      <div className="cc-box cc-statement__art" aria-hidden="true">
        <CcosVaultArt className="cc-statement__svg" active={current} reduced={reduced} />
      </div>
      <p className="cc-statement__copy">
        {CCOS_LOCAL}
      </p>
    </div>
  );
}

/* 6 — each product: the list (CC.OS and the six cores) and its detail, the
   detail given most of the width (CORR01: "let this table breathe").
   P2 CORR03 (OPERATOR, image 31): on phones the detail no longer scrolls under
   the chips (it trapped the deck); a tap opens a card that fits the screen
   over the blurred list — Core and Main Area, Keywords, the description, Dev
   State and Public Release — and its x closes it. */
export function CcosExplainerSlide({
  current,
  selected,
  onSelect,
}: {
  current: boolean;
  selected: CcosCoreId;
  onSelect: (id: CcosCoreId) => void;
}) {
  const wide = useWide();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!current || wide) setOpen(false);
  }, [current, wide]);
  const core = getCcosCore(selected);
  return (
    <div className="cc-frame cc-explainer" data-open={open || undefined}>
      {open ? (
        <div className="cc-excard">
          <div className="cc-card" role="dialog" aria-modal="true" aria-label={core.name} data-deck-scroll onKeyDown={keepTab}>
            <CloseButton label={`Close ${core.name}`} onClose={() => setOpen(false)} />
            <div className="cc-explainer__pair">
              <div>
                <p className="cc-info__label">Core:</p>
                <p className="cc-info__name">{core.name}</p>
              </div>
              <div>
                <p className="cc-info__label">Main Area:</p>
                <p className="cc-info__area">{core.area}</p>
              </div>
            </div>
            <div className="cc-card__row">
              <p className="cc-info__label">Keywords:</p>
              <p className="cc-info__text">{core.keywords}</p>
            </div>
            <div className="cc-card__row cc-info__text">
              {core.description.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="cc-explainer__pair cc-card__facts">
              <div>
                <p className="cc-info__label">Dev State:</p>
                <p className="cc-info__text">{core.state}</p>
              </div>
              <div>
                <p className="cc-info__label">Public Release:</p>
                <p className="cc-info__text">{core.release}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="cc-explainer__list" inert={open}>
        <CcosWordmark className="cc-explainer__mark" />
        <h2 className="cc-hidden" id="cc-products-title">
          The products
        </h2>
        <ul className="cc-explainer__items" aria-labelledby="cc-products-title">
          {CCOS_CORES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="cc-explainer__item"
                aria-pressed={item.id === selected}
                onClick={() => {
                  onSelect(item.id);
                  if (!wide) setOpen(true);
                }}
              >
                {item.id === "ccos" ? (
                  <CcosHeroIcon className="cc-explainer__icon" />
                ) : (
                  /* P2 CORR03 (OPERATOR): KAIRON and KRON match the suite */
                  <CcosSystemIcon className="cc-explainer__icon" gradientTo={item.color} />
                )}
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-explainer__detail" data-deck-scroll inert={open}>
        <div className="cc-info__swap cc-explainer__body" key={core.id}>
          <div className="cc-explainer__pair">
            <div>
              <p className="cc-info__label">Core</p>
              <p className="cc-info__name">{core.name}</p>
            </div>
            <div>
              <p className="cc-info__label">Main Area</p>
              <p className="cc-info__area">{core.area}</p>
            </div>
          </div>
          <div className="cc-explainer__text">
            {core.description.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="cc-explainer__pair cc-explainer__lists">
            <div>
              <p className="cc-info__label">[ Features ]</p>
              <ul>
                {core.features.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="cc-info__label">[ Roadmap ]</p>
              <ul>
                {core.roadmap.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="cc-explainer__pair cc-explainer__facts">
            <div>
              <p className="cc-info__label">Dev State</p>
              <p className="cc-info__text">{core.state}</p>
            </div>
            <div>
              <p className="cc-info__label">Public Release</p>
              <p className="cc-info__text">{core.release}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
