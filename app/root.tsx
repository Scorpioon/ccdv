import { useEffect, useRef, type ReactNode } from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigationType,
  useRouteError,
} from "react-router";
import { GlobalShell } from "./components/GlobalShell";
import gearFaviconUrl from "./assets/ccdv-gear-favicon.svg?no-inline";
/* N4 H7: hashed URL of the face tokens.css declares; preloaded so the first paint does not wait for the stylesheet */
import victorMonoSemiBold from "./assets/fonts/VictorMono-SemiBold.woff2?url";
import "./styles/tokens.css";
import "./styles/global.css";
/* H1 D1: the favicon is a hashed /assets/ file, so the prerendered head passes
   the stage script's /assets/-only href guard */
export function links() {
  return [
    { rel: "icon", type: "image/svg+xml", href: gearFaviconUrl },
    /* N4 H7: font preload (CORS-anonymous, as font preloads require) */
    { rel: "preload", href: victorMonoSemiBold, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  ];
}
/* H1 GH-A08: an unmatched URL (router 404) or a Response thrown while rendering
   (workcase.tsx); a raw Response fails isRouteErrorResponse, so both */
function isNotFound(error: unknown) {
  return (isRouteErrorResponse(error) || error instanceof Response) && error.status === 404;
}
/* H1 D2: SPA mode prerenders only the root, so this is index.html's title;
   each route's own meta replaces it after hydration (the leaf's meta wins) */
export function meta({ error }: { error?: unknown }) {
  /* N4 P-H A-16: index.html's default description (crawlers that run no JS see only this) */
  return [
    { title: !error ? "CCDV" : isNotFound(error) ? "CCDV — Page not found" : "CCDV — Error" },
    { name: "description", content: "Collapse Creative Development Unit — UX/UI, code and motion studio, part of Collapse Creative." },
  ];
}
/* H1 GH-A09/GH-E01: one document for the page, the hydrate fallback and the
   error view (React Router wraps all three in Layout), so the prerendered
   index.html carries the stylesheet, favicon and title. D7: the inline ink
   ground and theme colour paint before the stylesheet arrives. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#141414" />
        <style>{"html,body{background:#141414}"}</style>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function Root() {
  return (
    <GlobalShell />
  );
}
/* H1 D7: the ink ground is the loading state (replaces React Router's
   "Loading..." shell and its developer console.log) */
export function HydrateFallback() {
  return null;
}
/* H1 D3–D5: outside GlobalShell on purpose (a crashed shell must not take the
   error view with it); no masthead, no stack in the page. Focus moves to the
   heading only on an in-app arrival (PUSH / REPLACE), never on a hard load or
   Back / Forward (POP), as in GlobalShell. */
export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isNotFound(error);
  const navigationType = useNavigationType();
  const { key } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (navigationType !== "POP") heading.current?.focus({ preventScroll: true });
  }, [navigationType, key]);
  return (
    <main id="main-content" className="not-found">
      <h1 ref={heading} tabIndex={-1} className="not-found__title">
        {notFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="not-found__text">
        {notFound ? "This page doesn't exist or is no longer available." : "We couldn't load this page."}
      </p>
      <Link to="/" className="not-found__link">[ Home ]</Link>
    </main>
  );
}
