import { useEffect, useRef, useState } from "react";
import { CcosWordmark } from "../marks/CcosWordmark";
import { CcosHeroIcon, CcosSystemIcon } from "../marks/CcosArtwork";
import { CcosCoreMap } from "./CcosCoreMap";
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
   core; CC.OS itself is selected on load. The art boxes of slides 4 and 5 are
   empty until the operator supplies the new animations. */

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

/* 3 — the core map and what the selected core is for */
export function CcosMapSlide({ selected, onSelect }: { selected: CcosCoreId; onSelect: (id: CcosCoreId) => void }) {
  const core = getCcosCore(selected);
  return (
    <div className="cc-frame cc-split cc-map-slide" data-deck-scroll>
      <h2 className="cc-hidden" id="cc-map-title">
        The cores
      </h2>
      <div className="cc-box">
        <CcosCoreMap selected={selected} onSelect={onSelect} labelledBy="cc-map-title" />
      </div>
      <div className="cc-info">
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

/* 4 — modular: copy left, the art box right */
export function CcosModularSlide() {
  return (
    <div className="cc-frame cc-split cc-statement" data-deck-scroll>
      <p className="cc-statement__copy">
        {CCOS_MODULAR}
      </p>
      <div className="cc-box cc-statement__art" aria-hidden="true" />
    </div>
  );
}

/* 5 — local: the art box left, copy right (the source order) */
export function CcosLocalSlide() {
  return (
    <div className="cc-frame cc-split cc-statement cc-statement--flip" data-deck-scroll>
      <div className="cc-box cc-statement__art" aria-hidden="true" />
      <p className="cc-statement__copy">
        {CCOS_LOCAL}
      </p>
    </div>
  );
}

/* 6 — each product: the list (CC.OS and the six cores) and its detail, the
   detail given most of the width (CORR01: "let this table breathe") */
export function CcosExplainerSlide({
  selected,
  onSelect,
}: {
  selected: CcosCoreId;
  onSelect: (id: CcosCoreId) => void;
}) {
  const core = getCcosCore(selected);
  return (
    <div className="cc-frame cc-explainer">
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
