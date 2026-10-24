import { index, route, type RouteConfig } from "@react-router/dev/routes";
export default [
  index("./routes/home.tsx"),
  route("studio", "./routes/studio.tsx"),
  route("work", "./routes/work.tsx"),
  route("services", "./routes/services.tsx"),
] satisfies RouteConfig;
