import type { CSSProperties } from "react";
import { Link } from "react-router";
import { useTransitionLink } from "../GlobalShell";
import { CcosWordmark } from "../marks/CcosWordmark";
import { CcosHeroIcon, CcosSystemIcon } from "../marks/CcosArtwork";
import { CcosCoreMap } from "./CcosCoreMap";
import { CcosEcosystemArt, CcosLocalArt } from "./CcosArt";
import {
  CCOS_CORES,
  CCOS_INTRO,
  CCOS_LOCAL,
  CCOS_MODULAR,
  getCcosCore,
  type CcosCoreId,
} from "../../data/ccosContent";
import appFrame from "../../assets/ccos/aethernos-mini.webp";

/* The seven CC.OS slides (P2, PRODUCTS/CCOS.svg; the draft's 24 margins
   replaced by the site's, OPERATOR). Elements marked `data-spawn` come up in
   order (--i) when their slide arrives (CSS). Slides 3 and 6 share one
   selected core (OPERATOR); CC.OS itself is selected on load. */

const spawn = (i: number) => ({ "--i": i }) as CSSProperties;

/* 1 — the CC.OS lockup in the dark frame; the source's top-left chip is the
   way back to Products */
export function CcosHeroSlide() {
  const link = useTransitionLink();
  return (
    <div className="cc-frame cc-hero">
      <Link className="cc-back" {...link("/products")} data-spawn style={spawn(0)}>
        ← Products
      </Link>
      <h1 className="cc-hidden">CC.OS — Collapse Creative Operating System</h1>
      <CcosWordmark className="cc-hero__mark" />
    </div>
  );
}

/* 2 — the intro, centred */
export function CcosIntroSlide() {
  return (
    <div className="cc-frame cc-intro">
      <div className="cc-intro__copy" data-deck-scroll>
        {CCOS_INTRO.map((line, i) => (
          <p key={line} data-spawn style={spawn(i)}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/* 3 — the core map and what the selected core is for */
export function CcosMapSlide({ selected, onSelect }: { selected: CcosCoreId; onSelect: (id: CcosCoreId) => void }) {
  const core = getCcosCore(selected);
  return (
    <div className="cc-frame cc-split cc-map-slide" data-deck-scroll>
      <h2 className="cc-hidden" id="cc-map-title">
        The cores
      </h2>
      <div className="cc-box cc-map-slide__map" data-spawn style={spawn(0)}>
        <CcosCoreMap selected={selected} onSelect={onSelect} labelledBy="cc-map-title" />
      </div>
      <div className="cc-info" data-spawn style={spawn(1)}>
        <div className="cc-info__swap" key={core.id}>
          <p className="cc-info__label">Core:</p>
          <p className="cc-info__name">{core.name}</p>
          <p className="cc-info__label cc-info__label--gap">Keywords:</p>
          <p className="cc-info__text">{core.keywords}</p>
          <p className="cc-info__lead">{core.problems}</p>
        </div>
      </div>
    </div>
  );
}

/* 4 — modular: copy left, the cube cluster right */
export function CcosModularSlide() {
  return (
    <div className="cc-frame cc-split cc-statement" data-deck-scroll>
      <p className="cc-statement__copy" data-spawn style={spawn(0)}>
        {CCOS_MODULAR}
      </p>
      <div className="cc-box cc-statement__art" data-spawn style={spawn(1)}>
        <CcosEcosystemArt />
      </div>
    </div>
  );
}

/* 5 — local: the new illustration left, copy right (the source's order) */
export function CcosLocalSlide() {
  return (
    <div className="cc-frame cc-split cc-statement cc-statement--flip" data-deck-scroll>
      <div className="cc-box cc-statement__art" data-spawn style={spawn(0)}>
        <CcosLocalArt />
      </div>
      <p className="cc-statement__copy" data-spawn style={spawn(1)}>
        {CCOS_LOCAL}
      </p>
    </div>
  );
}

/* 6 — each product: the list (CC.OS and the six cores) and its detail */
export function CcosExplainerSlide({
  selected,
  onSelect,
}: {
  selected: CcosCoreId;
  onSelect: (id: CcosCoreId) => void;
}) {
  const core = getCcosCore(selected);
  return (
    <div className="cc-frame cc-explainer" data-spawn style={spawn(0)}>
      <div className="cc-explainer__list">
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
                onClick={() => onSelect(item.id)}
              >
                {item.id === "ccos" ? (
                  <CcosHeroIcon className="cc-explainer__icon" />
                ) : (
                  <CcosSystemIcon
                    className="cc-explainer__icon"
                    family={item.id === "kron" || item.id === "kairon" ? "thin" : "bold"}
                    gradientTo={item.color}
                  />
                )}
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="cc-explainer__detail" data-deck-scroll>
        <div className="cc-info__swap cc-explainer__body" key={core.id}>
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
    </div>
  );
}

/* 7 — the app itself (Frame 325, OPERATOR) */
export function CcosAppSlide() {
  return (
    <div className="cc-frame cc-app">
      <figure className="cc-app__figure" data-spawn style={spawn(0)}>
        <img
          className="cc-app__img"
          src={appFrame}
          width={3840}
          height={1980}
          alt="AETHERNOS Mini, the inbox organiser: an inbox of new items, the session log and the operations panel."
          loading="lazy"
          decoding="async"
        />
      </figure>
    </div>
  );
}
