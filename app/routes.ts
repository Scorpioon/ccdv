import { index, route, type RouteConfig } from "@react-router/dev/routes";
export default [
  index("./routes/home.tsx"),
  route("studio", "./routes/studio.tsx"),
  route("work", "./routes/work.tsx"),
  route("work/:slug", "./routes/workcase.tsx"),
  route("services", "./routes/services.tsx"),
  route("products", "./routes/products.tsx"),
  route("products/ccos", "./routes/products.ccos.tsx"),
  route("products/ccos/wrkops", "./routes/products.ccos.wrkops.tsx"),
  route("products/ccos/kaia", "./routes/products.ccos.kaia.tsx"),
  route("products/ccos/aethernos", "./routes/products.ccos.aethernos.tsx"),
  route("products/ccos/panoptes", "./routes/products.ccos.panoptes.tsx"),
  route("products/ccos/kron", "./routes/products.ccos.kron.tsx"),
  route("products/ccos/kairon", "./routes/products.ccos.kairon.tsx"),
  route("contact", "./routes/contact.tsx"),
] satisfies RouteConfig;
