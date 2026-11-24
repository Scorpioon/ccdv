import { index, route, type RouteConfig } from "@react-router/dev/routes";
export default [
  index("./routes/home.tsx"),
  route("studio", "./routes/studio.tsx"),
  /* N3 W-A1: one Work workspace (the layout) for Featured, Archive and a case */
  route("work", "./routes/work.tsx", [
    index("./routes/work.featured.tsx"),
    route("archive", "./routes/work.archive.tsx"),
    route(":slug", "./routes/workcase.tsx"),
  ]),
  route("services", "./routes/services.tsx"),
  route("products", "./routes/products.tsx"),
  route("products/ccos", "./routes/products.ccos.tsx"),
  route("contact", "./routes/contact.tsx"),
] satisfies RouteConfig;
