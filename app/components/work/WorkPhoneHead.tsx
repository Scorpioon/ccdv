import { StudioMobileMenu } from "../StudioMobileMenu";

/* N4 P-K (OPERATOR): the Work head on phones and tablets is the M1 menu bar
   (the gear opens the menu, the pixel mark is Home; the same bar as the other
   sections, Work current) over a rounded light card with the page's one h1,
   `CCDV:WORK`. It replaces the P-J card (gear, mark, `CC: DEV UNIT -> WORK`,
   section links). The desktop rail (WorkSidebar) is not used below 1024. */

export function WorkPhoneHead() {
  return (
    <>
      <StudioMobileMenu current="/work" />
      <div className="wv3p-head__card">
        <h1 className="wv3p-head__title">
          <span>CCDV:WORK</span>
        </h1>
      </div>
    </>
  );
}
