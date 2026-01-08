import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  route("verification", "routes/pages/VerificationPage.tsx"),
] satisfies RouteConfig;
