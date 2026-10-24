import { SiteMasthead } from "../components/SiteMasthead";
import { SiteFooter } from "../components/SiteFooter";
import { ContactDirectory } from "../components/ContactDirectory";

export function meta() {
  return [{ title: "CCDV — Contact" }];
}

/* Contact is a 1239-tall artboard: 268.12 masthead, 31 stripe, 177 hero,
   31 stripe, 571 directory, 160 footer — the literal rect heights from
   pages_contact.svg, summing unchanged. See ContactDirectory for link
   provenance per `CTC-DEC-001`-`005`. */
export default function Contact() {
  return (
    <div className="r11 r11--contact">
      <SiteMasthead variant="contact" />

      <div className="section section--stripe" />

      <section className="section section--hero" aria-labelledby="contact-hero">
        <h1 className="band__label" id="contact-hero">
          [Contact]
        </h1>
        <span className="band__suffix" style={{ left: "calc(1065 * var(--u))" }}>
          &lt;3
        </span>
        <span className="hero__watermark" aria-hidden="true">
          collapse
        </span>
      </section>

      <div className="section section--stripe" />

      <section className="section section--contact-directory" aria-label="Contact directory">
        <ContactDirectory />
      </section>

      <SiteFooter />
    </div>
  );
}
