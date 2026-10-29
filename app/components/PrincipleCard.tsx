/* A Studio principle entry: a bracketed label over body copy, laid on the
   R1.1 grid of 48/396/744/1092. The same text block is rendered two ways:

   - PrincipleCardStatic: a plain <article>, used for the four step columns
     inside a fan panel.
   - PrincipleSelectCard: the CP square. A real <button> that selects (and so
     opens) its paired fan. It carries no fill of its own; the one lilac
     square is drawn by the page behind the cards (`.cards__lilac`), so a
     card never looks "selected" by itself.

   Copy comes from app/data/studioPrinciples.ts. */

import type { PointerEvent, FocusEvent } from "react";

export interface PrincipleCardProps {
  label: string;
  body: readonly string[];
}

function CardText({ label, body }: PrincipleCardProps) {
  return (
    <>
      <span className="card__label">{label}</span>
      <span className="card__body">
        {body.map((paragraph) => (
          <span className="card__para" key={paragraph}>
            {paragraph}
          </span>
        ))}
      </span>
    </>
  );
}

export function PrincipleCardStatic(props: PrincipleCardProps) {
  return (
    <article className="card">
      <CardText {...props} />
    </article>
  );
}

export interface PrincipleSelectCardProps extends PrincipleCardProps {
  selected: boolean;
  panelId: string;
  onSelect: () => void;
  onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => void;
  onFocus: (event: FocusEvent<HTMLButtonElement>) => void;
}

export function PrincipleSelectCard({
  label,
  body,
  selected,
  panelId,
  onSelect,
  onPointerEnter,
  onFocus,
}: PrincipleSelectCardProps) {
  return (
    <button
      type="button"
      className="card card--select"
      aria-expanded={selected}
      aria-current={selected ? "true" : undefined}
      aria-controls={panelId}
      onClick={onSelect}
      onPointerEnter={onPointerEnter}
      onFocus={onFocus}
    >
      <CardText label={label} body={body} />
    </button>
  );
}
