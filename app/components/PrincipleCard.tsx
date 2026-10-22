/* A Studio principle entry. R1.1 shows the same four entries twice: once as
   300x293 filled purple cards (y947.12) and again further down as plain text
   columns on the panel (y1642.15), on the identical x grid of 48/396/744/1092.
   One component covers both; `.columns` in global.css drops the fill and lets
   the entry flow instead of sitting in a fixed card.

   Copy is reproduced verbatim from R1.1 and is editorially provisional —
   including "We belive" and the two truncated placeholder entries. */

export interface PrincipleCardProps {
  label: string;
  body: string;
}

export function PrincipleCard({ label, body }: PrincipleCardProps) {
  return (
    <article className="card">
      <span className="card__label">{label}</span>
      <p className="card__body">{body}</p>
    </article>
  );
}

export const PRINCIPLES: PrincipleCardProps[] = [
  {
    label: "[ Our own toolbelt ]",
    body: "We build our own tools and develop project specific tools. We take special care with UX/UI design",
  },
  {
    label: "[ Architecture Direction ]",
    body: "We put care into creating systems that gives ownership over automated tasks, leverages cognitive fatigue of repeating tasks.",
  },
  {
    label: "[ Core Principle ]",
    body: "We belive in software user ownership and able to",
  },
  {
    label: "[ Smthng smthing ]",
    body: "We belive in software user ownership and able to",
  },
];
