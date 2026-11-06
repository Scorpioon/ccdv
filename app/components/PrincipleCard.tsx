/* A Studio principle entry: a bracketed label over body copy, laid on the
   R1.1 grid of 48/396/744/1092. PrincipleCardStatic is a plain <article>:

   - the four step columns inside a fan panel, and
   - (MTG05 R4-B02, FBI-052) the four Core Principle squares. Those are
     informational only: no button, no tab stop, no aria-expanded and no
     coupling to the accordion. The earlier GF09-E selector (PrincipleSelectCard
     plus the `.cards__lilac` square behind it) is removed from Studio.

   Copy comes from app/data/studioPrinciples.ts. */

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
