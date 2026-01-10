import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("auth/callback", "routes/auth/callback.tsx"),
  route("auth/google", "routes/auth/GoogleAuth.tsx"),
  route("feed", "routes/pages/Homepage.tsx"),
  route("profile/:userId", "routes/profile.tsx"), // Add this dynamic route
] satisfies RouteConfig;
