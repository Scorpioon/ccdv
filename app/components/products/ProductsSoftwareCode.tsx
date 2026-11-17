import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Chip, ChipGear } from "../studio/studioMarks";
import { ProductsTopicArt } from "./ProductsArtwork";
import { PENDING, PRODUCTS_TOPICS } from "../../data/productsContent";

/* \\Our Software Code (PRODUCTS_v2.svg y1243.73..2076.8; phone
   PRODUCTS_responsive_v2.svg y585..1419).

   One set of four topic panels serves both layouts, so the content stays
   equivalent (OPERATOR D2). Desktop (D1): all four side by side — art box,
   green label chip, headline, body — and the tab list is not rendered (CSS).
   Phones: the chip and the four rows form a vertical tab list; only the
   selected panel shows, and its label chip is visually hidden (the row names
   it). Four squares under the panel mirror the selection; they duplicate the
   tabs, so they stay out of the tab order and the accessibility tree. */
export function ProductsSoftwareCode() {
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const last = PRODUCTS_TOPICS.length - 1;

  const select = (i: number, focus = false) => {
    setSelected(i);
    if (focus) tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[i]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (event.key in step) select((selected + step[event.key] + PRODUCTS_TOPICS.length) % PRODUCTS_TOPICS.length, true);
    else if (event.key === "Home") select(0, true);
    else if (event.key === "End") select(last, true);
    else return;
    event.preventDefault();
  };

  return (
    <section className="pv-code" aria-labelledby="pv-code-title">
      <Chip tone="lilac" as="h2" id="pv-code-title" className="pv-chip pv-code__title">
        {"\\\\Our Software Code"}
      </Chip>

      <div
        className="pv-code__tabs"
        role="tablist"
        aria-labelledby="pv-code-title"
        aria-orientation="vertical"
        ref={tabsRef}
        onKeyDown={onKeyDown}
      >
        {PRODUCTS_TOPICS.map((topic, i) => (
          <button
            key={topic.key}
            type="button"
            className="pv-code__tab"
            role="tab"
            id={`pv-tab-${topic.key}`}
            aria-selected={i === selected}
            aria-controls={`pv-topic-${topic.key}`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => select(i)}
          >
            <ChipGear className="chip__gear" />
            <span>{topic.label ?? PENDING}</span>
          </button>
        ))}
      </div>

      <div className="pv-code__topics">
        {PRODUCTS_TOPICS.map((topic, i) => (
          <div
            key={topic.key}
            className="pv-topic"
            role="tabpanel"
            id={`pv-topic-${topic.key}`}
            aria-labelledby={`pv-label-${topic.key}`}
            data-active={i === selected}
          >
            <div className="pv-topic__art">
              <ProductsTopicArt topic={topic.key} />
            </div>
            <Chip tone="lilac" as="h3" id={`pv-label-${topic.key}`} className="pv-chip pv-topic__label">
              {topic.label ?? PENDING}
            </Chip>
            <p className="pv-topic__headline" data-pending={topic.headline ? undefined : true}>
              {topic.headline ?? PENDING}
            </p>
            {topic.body.map((line) => (
              <p key={line} className="pv-topic__body">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="pv-code__pager" aria-hidden="true">
        {PRODUCTS_TOPICS.map((topic, i) => (
          <button
            key={topic.key}
            type="button"
            className="pv-code__page"
            tabIndex={-1}
            data-active={i === selected}
            onClick={() => select(i)}
          />
        ))}
      </div>
    </section>
  );
}
