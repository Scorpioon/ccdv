import { useState } from "react";
import { ProductsCard, ProductsEmptySlot } from "../ProductsCard";
import { ProductsPanel } from "./ProductsPanel";
import { PRODUCTS, PRODUCTS_DEFAULT_OPEN, PRODUCTS_SLOTS } from "../../data/productsContent";

/* The Products rail (P1b CORR03, OPERATOR): eight slots; a product slot
   opens its panel and the panel drops below — on desktop under the whole
   rail, on phones (one column) right under the slot's row. One panel is open
   at a time; 01 is open on load and the open slot closes again on a second
   click. Every slot keeps its card and its panel together in one list item:
   on desktop the items are `display: contents`, so the cards fill the rail's
   first row and every panel is placed in one shared second row spanning it
   (global.css); on phones each item is a block, so its panel follows its
   row. A closed panel collapses to nothing and is hidden from assistive
   tech (visibility); the drop is a CSS height transition, instant under
   reduced motion. The empty frames (03, 05-08) are decoration. */
export function ProductsRail() {
  const [open, setOpen] = useState<string | null>(PRODUCTS_DEFAULT_OPEN);

  return (
    <ul className="pv-rail">
      {PRODUCTS_SLOTS.map((slot) => {
        const product = PRODUCTS.find((entry) => entry.index === slot);
        if (!product) {
          return (
            <li key={slot} className="pv-rail__empty" aria-hidden="true">
              <ProductsEmptySlot index={slot} />
            </li>
          );
        }
        const isOpen = open === slot;
        const panelId = `pv-panel-${slot}`;
        return (
          <li key={slot} className="pv-rail__slot">
            <ProductsCard
              index={product.index}
              label={product.label}
              kind={product.kind}
              status={product.status}
              open={isOpen}
              panelId={panelId}
              onToggle={() => setOpen(isOpen ? null : slot)}
            />
            <div className="pv-drop" id={panelId} data-open={isOpen}>
              <div className="pv-drop__inner">
                <ProductsPanel index={product.index} panel={product.panel} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
