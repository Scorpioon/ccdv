/* R2-FB003-07 / FB003-09: word-by-word entrance for a beat's copy.

   The words are real inline text with real spaces between them, so wrapping,
   long copy, selection and screen readers behave as for a plain paragraph. The
   `data-words` attribute is what the route's reveal observer watches: it adds
   `data-seen` the first time the paragraph is on screen, and the CSS (global.css,
   "word reveal") staggers each word's fade and small rise by `--i`, capped so a
   long paragraph never takes long. Without the observer (reduced motion, no JS)
   nothing is hidden and the paragraph is plain text. */
import type { CSSProperties, ElementType } from "react";

export function WordReveal({
  text,
  as: Tag = "p",
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={className} data-words="">
      {words.map((word, i) => (
        <span key={i}>
          <span className="wr__w" style={{ "--i": i } as CSSProperties}>
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
