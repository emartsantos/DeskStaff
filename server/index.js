import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useNavigate, useLocation, Link, useSearchParams, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as React from "react";
import { createContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, Sun, Moon, Loader2, AlertCircle, Mail, Lock, EyeOff, Eye, LogIn, AlertTriangle, MailCheck, XCircle, Info, UserX, ShieldAlert, MailWarning, CheckCircle, Key, Verified, RefreshCw, XIcon, Building, Search, Home, Bell, MessageCircle, Users, Camera, User, Edit, Shield, LogOut, X, Image, Video, Smile, Send, Clock, Globe, MoreHorizontal, Bookmark, Trash2, Heart, MessageSquare, Share2, BriefcaseBusiness, MapPin, Phone, Calendar, UserPlus, Check, Briefcase, CalendarDays, Award, Settings, FileText } from "lucide-react";
import { toast } from "sonner";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as DialogPrimitive from "@radix-ui/react-dialog";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders
    });
  }
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    let timeoutId = setTimeout(
      () => abort(),
      streamTimeout + 1e3
    );
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback2) {
              clearTimeout(timeoutId);
              timeoutId = void 0;
              callback2();
            }
          });
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          pipe(body);
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const ThemeContext = React.createContext(
  void 0
);
function ThemeProvider({ children }) {
  const [theme, setThemeState] = React.useState("light");
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setThemeState(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);
  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  return /* @__PURE__ */ jsx(ThemeContext.Provider, { value: { theme, toggleTheme, setTheme }, children });
}
const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === void 0) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
class CacheBustManager {
  static instance;
  version = Date.now();
  subscribers = [];
  constructor() {
  }
  static getInstance() {
    if (!CacheBustManager.instance) {
      CacheBustManager.instance = new CacheBustManager();
    }
    return CacheBustManager.instance;
  }
  getVersion() {
    return this.version;
  }
  bust() {
    this.version = Date.now();
    this.notifySubscribers();
  }
  subscribe(callback2) {
    this.subscribers.push(callback2);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback2);
    };
  }
  notifySubscribers() {
    this.subscribers.forEach((callback2) => callback2());
  }
  // Helper to add cache busting to any URL
  bustUrl(url) {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("_cb", this.version.toString());
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  // Helper to bust all Supabase storage URLs
  bustSupabaseUrl(url) {
    if (!url || !url.includes("supabase.co")) return url;
    return this.bustUrl(url);
  }
}
const cacheBust = CacheBustManager.getInstance();
const supabaseUrl = "https://zmkgfngbmyzewbkhxffe.supabase.co";
const supabaseAnonKey = "sb_publishable_QQR1p7r0-ZoxvQ6r0DR1gQ_pWSOebv8";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    // Global fetch options for cache control
    fetch: (input, init) => {
      const fetchInit = init ? { ...init } : {};
      if (!fetchInit.headers) {
        fetchInit.headers = {};
      }
      let headers;
      if (fetchInit.headers instanceof Headers) {
        headers = fetchInit.headers;
      } else if (typeof fetchInit.headers === "object") {
        headers = new Headers(fetchInit.headers);
      } else {
        headers = new Headers();
      }
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      headers.set("X-Cache-Bust", cacheBust.getVersion().toString());
      fetchInit.headers = headers;
      if (typeof input === "string" && input.includes("storage/v1/object")) {
        const bustedUrl = cacheBust.bustSupabaseUrl(input);
        return fetch(bustedUrl, fetchInit);
      }
      return fetch(input, fetchInit);
    }
  }
});
const bustGlobalCache = () => {
  cacheBust.bust();
};
const AuthContext = createContext(void 0);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          setUser(null);
          setUserProfile(null);
        } else if (session) {
          setUser(session.user);
          const { data: profile2, error: profileError } = await supabase.from("users").select("*").eq("id", session.user.id).single();
          if (profileError) {
            console.error("Profile fetch error:", profileError);
          } else {
            setUserProfile(profile2);
          }
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    getSession();
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        const { data: profile2, error: profileError } = await supabase.from("users").select("*").eq("id", session.user.id).single();
        if (profileError) {
          console.error("Profile fetch error on auth change:", profileError);
          setUserProfile(null);
        } else {
          setUserProfile(profile2);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value: { user, isLoading, userProfile }, children });
};
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsxs(ThemeProvider, {
    children: [/* @__PURE__ */ jsxs(AuthProvider, {
      children: [" ", /* @__PURE__ */ jsx(Outlet, {})]
    }), " "]
  });
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "button",
      "data-variant": variant,
      "data-size": size,
      className: cn(buttonVariants({ variant, size, className })),
      ...props
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
function Checkbox({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    CheckboxPrimitive.Root,
    {
      "data-slot": "checkbox",
      className: cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        CheckboxPrimitive.Indicator,
        {
          "data-slot": "checkbox-indicator",
          className: "grid place-content-center text-current transition-none",
          children: /* @__PURE__ */ jsx(CheckIcon, { className: "size-3.5" })
        }
      )
    }
  );
}
const registerIllustration = "/assets/login-illustration-mQR2nY1C.jpg";
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-title",
      className: cn("leading-none font-semibold", className),
      ...props
    }
  );
}
function CardDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-content",
      className: cn("px-6", className),
      ...props
    }
  );
}
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return /* @__PURE__ */ jsx(
    Button,
    {
      variant: "outline",
      size: "icon",
      onClick: toggleTheme,
      className: "rounded-full w-10 h-10 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 hover:scale-105 transition-transform border-gray-300 dark:border-gray-600",
      "aria-label": "Toggle theme",
      children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "h-5 w-5 text-yellow-500" }) : /* @__PURE__ */ jsx(Moon, { className: "h-5 w-5 text-gray-700" })
    }
  );
}
function AuthLayout({
  children,
  illustration,
  illustrationAlt = "Auth illustration",
  gradientFrom = "from-red-50",
  gradientTo = "to-neutral-100"
}) {
  const { theme } = useTheme();
  const illustrationSrc = illustration || "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070";
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-muted dark:bg-gray-900 px-4 transition-colors duration-300", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl py-0 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-4 right-4", children: /* @__PURE__ */ jsx(ThemeToggle, {}) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center px-8 md:px-12 py-8", children }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `hidden md:flex items-center justify-center h-full transition-all duration-500 ${theme === "dark" ? "bg-gradient-to-br from-gray-800 to-gray-900" : `bg-gradient-to-br ${gradientFrom} ${gradientTo}`}`,
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: illustrationSrc,
              alt: illustrationAlt,
              className: "h-full w-full object-cover transition-opacity duration-500"
            }
          )
        }
      )
    ] })
  ] }) });
}
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Alert({
  className,
  variant,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert",
      role: "alert",
      className: cn(alertVariants({ variant }), className),
      ...props
    }
  );
}
function AlertTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-title",
      className: cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      ),
      ...props
    }
  );
}
function AlertDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "alert-description",
      className: cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      ),
      ...props
    }
  );
}
function AuthChecker({
  children,
  requireAuth = true,
  redirectTo = "/"
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      const hasSession = !!session;
      if (!hasSession) {
        if (requireAuth) {
          console.log("No session found, redirecting to login");
          navigate("/", { replace: true });
          setIsLoading(false);
          return;
        } else {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }
      if (requireAuth) {
        const { data: userData, error: userError } = await supabase.from("users").select("id").eq("id", session.user.id).single();
        if (userError || !userData) {
          console.error("User not found in database:", userError);
          await supabase.auth.signOut();
          navigate("/", { replace: true });
          setIsLoading(false);
          return;
        }
        setUserId(session.user.id);
        setIsAuthenticated(true);
      } else {
        const userId2 = session.user.id;
        let redirectPath = "/profile";
        if (typeof redirectTo === "function") {
          redirectPath = redirectTo(userId2);
        } else if (redirectTo.includes(":userId")) {
          redirectPath = redirectTo.replace(":userId", userId2);
        } else {
          redirectPath = `${redirectTo}/${userId2}`;
        }
        navigate(redirectPath, { replace: true });
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Authentication error:", error);
      if (requireAuth) {
        navigate("/", { replace: true });
      }
      setIsLoading(false);
      return;
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1e3);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: /* @__PURE__ */ jsx(Loader2, { className: "h-12 w-12 animate-spin text-blue-600" }) });
  }
  if (!isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsx(Fragment, { children });
}
const login = UNSAFE_withComponentProps(function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  location.state?.from?.pathname || "/";
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const handleChange = (e) => {
    const {
      id,
      value,
      type,
      checked
    } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value
    }));
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = {
          ...prev
        };
        delete newErrors[id];
        return newErrors;
      });
    }
  };
  React.useEffect(() => {
    document.title = "DeskStaff - Login";
  }, []);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      });
      if (error) {
        console.error("Login error:", error);
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email address before logging in.");
        } else if (error.message.includes("rate limit")) {
          throw new Error("Too many attempts. Please try again in a few minutes.");
        } else {
          throw new Error(`Login failed: ${error.message}`);
        }
      }
      if (!data.user) {
        throw new Error("Login failed. Please try again.");
      }
      try {
        const {
          error: updateError
        } = await supabase.from("users").update({
          logged_in: true,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", data.user.id);
        if (updateError) {
          console.error("Error updating login status:", updateError);
        }
      } catch (updateError) {
        console.error("Error updating login status:", updateError);
      }
      if (formData.rememberMe && typeof window !== "undefined") {
        localStorage.setItem("rememberMe", "true");
      }
      toast.success("Login successful! Redirecting...");
      setTimeout(() => {
        navigate(`/profile/${data.user.id}`, {
          replace: true
        });
      }, 1e3);
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setErrors({
          submit: error.message
        });
      } else {
        setErrors({
          submit: "Login failed. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      const siteUrl = window.location.origin;
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/google`,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google sign in error:", error);
      if (error instanceof Error) {
        setErrors({
          submit: error.message
        });
      } else {
        setErrors({
          submit: "Google sign in failed. Please try again."
        });
      }
      setIsGoogleLoading(false);
    }
  };
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({
        email: "Please enter your email address to reset password"
      });
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setErrors({
        email: "Please enter a valid email address"
      });
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) throw error;
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const canSubmit = formData.email.includes("@") && formData.password.length > 0;
  return /* @__PURE__ */ jsx(AuthChecker, {
    requireAuth: false,
    redirectTo: "/profile/:userId",
    children: /* @__PURE__ */ jsx(AuthLayout, {
      illustration: registerIllustration,
      illustrationAlt: "Login illustration",
      gradientFrom: "from-blue-50",
      gradientTo: "to-indigo-100",
      children: /* @__PURE__ */ jsxs("div", {
        className: "w-full max-w-md",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "mb-8",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-2xl font-semibold tracking-tight dark:text-white",
            children: "Welcome Back"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-sm text-muted-foreground dark:text-gray-400",
            children: "Please enter your details to sign in."
          })]
        }), errors.submit && /* @__PURE__ */ jsxs(Alert, {
          variant: "destructive",
          className: "mb-6",
          children: [/* @__PURE__ */ jsx(AlertCircle, {
            className: "h-4 w-4"
          }), /* @__PURE__ */ jsx(AlertDescription, {
            children: errors.submit
          })]
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleSubmit,
          className: "space-y-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsx(Label, {
              htmlFor: "email",
              className: "dark:text-gray-300",
              children: "Email Address"
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Input, {
                id: "email",
                type: "email",
                placeholder: "you@example.com",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pl-10 ${errors.email ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.email,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), /* @__PURE__ */ jsx(Mail, {
                className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              })]
            }), errors.email && /* @__PURE__ */ jsxs("p", {
              className: "text-xs text-red-500 flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(AlertCircle, {
                className: "h-3 w-3"
              }), errors.email]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "password",
                className: "dark:text-gray-300",
                children: "Password"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                className: "text-sm text-primary hover:underline dark:text-primary-400",
                onClick: handleForgotPassword,
                disabled: isSubmitting,
                children: "Forgot password?"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Input, {
                id: "password",
                type: showPassword ? "text" : "password",
                placeholder: "••••••••",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pl-10 pr-10 ${errors.password ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.password,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), /* @__PURE__ */ jsx(Lock, {
                className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50",
                onClick: () => setShowPassword(!showPassword),
                disabled: isSubmitting,
                children: showPassword ? /* @__PURE__ */ jsx(EyeOff, {
                  className: "h-4 w-4"
                }) : /* @__PURE__ */ jsx(Eye, {
                  className: "h-4 w-4"
                })
              })]
            }), errors.password && /* @__PURE__ */ jsxs("p", {
              className: "text-xs text-red-500 flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(AlertCircle, {
                className: "h-3 w-3"
              }), errors.password]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex items-center space-x-2",
            children: [/* @__PURE__ */ jsx(Checkbox, {
              id: "rememberMe",
              checked: formData.rememberMe,
              onCheckedChange: (checked) => setFormData((prev) => ({
                ...prev,
                rememberMe: checked
              })),
              className: "mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary",
              disabled: isSubmitting
            }), /* @__PURE__ */ jsx(Label, {
              htmlFor: "rememberMe",
              className: "font-normal dark:text-gray-400",
              children: "Remember me for 30 days"
            })]
          }), /* @__PURE__ */ jsx(Button, {
            type: "submit",
            className: "w-full",
            size: "lg",
            disabled: isSubmitting || !canSubmit,
            children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(Loader2, {
                className: "h-4 w-4 animate-spin mr-2"
              }), "Signing in..."]
            }) : /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(LogIn, {
                className: "h-4 w-4 mr-2"
              }), "Sign In"]
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("div", {
              className: "absolute inset-0 flex items-center",
              children: /* @__PURE__ */ jsx("div", {
                className: "w-full border-t border-border dark:border-gray-700"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "relative flex justify-center text-xs uppercase",
              children: /* @__PURE__ */ jsx("span", {
                className: "bg-card dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400",
                children: "Or continue with"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-3",
            children: [/* @__PURE__ */ jsxs(Button, {
              type: "button",
              variant: "outline",
              size: "lg",
              className: "w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
              onClick: handleGoogleSignIn,
              disabled: isSubmitting || isGoogleLoading,
              children: [isGoogleLoading ? /* @__PURE__ */ jsx(Loader2, {
                className: "h-5 w-5 animate-spin"
              }) : /* @__PURE__ */ jsx("img", {
                src: "https://www.svgrepo.com/show/475656/google-color.svg",
                alt: "Google",
                className: "h-5 w-5"
              }), isGoogleLoading ? "Signing in..." : "Sign in with Google"]
            }), /* @__PURE__ */ jsxs(Button, {
              type: "button",
              variant: "outline",
              size: "lg",
              className: "w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
              disabled: isSubmitting,
              onClick: () => toast.info("GitHub sign in coming soon!"),
              children: [/* @__PURE__ */ jsx("img", {
                src: "https://www.svgrepo.com/show/475661/github-filled.svg",
                alt: "GitHub",
                className: "h-5 w-5"
              }), "Sign in with GitHub"]
            })]
          })]
        }), /* @__PURE__ */ jsxs("p", {
          className: "mt-8 text-center text-sm text-muted-foreground dark:text-gray-400",
          children: ["Don't have an account?", " ", /* @__PURE__ */ jsx(Link, {
            to: "/register",
            className: "text-primary font-medium hover:underline dark:text-primary-400",
            onClick: (e) => isSubmitting && e.preventDefault(),
            children: "Sign up here"
          })]
        })]
      })
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
function TooltipProvider({
  delayDuration = 0,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TooltipPrimitive.Provider,
    {
      "data-slot": "tooltip-provider",
      delayDuration,
      ...props
    }
  );
}
function Tooltip({
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsx(TooltipPrimitive.Root, { "data-slot": "tooltip", ...props }) });
}
function TooltipTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipPrimitive.Trigger, { "data-slot": "tooltip-trigger", ...props });
}
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}) {
  return /* @__PURE__ */ jsx(TooltipPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
    TooltipPrimitive.Content,
    {
      "data-slot": "tooltip-content",
      sideOffset,
      className: cn(
        "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsx(TooltipPrimitive.Arrow, { className: "bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" })
      ]
    }
  ) });
}
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }
      if (!session) {
        navigate("/", { replace: true });
        return;
      }
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("id", session.user.id).single();
      if (userError || !userData) {
        console.error("User not found in database:", userError);
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Authentication error:", error);
      navigate("/", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "h-12 w-12 animate-spin mx-auto text-blue-600" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 dark:text-gray-300", children: "Verifying authentication..." })
    ] }) });
  }
  if (!isAuthenticated) {
    return null;
  }
  return /* @__PURE__ */ jsx(AuthChecker, { requireAuth: true, redirectTo: "/", children });
}
const emailCheckCache = /* @__PURE__ */ new Map();
const CACHE_DURATION = 5 * 60 * 1e3;
const register = UNSAFE_withComponentProps(function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
    newsletter: false
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const [emailSuggestions, setEmailSuggestions] = React.useState([]);
  const [emailStatus, setEmailStatus] = React.useState({
    exists: false,
    email_verified: null
  });
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const disposableEmailDomains = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com", "yopmail.com", "throwawaymail.com", "fakeinbox.com", "temp-mail.org", "trashmail.com", "dispostable.com", "getairmail.com", "maildrop.cc", "tempmailaddress.com", "fake-mail.com", "mytemp.email", "tempemail.net"];
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    if (score <= 5) return "strong";
    return "very-strong";
  };
  const passwordStrength = calculatePasswordStrength(formData.password);
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password)
  };
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
  const strengthIndicators = {
    weak: {
      color: "bg-red-500",
      text: "Weak"
    },
    medium: {
      color: "bg-yellow-500",
      text: "Medium"
    },
    strong: {
      color: "bg-green-500",
      text: "Strong"
    },
    "very-strong": {
      color: "bg-emerald-600",
      text: "Very Strong"
    }
  };
  const checkEmailWithVerification = React.useCallback(async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailStatus({
        exists: false,
        email_verified: null
      });
      return {
        exists: false,
        email_verified: null
      };
    }
    const cached = emailCheckCache.get(normalizedEmail);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setEmailStatus({
        exists: cached.exists,
        email_verified: cached.email_verified,
        user_id: cached.user_id
      });
      return {
        exists: cached.exists,
        email_verified: cached.email_verified,
        user_id: cached.user_id
      };
    }
    setIsCheckingEmail(true);
    try {
      const {
        data: userData,
        error: usersError
      } = await supabase.from("users").select("id, email, email_verified").eq("email", normalizedEmail).maybeSingle();
      if (usersError) {
        console.error("Database query error:", usersError);
        const result2 = {
          exists: false,
          email_verified: null
        };
        emailCheckCache.set(normalizedEmail, {
          exists: false,
          email_verified: false,
          timestamp: Date.now()
        });
        setEmailStatus(result2);
        return result2;
      }
      const {
        data: authUsers,
        error: authError
      } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error("Auth users query error:", authError);
      }
      const existingAuthUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
      const isGoogleUser = existingAuthUser?.identities?.some((id) => id.provider === "google");
      let exists = !!userData || !!existingAuthUser;
      let email_verified = userData?.email_verified || false;
      const user_id = userData?.id || existingAuthUser?.id;
      if (isGoogleUser && !userData) {
        exists = true;
        email_verified = true;
      }
      const result = {
        exists,
        email_verified,
        user_id
      };
      emailCheckCache.set(normalizedEmail, {
        exists,
        email_verified,
        user_id,
        timestamp: Date.now()
      });
      setEmailStatus(result);
      setErrors((prev) => {
        const newErrors = {
          ...prev
        };
        delete newErrors.email;
        return newErrors;
      });
      return result;
    } catch (error) {
      console.error("Error checking email:", error);
      const result = {
        exists: false,
        email_verified: null
      };
      emailCheckCache.set(normalizedEmail, {
        exists: false,
        email_verified: false,
        timestamp: Date.now()
      });
      setEmailStatus(result);
      return result;
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);
  const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return {
        isValid: false,
        message: "Email is required"
      };
    }
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: "Please enter a valid email address"
      };
    }
    const domain = email.split("@")[1];
    if (domain && disposableEmailDomains.some((disposable) => domain.toLowerCase().includes(disposable.toLowerCase()))) {
      return {
        isValid: false,
        message: "Please use a permanent email address"
      };
    }
    return {
      isValid: true
    };
  };
  const debouncedEmailCheck = React.useRef();
  const handleChange = (e) => {
    const {
      id,
      value,
      type,
      checked
    } = e.target;
    if (id === "email") {
      setEmailStatus({
        exists: false,
        email_verified: null
      });
      emailCheckCache.delete(value.toLowerCase());
    }
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value
    }));
    if (id === "email") {
      const {
        isValid,
        message
      } = validateEmailFormat(value);
      if (!isValid && message) {
        setErrors((prev) => ({
          ...prev,
          email: message
        }));
        setEmailSuggestions([]);
      } else if (errors.email) {
        setErrors((prev) => {
          const newErrors = {
            ...prev
          };
          delete newErrors.email;
          delete newErrors.submit;
          return newErrors;
        });
        setEmailSuggestions([]);
      }
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }
      if (isValid) {
        debouncedEmailCheck.current = setTimeout(() => {
          checkEmailWithVerification(value);
        }, 800);
      }
    } else {
      if (errors[id]) {
        setErrors((prev) => {
          const newErrors = {
            ...prev
          };
          delete newErrors[id];
          return newErrors;
        });
      }
    }
  };
  React.useEffect(() => {
    document.title = "DeskStaff - Register";
  }, []);
  React.useEffect(() => {
    return () => {
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }
    };
  }, []);
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      const normalizedEmail = formData.email.toLowerCase();
      if (formData.email) {
        const {
          exists,
          email_verified
        } = await checkEmailWithVerification(normalizedEmail);
        if (exists) {
          if (email_verified === true) {
            toast.error("This email is already registered. Please log in instead.");
            setIsGoogleLoading(false);
            return;
          } else {
            toast.error("This email is registered but not verified. Please check your email or use the resend verification option above.");
            setIsGoogleLoading(false);
            return;
          }
        }
      }
      localStorage.setItem("google_signup_flow", "true");
      const siteUrl = window.location.origin;
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/google`,
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });
      if (error) {
        console.error("Google OAuth error:", error);
        throw new Error(`Google sign up failed: ${error.message}`);
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Google sign up failed. Please try again.");
      }
      setIsGoogleLoading(false);
    }
  };
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    const emailValidation = validateEmailFormat(formData.email);
    if (!emailValidation.isValid && emailValidation.message) {
      newErrors.email = emailValidation.message;
    }
    if (!newErrors.email && emailStatus.exists) {
      if (emailStatus.email_verified === true) {
        newErrors.email = "This email is already registered and verified. Please use a different email or try logging in.";
      } else if (emailStatus.email_verified === false) {
        newErrors.email = "This email is registered but not verified. Please check your email for the verification link or click below to resend.";
      }
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength === "weak") {
      newErrors.password = "Please use a stronger password";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.terms) {
      newErrors.terms = "You must agree to the terms and privacy policy";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const normalizedEmail = formData.email.toLowerCase();
    try {
      const {
        exists,
        email_verified,
        user_id
      } = await checkEmailWithVerification(normalizedEmail);
      if (exists) {
        if (email_verified === true) {
          toast.error("This email is already registered and verified. Please use a different email or try logging in.");
          return;
        } else if (email_verified === false) {
          if (typeof window !== "undefined" && user_id) {
            localStorage.setItem("pending_email", formData.email);
            localStorage.setItem("pending_user_id", user_id);
          }
          navigate("/auth/callback", {
            state: {
              email: formData.email,
              userId: user_id,
              message: "Your email is registered but not verified. Please verify your email to continue."
            }
          });
          return;
        }
      }
    } catch (error) {
      console.error("Final email check error:", error);
    }
    setIsSubmitting(true);
    setErrors({});
    try {
      const siteUrl = window.location.origin;
      const {
        data: authData,
        error: authError
      } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            newsletter_subscribed: formData.newsletter
          },
          emailRedirectTo: `${siteUrl}/auth/callback`
        }
      });
      if (authError) {
        console.error("Supabase auth error:", authError);
        if (authError.message.includes("User already registered")) {
          emailCheckCache.set(normalizedEmail, {
            exists: true,
            email_verified: null,
            timestamp: Date.now()
          });
          setEmailStatus({
            exists: true,
            email_verified: null
          });
          throw new Error("This email is already registered. Please use a different email or try logging in.");
        } else if (authError.message.includes("Password should be at least")) {
          throw new Error("Password is too weak. Please use a stronger password.");
        } else if (authError.message.includes("Invalid email")) {
          throw new Error("Please enter a valid email address.");
        } else if (authError.message.includes("rate limit")) {
          throw new Error("Too many attempts. Please try again in a few minutes.");
        } else {
          throw new Error(`Registration failed: ${authError.message}`);
        }
      }
      if (!authData.user) {
        throw new Error("Registration failed. Please try again.");
      }
      try {
        const {
          error: insertError
        } = await supabase.from("users").insert({
          id: authData.user.id,
          email: normalizedEmail,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          newsletter_subscribed: formData.newsletter,
          email_verified: false,
          // Explicitly set to false for new registrations
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (insertError) {
          console.error("Error inserting user into users table:", insertError);
          if (insertError.code === "23505") {
            const {
              error: updateError
            } = await supabase.from("users").update({
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
              newsletter_subscribed: formData.newsletter,
              email_verified: false,
              // Ensure it's false for unverified users
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("email", normalizedEmail);
            if (updateError) {
              console.error("Error updating user in users table:", updateError);
            }
          }
        } else {
          console.log("✅ User successfully added to users table with email_verified = false");
        }
      } catch (dbError) {
        console.error("Database insert/update error:", dbError);
      }
      try {
        const {
          data: userCheck
        } = await supabase.from("users").select("email_verified").eq("email", normalizedEmail).maybeSingle();
        if (!userCheck) {
          console.warn("User was not added to users table");
        } else {
          console.log("User verification status:", userCheck.email_verified);
        }
      } catch (verificationError) {
        console.error("Error verifying user status:", verificationError);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", formData.email);
        localStorage.setItem("pending_user_id", authData.user.id);
      }
      emailCheckCache.set(normalizedEmail, {
        exists: true,
        email_verified: false,
        user_id: authData.user.id,
        timestamp: Date.now()
      });
      toast.success("Registration successful! Please check your email to verify your account.");
      navigate("/auth/callback", {
        state: {
          email: formData.email,
          userId: authData.user.id,
          message: "Registration successful! Please check your email to verify your account."
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleResendVerification = async () => {
    if (!formData.email) return;
    setIsSubmitting(true);
    setErrors({});
    try {
      const {
        error
      } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", formData.email);
      }
      toast.success("Verification email resent! Please check your inbox.");
      navigate("/auth/callback", {
        state: {
          email: formData.email,
          message: "Verification email resent! Please check your inbox."
        }
      });
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Failed to resend verification email. Please try again.");
    }
  };
  const canSubmit = formData.terms && passwordsMatch && formData.password.length >= 8 && !errors.email && !emailStatus.exists && formData.email.includes("@");
  return /* @__PURE__ */ jsx(AuthChecker, {
    requireAuth: false,
    redirectTo: "/profile/:userId",
    children: /* @__PURE__ */ jsx(AuthLayout, {
      illustration: registerIllustration,
      illustrationAlt: "Registration illustration",
      gradientFrom: "from-blue-50",
      gradientTo: "to-indigo-100",
      children: /* @__PURE__ */ jsxs("div", {
        className: "w-full max-w-md",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "mb-8",
          children: [/* @__PURE__ */ jsx("h1", {
            className: "text-2xl font-semibold tracking-tight dark:text-white",
            children: "Create an Account"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-sm text-muted-foreground dark:text-gray-400",
            children: "Join us today! Please enter your details."
          })]
        }), errors.submit && /* @__PURE__ */ jsxs(Alert, {
          variant: "destructive",
          className: "mb-6",
          children: [/* @__PURE__ */ jsx(AlertCircle, {
            className: "h-4 w-4"
          }), /* @__PURE__ */ jsx(AlertDescription, {
            children: errors.submit
          })]
        }), emailStatus.exists && emailStatus.email_verified === false && /* @__PURE__ */ jsxs(Alert, {
          className: "mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
          children: [/* @__PURE__ */ jsx(AlertTriangle, {
            className: "h-4 w-4 text-amber-600"
          }), /* @__PURE__ */ jsx(AlertDescription, {
            className: "text-amber-800 dark:text-amber-300",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex flex-col gap-2",
              children: [/* @__PURE__ */ jsx("p", {
                children: "This email is registered but not verified."
              }), /* @__PURE__ */ jsxs(Button, {
                onClick: handleResendVerification,
                size: "sm",
                variant: "outline",
                className: "mt-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30",
                children: [/* @__PURE__ */ jsx(MailCheck, {
                  className: "h-4 w-4 mr-2"
                }), "Resend Verification Email"]
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs("form", {
          onSubmit: handleSubmit,
          className: "space-y-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "grid grid-cols-2 gap-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "firstName",
                className: "dark:text-gray-300",
                children: "First Name"
              }), /* @__PURE__ */ jsx(Input, {
                id: "firstName",
                type: "text",
                placeholder: "John",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.firstName ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.firstName,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), errors.firstName && /* @__PURE__ */ jsxs("p", {
                className: "text-xs text-red-500 flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(XCircle, {
                  className: "h-3 w-3"
                }), errors.firstName]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "lastName",
                className: "dark:text-gray-300",
                children: "Last Name"
              }), /* @__PURE__ */ jsx(Input, {
                id: "lastName",
                type: "text",
                placeholder: "Doe",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${errors.lastName ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.lastName,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), errors.lastName && /* @__PURE__ */ jsxs("p", {
                className: "text-xs text-red-500 flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(XCircle, {
                  className: "h-3 w-3"
                }), errors.lastName]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center",
              children: [/* @__PURE__ */ jsxs(Label, {
                htmlFor: "email",
                className: "dark:text-gray-300",
                children: ["Email Address", /* @__PURE__ */ jsx(TooltipProvider, {
                  children: /* @__PURE__ */ jsxs(Tooltip, {
                    children: [/* @__PURE__ */ jsx(TooltipTrigger, {
                      asChild: true,
                      children: /* @__PURE__ */ jsx("button", {
                        type: "button",
                        className: "ml-2",
                        children: /* @__PURE__ */ jsx(Info, {
                          className: "h-3 w-3 text-muted-foreground"
                        })
                      })
                    }), /* @__PURE__ */ jsx(TooltipContent, {
                      children: /* @__PURE__ */ jsx("p", {
                        className: "text-xs",
                        children: "Use a permanent email you have access to"
                      })
                    })]
                  })
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [isCheckingEmail && /* @__PURE__ */ jsx(Loader2, {
                  className: "h-3 w-3 animate-spin text-gray-500"
                }), emailStatus.exists && !isCheckingEmail && formData.email.includes("@") && /* @__PURE__ */ jsx("div", {
                  className: "flex items-center gap-1 text-xs",
                  children: emailStatus.email_verified === true ? /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx(UserX, {
                      className: "h-3 w-3 text-red-500"
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-red-500",
                      children: "✗ Email Already Exist"
                    })]
                  }) : emailStatus.email_verified === false ? /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx(ShieldAlert, {
                      className: "h-3 w-3 text-amber-500"
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-amber-500",
                      children: "⚠️ Not Verified"
                    })]
                  }) : /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx(UserX, {
                      className: "h-3 w-3 text-red-500"
                    }), /* @__PURE__ */ jsx("span", {
                      className: "text-red-500",
                      children: "Already Registered"
                    })]
                  })
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Input, {
                id: "email",
                type: "email",
                placeholder: "you@example.com",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${errors.email || emailStatus.exists ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.email,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), /* @__PURE__ */ jsx("div", {
                className: "absolute right-3 top-1/2 -translate-y-1/2",
                children: errors.email || emailStatus.exists ? /* @__PURE__ */ jsx(MailWarning, {
                  className: "h-4 w-4 text-red-500"
                }) : formData.email.includes("@") && !errors.email && !emailStatus.exists ? /* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-green-500"
                }) : null
              })]
            }), errors.email && /* @__PURE__ */ jsxs("p", {
              className: "text-xs text-red-500 flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(XCircle, {
                className: "h-3 w-3"
              }), errors.email]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "password",
                className: "dark:text-gray-300",
                children: "Password"
              }), formData.password && /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx("div", {
                  className: `h-2 w-12 rounded-full ${strengthIndicators[passwordStrength].color}`
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-xs font-medium dark:text-gray-300",
                  children: strengthIndicators[passwordStrength].text
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Input, {
                id: "password",
                type: showPassword ? "text" : "password",
                placeholder: "••••••••",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${errors.password ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.password,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50",
                onClick: () => setShowPassword(!showPassword),
                disabled: isSubmitting,
                children: showPassword ? /* @__PURE__ */ jsx(EyeOff, {
                  className: "h-4 w-4"
                }) : /* @__PURE__ */ jsx(Eye, {
                  className: "h-4 w-4"
                })
              })]
            }), errors.password && /* @__PURE__ */ jsxs("p", {
              className: "text-xs text-red-500 flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(XCircle, {
                className: "h-3 w-3"
              }), errors.password]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-1 mt-2",
              children: [/* @__PURE__ */ jsx("p", {
                className: "text-xs font-medium dark:text-gray-400",
                children: "Password must contain:"
              }), /* @__PURE__ */ jsx("div", {
                className: "space-y-1",
                children: Object.entries(passwordRequirements).map(([key, met]) => {
                  const labels = {
                    length: "At least 8 characters",
                    uppercase: "One uppercase letter (A-Z)",
                    lowercase: "One lowercase letter (a-z)",
                    number: "One number (0-9)",
                    special: "One special character (!@#$%^&*)"
                  };
                  return /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [met ? /* @__PURE__ */ jsx(CheckCircle, {
                      className: "h-3 w-3 text-green-500"
                    }) : /* @__PURE__ */ jsx(XCircle, {
                      className: "h-3 w-3 text-gray-400"
                    }), /* @__PURE__ */ jsx("span", {
                      className: `text-xs ${met ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}`,
                      children: labels[key]
                    })]
                  }, key);
                })
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "flex justify-between items-center",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "confirmPassword",
                className: "dark:text-gray-300",
                children: "Confirm Password"
              }), formData.confirmPassword && /* @__PURE__ */ jsx("span", {
                className: `text-xs font-medium ${passwordsMatch ? "text-green-600 dark:text-green-500" : "text-red-500"}`,
                children: passwordsMatch ? "✓ Passwords match" : "✗ Passwords don't match"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "relative",
              children: [/* @__PURE__ */ jsx(Input, {
                id: "confirmPassword",
                type: showConfirmPassword ? "text" : "password",
                placeholder: "••••••••",
                className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${errors.confirmPassword ? "border-red-500 dark:border-red-500" : ""}`,
                value: formData.confirmPassword,
                onChange: handleChange,
                disabled: isSubmitting,
                required: true
              }), /* @__PURE__ */ jsx("button", {
                type: "button",
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50",
                onClick: () => setShowConfirmPassword(!showConfirmPassword),
                disabled: isSubmitting,
                children: showConfirmPassword ? /* @__PURE__ */ jsx(EyeOff, {
                  className: "h-4 w-4"
                }) : /* @__PURE__ */ jsx(Eye, {
                  className: "h-4 w-4"
                })
              })]
            }), errors.confirmPassword && /* @__PURE__ */ jsxs("p", {
              className: "text-xs text-red-500 flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(XCircle, {
                className: "h-3 w-3"
              }), errors.confirmPassword]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsx("div", {
              className: `space-y-2 rounded-lg ${errors.terms ? "bg-red-50 dark:bg-red-900/20" : ""}`,
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex items-center space-x-2",
                children: [/* @__PURE__ */ jsx("div", {
                  className: "flex-0 items-center",
                  children: /* @__PURE__ */ jsx(Checkbox, {
                    id: "terms",
                    checked: formData.terms,
                    onCheckedChange: (checked) => setFormData((prev) => ({
                      ...prev,
                      terms: checked
                    })),
                    className: `mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary ${errors.terms ? "border-red-500 dark:border-red-500" : ""}`,
                    disabled: isSubmitting
                  })
                }), /* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsxs(Label, {
                    htmlFor: "terms",
                    className: "font-normal dark:text-gray-400",
                    children: ["I agree to the", " ", /* @__PURE__ */ jsx(Link, {
                      to: "/terms",
                      className: "text-primary hover:underline dark:text-primary-400",
                      onClick: (e) => isSubmitting && e.preventDefault(),
                      children: "Terms"
                    }), " ", "and", " ", /* @__PURE__ */ jsx(Link, {
                      to: "/privacy",
                      className: "text-primary hover:underline dark:text-primary-400",
                      onClick: (e) => isSubmitting && e.preventDefault(),
                      children: "Privacy Policy"
                    })]
                  }), errors.terms && /* @__PURE__ */ jsxs("p", {
                    className: "text-xs text-red-500 flex items-center gap-1 mt-1",
                    children: [/* @__PURE__ */ jsx(XCircle, {
                      className: "h-3 w-3"
                    }), errors.terms]
                  })]
                })]
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center space-x-2",
              children: [/* @__PURE__ */ jsx(Checkbox, {
                id: "newsletter",
                checked: formData.newsletter,
                onCheckedChange: (checked) => setFormData((prev) => ({
                  ...prev,
                  newsletter: checked
                })),
                className: "mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary",
                disabled: isSubmitting
              }), /* @__PURE__ */ jsx(Label, {
                htmlFor: "newsletter",
                className: "font-normal dark:text-gray-400",
                children: "Subscribe to newsletter for updates and offers"
              })]
            })]
          }), /* @__PURE__ */ jsx(Button, {
            type: "submit",
            className: "w-full",
            size: "lg",
            disabled: isSubmitting || !canSubmit,
            children: isSubmitting ? /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsx(Loader2, {
                className: "h-4 w-4 animate-spin mr-2"
              }), "Creating Account..."]
            }) : "Create Account"
          }), /* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("div", {
              className: "absolute inset-0 flex items-center",
              children: /* @__PURE__ */ jsx("div", {
                className: "w-full border-t border-border dark:border-gray-700"
              })
            }), /* @__PURE__ */ jsx("div", {
              className: "relative flex justify-center text-xs uppercase",
              children: /* @__PURE__ */ jsx("span", {
                className: "bg-card dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400",
                children: "Or continue with"
              })
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-3",
            children: [/* @__PURE__ */ jsxs(Button, {
              type: "button",
              variant: "outline",
              size: "lg",
              className: "w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
              onClick: handleGoogleSignUp,
              disabled: isSubmitting || isGoogleLoading,
              children: [isGoogleLoading ? /* @__PURE__ */ jsx(Loader2, {
                className: "h-5 w-5 animate-spin"
              }) : /* @__PURE__ */ jsx("img", {
                src: "https://www.svgrepo.com/show/475656/google-color.svg",
                alt: "Google",
                className: "h-5 w-5"
              }), isGoogleLoading ? "Signing in..." : "Sign up with Google"]
            }), /* @__PURE__ */ jsxs(Button, {
              type: "button",
              variant: "outline",
              size: "lg",
              className: "w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
              disabled: isSubmitting,
              onClick: () => toast.info("GitHub sign up coming soon!"),
              children: [/* @__PURE__ */ jsx("img", {
                src: "https://www.svgrepo.com/show/475661/github-filled.svg",
                alt: "GitHub",
                className: "h-5 w-5"
              }), "Sign up with GitHub"]
            })]
          })]
        }), /* @__PURE__ */ jsxs("p", {
          className: "mt-8 text-center text-sm text-muted-foreground dark:text-gray-400",
          children: ["Already have an account?", " ", /* @__PURE__ */ jsx(Link, {
            to: "/",
            className: "text-primary font-medium hover:underline dark:text-primary-400",
            onClick: (e) => isSubmitting && e.preventDefault(),
            children: "Sign in here"
          })]
        })]
      })
    })
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: register
}, Symbol.toStringTag, { value: "Module" }));
function Progress({
  className,
  value,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    ProgressPrimitive.Root,
    {
      "data-slot": "progress",
      className: cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(
        ProgressPrimitive.Indicator,
        {
          "data-slot": "progress-indicator",
          className: "bg-primary h-full w-full flex-1 transition-all",
          style: { transform: `translateX(-${100 - (value || 0)}%)` }
        }
      )
    }
  );
}
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    SeparatorPrimitive.Root,
    {
      "data-slot": "separator",
      decorative,
      orientation,
      className: cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      ),
      ...props
    }
  );
}
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "badge",
      className: cn(badgeVariants({ variant }), className),
      ...props
    }
  );
}
const callback = UNSAFE_withComponentProps(function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(null);
  const [emailConfirmationData, setEmailConfirmationData] = useState(null);
  const [progress, setProgress] = useState(0);
  const getEmail = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pending_email") || "";
    }
    return "";
  };
  const clearPendingData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_email");
      localStorage.removeItem("pending_user_id");
    }
  };
  const checkEmailVerifiedStatus = async (userEmail) => {
    try {
      if (!userEmail) return false;
      const {
        data,
        error
      } = await supabase.from("users").select("email_verified").eq("email", userEmail.toLowerCase()).maybeSingle();
      if (error || !data) {
        console.error("Error checking email_verified:", error);
        return false;
      }
      return data.email_verified === true;
    } catch (error) {
      console.error("Exception checking email_verified:", error);
      return false;
    }
  };
  const updateEmailVerifiedToTrue = async (userEmail) => {
    try {
      const {
        error
      } = await supabase.from("users").update({
        email_verified: true,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("email", userEmail.toLowerCase());
      if (error) {
        console.error("Error updating email_verified:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Exception updating email_verified:", error);
      return false;
    }
  };
  const checkEmailConfirmedInAuth = async () => {
    try {
      const {
        data: {
          session
        },
        error
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        return false;
      }
      return session?.user?.email_confirmed_at !== null;
    } catch (error) {
      console.error("Exception checking auth confirmation:", error);
      return false;
    }
  };
  const processEmailVerification = async (userEmail) => {
    try {
      setStatus("processing");
      setMessage("Processing email verification...");
      setProgress(30);
      const isConfirmedInAuth = await checkEmailConfirmedInAuth();
      setProgress(60);
      const isVerifiedInDB = await checkEmailVerifiedStatus(userEmail);
      setProgress(80);
      setEmailConfirmationData({
        confirmedInAuth: isConfirmedInAuth,
        verifiedInDB: isVerifiedInDB
      });
      if (isConfirmedInAuth) {
        const updated = await updateEmailVerifiedToTrue(userEmail);
        if (updated) {
          const isNowVerified = await checkEmailVerifiedStatus(userEmail);
          setProgress(100);
          if (isNowVerified) {
            setEmailVerified(true);
            setStatus("verified");
            setMessage("Email verification completed successfully!");
            clearPendingData();
          } else {
            setEmailVerified(false);
            setStatus("error");
            setMessage("Verification completed but database update failed.");
          }
        } else {
          setEmailVerified(false);
          setStatus("error");
          setMessage("Failed to update verification status.");
        }
      } else {
        setEmailVerified(false);
        setStatus("not_verified");
        setMessage("Email verification link clicked, but confirmation is still pending.");
      }
    } catch (error) {
      console.error("Error processing email verification:", error);
      setStatus("error");
      setMessage("An error occurred while processing email verification.");
    }
  };
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const userEmail = location.state?.email || getEmail();
        if (!userEmail) {
          setStatus("error");
          setMessage("No email found. Please try registering again.");
          return;
        }
        setEmail(userEmail);
        const hash = window.location.hash;
        const isFromEmailLink = hash.includes("type=signup") || hash.includes("token=");
        if (isFromEmailLink) {
          await processEmailVerification(userEmail);
        } else {
          setStatus("loading");
          setMessage("Checking verification status...");
          setProgress(50);
          const isVerified = await checkEmailVerifiedStatus(userEmail);
          setProgress(100);
          if (isVerified) {
            setEmailVerified(true);
            setStatus("verified");
            setMessage("Your email is already verified!");
            clearPendingData();
          } else {
            setEmailVerified(false);
            setStatus("not_verified");
            setMessage("Email not verified yet.");
          }
        }
      } catch (error) {
        console.error("Callback error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };
    const timer = setTimeout(() => {
      handleCallback();
    }, 1e3);
    return () => clearTimeout(timer);
  }, [location]);
  const handleCheckStatus = async () => {
    if (!email) return;
    setStatus("loading");
    setMessage("Checking verification status...");
    setProgress(50);
    try {
      const isVerified = await checkEmailVerifiedStatus(email);
      setProgress(100);
      if (isVerified) {
        setEmailVerified(true);
        setStatus("verified");
        setMessage("Email verified successfully!");
        clearPendingData();
      } else {
        setEmailVerified(false);
        setStatus("not_verified");
        setMessage("Email not verified yet.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to check verification status");
    }
  };
  const handleResendVerification = async () => {
    if (!email) return;
    setStatus("loading");
    setMessage("Sending verification email...");
    try {
      const {
        error
      } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      setStatus("not_verified");
      setMessage(`Verification email sent to ${email}. Please check your inbox.`);
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("Failed to resend verification email");
    }
  };
  const handleGoToLogin = () => {
    clearPendingData();
    navigate("/login", {
      state: {
        email,
        verified: status === "verified",
        message: status === "verified" ? "Email verified successfully! You can now log in." : void 0
      }
    });
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8",
    children: /* @__PURE__ */ jsx(Card, {
      className: "w-full max-w-lg p-8 shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm",
      children: /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center justify-center space-y-8",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "text-center space-y-2",
          children: [/* @__PURE__ */ jsx("div", {
            className: "inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg",
            children: /* @__PURE__ */ jsx(Key, {
              className: "h-8 w-8 text-white"
            })
          }), /* @__PURE__ */ jsx("h1", {
            className: "text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400",
            children: "Email Verification"
          }), /* @__PURE__ */ jsx("p", {
            className: "text-gray-600 dark:text-gray-300 text-lg",
            children: email && `Verifying: ${email}`
          })]
        }), /* @__PURE__ */ jsx(Separator, {
          className: "w-full"
        }), /* @__PURE__ */ jsxs("div", {
          className: "w-full space-y-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [(status === "loading" || status === "processing") && /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex justify-between text-sm",
                children: [/* @__PURE__ */ jsx("span", {
                  className: "text-gray-600 dark:text-gray-300",
                  children: "Processing..."
                }), /* @__PURE__ */ jsxs("span", {
                  className: "font-medium",
                  children: [progress, "%"]
                })]
              }), /* @__PURE__ */ jsx(Progress, {
                value: progress,
                className: "h-2"
              })]
            }), /* @__PURE__ */ jsx("div", {
              className: "flex items-center justify-center",
              children: /* @__PURE__ */ jsxs("div", {
                className: `relative ${status === "processing" || status === "loading" ? "animate-pulse" : ""}`,
                children: [/* @__PURE__ */ jsx("div", {
                  className: `h-24 w-24 rounded-full flex items-center justify-center shadow-lg ${status === "verified" ? "bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800" : status === "not_verified" ? "bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-800" : status === "error" ? "bg-gradient-to-br from-red-100 to-rose-100 border-4 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:border-red-800" : "bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-800"}`,
                  children: status === "loading" || status === "processing" ? /* @__PURE__ */ jsx(Loader2, {
                    className: "h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin"
                  }) : status === "verified" ? /* @__PURE__ */ jsx(Verified, {
                    className: "h-12 w-12 text-green-600 dark:text-green-400"
                  }) : status === "not_verified" ? /* @__PURE__ */ jsx(AlertTriangle, {
                    className: "h-12 w-12 text-amber-600 dark:text-amber-400"
                  }) : /* @__PURE__ */ jsx(XCircle, {
                    className: "h-12 w-12 text-red-600 dark:text-red-400"
                  })
                }), /* @__PURE__ */ jsx("div", {
                  className: "absolute -bottom-2 left-1/2 -translate-x-1/2",
                  children: /* @__PURE__ */ jsxs(Badge, {
                    variant: status === "verified" ? "default" : status === "not_verified" ? "secondary" : status === "error" ? "destructive" : "outline",
                    className: "px-3 py-1 font-medium",
                    children: [status === "loading" && "Checking", status === "processing" && "Processing", status === "verified" && "Verified", status === "not_verified" && "Not Verified", status === "error" && "Error"]
                  })
                })]
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "text-center space-y-2",
              children: [/* @__PURE__ */ jsxs("h2", {
                className: "text-xl font-semibold text-gray-900 dark:text-white",
                children: [status === "loading" && "Checking Verification Status", status === "processing" && "Processing Verification", status === "verified" && "Email Verified Successfully!", status === "not_verified" && "Email Verification Required", status === "error" && "Verification Failed"]
              }), /* @__PURE__ */ jsx("p", {
                className: "text-gray-600 dark:text-gray-300 text-sm leading-relaxed",
                children: message
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-3 pt-4",
            children: [status === "verified" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs(Button, {
                onClick: handleGoToLogin,
                className: "w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-5 w-5 mr-2"
                }), "Continue to Login"]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex gap-3",
                children: [/* @__PURE__ */ jsxs(Button, {
                  onClick: handleCheckStatus,
                  variant: "outline",
                  className: "flex-1",
                  children: [/* @__PURE__ */ jsx(RefreshCw, {
                    className: "h-4 w-4 mr-2"
                  }), "Check Again"]
                }), /* @__PURE__ */ jsx(Button, {
                  onClick: () => navigate("/"),
                  variant: "ghost",
                  className: "flex-1",
                  children: "Go Home"
                })]
              })]
            }), status === "not_verified" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs(Button, {
                onClick: handleResendVerification,
                className: "w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg",
                children: [/* @__PURE__ */ jsx(Mail, {
                  className: "h-5 w-5 mr-2"
                }), "Resend Verification Email"]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex gap-3",
                children: [/* @__PURE__ */ jsxs(Button, {
                  onClick: handleCheckStatus,
                  variant: "outline",
                  className: "flex-1",
                  children: [/* @__PURE__ */ jsx(RefreshCw, {
                    className: "h-4 w-4 mr-2"
                  }), "Check Status"]
                }), /* @__PURE__ */ jsx(Button, {
                  onClick: () => navigate("/login"),
                  variant: "ghost",
                  className: "flex-1",
                  children: "Go to Login"
                })]
              })]
            }), status === "error" && /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs(Button, {
                onClick: handleCheckStatus,
                className: "w-full h-12 text-base font-medium",
                children: [/* @__PURE__ */ jsx(RefreshCw, {
                  className: "h-5 w-5 mr-2"
                }), "Try Again"]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex gap-3",
                children: [/* @__PURE__ */ jsx(Button, {
                  onClick: () => navigate("/register"),
                  variant: "outline",
                  className: "flex-1",
                  children: "Register Again"
                }), /* @__PURE__ */ jsx(Button, {
                  onClick: () => navigate("/"),
                  variant: "ghost",
                  className: "flex-1",
                  children: "Go Home"
                })]
              })]
            }), status === "processing" && /* @__PURE__ */ jsxs(Button, {
              disabled: true,
              className: "w-full h-12",
              children: [/* @__PURE__ */ jsx(Loader2, {
                className: "h-5 w-5 mr-2 animate-spin"
              }), "Processing Verification..."]
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "pt-6 border-t",
            children: /* @__PURE__ */ jsxs(Alert, {
              className: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
              children: [/* @__PURE__ */ jsx(MailCheck, {
                className: "h-4 w-4 text-blue-600"
              }), /* @__PURE__ */ jsx(AlertTitle, {
                className: "text-blue-800 dark:text-blue-300",
                children: "Need help?"
              }), /* @__PURE__ */ jsx(AlertDescription, {
                className: "text-blue-700 dark:text-blue-400 text-sm",
                children: /* @__PURE__ */ jsxs("ul", {
                  className: "space-y-1 mt-1",
                  children: [/* @__PURE__ */ jsx("li", {
                    children: "• Check your spam folder for the verification email"
                  }), /* @__PURE__ */ jsx("li", {
                    children: "• Make sure you clicked the link in the verification email"
                  }), /* @__PURE__ */ jsx("li", {
                    children: "• Verification links expire after 24 hours"
                  })]
                })
              })]
            })
          })]
        })]
      })
    })
  });
});
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: callback
}, Symbol.toStringTag, { value: "Module" }));
const GoogleAuth = UNSAFE_withComponentProps(function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const {
          data: {
            session
          },
          error: authError
        } = await supabase.auth.getSession();
        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }
        if (!session?.user) {
          throw new Error("No user session found");
        }
        const user = session.user;
        const userEmail = user.email?.toLowerCase();
        const googleSignupFlow = localStorage.getItem("google_signup_flow");
        localStorage.removeItem("google_signup_flow");
        if (!userEmail) {
          throw new Error("No email found from Google");
        }
        const {
          data: existingUser,
          error: checkError
        } = await supabase.from("users").select("id, email, email_verified").eq("email", userEmail).maybeSingle();
        if (checkError) {
          console.error("Error checking user:", checkError);
        }
        if (existingUser) {
          if (!existingUser.email_verified) {
            await supabase.from("users").update({
              email_verified: true,
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("id", existingUser.id);
          }
          navigate("/profile/" + user.id, {
            replace: true,
            state: {
              message: "Successfully logged in!"
            }
          });
          return;
        }
        if (googleSignupFlow === "true") {
          const {
            error: insertError
          } = await supabase.from("users").insert({
            id: user.id,
            email: userEmail,
            first_name: user.user_metadata?.given_name || "",
            last_name: user.user_metadata?.family_name || "",
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
            email_verified: true,
            // Google emails are verified
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          });
          if (insertError) {
            console.error("Error inserting Google user:", insertError);
          }
          navigate("/dashboard", {
            replace: true,
            state: {
              message: "Registration successful!"
            }
          });
        } else {
          await supabase.auth.signOut();
          setError("No account found with this Google email. Please register first.");
          setLoading(false);
        }
      } catch (error2) {
        console.error("Callback error:", error2);
        setError(error2 instanceof Error ? error2.message : "An error occurred");
        setLoading(false);
      }
    };
    handleCallback();
  }, [navigate]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen flex items-center justify-center",
      children: /* @__PURE__ */ jsxs("div", {
        className: "text-center",
        children: [/* @__PURE__ */ jsx(Loader2, {
          className: "h-8 w-8 animate-spin mx-auto text-primary"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-4 text-muted-foreground",
          children: "Processing Google sign in..."
        })]
      })
    });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen flex items-center justify-center p-4",
      children: /* @__PURE__ */ jsxs("div", {
        className: "w-full max-w-md",
        children: [/* @__PURE__ */ jsx(Alert, {
          variant: "destructive",
          children: /* @__PURE__ */ jsx(AlertDescription, {
            children: error
          })
        }), /* @__PURE__ */ jsx("div", {
          className: "mt-6 text-center",
          children: /* @__PURE__ */ jsx("button", {
            onClick: () => navigate("/register"),
            className: "text-primary hover:underline",
            children: "Go back to registration"
          })
        })]
      })
    });
  }
  return null;
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: GoogleAuth
}, Symbol.toStringTag, { value: "Module" }));
function Avatar({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AvatarPrimitive.Root,
    {
      "data-slot": "avatar",
      className: cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      ),
      ...props
    }
  );
}
function AvatarImage({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AvatarPrimitive.Image,
    {
      "data-slot": "avatar-image",
      className: cn("aspect-square size-full", className),
      ...props
    }
  );
}
function AvatarFallback({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    AvatarPrimitive.Fallback,
    {
      "data-slot": "avatar-fallback",
      className: cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      ),
      ...props
    }
  );
}
function Tabs({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Root,
    {
      "data-slot": "tabs",
      className: cn("flex flex-col gap-2", className),
      ...props
    }
  );
}
function TabsList({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.List,
    {
      "data-slot": "tabs-list",
      className: cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        className
      ),
      ...props
    }
  );
}
function TabsTrigger({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Trigger,
    {
      "data-slot": "tabs-trigger",
      className: cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function TabsContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    TabsPrimitive.Content,
    {
      "data-slot": "tabs-content",
      className: cn("flex-1 outline-none", className),
      ...props
    }
  );
}
function DropdownMenu({
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, { "data-slot": "dropdown-menu", ...props });
}
function DropdownMenuTrigger({
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Trigger,
    {
      "data-slot": "dropdown-menu-trigger",
      ...props
    }
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}) {
  return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Content,
    {
      "data-slot": "dropdown-menu-content",
      sideOffset,
      className: cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className
      ),
      ...props
    }
  ) });
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Item,
    {
      "data-slot": "dropdown-menu-item",
      "data-inset": inset,
      "data-variant": variant,
      className: cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Label,
    {
      "data-slot": "dropdown-menu-label",
      "data-inset": inset,
      className: cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className
      ),
      ...props
    }
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DropdownMenuPrimitive.Separator,
    {
      "data-slot": "dropdown-menu-separator",
      className: cn("bg-border -mx-1 my-1 h-px", className),
      ...props
    }
  );
}
function Dialog({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Root, { "data-slot": "dialog", ...props });
}
function DialogPortal({
  ...props
}) {
  return /* @__PURE__ */ jsx(DialogPrimitive.Portal, { "data-slot": "dialog-portal", ...props });
}
function DialogOverlay({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Overlay,
    {
      "data-slot": "dialog-overlay",
      className: cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      ),
      ...props
    }
  );
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}) {
  return /* @__PURE__ */ jsxs(DialogPortal, { "data-slot": "dialog-portal", children: [
    /* @__PURE__ */ jsx(DialogOverlay, {}),
    /* @__PURE__ */ jsxs(
      DialogPrimitive.Content,
      {
        "data-slot": "dialog-content",
        className: cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-lg",
          className
        ),
        ...props,
        children: [
          children,
          showCloseButton && /* @__PURE__ */ jsxs(
            DialogPrimitive.Close,
            {
              "data-slot": "dialog-close",
              className: "ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              children: [
                /* @__PURE__ */ jsx(XIcon, {}),
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-header",
      className: cn("flex flex-col gap-2 text-center sm:text-left", className),
      ...props
    }
  );
}
function DialogFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "dialog-footer",
      className: cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      ),
      ...props
    }
  );
}
function DialogTitle({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Title,
    {
      "data-slot": "dialog-title",
      className: cn("text-lg leading-none font-semibold", className),
      ...props
    }
  );
}
function DialogDescription({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    DialogPrimitive.Description,
    {
      "data-slot": "dialog-description",
      className: cn("text-muted-foreground text-sm", className),
      ...props
    }
  );
}
function Textarea({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "textarea",
    {
      "data-slot": "textarea",
      className: cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      ),
      ...props
    }
  );
}
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "skeleton",
      className: cn("bg-accent animate-pulse rounded-md", className),
      ...props
    }
  );
}
function Header({
  user,
  currentUserId,
  onNavigate,
  onEditProfile,
  onPrivacySettings,
  onChangePassword,
  onLogout,
  onAvatarUpdate,
  onUserUpdate,
  notificationsCount = 5,
  messagesCount = 3
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const getStoredUser = () => {
    try {
      const stored = localStorage.getItem("current_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
    return null;
  };
  const displayUser = user || getStoredUser();
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  const uploadAvatar = async (file) => {
    if (!currentUserId) {
      toast.error("Please log in to upload profile picture");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true
      });
      if (uploadError) {
        throw uploadError;
      }
      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      try {
        const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", currentUserId);
        if (updateError) {
          console.warn("Note: Could not update avatar_url in database");
          if (displayUser) {
            const updatedUser = { ...displayUser, avatar_url: publicUrl };
            localStorage.setItem("current_user", JSON.stringify(updatedUser));
          }
        }
      } catch (columnError) {
        console.warn("Database update failed:", columnError);
        if (displayUser) {
          const updatedUser = { ...displayUser, avatar_url: publicUrl };
          localStorage.setItem("current_user", JSON.stringify(updatedUser));
        }
      }
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }
      if (onUserUpdate && displayUser) {
        onUserUpdate({
          ...displayUser,
          avatar_url: publicUrl
        });
      }
      toast.success("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    e.target.value = "";
  };
  const getUserInitials = () => {
    if (!displayUser) {
      return "U";
    }
    const firstName = displayUser.first_name || "";
    const lastName = displayUser.last_name || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (displayUser.full_name) {
      const names = displayUser.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0]?.toUpperCase() || "U";
    }
    console.log(
      "userasdadsasdsasdasdasasdasdasdadsasddasasd" + displayUser.full_name
    );
  };
  const getUserDisplayName = () => {
    if (!displayUser) {
      return "User";
    }
    return displayUser.full_name || displayUser.email?.split("@")[0] || "User";
  };
  const getUserPosition = () => {
    if (!displayUser) {
      return "Employee";
    }
    return displayUser.position || "Employee";
  };
  const getUserEmail = () => {
    if (!displayUser) {
      return "";
    }
    return displayUser.email || "";
  };
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between h-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center space-x-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg", children: /* @__PURE__ */ jsx(Building, { className: "h-5 w-5 text-white" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400", children: "DeskStaff" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSearch, className: "relative hidden md:block", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            placeholder: "Search colleagues, projects, or documents...",
            className: "pl-10 w-64 bg-gray-100/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value)
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
      /* @__PURE__ */ jsx(ThemeToggle, {}),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
          title: "Home",
          onClick: () => onNavigate("/"),
          children: /* @__PURE__ */ jsx(Home, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative text-gray-700 dark:text-gray-300",
          title: "Notifications",
          onClick: () => onNavigate("/notifications"),
          children: [
            /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }),
            notificationsCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center", children: notificationsCount > 9 ? "9+" : notificationsCount })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative text-gray-700 dark:text-gray-300",
          title: "Messages",
          onClick: () => onNavigate("/messages"),
          children: [
            /* @__PURE__ */ jsx(MessageCircle, { className: "h-5 w-5" }),
            messagesCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center", children: messagesCount > 9 ? "9+" : messagesCount })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "icon",
          className: "rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
          title: "Teams",
          onClick: () => onNavigate("/teams"),
          children: /* @__PURE__ */ jsx(Users, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            className: "relative h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700",
            disabled: isUploadingAvatar,
            children: isUploadingAvatar ? /* @__PURE__ */ jsx("div", { className: "h-9 w-9 flex items-center justify-center", children: /* @__PURE__ */ jsx(Loader2, { className: "h-5 w-5 text-blue-600 animate-spin" }) }) : /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxs(Avatar, { className: "h-9 w-9 ring-2 ring-white dark:ring-gray-700", children: [
                /* @__PURE__ */ jsx(
                  AvatarImage,
                  {
                    src: displayUser?.avatar_url || void 0,
                    alt: getUserDisplayName()
                  }
                ),
                /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", children: getUserInitials() })
              ] }),
              /* @__PURE__ */ jsx("label", { className: "absolute -bottom-1 -right-1 cursor-pointer", children: /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  className: "hidden",
                  onChange: handleFileSelect,
                  disabled: isUploadingAvatar
                }
              ) })
            ] })
          }
        ) }),
        /* @__PURE__ */ jsxs(
          DropdownMenuContent,
          {
            className: "w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
            align: "end",
            children: [
              /* @__PURE__ */ jsxs(DropdownMenuLabel, { className: "flex items-center gap-3 text-gray-900 dark:text-white p-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsxs(Avatar, { className: "h-12 w-12", children: [
                    /* @__PURE__ */ jsx(
                      AvatarImage,
                      {
                        src: displayUser?.avatar_url || void 0,
                        alt: getUserDisplayName()
                      }
                    ),
                    /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", children: getUserInitials() })
                  ] }),
                  /* @__PURE__ */ jsxs("label", { className: "absolute -bottom-1 -right-1 cursor-pointer", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        accept: "image/*",
                        className: "hidden",
                        onChange: handleFileSelect,
                        disabled: isUploadingAvatar
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: "h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-white dark:border-gray-800", children: isUploadingAvatar ? /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 text-white animate-spin" }) : /* @__PURE__ */ jsx(Camera, { className: "h-3 w-3 text-white" }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-semibold truncate", children: getUserDisplayName() }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: getUserPosition() }),
                  getUserEmail() && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate mt-1", children: getUserEmail() })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "px-3 py-2", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 text-center", children: "Click camera icon to update profile picture" }) }),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, { className: "bg-gray-200 dark:bg-gray-700" }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: () => currentUserId && onNavigate(`/profile/${currentUserId}`),
                  className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(User, { className: "mr-2 h-4 w-4" }),
                    "My Profile"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: onEditProfile,
                  className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(Edit, { className: "mr-2 h-4 w-4" }),
                    "Edit Profile"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: onPrivacySettings,
                  className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(Shield, { className: "mr-2 h-4 w-4" }),
                    "Privacy Settings"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  onClick: onChangePassword,
                  className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(Key, { className: "mr-2 h-4 w-4" }),
                    "Change Password"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(DropdownMenuSeparator, { className: "bg-gray-200 dark:bg-gray-700" }),
              /* @__PURE__ */ jsxs(
                DropdownMenuItem,
                {
                  className: "text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer",
                  onClick: onLogout,
                  children: [
                    /* @__PURE__ */ jsx(LogOut, { className: "mr-2 h-4 w-4" }),
                    "Log out"
                  ]
                }
              )
            ]
          }
        )
      ] })
    ] })
  ] }) }) });
}
function CreatePost({
  user,
  onSubmit,
  placeholder = "What's on your mind?",
  disabled = false
}) {
  const [newPost, setNewPost] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };
  const handleSubmit = async () => {
    if (!newPost.trim() && !selectedImage) return;
    setIsPosting(true);
    try {
      await onSubmit(newPost, selectedImage || void 0);
      setNewPost("");
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };
  return /* @__PURE__ */ jsx(Card, { className: "border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900", children: /* @__PURE__ */ jsx(CardContent, { className: "pt-6", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
    /* @__PURE__ */ jsxs(Avatar, { className: "h-12 w-12", children: [
      /* @__PURE__ */ jsx(AvatarImage, { src: user?.avatar_url || void 0 }),
      /* @__PURE__ */ jsxs(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", children: [
        user?.first_name?.[0],
        user?.last_name?.[0]
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          placeholder: `${placeholder} ${user?.first_name}?`,
          value: newPost,
          onChange: (e) => setNewPost(e.target.value),
          className: "min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400",
          disabled: disabled || isPosting
        }
      ),
      imagePreview && /* @__PURE__ */ jsxs("div", { className: "relative rounded-xl overflow-hidden", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: imagePreview,
            alt: "Preview",
            className: "w-full max-h-96 object-cover"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "destructive",
            size: "sm",
            className: "absolute top-3 right-3 backdrop-blur-sm",
            onClick: removeImage,
            disabled: isPosting,
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx(Separator, { className: "bg-gray-200 dark:bg-gray-700" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: handleImageSelect,
                disabled: isPosting
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30", children: /* @__PURE__ */ jsx(Image, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Photo" })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
              disabled: isPosting,
              children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30", children: /* @__PURE__ */ jsx(Video, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Video" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              size: "sm",
              className: "gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400",
              disabled: isPosting,
              children: [
                /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-green-50 dark:bg-green-900/30", children: /* @__PURE__ */ jsx(Smile, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Feeling" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleSubmit,
            disabled: isPosting || !newPost.trim() && !selectedImage || disabled,
            className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
            children: isPosting ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Send, { className: "h-4 w-4 mr-2" }),
              "Post"
            ] })
          }
        )
      ] })
    ] })
  ] }) }) });
}
function Post({
  id,
  content,
  image_url,
  created_at,
  likes_count,
  comments_count,
  user,
  liked,
  bookmarked,
  isOwnPost = false,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onEdit,
  onDelete,
  showActions = true
}) {
  const formattedDate = new Date(created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ jsx(Card, { className: "border-gray-200/50 dark:border-gray-700/50 overflow-hidden bg-white dark:bg-gray-900", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs(Avatar, { children: [
          /* @__PURE__ */ jsx(AvatarImage, { src: user.avatar_url || void 0 }),
          /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", children: user.full_name.split(" ").map((n) => n[0]).join("") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: user.full_name }),
            isOwnPost && /* @__PURE__ */ jsx(
              Badge,
              {
                variant: "outline",
                className: "text-xs bg-blue-50 dark:bg-blue-900/20",
                children: "You"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx("span", { children: formattedDate }),
            /* @__PURE__ */ jsx(Globe, { className: "h-3 w-3" }),
            /* @__PURE__ */ jsx("span", { children: "Public" })
          ] })
        ] })
      ] }),
      showActions && /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
            children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-4 w-4" })
          }
        ) }),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { className: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700", children: [
          isOwnPost && onEdit && /* @__PURE__ */ jsxs(
            DropdownMenuItem,
            {
              onClick: () => onEdit(id),
              className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              children: [
                /* @__PURE__ */ jsx(Edit, { className: "mr-2 h-4 w-4" }),
                "Edit Post"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            DropdownMenuItem,
            {
              onClick: () => onBookmark(id),
              className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
              children: [
                /* @__PURE__ */ jsx(
                  Bookmark,
                  {
                    className: `mr-2 h-4 w-4 ${bookmarked ? "fill-current text-yellow-500" : ""}`
                  }
                ),
                bookmarked ? "Remove from Bookmarks" : "Save Post"
              ]
            }
          ),
          isOwnPost && onDelete && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(DropdownMenuSeparator, { className: "bg-gray-200 dark:bg-gray-700" }),
            /* @__PURE__ */ jsxs(
              DropdownMenuItem,
              {
                className: "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                onClick: () => onDelete(id),
                children: [
                  /* @__PURE__ */ jsx(Trash2, { className: "mr-2 h-4 w-4" }),
                  "Delete Post"
                ]
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mb-4 text-gray-700 dark:text-gray-300 leading-relaxed", children: content }),
    image_url && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsx(
      "img",
      {
        src: image_url,
        alt: "Post",
        className: "w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-gray-500 dark:text-gray-400 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center -space-x-1", children: [
          /* @__PURE__ */ jsx("div", { className: "h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-white", children: "👍" }) }),
          /* @__PURE__ */ jsx("div", { className: "h-6 w-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800", children: /* @__PURE__ */ jsx("span", { className: "text-xs text-white", children: "❤️" }) })
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          likes_count,
          " reactions"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("span", { children: [
        comments_count,
        " comments"
      ] }) })
    ] }),
    showActions && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Separator, { className: "mb-4 bg-gray-200 dark:bg-gray-700" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-1", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: `gap-2 ${liked ? "text-blue-600" : "text-gray-600 dark:text-gray-400"}`,
            onClick: () => onLike(id),
            children: [
              /* @__PURE__ */ jsx(Heart, { className: `h-4 w-4 ${liked ? "fill-current" : ""}` }),
              liked ? "Liked" : "Like"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "gap-2 text-gray-600 dark:text-gray-400",
            onClick: () => onComment?.(id),
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4" }),
              "Comment"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "gap-2 text-gray-600 dark:text-gray-400",
            onClick: () => onShare?.(id),
            children: [
              /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4" }),
              "Share"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: `gap-2 ${bookmarked ? "text-yellow-600" : "text-gray-600 dark:text-gray-400"}`,
            onClick: () => onBookmark(id),
            children: [
              /* @__PURE__ */ jsx(
                Bookmark,
                {
                  className: `h-4 w-4 ${bookmarked ? "fill-current" : ""}`
                }
              ),
              "Save"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function UserInfoCard({
  user,
  connectionsCount = 0,
  isOwnProfile = false,
  onConnect,
  onMessage,
  onEdit,
  showActions = true
}) {
  return /* @__PURE__ */ jsxs(Card, { className: "border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900", children: [
    /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between text-lg text-gray-900 dark:text-white", children: [
      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(BriefcaseBusiness, { className: "h-5 w-5 text-blue-600 dark:text-blue-400" }),
        "Professional Information"
      ] }),
      isOwnProfile && onEdit && /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: onEdit,
          className: "text-gray-600 dark:text-gray-400",
          children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      user.bio ? /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300 leading-relaxed", children: user.bio }) : /* @__PURE__ */ jsx("p", { className: "text-gray-400 italic", children: "No summary added yet" }),
      /* @__PURE__ */ jsx(Separator, { className: "bg-gray-200 dark:bg-gray-700" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        user.position && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(BriefcaseBusiness, { className: "h-5 w-5 text-blue-600 dark:text-blue-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Position" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: user.position })
          ] })
        ] }),
        user.department && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Building, { className: "h-5 w-5 text-indigo-600 dark:text-indigo-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Department" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: user.department })
          ] })
        ] }),
        user.location && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-purple-600 dark:text-purple-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Location" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: user.location })
          ] })
        ] }),
        user.email && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Mail, { className: "h-5 w-5 text-green-600 dark:text-green-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Email" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300 truncate", children: user.email })
          ] })
        ] }),
        user.phone && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Phone, { className: "h-5 w-5 text-amber-600 dark:text-amber-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Phone" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: user.phone })
          ] })
        ] }),
        user.hire_date && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5 text-red-600 dark:text-red-400" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: "Hire Date" }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-300", children: new Date(user.hire_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric"
            }) })
          ] })
        ] })
      ] }),
      showActions && !isOwnProfile && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Separator, { className: "bg-gray-200 dark:bg-gray-700" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              className: "flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
              onClick: onConnect,
              children: [
                /* @__PURE__ */ jsx(UserPlus, { className: "h-4 w-4 mr-2" }),
                "Connect"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              className: "flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
              onClick: onMessage,
              children: [
                /* @__PURE__ */ jsx(MessageSquare, { className: "h-4 w-4 mr-2" }),
                "Message"
              ]
            }
          )
        ] })
      ] })
    ] })
  ] });
}
function useGlobalCacheBust() {
  const [version, setVersion] = useState(cacheBust.getVersion());
  useEffect(() => {
    const unsubscribe = cacheBust.subscribe(() => {
      setVersion(cacheBust.getVersion());
    });
    return unsubscribe;
  }, []);
  const bust = () => cacheBust.bust();
  const getBustedUrl = (url) => {
    if (!url) return url;
    return cacheBust.bustSupabaseUrl(url);
  };
  return { version, bust, getBustedUrl };
}
function ProfilePictureUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  size = "md",
  editable = true,
  showRemoveButton = true,
  compact = false
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [localImageKey, setLocalImageKey] = useState(Date.now());
  const { getBustedUrl, version } = useGlobalCacheBust();
  const sizeClasses = {
    xs: "h-8 w-8",
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };
  const iconSizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8"
  };
  useEffect(() => {
    setLocalImageKey(Date.now());
  }, [version]);
  const forceImageRefresh = async (url) => {
    try {
      const response = await fetch(url, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        },
        cache: "no-store"
      });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 3e3);
        return blobUrl;
      }
    } catch (error) {
      console.warn("Could not force refresh image:", error);
    }
    return getBustedUrl(url);
  };
  const uploadAvatar = async (file) => {
    if (!userId) {
      toast.error("User ID is required");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const fileName = `${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        cacheControl: "0",
        upsert: false,
        contentType: file.type
      });
      if (uploadError) {
        throw uploadError;
      }
      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const immediateUrl = `${publicUrl}?_=${timestamp}&cb=${Date.now()}`;
      const { error: updateError } = await supabase.from("users").update({
        avatar_url: immediateUrl,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", userId);
      if (updateError) {
        await supabase.storage.from("avatars").remove([filePath]);
        throw updateError;
      }
      bustGlobalCache();
      setLocalImageKey(Date.now());
      let finalUrl = immediateUrl;
      try {
        const refreshedUrl = await forceImageRefresh(immediateUrl);
        finalUrl = refreshedUrl;
      } catch (error) {
        console.warn("Using regular URL for image:", error);
      }
      onUploadComplete(finalUrl);
      setUploadSuccess(true);
      setTimeout(async () => {
        try {
          const { data: oldFiles } = await supabase.storage.from("avatars").list(userId);
          if (oldFiles) {
            const filesToDelete = oldFiles.filter((f) => f.name !== fileName).map((f) => `${userId}/${f.name}`);
            if (filesToDelete.length > 0) {
              await supabase.storage.from("avatars").remove(filesToDelete);
            }
          }
        } catch (error) {
          console.warn("Failed to cleanup old avatars:", error);
        }
      }, 2e3);
      setTimeout(() => setUploadSuccess(false), 2e3);
      if (!compact) {
        toast.success("Profile picture updated!");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
    }
  };
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    e.target.value = "";
  };
  const handleRemoveAvatar = async () => {
    if (!userId) return;
    setIsUploading(true);
    try {
      const { data: files } = await supabase.storage.from("avatars").list(userId);
      if (files && files.length > 0) {
        const filesToDelete = files.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from("avatars").remove(filesToDelete);
      }
      const { error } = await supabase.from("users").update({
        avatar_url: null,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", userId);
      if (error) throw error;
      bustGlobalCache();
      setLocalImageKey(Date.now());
      onUploadComplete("");
      toast.success("Profile picture removed");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error(error.message || "Failed to remove profile picture");
    } finally {
      setIsUploading(false);
    }
  };
  const getAvatarInitials = () => {
    return "U";
  };
  const avatarUrl = currentAvatarUrl ? getBustedUrl(currentAvatarUrl) : null;
  const imageKey = `${avatarUrl || ""}_${localImageKey}_${version}`;
  if (compact) {
    return /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs("label", { className: "cursor-pointer", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "file",
          accept: "image/*",
          className: "hidden",
          onChange: handleFileSelect,
          disabled: isUploading
        }
      ),
      /* @__PURE__ */ jsxs(
        Avatar,
        {
          className: `${sizeClasses[size]} border-2 border-transparent hover:border-blue-500 transition-all duration-200`,
          children: [
            avatarUrl && !isUploading ? /* @__PURE__ */ jsx(
              AvatarImage,
              {
                src: avatarUrl,
                alt: "Profile",
                className: "object-cover",
                onError: (e) => {
                  const target = e.target;
                  if (currentAvatarUrl && target.src !== currentAvatarUrl) {
                    target.src = getBustedUrl(currentAvatarUrl);
                  }
                }
              },
              imageKey
            ) : null,
            /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", children: isUploading ? /* @__PURE__ */ jsx(Loader2, { className: `${iconSizeClasses[size]} animate-spin` }) : uploadSuccess ? /* @__PURE__ */ jsx(Check, { className: `${iconSizeClasses[size]} text-green-400` }) : getAvatarInitials() })
          ]
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
    /* @__PURE__ */ jsxs(
      Avatar,
      {
        className: `${sizeClasses[size]} border-2 border-white dark:border-gray-800 shadow-md transition-all duration-200 ${isHovering && editable ? "scale-105" : ""}`,
        onMouseEnter: () => editable && setIsHovering(true),
        onMouseLeave: () => setIsHovering(false),
        children: [
          avatarUrl && !isUploading ? /* @__PURE__ */ jsx(
            AvatarImage,
            {
              src: avatarUrl,
              alt: "Profile",
              className: "object-cover",
              onError: (e) => {
                const target = e.target;
                if (currentAvatarUrl && target.src !== currentAvatarUrl) {
                  target.src = getBustedUrl(currentAvatarUrl);
                }
              }
            },
            imageKey
          ) : null,
          /* @__PURE__ */ jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white", children: isUploading ? /* @__PURE__ */ jsx(Loader2, { className: `${iconSizeClasses[size]} animate-spin` }) : uploadSuccess ? /* @__PURE__ */ jsx(Check, { className: `${iconSizeClasses[size]} text-green-400` }) : getAvatarInitials() })
        ]
      }
    ),
    editable && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(
        "label",
        {
          className: `absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer transition-all duration-200 ${isHovering ? "opacity-100" : "opacity-0"} ${isUploading ? "pointer-events-none" : ""}`,
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false),
          children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                accept: "image/*",
                className: "hidden",
                onChange: handleFileSelect,
                disabled: isUploading
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
              /* @__PURE__ */ jsx(Camera, { className: `${iconSizeClasses[size]} text-white` }),
              size !== "xs" && size !== "sm" && /* @__PURE__ */ jsx("span", { className: "text-white text-xs font-medium", children: isUploading ? "Uploading..." : "Change" })
            ] })
          ]
        }
      ),
      currentAvatarUrl && showRemoveButton && !isUploading && /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          size: "icon",
          variant: "destructive",
          className: `absolute -top-1 -right-1 h-6 w-6 rounded-full shadow-md transition-all duration-200 ${isHovering ? "opacity-100 scale-100" : "opacity-0 scale-90"}`,
          onClick: handleRemoveAvatar,
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false),
          disabled: isUploading,
          children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
        }
      )
    ] }),
    isUploading && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex items-center justify-center", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/20 rounded-full" }),
      /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx(
        "div",
        {
          className: `${sizeClasses[size].replace("h-", "h-").replace("w-", "w-")} border-4 border-white/30 border-t-white rounded-full animate-spin`
        }
      ) })
    ] })
  ] });
}
const profile = UNSAFE_withComponentProps(function Profile() {
  const navigate = useNavigate();
  const {
    userId: urlUserId
  } = useParams();
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    location: "",
    workplace: "",
    education: "",
    birthday: "",
    website: "",
    privacy: "public",
    department: "",
    position: "",
    phone: "",
    hire_date: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  useEffect(() => {
    fetchUserData();
    fetchPosts();
    fetchFriends();
  }, []);
  useEffect(() => {
    if (viewedUser) {
      console.log("🔍 Viewed user data:", {
        full_name: viewedUser.full_name,
        logged_in: viewedUser.logged_in
      });
    }
    if (loggedInUser) {
      console.log("🔍 Logged in user data:", {
        full_name: loggedInUser.full_name,
        logged_in: loggedInUser.logged_in
      });
    }
  }, [viewedUser, loggedInUser]);
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      if (event === "SIGNED_IN" && session?.user) {
        try {
          await updateUserLoginStatus(true);
        } catch (error) {
          console.error("Error setting online status:", error);
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  useEffect(() => {
    if (!currentUserId || !isOwnProfile) return;
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    let activityTimeout;
    const updateActivity = async () => {
      await setUserOnline();
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(async () => {
        if (isOwnProfile) {
          await setUserOffline();
          console.log("User marked as offline due to inactivity");
        }
      }, 5 * 60 * 1e3);
    };
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });
    updateActivity();
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearTimeout(activityTimeout);
      if (isOwnProfile) {
        setUserOffline();
      }
    };
  }, [currentUserId, isOwnProfile]);
  useEffect(() => {
    document.title = "DeskStaff";
  }, []);
  useEffect(() => {
    const userIdToSubscribe = urlUserId || currentUserId;
    if (!userIdToSubscribe) return;
    const channel = supabase.channel(`user-${userIdToSubscribe}`).on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "users",
      filter: `id=eq.${userIdToSubscribe}`
    }, (payload) => {
      console.log("User updated:", payload.new);
      const updatedUser = payload.new;
      if (urlUserId && urlUserId !== currentUserId) {
        setViewedUser(updatedUser);
      } else {
        setViewedUser(updatedUser);
        setLoggedInUser(updatedUser);
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [urlUserId, currentUserId]);
  const updateUserLoginStatus = async (isLoggedIn) => {
    try {
      const {
        data: {
          user: authUser
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.log("No authenticated user found or auth error:", authError);
        return;
      }
      console.log(`Updating user ${authUser.id} logged_in to: ${isLoggedIn}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5e3);
      const {
        error
      } = await supabase.from("users").update({
        logged_in: isLoggedIn,
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        ...!isLoggedIn ? {
          last_seen: (/* @__PURE__ */ new Date()).toISOString()
        } : {}
      }).eq("id", authUser.id);
      clearTimeout(timeoutId);
      if (error) {
        if (error.message.includes("aborted") || error.message.includes("AbortError")) {
          console.log("Update aborted (expected during logout)");
        } else {
          console.error("Error updating login status:", error);
        }
      } else {
        console.log(`User ${isLoggedIn ? "logged in" : "logged out"} status updated successfully`);
      }
    } catch (error) {
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        console.log("Request was aborted (expected during navigation)");
        return;
      }
      console.error("Error in updateUserLoginStatus:", error);
    }
  };
  const setUserOnline = () => updateUserLoginStatus(true);
  const setUserOffline = () => updateUserLoginStatus(false);
  const fetchUserData = async () => {
    try {
      console.log("🔄 Starting fetchUserData...");
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("❌ Session error:", sessionError);
        toast.error("Please log in to continue");
        navigate("/", {
          replace: true
        });
        return;
      }
      setCurrentUserId(session.user.id);
      const userIdToFetch = urlUserId || session.user.id;
      const isOwnProfile2 = userIdToFetch === session.user.id;
      setIsOwnProfile(isOwnProfile2);
      const {
        data: loggedInUserData,
        error: loggedInUserError
      } = await supabase.from("users").select("*").eq("id", session.user.id).single();
      if (loggedInUserError) {
        console.error("❌ Error fetching logged-in user:", loggedInUserError);
      } else {
        setLoggedInUser(loggedInUserData);
      }
      const {
        data: viewedUserData,
        error: viewedUserError
      } = await supabase.from("users").select("*").eq("id", userIdToFetch).single();
      if (viewedUserError) {
        if (viewedUserError.code === "PGRST116" || viewedUserError.message.includes("No rows found")) {
          console.log("⚠️ Viewed user not found in database...");
          if (isOwnProfile2) {
            await createUserRecord(session.user);
            await fetchUserData();
            return;
          } else {
            toast.error("User profile not found");
            navigate(`/profile/${session.user.id}`, {
              replace: true
            });
            return;
          }
        }
        toast.error("Failed to load profile data");
        return;
      }
      if (!viewedUserData) {
        if (isOwnProfile2) {
          await createUserRecord(session.user);
          await fetchUserData();
          return;
        }
        toast.error("User profile not found");
        return;
      }
      setViewedUser(viewedUserData);
      if (isOwnProfile2) {
        setEditForm({
          first_name: viewedUserData.first_name || "",
          last_name: viewedUserData.last_name || "",
          bio: viewedUserData.bio || "",
          location: viewedUserData.location || "",
          workplace: viewedUserData.workplace || "",
          education: viewedUserData.education || "",
          birthday: viewedUserData.birthday || "",
          website: viewedUserData.website || "",
          privacy: viewedUserData.privacy || "public",
          department: viewedUserData.department || "",
          position: viewedUserData.position || "",
          phone: viewedUserData.phone || "",
          hire_date: viewedUserData.hire_date || ""
        });
        try {
          await setUserOnline();
        } catch (onlineError) {
          console.error("⚠️ Failed to set user online:", onlineError);
        }
      }
    } catch (error) {
      console.error("💥 Error in fetchUserData:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };
  const createUserRecord = async (authUser) => {
    try {
      const {
        error
      } = await supabase.from("users").insert({
        id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || "",
        last_name: authUser.user_metadata?.last_name || "",
        full_name: `${authUser.user_metadata?.first_name || ""} ${authUser.user_metadata?.last_name || ""}`.trim() || authUser.email?.split("@")[0] || "User",
        avatar_url: null,
        bio: null,
        location: null,
        workplace: null,
        education: null,
        birthday: null,
        website: null,
        privacy: "public",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        logged_in: true
      });
      if (error) throw error;
      console.log("✅ New user record created");
    } catch (error) {
      console.error("Error creating user record:", error);
      throw error;
    }
  };
  const fetchPosts = async () => {
    try {
      const userIdToFetchPosts = urlUserId || currentUserId;
      const mockPosts = [{
        id: "1",
        content: isOwnProfile ? "Just finished the Q3 project report ahead of schedule! Great teamwork from everyone involved. 🎯" : `${viewedUser?.full_name || "This user"} shared a professional update`,
        image_url: isOwnProfile ? "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop" : null,
        created_at: "2024-01-15T10:30:00Z",
        likes_count: 24,
        comments_count: 8,
        user: {
          id: userIdToFetchPosts || "1",
          full_name: viewedUser?.full_name || "User",
          avatar_url: viewedUser?.avatar_url || null
        },
        liked: false,
        bookmarked: false
      }];
      setPosts(mockPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };
  const fetchFriends = async () => {
    try {
      const mockFriends = [{
        id: "2",
        full_name: "Jane Smith",
        avatar_url: null,
        mutual_friends: 8,
        status: "accepted",
        department: "Engineering",
        position: "Senior Developer",
        logged_in: true
      }, {
        id: "3",
        full_name: "Bob Johnson",
        avatar_url: null,
        mutual_friends: 12,
        status: "accepted",
        department: "Marketing",
        position: "Marketing Manager",
        logged_in: false
      }];
      setFriends(mockFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };
  const testLoginStatusUpdate = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No user found");
        return;
      }
      toast.loading("Testing login status update...");
      const {
        data,
        error
      } = await supabase.from("users").update({
        logged_in: false,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", user.id).select("id, logged_in, updated_at");
      if (error) {
        toast.error(`Update failed: ${error.message}`);
        console.error("Test error details:", error);
      } else {
        toast.success(`Update successful! Status: ${data?.[0]?.logged_in}`);
        console.log("Test result:", data);
      }
    } catch (error) {
      toast.error("Test failed");
      console.error("Test error:", error);
    }
  };
  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    let dbUpdateComplete = false;
    const beforeUnloadHandler = (e) => {
      if (!dbUpdateComplete) {
        e.preventDefault();
        e.returnValue = "Please wait, logging out...";
        return "Please wait, logging out...";
      }
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    try {
      toast.loading("Logging out...");
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        await updateDatabaseWithRetry(user.id);
      }
      dbUpdateComplete = true;
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      await supabase.auth.signOut();
      setLoggedInUser(null);
      setViewedUser(null);
      setPosts([]);
      setFriends([]);
      toast.dismiss();
      toast.success("Logged out!");
      navigate("/", {
        replace: true
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.dismiss();
      toast.error("Logout failed");
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      navigate("/", {
        replace: true
      });
    }
  };
  const updateDatabaseWithRetry = async (userId, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to update database...`);
        const {
          error,
          status
        } = await supabase.from("users").update({
          logged_in: false,
          last_seen: (/* @__PURE__ */ new Date()).toISOString(),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", userId);
        if (error) throw error;
        console.log(`✅ Database updated on attempt ${attempt}, status: ${status}`);
        const {
          data
        } = await supabase.from("users").select("logged_in").eq("id", userId).maybeSingle();
        if (data && data.logged_in === false) {
          console.log("✅ Verification passed: logged_in is FALSE");
          return;
        } else {
          throw new Error("Verification failed");
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          throw new Error(`Failed to update database after ${retries} attempts`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  };
  const handleUpdateProfile = async () => {
    try {
      const {
        data: {
          user: authUser
        }
      } = await supabase.auth.getUser();
      if (!authUser) return;
      const {
        error
      } = await supabase.from("users").update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        full_name: `${editForm.first_name} ${editForm.last_name}`,
        bio: editForm.bio,
        location: editForm.location,
        workplace: editForm.workplace,
        education: editForm.education,
        birthday: editForm.birthday,
        website: editForm.website,
        privacy: editForm.privacy,
        department: editForm.department,
        position: editForm.position,
        phone: editForm.phone,
        hire_date: editForm.hire_date,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", authUser.id);
      if (error) throw error;
      toast.success("Your profile has been successfully updated");
      fetchUserData();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsChangingPassword(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });
      if (error) throw error;
      toast.success("Your password has been successfully updated");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsChangePasswordOpen(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleCreatePost = async (content, image) => {
    try {
      const newPostObj = {
        id: Date.now().toString(),
        content,
        image_url: image ? URL.createObjectURL(image) : null,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        likes_count: 0,
        comments_count: 0,
        user: {
          id: viewedUser?.id || "",
          full_name: viewedUser?.full_name || "",
          avatar_url: viewedUser?.avatar_url || null
        },
        liked: false,
        bookmarked: false
      };
      setPosts([newPostObj, ...posts]);
      toast.success("Your post has been published");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      throw error;
    }
  };
  const handleLikePost = (postId) => {
    setPosts(posts.map((post2) => {
      if (post2.id === postId) {
        const wasLiked = post2.liked;
        return {
          ...post2,
          liked: !wasLiked,
          likes_count: wasLiked ? post2.likes_count - 1 : post2.likes_count + 1
        };
      }
      return post2;
    }));
    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.liked) {
        toast.success("Post liked!");
      } else {
        toast.info("Post unliked");
      }
    }
  };
  const handleBookmarkPost = (postId) => {
    setPosts(posts.map((post2) => {
      if (post2.id === postId) {
        const wasBookmarked = post2.bookmarked;
        return {
          ...post2,
          bookmarked: !wasBookmarked
        };
      }
      return post2;
    }));
    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.bookmarked) {
        toast.success("Post bookmarked!");
      } else {
        toast.info("Post removed from bookmarks");
      }
    }
  };
  const handleDeletePost = (postId) => {
    setPosts(posts.filter((p) => p.id !== postId));
    toast.success("Post deleted successfully");
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", {
      className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
      children: /* @__PURE__ */ jsxs("div", {
        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
        children: [/* @__PURE__ */ jsx(Skeleton, {
          className: "h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700"
        }), /* @__PURE__ */ jsxs("div", {
          className: "mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "lg:col-span-2 space-y-6",
            children: [/* @__PURE__ */ jsx(Skeleton, {
              className: "h-32 w-full rounded-xl bg-gray-200 dark:bg-gray-700"
            }), [1, 2, 3].map((i) => /* @__PURE__ */ jsx(Skeleton, {
              className: "h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700"
            }, i))]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */ jsx(Skeleton, {
              className: "h-48 w-full rounded-xl bg-gray-200 dark:bg-gray-700"
            }), /* @__PURE__ */ jsx(Skeleton, {
              className: "h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700"
            })]
          })]
        })]
      })
    });
  }
  return /* @__PURE__ */ jsx(ProtectedRoute, {
    children: /* @__PURE__ */ jsxs("div", {
      className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800",
      children: [/* @__PURE__ */ jsx(Header, {
        user: loggedInUser,
        currentUserId,
        onNavigate: navigate,
        onEditProfile: () => setIsEditing(true),
        onPrivacySettings: () => setIsPrivacyOpen(true),
        onChangePassword: () => setIsChangePasswordOpen(true),
        onLogout: () => setIsLogoutDialogOpen(true)
      }), /* @__PURE__ */ jsxs("main", {
        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
        children: [/* @__PURE__ */ jsxs(Card, {
          className: "mb-6 overflow-hidden border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white dark:bg-gray-900",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "relative h-56 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600",
            children: [/* @__PURE__ */ jsx("div", {
              className: "absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute bottom-4 right-4 flex gap-2",
              children: isOwnProfile ? /* @__PURE__ */ jsxs(Button, {
                className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
                onClick: () => setIsEditing(true),
                children: [/* @__PURE__ */ jsx(Edit, {
                  className: "h-4 w-4 mr-2"
                }), "Edit Profile"]
              }) : /* @__PURE__ */ jsxs(Button, {
                className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
                onClick: () => toast.success("Connection request sent!"),
                children: [/* @__PURE__ */ jsx(UserPlus, {
                  className: "h-4 w-4 mr-2"
                }), "Connect"]
              })
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "relative px-6 pb-6",
            children: /* @__PURE__ */ jsxs("div", {
              className: "flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16",
              children: [/* @__PURE__ */ jsx(ProfilePictureUpload, {
                userId: viewedUser?.id || "",
                currentAvatarUrl: viewedUser?.avatar_url || null,
                onUploadComplete: (avatarUrl) => {
                  if (viewedUser) {
                    setViewedUser({
                      ...viewedUser,
                      avatar_url: avatarUrl || null
                    });
                  }
                  if (loggedInUser && isOwnProfile) {
                    setLoggedInUser({
                      ...loggedInUser,
                      avatar_url: avatarUrl || null
                    });
                  }
                },
                size: "lg",
                editable: isOwnProfile
              }), /* @__PURE__ */ jsx("div", {
                className: "flex-1 space-y-4",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  children: [/* @__PURE__ */ jsxs("div", {
                    className: "space-y-2",
                    children: [/* @__PURE__ */ jsxs("div", {
                      className: "flex items-center gap-3",
                      children: [/* @__PURE__ */ jsx("h1", {
                        className: "text-3xl font-bold text-gray-900 dark:text-white",
                        children: viewedUser?.full_name
                      }), viewedUser?.logged_in ? /* @__PURE__ */ jsxs(Badge, {
                        className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
                        children: [/* @__PURE__ */ jsx("div", {
                          className: "h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"
                        }), "Online"]
                      }) : viewedUser?.last_seen ? /* @__PURE__ */ jsxs(Badge, {
                        variant: "outline",
                        className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                        children: [/* @__PURE__ */ jsx("div", {
                          className: "h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5"
                        }), "Offline"]
                      }) : null, viewedUser?.position && /* @__PURE__ */ jsx(Badge, {
                        variant: "secondary",
                        className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                        children: viewedUser.position
                      })]
                    }), /* @__PURE__ */ jsxs("div", {
                      className: "flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300",
                      children: [/* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [/* @__PURE__ */ jsx(Briefcase, {
                          className: "h-4 w-4"
                        }), /* @__PURE__ */ jsx("span", {
                          children: viewedUser?.department || "Department"
                        })]
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [/* @__PURE__ */ jsx(Users, {
                          className: "h-4 w-4"
                        }), /* @__PURE__ */ jsxs("span", {
                          children: [friends.length, " Connections"]
                        })]
                      }), /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [/* @__PURE__ */ jsx(CalendarDays, {
                          className: "h-4 w-4"
                        }), /* @__PURE__ */ jsxs("span", {
                          children: ["Joined", " ", viewedUser?.created_at ? new Date(viewedUser.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric"
                          }) : "Recently"]
                        })]
                      }), !viewedUser?.logged_in && viewedUser?.last_seen && /* @__PURE__ */ jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [/* @__PURE__ */ jsx(Clock, {
                          className: "h-4 w-4"
                        }), /* @__PURE__ */ jsxs("span", {
                          className: "text-sm",
                          children: ["Last seen", " ", new Date(viewedUser.last_seen).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })]
                        })]
                      })]
                    })]
                  }), /* @__PURE__ */ jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [/* @__PURE__ */ jsxs(Button, {
                      className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
                      onClick: () => toast.success("Connection request sent!"),
                      children: [/* @__PURE__ */ jsx(UserPlus, {
                        className: "h-4 w-4 mr-2"
                      }), "Connect"]
                    }), /* @__PURE__ */ jsxs(Button, {
                      variant: "outline",
                      onClick: () => toast.info("Messaging feature coming soon!"),
                      className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                      children: [/* @__PURE__ */ jsx(MessageSquare, {
                        className: "h-4 w-4 mr-2"
                      }), "Message"]
                    }), /* @__PURE__ */ jsxs(DropdownMenu, {
                      children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
                        asChild: true,
                        children: /* @__PURE__ */ jsx(Button, {
                          variant: "outline",
                          size: "icon",
                          className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                          children: /* @__PURE__ */ jsx(MoreHorizontal, {
                            className: "h-4 w-4"
                          })
                        })
                      }), /* @__PURE__ */ jsxs(DropdownMenuContent, {
                        className: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                        children: [/* @__PURE__ */ jsxs(DropdownMenuItem, {
                          onClick: () => setIsEditing(true),
                          className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                          children: [/* @__PURE__ */ jsx(Edit, {
                            className: "mr-2 h-4 w-4"
                          }), "Edit Profile"]
                        }), /* @__PURE__ */ jsxs(DropdownMenuItem, {
                          onClick: () => toast.info("Saved items feature coming soon!"),
                          className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                          children: [/* @__PURE__ */ jsx(Bookmark, {
                            className: "mr-2 h-4 w-4"
                          }), "Saved Items"]
                        }), /* @__PURE__ */ jsx(DropdownMenuSeparator, {
                          className: "bg-gray-200 dark:bg-gray-700"
                        }), /* @__PURE__ */ jsxs(DropdownMenuItem, {
                          className: "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                          onClick: () => toast.error("Account deletion is not available yet"),
                          children: [/* @__PURE__ */ jsx(Trash2, {
                            className: "mr-2 h-4 w-4"
                          }), "Delete Account"]
                        })]
                      })]
                    })]
                  })]
                })
              })]
            })
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "space-y-6",
            children: [/* @__PURE__ */ jsx(UserInfoCard, {
              user: {
                full_name: viewedUser?.full_name || "",
                avatar_url: viewedUser?.avatar_url || null,
                bio: viewedUser?.bio || null,
                position: viewedUser?.position || "",
                department: viewedUser?.department || "",
                location: viewedUser?.location || null,
                email: viewedUser?.email || "",
                phone: viewedUser?.phone || "",
                hire_date: viewedUser?.hire_date || "",
                logged_in: viewedUser?.logged_in,
                last_seen: viewedUser?.last_seen,
                created_at: viewedUser?.created_at
              },
              connectionsCount: friends.length,
              isOwnProfile,
              onConnect: () => toast.success("Connection request sent!"),
              onMessage: () => toast.info("Messaging feature coming soon!"),
              onEdit: () => setIsEditing(true),
              showActions: !isOwnProfile
            }), /* @__PURE__ */ jsxs(Card, {
              className: "border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900",
              children: [/* @__PURE__ */ jsx(CardHeader, {
                className: "pb-3",
                children: /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsxs(CardTitle, {
                      className: "flex items-center gap-2 text-gray-900 dark:text-white",
                      children: [/* @__PURE__ */ jsx(Users, {
                        className: "h-5 w-5 text-blue-600 dark:text-blue-400"
                      }), "Connections"]
                    }), /* @__PURE__ */ jsxs(CardDescription, {
                      className: "text-gray-600 dark:text-gray-400",
                      children: [friends.length, " professional connections"]
                    })]
                  }), /* @__PURE__ */ jsx(Button, {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => toast.info("Connections page coming soon!"),
                    className: "text-gray-600 dark:text-gray-400",
                    children: "See all"
                  })]
                })
              }), /* @__PURE__ */ jsx(CardContent, {
                children: /* @__PURE__ */ jsx("div", {
                  className: "grid grid-cols-3 gap-3",
                  children: friends.slice(0, 9).map((friend) => /* @__PURE__ */ jsxs("div", {
                    className: "group cursor-pointer space-y-2",
                    children: [/* @__PURE__ */ jsx("div", {
                      className: "relative",
                      children: /* @__PURE__ */ jsx(Avatar, {
                        className: "h-20 w-full rounded-xl border-2 border-transparent group-hover:border-blue-500 transition-all",
                        children: /* @__PURE__ */ jsxs(AvatarFallback, {
                          className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative",
                          children: [friend.full_name.split(" ").map((n) => n[0]).join(""), friend.logged_in && /* @__PURE__ */ jsx("div", {
                            className: "absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
                          })]
                        })
                      })
                    }), /* @__PURE__ */ jsx("div", {
                      className: "space-y-1",
                      children: /* @__PURE__ */ jsxs("p", {
                        className: "text-xs font-semibold truncate text-gray-900 dark:text-white",
                        children: [friend.full_name, friend.logged_in && /* @__PURE__ */ jsx("span", {
                          className: "ml-1 text-green-500",
                          children: "●"
                        })]
                      })
                    })]
                  }, friend.id))
                })
              })]
            }), /* @__PURE__ */ jsxs(Card, {
              className: "border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900",
              children: [/* @__PURE__ */ jsx(CardHeader, {
                className: "pb-3",
                children: /* @__PURE__ */ jsxs(CardTitle, {
                  className: "flex items-center gap-2 text-gray-900 dark:text-white",
                  children: [/* @__PURE__ */ jsx(Award, {
                    className: "h-5 w-5 text-blue-600 dark:text-blue-400"
                  }), "Skills & Privacy"]
                })
              }), /* @__PURE__ */ jsxs(CardContent, {
                className: "space-y-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "font-medium text-gray-900 dark:text-white",
                      children: "Profile Privacy"
                    }), /* @__PURE__ */ jsxs("p", {
                      className: "text-sm text-gray-500 dark:text-gray-400",
                      children: [viewedUser?.privacy === "public" && "Public - Anyone can see your profile", viewedUser?.privacy === "friends" && "Connections only", viewedUser?.privacy === "private" && "Private - Only you can see"]
                    })]
                  }), /* @__PURE__ */ jsx(Badge, {
                    variant: viewedUser?.privacy === "public" ? "default" : viewedUser?.privacy === "friends" ? "secondary" : "destructive",
                    className: "bg-gradient-to-r from-blue-500 to-indigo-600",
                    children: viewedUser?.privacy?.charAt(0).toUpperCase() + viewedUser?.privacy?.slice(1)
                  })]
                }), /* @__PURE__ */ jsxs(Button, {
                  variant: "outline",
                  className: "w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                  onClick: () => setIsPrivacyOpen(true),
                  children: [/* @__PURE__ */ jsx(Settings, {
                    className: "h-4 w-4 mr-2"
                  }), "Privacy Settings"]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "lg:col-span-2 space-y-6",
            children: [isOwnProfile && /* @__PURE__ */ jsx(CreatePost, {
              user: viewedUser,
              onSubmit: handleCreatePost,
              placeholder: "What's on your mind",
              disabled: !viewedUser
            }), /* @__PURE__ */ jsxs(Tabs, {
              value: activeTab,
              onValueChange: setActiveTab,
              children: [/* @__PURE__ */ jsxs(TabsList, {
                className: "grid w-full grid-cols-3 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl",
                children: [/* @__PURE__ */ jsxs(TabsTrigger, {
                  value: "posts",
                  className: "rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm text-gray-700 dark:text-gray-300",
                  children: [/* @__PURE__ */ jsx(FileText, {
                    className: "h-4 w-4 mr-2"
                  }), "Posts"]
                }), /* @__PURE__ */ jsxs(TabsTrigger, {
                  value: "photos",
                  className: "rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm text-gray-700 dark:text-gray-300",
                  children: [/* @__PURE__ */ jsx(Image, {
                    className: "h-4 w-4 mr-2"
                  }), "Photos"]
                }), /* @__PURE__ */ jsxs(TabsTrigger, {
                  value: "videos",
                  className: "rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm text-gray-700 dark:text-gray-300",
                  children: [/* @__PURE__ */ jsx(Video, {
                    className: "h-4 w-4 mr-2"
                  }), "Videos"]
                })]
              }), /* @__PURE__ */ jsx(TabsContent, {
                value: "posts",
                className: "space-y-6 mt-6",
                children: posts.map((post) => /* @__PURE__ */ jsx(Post, {
                  ...post,
                  isOwnPost: post.user.id === viewedUser?.id,
                  onLike: handleLikePost,
                  onBookmark: handleBookmarkPost,
                  onComment: () => toast.info("Comment feature coming soon!"),
                  onShare: () => toast.success("Post shared!"),
                  onDelete: handleDeletePost
                }, post.id))
              }), /* @__PURE__ */ jsx(TabsContent, {
                value: "photos",
                children: /* @__PURE__ */ jsx(Card, {
                  className: "border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900",
                  children: /* @__PURE__ */ jsx(CardContent, {
                    className: "pt-6",
                    children: /* @__PURE__ */ jsx("div", {
                      className: "grid grid-cols-2 md:grid-cols-3 gap-4",
                      children: posts.filter((p) => p.image_url).map((post) => /* @__PURE__ */ jsxs("div", {
                        className: "relative group rounded-xl overflow-hidden",
                        children: [/* @__PURE__ */ jsx("img", {
                          src: post.image_url,
                          alt: "Post",
                          className: "w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300",
                          onClick: () => toast.info("Viewing photo in full screen")
                        }), /* @__PURE__ */ jsxs("div", {
                          className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3",
                          children: [/* @__PURE__ */ jsxs("div", {
                            className: "text-white",
                            children: [/* @__PURE__ */ jsx("p", {
                              className: "text-sm font-medium truncate",
                              children: post.user.full_name
                            }), /* @__PURE__ */ jsx("p", {
                              className: "text-xs opacity-90",
                              children: new Date(post.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric"
                              })
                            })]
                          }), /* @__PURE__ */ jsxs("div", {
                            className: "flex gap-2",
                            children: [/* @__PURE__ */ jsx(Button, {
                              size: "sm",
                              variant: "secondary",
                              className: "bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white",
                              onClick: () => handleLikePost(post.id),
                              children: /* @__PURE__ */ jsx(Heart, {
                                className: `h-3 w-3 ${post.liked ? "fill-current" : ""}`
                              })
                            }), /* @__PURE__ */ jsx(Button, {
                              size: "sm",
                              variant: "secondary",
                              className: "bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white",
                              onClick: () => toast.info("Comment on photo"),
                              children: /* @__PURE__ */ jsx(MessageSquare, {
                                className: "h-3 w-3"
                              })
                            })]
                          })]
                        })]
                      }, post.id))
                    })
                  })
                })
              }), /* @__PURE__ */ jsx(TabsContent, {
                value: "videos",
                children: /* @__PURE__ */ jsx(Card, {
                  className: "border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900",
                  children: /* @__PURE__ */ jsx(CardContent, {
                    className: "pt-6 text-center",
                    children: /* @__PURE__ */ jsxs("div", {
                      className: "py-12 space-y-4",
                      children: [/* @__PURE__ */ jsx("div", {
                        className: "h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
                        children: /* @__PURE__ */ jsx(Video, {
                          className: "h-8 w-8 text-gray-400"
                        })
                      }), /* @__PURE__ */ jsx("h3", {
                        className: "text-lg font-semibold text-gray-900 dark:text-white",
                        children: "No videos yet"
                      }), /* @__PURE__ */ jsx("p", {
                        className: "text-gray-500 dark:text-gray-400 max-w-sm mx-auto",
                        children: "Share your first video to showcase your work or team activities"
                      }), /* @__PURE__ */ jsx("div", {
                        className: "pt-4",
                        children: /* @__PURE__ */ jsxs(Button, {
                          variant: "outline",
                          onClick: () => toast.info("Video upload feature coming soon!"),
                          className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                          children: [/* @__PURE__ */ jsx(Video, {
                            className: "h-4 w-4 mr-2"
                          }), "Upload Your First Video"]
                        })
                      })]
                    })
                  })
                })
              })]
            })]
          })]
        })]
      }), /* @__PURE__ */ jsx(Dialog, {
        open: isEditing,
        onOpenChange: setIsEditing,
        children: /* @__PURE__ */ jsxs(DialogContent, {
          className: "max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          children: [/* @__PURE__ */ jsxs(DialogHeader, {
            children: [/* @__PURE__ */ jsx(DialogTitle, {
              className: "text-xl text-gray-900 dark:text-white",
              children: "Edit Profile"
            }), /* @__PURE__ */ jsx(DialogDescription, {
              className: "text-gray-600 dark:text-gray-400",
              children: "Update your professional profile information."
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-6 py-2",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "first_name",
                  className: "text-gray-900 dark:text-white",
                  children: "First Name"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "first_name",
                  value: editForm.first_name,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    first_name: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "last_name",
                  className: "text-gray-900 dark:text-white",
                  children: "Last Name"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "last_name",
                  value: editForm.last_name,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    last_name: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "bio",
                className: "text-gray-900 dark:text-white",
                children: "Professional Summary"
              }), /* @__PURE__ */ jsx(Textarea, {
                id: "bio",
                value: editForm.bio,
                onChange: (e) => setEditForm({
                  ...editForm,
                  bio: e.target.value
                }),
                placeholder: "Tell people about your professional background and expertise...",
                className: "min-h-[100px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "department",
                  className: "text-gray-900 dark:text-white",
                  children: "Department"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "department",
                  value: editForm.department,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    department: e.target.value
                  }),
                  placeholder: "Engineering, Marketing, HR, etc.",
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "position",
                  className: "text-gray-900 dark:text-white",
                  children: "Position"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "position",
                  value: editForm.position,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    position: e.target.value
                  }),
                  placeholder: "Your job title",
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "location",
                  className: "text-gray-900 dark:text-white",
                  children: "Location"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "location",
                  value: editForm.location,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    location: e.target.value
                  }),
                  placeholder: "City, Country",
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "phone",
                  className: "text-gray-900 dark:text-white",
                  children: "Phone"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "phone",
                  value: editForm.phone,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    phone: e.target.value
                  }),
                  placeholder: "+1 (555) 123-4567",
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "workplace",
                  className: "text-gray-900 dark:text-white",
                  children: "Company"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "workplace",
                  value: editForm.workplace,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    workplace: e.target.value
                  }),
                  placeholder: "Your company name",
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "hire_date",
                  className: "text-gray-900 dark:text-white",
                  children: "Hire Date"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "hire_date",
                  type: "date",
                  value: editForm.hire_date,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    hire_date: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "education",
                  className: "text-gray-900 dark:text-white",
                  children: "Education"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "education",
                  value: editForm.education,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    education: e.target.value
                  }),
                  placeholder: "Your educational background",
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "birthday",
                  className: "text-gray-900 dark:text-white",
                  children: "Birthday"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "birthday",
                  type: "date",
                  value: editForm.birthday,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    birthday: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "website",
                className: "text-gray-900 dark:text-white",
                children: "Website"
              }), /* @__PURE__ */ jsx(Input, {
                id: "website",
                value: editForm.website,
                onChange: (e) => setEditForm({
                  ...editForm,
                  website: e.target.value
                }),
                placeholder: "https://yourportfolio.com",
                className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "privacy",
                className: "text-gray-900 dark:text-white",
                children: "Profile Privacy"
              }), /* @__PURE__ */ jsxs("div", {
                className: "grid grid-cols-3 gap-2",
                children: [/* @__PURE__ */ jsxs(Button, {
                  type: "button",
                  variant: editForm.privacy === "public" ? "default" : "outline",
                  onClick: () => setEditForm({
                    ...editForm,
                    privacy: "public"
                  }),
                  className: "justify-start gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                  children: [/* @__PURE__ */ jsx(Globe, {
                    className: "h-4 w-4"
                  }), "Public"]
                }), /* @__PURE__ */ jsxs(Button, {
                  type: "button",
                  variant: editForm.privacy === "friends" ? "default" : "outline",
                  onClick: () => setEditForm({
                    ...editForm,
                    privacy: "friends"
                  }),
                  className: "justify-start gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                  children: [/* @__PURE__ */ jsx(Users, {
                    className: "h-4 w-4"
                  }), "Connections Only"]
                }), /* @__PURE__ */ jsxs(Button, {
                  type: "button",
                  variant: editForm.privacy === "private" ? "default" : "outline",
                  onClick: () => setEditForm({
                    ...editForm,
                    privacy: "private"
                  }),
                  className: "justify-start gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
                  children: [/* @__PURE__ */ jsx(Lock, {
                    className: "h-4 w-4"
                  }), "Private"]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs(DialogFooter, {
            children: [/* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => setIsEditing(false),
              className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
              children: "Cancel"
            }), /* @__PURE__ */ jsx(Button, {
              onClick: handleUpdateProfile,
              className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
              children: "Save Changes"
            })]
          })]
        })
      }), /* @__PURE__ */ jsx(Dialog, {
        open: isLogoutDialogOpen,
        onOpenChange: setIsLogoutDialogOpen,
        children: /* @__PURE__ */ jsxs(DialogContent, {
          className: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          children: [/* @__PURE__ */ jsxs(DialogHeader, {
            children: [/* @__PURE__ */ jsx(DialogTitle, {
              className: "text-gray-900 dark:text-white",
              children: "Log Out"
            }), /* @__PURE__ */ jsx(DialogDescription, {
              className: "text-gray-600 dark:text-gray-400",
              children: "Are you sure you want to log out? You will need to sign in again to access your account."
            })]
          }), /* @__PURE__ */ jsxs(DialogFooter, {
            children: [/* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => setIsLogoutDialogOpen(false),
              className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
              children: "Cancel"
            }), /* @__PURE__ */ jsxs(Button, {
              variant: "destructive",
              onClick: handleLogout,
              children: [/* @__PURE__ */ jsx(LogOut, {
                className: "h-4 w-4 mr-2"
              }), "Log Out"]
            })]
          })]
        })
      }), /* @__PURE__ */ jsx(Dialog, {
        open: isChangePasswordOpen,
        onOpenChange: setIsChangePasswordOpen,
        children: /* @__PURE__ */ jsxs(DialogContent, {
          className: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          children: [/* @__PURE__ */ jsxs(DialogHeader, {
            children: [/* @__PURE__ */ jsx(DialogTitle, {
              className: "text-gray-900 dark:text-white",
              children: "Change Password"
            }), /* @__PURE__ */ jsx(DialogDescription, {
              className: "text-gray-600 dark:text-gray-400",
              children: "Enter your current password and a new password to update your account security."
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4",
            children: [/* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "currentPassword",
                className: "text-gray-900 dark:text-white",
                children: "Current Password"
              }), /* @__PURE__ */ jsxs("div", {
                className: "relative",
                children: [/* @__PURE__ */ jsx(Input, {
                  id: "currentPassword",
                  type: showCurrentPassword ? "text" : "password",
                  value: passwordForm.currentPassword,
                  onChange: (e) => setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                }), /* @__PURE__ */ jsx(Button, {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400",
                  onClick: () => setShowCurrentPassword(!showCurrentPassword),
                  children: showCurrentPassword ? /* @__PURE__ */ jsx(EyeOff, {
                    className: "h-4 w-4"
                  }) : /* @__PURE__ */ jsx(Eye, {
                    className: "h-4 w-4"
                  })
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "newPassword",
                className: "text-gray-900 dark:text-white",
                children: "New Password"
              }), /* @__PURE__ */ jsxs("div", {
                className: "relative",
                children: [/* @__PURE__ */ jsx(Input, {
                  id: "newPassword",
                  type: showNewPassword ? "text" : "password",
                  value: passwordForm.newPassword,
                  onChange: (e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                }), /* @__PURE__ */ jsx(Button, {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400",
                  onClick: () => setShowNewPassword(!showNewPassword),
                  children: showNewPassword ? /* @__PURE__ */ jsx(EyeOff, {
                    className: "h-4 w-4"
                  }) : /* @__PURE__ */ jsx(Eye, {
                    className: "h-4 w-4"
                  })
                })]
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "space-y-2",
              children: [/* @__PURE__ */ jsx(Label, {
                htmlFor: "confirmPassword",
                className: "text-gray-900 dark:text-white",
                children: "Confirm New Password"
              }), /* @__PURE__ */ jsxs("div", {
                className: "relative",
                children: [/* @__PURE__ */ jsx(Input, {
                  id: "confirmPassword",
                  type: showConfirmPassword ? "text" : "password",
                  value: passwordForm.confirmPassword,
                  onChange: (e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  }),
                  className: "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                }), /* @__PURE__ */ jsx(Button, {
                  type: "button",
                  variant: "ghost",
                  size: "sm",
                  className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400",
                  onClick: () => setShowConfirmPassword(!showConfirmPassword),
                  children: showConfirmPassword ? /* @__PURE__ */ jsx(EyeOff, {
                    className: "h-4 w-4"
                  }) : /* @__PURE__ */ jsx(Eye, {
                    className: "h-4 w-4"
                  })
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs(DialogFooter, {
            children: [/* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => setIsChangePasswordOpen(false),
              className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
              children: "Cancel"
            }), /* @__PURE__ */ jsxs(Button, {
              onClick: handleChangePassword,
              disabled: isChangingPassword,
              className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
              children: [isChangingPassword ? /* @__PURE__ */ jsx(Loader2, {
                className: "h-4 w-4 mr-2 animate-spin"
              }) : null, "Change Password"]
            })]
          })]
        })
      }), /* @__PURE__ */ jsx(Dialog, {
        open: isPrivacyOpen,
        onOpenChange: setIsPrivacyOpen,
        children: /* @__PURE__ */ jsxs(DialogContent, {
          className: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
          children: [/* @__PURE__ */ jsxs(DialogHeader, {
            children: [/* @__PURE__ */ jsx(DialogTitle, {
              className: "text-gray-900 dark:text-white",
              children: "Privacy Settings"
            }), /* @__PURE__ */ jsx(DialogDescription, {
              className: "text-gray-600 dark:text-gray-400",
              children: "Control who can see your profile and activity on DeskStaff."
            })]
          }), /* @__PURE__ */ jsx("div", {
            className: "space-y-6",
            children: /* @__PURE__ */ jsxs("div", {
              className: "space-y-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-between",
                children: [/* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "font-medium text-gray-900 dark:text-white",
                    children: "Profile Visibility"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-sm text-gray-500 dark:text-gray-400",
                    children: "Who can see your profile?"
                  })]
                }), /* @__PURE__ */ jsxs("select", {
                  className: "border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                  value: editForm.privacy,
                  onChange: (e) => setEditForm({
                    ...editForm,
                    privacy: e.target.value
                  }),
                  children: [/* @__PURE__ */ jsx("option", {
                    value: "public",
                    children: "Public"
                  }), /* @__PURE__ */ jsx("option", {
                    value: "friends",
                    children: "Connections Only"
                  }), /* @__PURE__ */ jsx("option", {
                    value: "private",
                    children: "Private"
                  })]
                })]
              }), /* @__PURE__ */ jsx(Separator, {
                className: "bg-gray-200 dark:bg-gray-700"
              }), /* @__PURE__ */ jsxs("div", {
                className: "space-y-3",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "font-medium text-gray-900 dark:text-white",
                      children: "Email Visibility"
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-sm text-gray-500 dark:text-gray-400",
                      children: "Who can see your email?"
                    })]
                  }), /* @__PURE__ */ jsxs("select", {
                    className: "border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                    children: [/* @__PURE__ */ jsx("option", {
                      children: "Only Me"
                    }), /* @__PURE__ */ jsx("option", {
                      children: "Connections"
                    })]
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "font-medium text-gray-900 dark:text-white",
                      children: "Connections List"
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-sm text-gray-500 dark:text-gray-400",
                      children: "Who can see your connections?"
                    })]
                  }), /* @__PURE__ */ jsxs("select", {
                    className: "border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                    children: [/* @__PURE__ */ jsx("option", {
                      children: "Public"
                    }), /* @__PURE__ */ jsx("option", {
                      children: "Connections Only"
                    }), /* @__PURE__ */ jsx("option", {
                      children: "Only Me"
                    })]
                  })]
                }), /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [/* @__PURE__ */ jsxs("div", {
                    children: [/* @__PURE__ */ jsx("p", {
                      className: "font-medium text-gray-900 dark:text-white",
                      children: "Post Visibility"
                    }), /* @__PURE__ */ jsx("p", {
                      className: "text-sm text-gray-500 dark:text-gray-400",
                      children: "Default audience for new posts"
                    })]
                  }), /* @__PURE__ */ jsxs("select", {
                    className: "border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                    children: [/* @__PURE__ */ jsx("option", {
                      children: "Public"
                    }), /* @__PURE__ */ jsx("option", {
                      children: "Connections Only"
                    }), /* @__PURE__ */ jsx("option", {
                      children: "Only Me"
                    })]
                  })]
                })]
              })]
            })
          }), /* @__PURE__ */ jsxs(DialogFooter, {
            children: [/* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => setIsPrivacyOpen(false),
              className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
              children: "Cancel"
            }), /* @__PURE__ */ jsx(Button, {
              onClick: () => {
                handleUpdateProfile();
                setIsPrivacyOpen(false);
                toast.success("Privacy settings updated");
              },
              className: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
              children: "Save Privacy Settings"
            })]
          })]
        })
      }), /* @__PURE__ */ jsxs("div", {
        className: "fixed bottom-4 right-4 flex flex-col gap-2",
        children: [/* @__PURE__ */ jsx(Button, {
          variant: "outline",
          size: "sm",
          onClick: testLoginStatusUpdate,
          className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
          children: "Test Login Status Update"
        }), /* @__PURE__ */ jsx(Button, {
          onClick: () => {
            console.log("Current states:", {
              loggedInUser,
              viewedUser,
              currentUserId,
              loading
            });
            fetchUserData();
          },
          className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
          size: "sm",
          children: "Debug Fetch"
        })]
      })]
    })
  });
});
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: profile
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DCpKj6do.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/index-BRs_dBEV.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-C5uW3vdT.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/index-BRs_dBEV.js", "/assets/ThemeProvider-1bH72AO7.js", "/assets/supabase-BO81Wobz.js"], "css": ["/assets/root-D5ftVr6z.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/login-BlI_JUj0.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/card-DCCwVGqU.js", "/assets/AuthChecker-lr5Qdb8c.js", "/assets/AuthLayout-_UhsZK27.js", "/assets/alert-9_S9W-Db.js", "/assets/supabase-BO81Wobz.js", "/assets/mail-BwQk4DBE.js", "/assets/lock-RqldTzhB.js", "/assets/loader-circle-B5kmy_fB.js", "/assets/index-BRs_dBEV.js", "/assets/ThemeProvider-1bH72AO7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/register": { "id": "routes/register", "parentId": "root", "path": "register", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/register-CZV6nYwK.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/card-DCCwVGqU.js", "/assets/AuthChecker-lr5Qdb8c.js", "/assets/AuthLayout-_UhsZK27.js", "/assets/alert-9_S9W-Db.js", "/assets/index-BMxA-PKL.js", "/assets/index-BRs_dBEV.js", "/assets/loader-circle-B5kmy_fB.js", "/assets/supabase-BO81Wobz.js", "/assets/triangle-alert-CiF5QaMf.js", "/assets/ThemeProvider-1bH72AO7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/callback": { "id": "routes/auth/callback", "parentId": "root", "path": "auth/callback", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/callback-D9M2kDCW.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/supabase-BO81Wobz.js", "/assets/card-DCCwVGqU.js", "/assets/alert-9_S9W-Db.js", "/assets/badge-z8JLICnP.js", "/assets/loader-circle-B5kmy_fB.js", "/assets/triangle-alert-CiF5QaMf.js", "/assets/mail-BwQk4DBE.js", "/assets/index-BRs_dBEV.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/GoogleAuth": { "id": "routes/auth/GoogleAuth", "parentId": "root", "path": "auth/google", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/GoogleAuth-Bi6BMt8T.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/supabase-BO81Wobz.js", "/assets/alert-9_S9W-Db.js", "/assets/loader-circle-B5kmy_fB.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/profile": { "id": "routes/profile", "parentId": "root", "path": "profile/:userId", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/profile-DMv3k22F.js", "imports": ["/assets/chunk-EPOLDU6W-BHelFxtI.js", "/assets/supabase-BO81Wobz.js", "/assets/AuthChecker-lr5Qdb8c.js", "/assets/card-DCCwVGqU.js", "/assets/badge-z8JLICnP.js", "/assets/index-BMxA-PKL.js", "/assets/loader-circle-B5kmy_fB.js", "/assets/index-BRs_dBEV.js", "/assets/mail-BwQk4DBE.js", "/assets/lock-RqldTzhB.js", "/assets/ThemeProvider-1bH72AO7.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-461f3ce3.js", "version": "461f3ce3", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/register": {
    id: "routes/register",
    parentId: "root",
    path: "register",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/auth/callback": {
    id: "routes/auth/callback",
    parentId: "root",
    path: "auth/callback",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/auth/GoogleAuth": {
    id: "routes/auth/GoogleAuth",
    parentId: "root",
    path: "auth/google",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/profile": {
    id: "routes/profile",
    parentId: "root",
    path: "profile/:userId",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  }
};
const allowedActionOrigins = false;
export {
  allowedActionOrigins,
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
