import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, useNavigate, Link, useLocation } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import * as React from "react";
import { useState, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, Sun, Moon, AlertCircle, XCircle, Info, Loader2, UserX, ShieldAlert, MailWarning, CheckCircle, EyeOff, Eye, LogIn, Shield, Mail, ExternalLink, RefreshCw, AlertTriangle, MailCheck, Clock, ArrowRight, CheckSquare, User, Lock, ShieldCheck } from "lucide-react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { createClient } from "@supabase/supabase-js";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { motion } from "framer-motion";
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
  return /* @__PURE__ */ jsx(ThemeProvider, {
    children: /* @__PURE__ */ jsx(Outlet, {})
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
const registerIllustration = "/Deskstaff/assets/login-illustration-mQR2nY1C.jpg";
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
function CardFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "card-footer",
      className: cn("flex items-center px-6 [.border-t]:pt-6", className),
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
      className: "rounded-full w-10 h-10 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 hover:scale-105 transition-transform",
      "aria-label": "Toggle theme",
      children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "h-5 w-5" }) : /* @__PURE__ */ jsx(Moon, { className: "h-5 w-5" })
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
const login = UNSAFE_withComponentProps(function Login() {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };
  return /* @__PURE__ */ jsx(AuthLayout, {
    illustration: registerIllustration,
    illustrationAlt: "Login illustration",
    gradientFrom: "from-red-50",
    gradientTo: "to-neutral-100",
    children: /* @__PURE__ */ jsxs("div", {
      className: "w-full max-w-md",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "mb-8",
        children: [/* @__PURE__ */ jsx("h1", {
          className: "text-2xl font-semibold tracking-tight dark:text-white",
          children: "Welcome Back"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-sm text-muted-foreground dark:text-gray-400",
          children: "Welcome back! Please enter your details."
        })]
      }), /* @__PURE__ */ jsxs("form", {
        onSubmit: handleSubmit,
        className: "space-y-6",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsx(Label, {
            htmlFor: "email",
            className: "dark:text-gray-300",
            children: "Email"
          }), /* @__PURE__ */ jsx(Input, {
            id: "email",
            type: "email",
            placeholder: "Enter your email",
            className: "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
            required: true
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "space-y-2",
          children: [/* @__PURE__ */ jsx(Label, {
            htmlFor: "password",
            className: "dark:text-gray-300",
            children: "Password"
          }), /* @__PURE__ */ jsx(Input, {
            id: "password",
            type: "password",
            placeholder: "••••••••",
            className: "dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400",
            required: true
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex items-center justify-between text-sm",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "flex items-center space-x-2",
            children: [/* @__PURE__ */ jsx(Checkbox, {
              id: "remember",
              className: "dark:border-gray-600 dark:data-[state=checked]:bg-primary"
            }), /* @__PURE__ */ jsx(Label, {
              htmlFor: "remember",
              className: "font-normal dark:text-gray-400",
              children: "Remember me"
            })]
          }), /* @__PURE__ */ jsx(Link, {
            to: "/forgot-password",
            className: "text-primary hover:underline dark:text-primary-400",
            children: "Forgot password"
          })]
        }), /* @__PURE__ */ jsx(Button, {
          type: "submit",
          className: "w-full",
          size: "lg",
          children: "Sign in"
        }), /* @__PURE__ */ jsxs("div", {
          className: "relative",
          children: [/* @__PURE__ */ jsx("div", {
            className: "absolute inset-0 flex items-center",
            children: /* @__PURE__ */ jsx("span", {
              className: "w-full border-t border-border dark:border-gray-700"
            })
          }), /* @__PURE__ */ jsx("div", {
            className: "relative flex justify-center text-xs uppercase",
            children: /* @__PURE__ */ jsx("span", {
              className: "bg-card dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400",
              children: "Or continue with"
            })
          })]
        }), /* @__PURE__ */ jsxs(Button, {
          type: "button",
          variant: "outline",
          size: "lg",
          className: "w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
          children: [/* @__PURE__ */ jsx("img", {
            src: "https://www.svgrepo.com/show/475656/google-color.svg",
            alt: "Google",
            className: "h-5 w-5"
          }), "Sign in with Google"]
        })]
      }), /* @__PURE__ */ jsxs("p", {
        className: "mt-8 text-center text-sm text-muted-foreground dark:text-gray-400",
        children: ["Don't have an account?", " ", /* @__PURE__ */ jsx(Link, {
          to: "/register",
          className: "text-primary font-medium hover:underline dark:text-primary-400",
          children: "Sign up for free"
        })]
      })]
    })
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: login
}, Symbol.toStringTag, { value: "Module" }));
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
const supabaseUrl = "https://zmkgfngbmyzewbkhxffe.supabase.co";
const supabaseAnonKey = "sb_publishable_QQR1p7r0-ZoxvQ6r0DR1gQ_pWSOebv8";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  }
});
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
  const [emailExists, setEmailExists] = React.useState(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = React.useState("none");
  const disposableEmailDomains = ["tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com", "yopmail.com", "throwawaymail.com", "fakeinbox.com", "temp-mail.org", "trashmail.com", "dispostable.com", "getairmail.com", "maildrop.cc", "tempmailaddress.com", "fake-mail.com", "mytemp.email", "tempemail.net"];
  const commonEmailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
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
      text: "Weak",
      description: "Easy to crack"
    },
    medium: {
      color: "bg-yellow-500",
      text: "Medium",
      description: "Could be stronger"
    },
    strong: {
      color: "bg-green-500",
      text: "Strong",
      description: "Good password"
    },
    "very-strong": {
      color: "bg-emerald-600",
      text: "Very Strong",
      description: "Excellent password"
    }
  };
  const checkEmailExists = React.useCallback(async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailExists(false);
      setEmailVerificationStatus("none");
      return false;
    }
    const cached = emailCheckCache.get(normalizedEmail);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setEmailExists(cached.exists);
      setEmailVerificationStatus(cached.isVerified ? "verified" : "unverified");
      return cached.exists;
    }
    setIsCheckingEmail(true);
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.from("users").select("email, email_verified").eq("email", normalizedEmail).maybeSingle();
      if (userError) {
        console.error("Database query error:", userError);
        emailCheckCache.set(normalizedEmail, {
          exists: false,
          timestamp: Date.now()
        });
        setEmailExists(false);
        setEmailVerificationStatus("none");
        return false;
      }
      const exists = !!userData;
      const isVerified = userData?.email_verified || false;
      emailCheckCache.set(normalizedEmail, {
        exists,
        timestamp: Date.now(),
        isVerified
      });
      setEmailExists(exists);
      setEmailVerificationStatus(exists ? isVerified ? "verified" : "unverified" : "none");
      setErrors((prev) => {
        const newErrors = {
          ...prev
        };
        delete newErrors.email;
        return newErrors;
      });
      return exists;
    } catch (error) {
      console.error("Error checking email:", error);
      emailCheckCache.set(normalizedEmail, {
        exists: false,
        timestamp: Date.now()
      });
      setEmailExists(false);
      setEmailVerificationStatus("none");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);
  const validateEmail = React.useCallback((email) => {
    const newErrors = {};
    const suggestions = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = "Email is required";
      return {
        errors: newErrors,
        suggestions
      };
    }
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
      return {
        errors: newErrors,
        suggestions
      };
    }
    const [localPart, domain] = email.split("@");
    if (domain) {
      const isDisposable = disposableEmailDomains.some((disposable) => domain.toLowerCase().includes(disposable.toLowerCase()));
      if (isDisposable) {
        newErrors.email = "Please use a permanent email address";
        suggestions.push("Disposable/temporary emails are not allowed");
      }
      const typedDomain = domain.toLowerCase();
      for (const commonDomain of commonEmailDomains) {
        if (typedDomain.includes(commonDomain.replace(".", "")) || typedDomain.length >= 3 && commonDomain.includes(typedDomain) || levenshteinDistance(typedDomain, commonDomain) <= 2) {
          const suggestedEmail = `${localPart}@${commonDomain}`;
          if (suggestedEmail !== email.toLowerCase()) {
            suggestions.push(`Did you mean ${suggestedEmail}?`);
          }
        }
      }
      const validTLDs = ["com", "org", "net", "edu", "gov", "io", "co", "ai", "dev", "me", "info", "biz", "us", "uk", "ca", "au", "in"];
      const tld = domain.split(".").pop()?.toLowerCase();
      if (tld && !validTLDs.includes(tld) && tld.length <= 3) {
        suggestions.push("This email domain might be incorrect");
      }
      if (localPart.length > 50) {
        suggestions.push("Email username seems unusually long");
      }
      if (domain.split(".").length > 3) {
        suggestions.push("Email domain has too many subdomains");
      }
    }
    return {
      errors: newErrors,
      suggestions
    };
  }, []);
  const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator);
      }
    }
    return matrix[b.length][a.length];
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
      if (emailExists) {
        setEmailExists(false);
        setEmailVerificationStatus("none");
      }
      emailCheckCache.delete(value.toLowerCase());
    }
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value
    }));
    if (id === "email") {
      const {
        errors: emailErrors,
        suggestions
      } = validateEmail(value);
      setEmailSuggestions(suggestions);
      setErrors((prev) => {
        const newErrors = {
          ...prev
        };
        if (emailErrors.email) {
          newErrors.email = emailErrors.email;
          delete newErrors.submit;
        } else if (newErrors.email) {
          delete newErrors.email;
        }
        return newErrors;
      });
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value) && !emailErrors.email) {
        const domain = value.split("@")[1];
        const isDisposable = domain && disposableEmailDomains.some((disposable) => domain.toLowerCase().includes(disposable.toLowerCase()));
        if (!isDisposable) {
          debouncedEmailCheck.current = setTimeout(() => {
            checkEmailExists(value);
          }, 800);
        }
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
    return () => {
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }
    };
  }, []);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    const {
      errors: emailErrors
    } = validateEmail(formData.email);
    Object.assign(newErrors, emailErrors);
    if (!emailErrors.email && emailExists) {
      if (emailVerificationStatus === "verified") {
        newErrors.email = "This email is already registered and verified. Please use a different email or try logging in.";
      } else if (emailVerificationStatus === "unverified") {
        newErrors.email = "This email is registered but not verified. Please check your email for the verification link or request a new one.";
      } else {
        newErrors.email = "This email is already registered. Please use a different email or try logging in.";
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
        data: userData
      } = await supabase.from("users").select("email, email_verified").eq("email", normalizedEmail).maybeSingle();
      if (userData) {
        emailCheckCache.set(normalizedEmail, {
          exists: true,
          timestamp: Date.now(),
          isVerified: userData.email_verified
        });
        setEmailExists(true);
        setEmailVerificationStatus(userData.email_verified ? "verified" : "unverified");
        if (userData.email_verified) {
          setErrors({
            submit: "This email is already registered and verified. Please use a different email or try logging in."
          });
        } else {
          setErrors({
            submit: "This email is registered but not verified. Please check your email for verification or visit the verification page."
          });
        }
        return;
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
            timestamp: Date.now()
          });
          setEmailExists(true);
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
              // Ensure it's false
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            }).eq("email", normalizedEmail);
            if (updateError) {
              console.error("Error updating user in users table:", updateError);
            }
          }
        }
      } catch (dbError) {
        console.error("Database insert/update error:", dbError);
      }
      try {
        const {
          data: unverifiedUser
        } = await supabase.from("users").select("*").eq("email", normalizedEmail).eq("email_verified", false).maybeSingle();
        if (!unverifiedUser) {
          console.warn("User was not added to unverified_users");
          await supabase.from("users").update({
            email_verified: false
          }).eq("email", normalizedEmail);
        } else {
          console.log("User successfully added to unverified_users");
        }
      } catch (verificationError) {
        console.error("Error verifying unverified user status:", verificationError);
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", formData.email);
        localStorage.setItem("pending_user_id", authData.user.id);
      }
      navigate("/auth/callback", {
        state: {
          email: formData.email,
          userId: authData.user.id,
          message: "Registration successful! Please check your email to verify your account. Your account has been added to unverified users until you verify your email."
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        setErrors({
          submit: error.message
        });
      } else {
        setErrors({
          submit: "Registration failed. Please try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  const canSubmit = formData.terms && passwordsMatch && formData.password.length >= 8 && !errors.email && !emailExists && formData.email.includes("@");
  const getEmailDomainInfo = () => {
    const domain = formData.email.split("@")[1];
    if (!domain) return null;
    const domainInfo = {
      "gmail.com": {
        icon: /* @__PURE__ */ jsx("span", {
          className: "text-xs",
          children: "📧"
        }),
        message: "Gmail",
        color: "text-red-500"
      },
      "yahoo.com": {
        icon: /* @__PURE__ */ jsx("span", {
          className: "text-xs",
          children: "🌈"
        }),
        message: "Yahoo Mail",
        color: "text-purple-500"
      },
      "outlook.com": {
        icon: /* @__PURE__ */ jsx("span", {
          className: "text-xs",
          children: "📨"
        }),
        message: "Outlook",
        color: "text-blue-500"
      },
      "hotmail.com": {
        icon: /* @__PURE__ */ jsx("span", {
          className: "text-xs",
          children: "🔥"
        }),
        message: "Hotmail",
        color: "text-orange-500"
      },
      "icloud.com": {
        icon: /* @__PURE__ */ jsx("span", {
          className: "text-xs",
          children: "☁️"
        }),
        message: "iCloud",
        color: "text-gray-500"
      }
    };
    return domainInfo[domain.toLowerCase()] || {
      icon: /* @__PURE__ */ jsx("span", {
        className: "text-xs",
        children: "📧"
      }),
      message: `@${domain}`,
      color: "text-gray-500"
    };
  };
  const emailDomainInfo = getEmailDomainInfo();
  return /* @__PURE__ */ jsx(AuthLayout, {
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
              children: [emailDomainInfo && formData.email.includes("@") && !errors.email && /* @__PURE__ */ jsxs("div", {
                className: `text-xs font-medium flex items-center gap-1 ${emailDomainInfo.color}`,
                children: [emailDomainInfo.icon, /* @__PURE__ */ jsx("span", {
                  children: emailDomainInfo.message
                })]
              }), isCheckingEmail && /* @__PURE__ */ jsx(Loader2, {
                className: "h-3 w-3 animate-spin text-gray-500"
              }), emailExists && !isCheckingEmail && formData.email.includes("@") && /* @__PURE__ */ jsx("div", {
                className: "flex items-center gap-1 text-xs",
                children: emailVerificationStatus === "verified" ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(UserX, {
                    className: "h-3 w-3 text-red-500"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-red-500",
                    children: "Already registered & verified"
                  })]
                }) : /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(ShieldAlert, {
                    className: "h-3 w-3 text-amber-500"
                  }), /* @__PURE__ */ jsx("span", {
                    className: "text-amber-500",
                    children: "Registered but not verified"
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
              className: `dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${errors.email || emailExists ? "border-red-500 dark:border-red-500" : ""}`,
              value: formData.email,
              onChange: handleChange,
              disabled: isSubmitting,
              required: true
            }), /* @__PURE__ */ jsx("div", {
              className: "absolute right-3 top-1/2 -translate-y-1/2",
              children: errors.email || emailExists ? /* @__PURE__ */ jsx(MailWarning, {
                className: "h-4 w-4 text-red-500"
              }) : formData.email.includes("@") && !errors.email && !emailExists ? /* @__PURE__ */ jsx(CheckCircle, {
                className: "h-4 w-4 text-green-500"
              }) : null
            })]
          }), (errors.email || emailExists) && /* @__PURE__ */ jsxs("div", {
            className: "space-y-1",
            children: [/* @__PURE__ */ jsxs("p", {
              className: "text-xs text-red-500 flex items-center gap-1",
              children: [/* @__PURE__ */ jsx(XCircle, {
                className: "h-3 w-3"
              }), emailExists ? emailVerificationStatus === "verified" ? "This email is already registered and verified. Please use a different email or try logging in." : "This email is registered but not verified. Please check your email for the verification link or request a new one." : errors.email]
            }), emailSuggestions.length > 0 && /* @__PURE__ */ jsx("div", {
              className: "text-xs text-amber-600 dark:text-amber-400",
              children: emailSuggestions.map((suggestion, index) => /* @__PURE__ */ jsxs("p", {
                className: "flex items-center gap-1",
                children: [/* @__PURE__ */ jsx(AlertCircle, {
                  className: "h-3 w-3"
                }), suggestion]
              }, index))
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-1 mt-2",
            children: [/* @__PURE__ */ jsx("p", {
              className: "text-xs font-medium dark:text-gray-400",
              children: "Email requirements:"
            }), /* @__PURE__ */ jsx("div", {
              className: "space-y-1",
              children: [{
                key: "format",
                met: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
                label: "Valid email format (user@domain.com)"
              }, {
                key: "disposable",
                met: !disposableEmailDomains.some((domain) => formData.email.toLowerCase().includes(domain.toLowerCase())),
                label: "Not a disposable/temporary email"
              }, {
                key: "available",
                met: !emailExists && !isCheckingEmail && formData.email.includes("@"),
                label: "Email not already registered",
                loading: isCheckingEmail
              }, {
                key: "verification",
                met: emailVerificationStatus !== "verified",
                label: "Email not already verified",
                showOnlyIfRegistered: true
              }].map(({
                key,
                met,
                label,
                loading,
                showOnlyIfRegistered
              }) => {
                if (showOnlyIfRegistered && !emailExists) return null;
                return /* @__PURE__ */ jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [loading ? /* @__PURE__ */ jsx(Loader2, {
                    className: "h-3 w-3 animate-spin text-gray-500"
                  }) : met || !formData.email ? /* @__PURE__ */ jsx(CheckCircle, {
                    className: "h-3 w-3 text-green-500"
                  }) : /* @__PURE__ */ jsx(XCircle, {
                    className: "h-3 w-3 text-red-500"
                  }), /* @__PURE__ */ jsx("span", {
                    className: `text-xs ${met ? "text-green-600 dark:text-green-500" : loading ? "text-gray-500" : "text-red-500 dark:text-red-400"}`,
                    children: label
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
          }), formData.password && /* @__PURE__ */ jsxs("div", {
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
            disabled: isSubmitting,
            children: [/* @__PURE__ */ jsx("img", {
              src: "https://www.svgrepo.com/show/475656/google-color.svg",
              alt: "Google",
              className: "h-5 w-5"
            }), "Sign up with Google"]
          }), /* @__PURE__ */ jsxs(Button, {
            type: "button",
            variant: "outline",
            size: "lg",
            className: "w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700",
            disabled: isSubmitting,
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
  });
});
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: register
}, Symbol.toStringTag, { value: "Module" }));
const callback = UNSAFE_withComponentProps(function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(3);
  const MAX_RETRIES = 3;
  const getPendingEmail = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pending_email") || "";
    }
    return "";
  };
  const getPendingUserId = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pending_user_id") || null;
    }
    return null;
  };
  const clearPendingData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_email");
      localStorage.removeItem("pending_user_id");
    }
  };
  const checkUserVerificationStatus = async (userEmail, userId2) => {
    try {
      const {
        data: userData,
        error: userError
      } = await supabase.from("users").select("email_verified, id, email, first_name, last_name").eq("email", userEmail.toLowerCase()).maybeSingle();
      if (userError) {
        console.error("Error checking user verification:", userError);
        return {
          verified: false,
          error: userError.message
        };
      }
      if (!userData) {
        return {
          verified: false,
          error: "User not found in database"
        };
      }
      const isVerifiedInDB = userData.email_verified === true;
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session check error:", sessionError);
        return {
          verified: isVerifiedInDB,
          userId: userData.id,
          userData,
          dbVerified: isVerifiedInDB,
          authVerified: false
        };
      }
      const isVerifiedInAuth = session?.user?.email_confirmed_at !== null || session?.user?.confirmed_at !== null;
      const isFullyVerified = isVerifiedInDB && isVerifiedInAuth;
      return {
        verified: isFullyVerified,
        userId: userData.id,
        userData,
        dbVerified: isVerifiedInDB,
        authVerified: isVerifiedInAuth
      };
    } catch (error) {
      console.error("Exception checking verification status:", error);
      return {
        verified: false,
        error: "Failed to check verification status"
      };
    }
  };
  const updateUserVerificationInDB = async (userEmail, isVerified) => {
    try {
      const {
        error
      } = await supabase.from("users").update({
        email_verified: isVerified,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("email", userEmail.toLowerCase());
      if (error) {
        console.error("Error updating user verification in DB:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Exception updating verification in DB:", error);
      return false;
    }
  };
  const checkIfAlreadyVerified = async (userEmail) => {
    try {
      const {
        verified,
        dbVerified,
        authVerified,
        userData
      } = await checkUserVerificationStatus(userEmail);
      if (verified) {
        setStatus("already_verified");
        setMessage(`Welcome back ${userData?.first_name || ""}! Your email is already verified. Redirecting to login...`);
        clearPendingData();
        const timer = setInterval(() => {
          setAutoRedirectTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/login", {
                state: {
                  message: "Email already verified! You can now log in.",
                  email: userEmail
                }
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1e3);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking if already verified:", error);
      return false;
    }
  };
  const waitAndRetryVerification = async (userEmail, currentRetry) => {
    if (currentRetry >= MAX_RETRIES) {
      setStatus("unverified");
      setMessage(`Email verification is taking longer than expected. Please check your email at ${userEmail} and click the verification link. You may need to manually refresh this page after verifying.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const {
      verified,
      dbVerified,
      authVerified
    } = await checkUserVerificationStatus(userEmail);
    if (verified) {
      if (!dbVerified) {
        await updateUserVerificationInDB(userEmail, true);
      }
      setStatus("success");
      setMessage("Email verified successfully! Your account is now active.");
      clearPendingData();
      const timer = setInterval(() => {
        setAutoRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/login", {
              state: {
                message: "Email verified successfully! You can now log in.",
                email: userEmail
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
    } else if (authVerified && !dbVerified) {
      await updateUserVerificationInDB(userEmail, true);
      setStatus("success");
      setMessage("Email verified successfully! Database updated.");
      clearPendingData();
      const timer = setInterval(() => {
        setAutoRedirectTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/login", {
              state: {
                message: "Email verified successfully! You can now log in.",
                email: userEmail
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
    } else {
      setRetryCount(currentRetry + 1);
      setStatus("checking_verification");
      setMessage(`Still checking verification status... (Attempt ${currentRetry + 1}/${MAX_RETRIES})`);
      setTimeout(() => {
        waitAndRetryVerification(userEmail, currentRetry + 1);
      }, 3e3);
    }
  };
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const pendingEmail = location.state?.email || getPendingEmail();
        const pendingUserId = location.state?.userId || getPendingUserId();
        setEmail(pendingEmail);
        setUserId(pendingUserId);
        const isAlreadyVerified = await checkIfAlreadyVerified(pendingEmail);
        if (isAlreadyVerified) {
          return;
        }
        const hash = window.location.hash;
        if (hash.includes("type=signup") || hash.includes("token=")) {
          setStatus("checking_verification");
          setMessage("Verifying your email... Please wait.");
          const {
            error: sessionError
          } = await supabase.auth.getSession();
          if (sessionError) {
            console.error("Session error after email verification:", sessionError);
            setStatus("error");
            setMessage("Email verification failed. Please try again.");
            return;
          }
          const {
            verified,
            dbVerified,
            authVerified,
            error
          } = await checkUserVerificationStatus(pendingEmail);
          if (error && error !== "User not found in database") {
            console.error("Verification check error:", error);
          }
          if (verified) {
            if (!dbVerified) {
              await updateUserVerificationInDB(pendingEmail, true);
            }
            setStatus("success");
            setMessage("Email verified successfully! Your account is now active.");
            clearPendingData();
            const timer2 = setInterval(() => {
              setAutoRedirectTimer((prev) => {
                if (prev <= 1) {
                  clearInterval(timer2);
                  navigate("/login", {
                    state: {
                      message: "Email verified successfully! You can now log in.",
                      email: pendingEmail
                    }
                  });
                  return 0;
                }
                return prev - 1;
              });
            }, 1e3);
          } else if (authVerified && !dbVerified) {
            await updateUserVerificationInDB(pendingEmail, true);
            setStatus("success");
            setMessage("Email verified successfully! Database updated.");
            clearPendingData();
            const timer2 = setInterval(() => {
              setAutoRedirectTimer((prev) => {
                if (prev <= 1) {
                  clearInterval(timer2);
                  navigate("/login", {
                    state: {
                      message: "Email verified successfully! You can now log in.",
                      email: pendingEmail
                    }
                  });
                  return 0;
                }
                return prev - 1;
              });
            }, 1e3);
          } else {
            setStatus("checking_verification");
            setMessage("Email verification in progress... Checking status.");
            setRetryCount(0);
            setTimeout(() => {
              waitAndRetryVerification(pendingEmail, 0);
            }, 3e3);
          }
        } else {
          const {
            verified,
            dbVerified,
            authVerified
          } = await checkUserVerificationStatus(pendingEmail);
          if (verified) {
            setStatus("success");
            setMessage("Your email is already verified! You can now log in.");
            clearPendingData();
            const timer2 = setInterval(() => {
              setAutoRedirectTimer((prev) => {
                if (prev <= 1) {
                  clearInterval(timer2);
                  navigate("/login", {
                    state: {
                      message: "Email already verified! You can now log in.",
                      email: pendingEmail
                    }
                  });
                  return 0;
                }
                return prev - 1;
              });
            }, 1e3);
          } else if (authVerified && !dbVerified) {
            await updateUserVerificationInDB(pendingEmail, true);
            setStatus("success");
            setMessage("Email verification completed! Database updated.");
            clearPendingData();
            const timer2 = setInterval(() => {
              setAutoRedirectTimer((prev) => {
                if (prev <= 1) {
                  clearInterval(timer2);
                  navigate("/login", {
                    state: {
                      message: "Email verified successfully! You can now log in.",
                      email: pendingEmail
                    }
                  });
                  return 0;
                }
                return prev - 1;
              });
            }, 1e3);
          } else {
            setStatus("pending");
            setMessage(`Registration completed! We've sent a verification email to ${pendingEmail}. Please check your inbox and click the link to activate your account.`);
            const checkInterval = setInterval(async () => {
              const {
                verified: verified2,
                dbVerified: dbVerified2,
                authVerified: authVerified2
              } = await checkUserVerificationStatus(pendingEmail);
              if (verified2 || authVerified2 && !dbVerified2) {
                clearInterval(checkInterval);
                if (authVerified2 && !dbVerified2) {
                  await updateUserVerificationInDB(pendingEmail, true);
                }
                setStatus("success");
                setMessage("Email verified! Your account is now active.");
                clearPendingData();
                const timer2 = setInterval(() => {
                  setAutoRedirectTimer((prev) => {
                    if (prev <= 1) {
                      clearInterval(timer2);
                      navigate("/login", {
                        state: {
                          message: "Email verified successfully! You can now log in.",
                          email: pendingEmail
                        }
                      });
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1e3);
              }
            }, 5e3);
            setTimeout(() => {
              clearInterval(checkInterval);
              if (status === "pending") {
                setStatus("unverified");
                setMessage(`Verification is taking longer than expected. Please check your email at ${pendingEmail} and click the verification link.`);
              }
            }, 5 * 60 * 1e3);
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try registering again.");
      }
    };
    const timer = setTimeout(() => {
      handleAuthCallback();
    }, 1e3);
    return () => clearTimeout(timer);
  }, [navigate, location]);
  const handleResendVerification = async () => {
    try {
      if (!email) return;
      setStatus("loading");
      setMessage("Sending verification email...");
      const {
        error
      } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verification`
        }
      });
      if (error) {
        throw error;
      }
      setStatus("pending");
      setMessage(`✅ Verification email resent to ${email}. Please check your inbox.`);
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("❌ Failed to resend verification email. Please try again.");
    }
  };
  const handleCheckVerification = async () => {
    try {
      setStatus("checking_verification");
      setMessage("Checking verification status...");
      const {
        verified,
        dbVerified,
        authVerified,
        userData
      } = await checkUserVerificationStatus(email);
      if (verified) {
        setStatus("success");
        setMessage("✅ Email verified! Your account is now active.");
        clearPendingData();
        const timer = setInterval(() => {
          setAutoRedirectTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/login", {
                state: {
                  message: "Email verified successfully! You can now log in.",
                  email
                }
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1e3);
      } else if (authVerified && !dbVerified) {
        await updateUserVerificationInDB(email, true);
        setStatus("success");
        setMessage("✅ Email verification completed! Database updated.");
        clearPendingData();
        const timer = setInterval(() => {
          setAutoRedirectTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/login", {
                state: {
                  message: "Email verified successfully! You can now log in.",
                  email
                }
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1e3);
      } else {
        setStatus("unverified");
        setMessage(`❌ Email not verified yet. Please check your email at ${email} and click the verification link.`);
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setStatus("error");
      setMessage("Failed to check verification status.");
    }
  };
  const handleGoToVerification = () => {
    navigate("/verification", {
      state: {
        email,
        userId
      }
    });
  };
  const handleRedirectToLogin = () => {
    clearPendingData();
    navigate("/login", {
      state: {
        message: "Redirecting to login...",
        email
      }
    });
  };
  const handleOpenEmail = () => {
    if (email) {
      const mailtoLink = `mailto:${email}`;
      window.open(mailtoLink, "_blank");
    }
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4",
    children: /* @__PURE__ */ jsx(Card, {
      className: "w-full max-w-md p-8 shadow-xl",
      children: /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center justify-center space-y-6 text-center",
        children: [status === "loading" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("div", {
              className: "h-20 w-20 rounded-full border-4 border-primary/20"
            }), /* @__PURE__ */ jsx(Loader2, {
              className: "h-20 w-20 absolute inset-0 m-auto animate-spin text-primary"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Processing..."
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-2",
              children: "Completing your registration. Please wait."
            })]
          })]
        }), status === "already_verified" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(CheckCircle, {
              className: "h-10 w-10 text-emerald-600 dark:text-emerald-400"
            })
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Already Verified! ✅"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-4",
              children: message
            }), /* @__PURE__ */ jsxs("div", {
              className: "mt-6 space-y-3",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-emerald-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-emerald-600 dark:text-emerald-400",
                  children: "Email already verified"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-emerald-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-emerald-600 dark:text-emerald-400",
                  children: "Account is active"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "h-4 w-4 animate-spin text-blue-500"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-blue-600 dark:text-blue-400",
                  children: ["Redirecting to login in ", autoRedirectTimer, " seconds..."]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4 w-full",
            children: [/* @__PURE__ */ jsxs(Button, {
              onClick: handleRedirectToLogin,
              className: "w-full",
              variant: "default",
              children: [/* @__PURE__ */ jsx(LogIn, {
                className: "h-4 w-4 mr-2"
              }), "Go to Login Now"]
            }), /* @__PURE__ */ jsx(Button, {
              onClick: () => navigate("/"),
              variant: "outline",
              className: "w-full",
              children: "Go to Homepage"
            })]
          })]
        }), status === "checking_verification" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsxs("div", {
            className: "relative",
            children: [/* @__PURE__ */ jsx("div", {
              className: "h-20 w-20 rounded-full border-4 border-primary/20"
            }), /* @__PURE__ */ jsx(Loader2, {
              className: "h-20 w-20 absolute inset-0 m-auto animate-spin text-primary"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Checking Verification"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-4",
              children: message
            }), /* @__PURE__ */ jsxs("div", {
              className: "mt-4 space-y-2",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "h-4 w-4 animate-spin text-blue-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-blue-600 dark:text-blue-400",
                  children: "Verifying email confirmation..."
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Shield, {
                  className: "h-4 w-4 text-amber-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-amber-600 dark:text-amber-400",
                  children: "Checking database status..."
                })]
              })]
            })]
          })]
        }), status === "pending" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(Mail, {
              className: "h-10 w-10 text-blue-600 dark:text-blue-400"
            })
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Check Your Email! 📧"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-4",
              children: message
            }), /* @__PURE__ */ jsxs("div", {
              className: "mt-6 space-y-3",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-green-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-green-600 dark:text-green-400",
                  children: "Account created successfully"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Mail, {
                  className: "h-4 w-4 text-blue-500"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-blue-600 dark:text-blue-400",
                  children: ["Verification email sent to ", email]
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "h-4 w-4 animate-spin text-amber-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-amber-600 dark:text-amber-400",
                  children: "Waiting for email verification"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4 w-full",
            children: [/* @__PURE__ */ jsxs(Button, {
              onClick: handleOpenEmail,
              variant: "default",
              className: "w-full",
              children: [/* @__PURE__ */ jsx(ExternalLink, {
                className: "h-4 w-4 mr-2"
              }), "Open Email App"]
            }), /* @__PURE__ */ jsxs(Button, {
              onClick: handleCheckVerification,
              variant: "outline",
              className: "w-full",
              children: [/* @__PURE__ */ jsx(RefreshCw, {
                className: "h-4 w-4 mr-2"
              }), "Check Verification Status"]
            }), /* @__PURE__ */ jsxs(Button, {
              onClick: handleResendVerification,
              variant: "secondary",
              className: "w-full",
              children: [/* @__PURE__ */ jsx(Mail, {
                className: "h-4 w-4 mr-2"
              }), "Resend Verification Email"]
            }), /* @__PURE__ */ jsx(Button, {
              onClick: handleGoToVerification,
              className: "w-full",
              children: "Go to Verification Page"
            })]
          })]
        }), status === "unverified" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(AlertTriangle, {
              className: "h-10 w-10 text-amber-600 dark:text-amber-400"
            })
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Verification Required"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-4",
              children: message
            }), /* @__PURE__ */ jsxs("div", {
              className: "mt-6 space-y-3",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(AlertTriangle, {
                  className: "h-4 w-4 text-amber-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-amber-600 dark:text-amber-400",
                  children: "Email not verified yet"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Shield, {
                  className: "h-4 w-4 text-red-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-red-600 dark:text-red-400",
                  children: "Cannot log in until email is verified"
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4 w-full",
            children: [/* @__PURE__ */ jsxs(Button, {
              onClick: handleOpenEmail,
              variant: "default",
              className: "w-full",
              children: [/* @__PURE__ */ jsx(ExternalLink, {
                className: "h-4 w-4 mr-2"
              }), "Open Email App"]
            }), /* @__PURE__ */ jsxs(Button, {
              onClick: handleCheckVerification,
              variant: "outline",
              className: "w-full",
              children: [/* @__PURE__ */ jsx(RefreshCw, {
                className: "h-4 w-4 mr-2"
              }), "Check Verification Status"]
            }), /* @__PURE__ */ jsxs(Button, {
              onClick: handleResendVerification,
              className: "w-full",
              children: [/* @__PURE__ */ jsx(Mail, {
                className: "h-4 w-4 mr-2"
              }), "Resend Verification Email"]
            }), /* @__PURE__ */ jsx(Button, {
              onClick: handleGoToVerification,
              variant: "secondary",
              className: "w-full",
              children: "Go to Verification Page"
            })]
          })]
        }), status === "success" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(MailCheck, {
              className: "h-10 w-10 text-green-600 dark:text-green-400"
            })
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Email Verified! ✅"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-2",
              children: message
            }), /* @__PURE__ */ jsxs("div", {
              className: "mt-6 space-y-3",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-green-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-green-600 dark:text-green-400",
                  children: "Account activated successfully"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-green-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-green-600 dark:text-green-400",
                  children: "Database updated"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-4 w-4 text-green-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-green-600 dark:text-green-400",
                  children: "You can now log in"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center justify-center gap-2 text-sm",
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "h-4 w-4 animate-spin text-blue-500"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-blue-600 dark:text-blue-400",
                  children: ["Redirecting to login in ", autoRedirectTimer, " seconds..."]
                })]
              })]
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "space-y-4 w-full",
            children: [/* @__PURE__ */ jsxs(Button, {
              onClick: handleRedirectToLogin,
              className: "w-full",
              variant: "default",
              children: [/* @__PURE__ */ jsx(LogIn, {
                className: "h-4 w-4 mr-2"
              }), "Go to Login Now"]
            }), /* @__PURE__ */ jsx(Button, {
              onClick: () => navigate("/"),
              variant: "outline",
              className: "w-full",
              children: "Go to Homepage"
            })]
          })]
        }), status === "error" && /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("div", {
            className: "h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(XCircle, {
              className: "h-10 w-10 text-red-600 dark:text-red-400"
            })
          }), /* @__PURE__ */ jsxs("div", {
            children: [/* @__PURE__ */ jsx("h2", {
              className: "text-2xl font-bold dark:text-white",
              children: "Oops! Something went wrong"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-muted-foreground mt-2",
              children: message
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col gap-3 w-full",
            children: [/* @__PURE__ */ jsxs(Button, {
              onClick: handleCheckVerification,
              variant: "outline",
              children: [/* @__PURE__ */ jsx(RefreshCw, {
                className: "h-4 w-4 mr-2"
              }), "Check Status Again"]
            }), /* @__PURE__ */ jsxs(Button, {
              variant: "secondary",
              onClick: handleResendVerification,
              children: [/* @__PURE__ */ jsx(Mail, {
                className: "h-4 w-4 mr-2"
              }), "Resend Verification Email"]
            }), email && /* @__PURE__ */ jsxs(Button, {
              onClick: handleOpenEmail,
              variant: "default",
              children: [/* @__PURE__ */ jsx(ExternalLink, {
                className: "h-4 w-4 mr-2"
              }), "Open Email App"]
            }), /* @__PURE__ */ jsx(Button, {
              variant: "outline",
              onClick: () => navigate("/register"),
              children: "Try Registration Again"
            }), /* @__PURE__ */ jsx(Button, {
              onClick: () => navigate("/"),
              children: "Go Home"
            })]
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
const VerificationPage = UNSAFE_withComponentProps(function VerificationPage2() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(5);
  const [showManualVerification, setShowManualVerification] = useState(false);
  useEffect(() => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token") || hash.includes("token=") ? hash.split("token=")[1]?.split("&")[0] : null;
    if (tokenFromUrl) {
      setVerificationToken(tokenFromUrl);
      handleTokenVerification(tokenFromUrl);
    } else {
      checkCurrentVerificationStatus();
    }
  }, [location]);
  const checkCurrentVerificationStatus = async () => {
    setStatus("checking");
    try {
      const {
        data: {
          session
        },
        error
      } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        setEmail(session.user.email || "");
        const isVerified = session.user.email_confirmed_at !== null;
        if (isVerified) {
          setStatus("success");
          setMessage("Your email is already verified! You can proceed to login.");
        } else {
          setStatus("idle");
          setMessage("Your email needs verification. Please check your inbox.");
        }
      } else {
        setStatus("idle");
        setMessage("Please enter your email to verify your account.");
      }
    } catch (error) {
      console.error("Status check error:", error);
      setStatus("idle");
      setMessage("Unable to check verification status. Please try again.");
    }
  };
  const handleTokenVerification = async (token) => {
    setStatus("loading");
    try {
      const {
        data,
        error
      } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "signup"
      });
      if (error) throw error;
      if (data.user) {
        setStatus("success");
        setMessage("Email verified successfully! Your account is now active.");
        localStorage.removeItem("pending_email");
        const timer = setInterval(() => {
          setAutoRedirectTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/login", {
                state: {
                  message: "Email verified successfully! You can now log in."
                }
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1e3);
        return () => clearInterval(timer);
      }
    } catch (error) {
      console.error("Token verification error:", error);
      setStatus("error");
      setMessage("Invalid or expired verification token. Please request a new one.");
    }
  };
  const handleRequestVerification = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }
    setStatus("loading");
    try {
      const {
        error
      } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verification`
        }
      });
      if (error) throw error;
      setStatus("pending");
      setMessage(`✅ Verification email sent to ${email}. Please check your inbox and click the link.`);
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", email);
      }
    } catch (error) {
      console.error("Resend error:", error);
      if (error.message?.includes("already verified")) {
        setStatus("success");
        setMessage("This email is already verified. You can proceed to login.");
      } else if (error.message?.includes("not found")) {
        setStatus("error");
        setMessage("No account found with this email. Please register first.");
      } else {
        setStatus("error");
        setMessage("Failed to send verification email. Please try again.");
      }
    }
  };
  const handleManualVerification = async (e) => {
    e.preventDefault();
    if (!verificationToken.trim()) {
      setStatus("error");
      setMessage("Please enter a verification token.");
      return;
    }
    await handleTokenVerification(verificationToken.trim());
  };
  const handleCheckStatus = async () => {
    setStatus("loading");
    try {
      const {
        data: {
          session
        },
        error
      } = await supabase.auth.getSession();
      if (error) throw error;
      if (session?.user) {
        const isVerified = session.user.email_confirmed_at !== null;
        if (isVerified) {
          setStatus("success");
          setMessage("✅ Your email has been verified! You can now log in.");
        } else {
          setStatus("pending");
          setMessage("⏳ Still waiting for verification. Please check your email.");
        }
      } else {
        setStatus("error");
        setMessage("No active session found. Please log in first.");
      }
    } catch (error) {
      console.error("Status check error:", error);
      setStatus("error");
      setMessage("Failed to check verification status.");
    }
  };
  const StatusIcon = () => {
    switch (status) {
      case "loading":
      case "checking":
        return /* @__PURE__ */ jsx(motion.div, {
          animate: {
            rotate: 360
          },
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          },
          className: "h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto",
          children: /* @__PURE__ */ jsx(Loader2, {
            className: "h-12 w-12 text-primary"
          })
        });
      case "pending":
        return /* @__PURE__ */ jsx("div", {
          className: "h-24 w-24 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center ring-4 ring-amber-200 dark:ring-amber-900/30 mx-auto",
          children: /* @__PURE__ */ jsx(Clock, {
            className: "h-12 w-12 text-amber-600 dark:text-amber-400"
          })
        });
      case "success":
        return /* @__PURE__ */ jsx(motion.div, {
          initial: {
            scale: 0
          },
          animate: {
            scale: 1
          },
          transition: {
            type: "spring",
            stiffness: 200,
            damping: 15
          },
          className: "h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center ring-4 ring-emerald-200 dark:ring-emerald-900/30 mx-auto",
          children: /* @__PURE__ */ jsx(ShieldCheck, {
            className: "h-12 w-12 text-emerald-600 dark:text-emerald-400"
          })
        });
      case "error":
        return /* @__PURE__ */ jsx("div", {
          className: "h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center ring-4 ring-red-200 dark:ring-red-900/30 mx-auto",
          children: /* @__PURE__ */ jsx(XCircle, {
            className: "h-12 w-12 text-red-600 dark:text-red-400"
          })
        });
      default:
        return /* @__PURE__ */ jsx("div", {
          className: "h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center ring-4 ring-blue-200 dark:ring-blue-900/30 mx-auto",
          children: /* @__PURE__ */ jsx(Mail, {
            className: "h-12 w-12 text-blue-600 dark:text-blue-400"
          })
        });
    }
  };
  const StatusBadge = () => {
    const badgeConfig = {
      idle: {
        label: "Ready",
        variant: "secondary"
      },
      loading: {
        label: "Processing",
        variant: "secondary"
      },
      checking: {
        label: "Checking",
        variant: "secondary"
      },
      pending: {
        label: "Pending",
        variant: "warning"
      },
      success: {
        label: "Verified",
        variant: "default"
      },
      error: {
        label: "Error",
        variant: "destructive"
      }
    };
    const config = badgeConfig[status];
    return /* @__PURE__ */ jsx(Badge, {
      variant: config.variant,
      className: "text-sm font-medium px-3 py-1.5 mb-4",
      children: config.label
    });
  };
  return /* @__PURE__ */ jsx("div", {
    className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4",
    children: /* @__PURE__ */ jsx(motion.div, {
      initial: {
        opacity: 0,
        y: 20
      },
      animate: {
        opacity: 1,
        y: 0
      },
      transition: {
        duration: 0.3
      },
      className: "w-full max-w-2xl",
      children: /* @__PURE__ */ jsxs(Card, {
        className: "shadow-xl border-0 dark:border dark:border-gray-700",
        children: [/* @__PURE__ */ jsxs(CardHeader, {
          className: "text-center space-y-4",
          children: [/* @__PURE__ */ jsx(StatusIcon, {}), /* @__PURE__ */ jsxs("div", {
            className: "space-y-2",
            children: [/* @__PURE__ */ jsxs(CardTitle, {
              className: "text-2xl md:text-3xl font-bold tracking-tight",
              children: [status === "idle" && "Verify Your Email", status === "loading" && "Verifying...", status === "checking" && "Checking Status...", status === "pending" && "Check Your Email", status === "success" && "Email Verified!", status === "error" && "Verification Issue"]
            }), /* @__PURE__ */ jsx(CardDescription, {
              className: "text-base",
              children: /* @__PURE__ */ jsx(StatusBadge, {})
            })]
          })]
        }), /* @__PURE__ */ jsxs(CardContent, {
          className: "space-y-6",
          children: [message && /* @__PURE__ */ jsxs(Alert, {
            className: cn(status === "success" && "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", status === "error" && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800", status === "pending" && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800", "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"),
            children: [status === "success" && /* @__PURE__ */ jsx(CheckCircle, {
              className: "h-4 w-4 text-emerald-600"
            }), status === "error" && /* @__PURE__ */ jsx(XCircle, {
              className: "h-4 w-4 text-red-600"
            }), status === "pending" && /* @__PURE__ */ jsx(Clock, {
              className: "h-4 w-4 text-amber-600"
            }), (status === "idle" || status === "checking" || status === "loading") && /* @__PURE__ */ jsx(Mail, {
              className: "h-4 w-4 text-blue-600"
            }), /* @__PURE__ */ jsx(AlertDescription, {
              children: message
            })]
          }), (status === "idle" || status === "error") && /* @__PURE__ */ jsxs(motion.div, {
            initial: {
              opacity: 0
            },
            animate: {
              opacity: 1
            },
            transition: {
              delay: 0.2
            },
            children: [/* @__PURE__ */ jsxs("form", {
              onSubmit: handleRequestVerification,
              className: "space-y-4",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "space-y-2",
                children: [/* @__PURE__ */ jsx(Label, {
                  htmlFor: "email",
                  className: "text-sm font-medium",
                  children: "Email Address"
                }), /* @__PURE__ */ jsx(Input, {
                  id: "email",
                  type: "email",
                  placeholder: "you@example.com",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  disabled: status === "loading",
                  required: true,
                  className: "dark:bg-gray-700 dark:border-gray-600"
                }), /* @__PURE__ */ jsx("p", {
                  className: "text-xs text-muted-foreground",
                  children: "Enter the email you used for registration"
                })]
              }), /* @__PURE__ */ jsx(Button, {
                type: "submit",
                className: "w-full",
                disabled: status === "loading",
                children: status === "loading" ? /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(Loader2, {
                    className: "h-4 w-4 mr-2 animate-spin"
                  }), "Sending..."]
                }) : /* @__PURE__ */ jsxs(Fragment, {
                  children: [/* @__PURE__ */ jsx(Mail, {
                    className: "h-4 w-4 mr-2"
                  }), "Send Verification Email"]
                })
              })]
            }), /* @__PURE__ */ jsxs("div", {
              className: "flex items-center my-6",
              children: [/* @__PURE__ */ jsx(Separator, {
                className: "flex-1"
              }), /* @__PURE__ */ jsx("span", {
                className: "px-4 text-sm text-muted-foreground",
                children: "or"
              }), /* @__PURE__ */ jsx(Separator, {
                className: "flex-1"
              })]
            }), /* @__PURE__ */ jsx(Button, {
              type: "button",
              variant: "outline",
              className: "w-full",
              onClick: () => setShowManualVerification(!showManualVerification),
              children: showManualVerification ? /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(ArrowRight, {
                  className: "h-4 w-4 mr-2 rotate-90"
                }), "Hide Manual Verification"]
              }) : /* @__PURE__ */ jsxs(Fragment, {
                children: [/* @__PURE__ */ jsx(ExternalLink, {
                  className: "h-4 w-4 mr-2"
                }), "Enter Verification Token Manually"]
              })
            }), showManualVerification && /* @__PURE__ */ jsx(motion.div, {
              initial: {
                opacity: 0,
                height: 0
              },
              animate: {
                opacity: 1,
                height: "auto"
              },
              transition: {
                duration: 0.3
              },
              className: "mt-6 p-4 border rounded-lg bg-muted/30",
              children: /* @__PURE__ */ jsxs("form", {
                onSubmit: handleManualVerification,
                className: "space-y-4",
                children: [/* @__PURE__ */ jsxs("div", {
                  className: "space-y-2",
                  children: [/* @__PURE__ */ jsx(Label, {
                    htmlFor: "token",
                    className: "text-sm font-medium",
                    children: "Verification Token"
                  }), /* @__PURE__ */ jsx(Input, {
                    id: "token",
                    type: "text",
                    placeholder: "Paste your verification token here",
                    value: verificationToken,
                    onChange: (e) => setVerificationToken(e.target.value),
                    disabled: status === "loading",
                    required: true,
                    className: "font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                  }), /* @__PURE__ */ jsx("p", {
                    className: "text-xs text-muted-foreground",
                    children: "Paste the token from your verification email or URL"
                  })]
                }), /* @__PURE__ */ jsx(Button, {
                  type: "submit",
                  className: "w-full",
                  disabled: status === "loading",
                  children: status === "loading" ? /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx(Loader2, {
                      className: "h-4 w-4 mr-2 animate-spin"
                    }), "Verifying..."]
                  }) : /* @__PURE__ */ jsxs(Fragment, {
                    children: [/* @__PURE__ */ jsx(CheckSquare, {
                      className: "h-4 w-4 mr-2"
                    }), "Verify Token"]
                  })
                })]
              })
            })]
          }), status === "success" && /* @__PURE__ */ jsx(motion.div, {
            initial: {
              opacity: 0
            },
            animate: {
              opacity: 1
            },
            transition: {
              delay: 0.2
            },
            className: "space-y-6",
            children: /* @__PURE__ */ jsxs("div", {
              className: "space-y-3",
              children: [/* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-5 w-5 text-emerald-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-emerald-700 dark:text-emerald-400 font-medium",
                  children: "Account successfully verified"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx(CheckCircle, {
                  className: "h-5 w-5 text-emerald-500"
                }), /* @__PURE__ */ jsx("span", {
                  className: "text-emerald-700 dark:text-emerald-400 font-medium",
                  children: "Full account access granted"
                })]
              }), /* @__PURE__ */ jsxs("div", {
                className: "flex items-center gap-2",
                children: [/* @__PURE__ */ jsx(Loader2, {
                  className: "h-5 w-5 text-blue-500 animate-spin"
                }), /* @__PURE__ */ jsxs("span", {
                  className: "text-blue-700 dark:text-blue-400 font-medium",
                  children: ["Redirecting to login in ", autoRedirectTimer, " seconds..."]
                })]
              })]
            })
          }), status === "pending" && /* @__PURE__ */ jsxs(motion.div, {
            initial: {
              opacity: 0
            },
            animate: {
              opacity: 1
            },
            transition: {
              delay: 0.2
            },
            className: "space-y-6",
            children: [/* @__PURE__ */ jsx("div", {
              className: "bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 space-y-3",
              children: /* @__PURE__ */ jsxs("div", {
                className: "flex items-start gap-3",
                children: [/* @__PURE__ */ jsx(AlertTriangle, {
                  className: "h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
                }), /* @__PURE__ */ jsxs("div", {
                  children: [/* @__PURE__ */ jsx("p", {
                    className: "text-amber-800 dark:text-amber-300 font-medium",
                    children: "Important:"
                  }), /* @__PURE__ */ jsxs("ul", {
                    className: "text-sm text-amber-700 dark:text-amber-400 space-y-1 mt-1",
                    children: [/* @__PURE__ */ jsx("li", {
                      children: "• Check your spam/junk folder if you don't see the email"
                    }), /* @__PURE__ */ jsx("li", {
                      children: "• Click the verification link in the email"
                    }), /* @__PURE__ */ jsx("li", {
                      children: "• The link expires after 24 hours"
                    })]
                  })]
                })]
              })
            }), /* @__PURE__ */ jsxs("div", {
              className: "grid grid-cols-1 md:grid-cols-2 gap-3",
              children: [/* @__PURE__ */ jsxs(Button, {
                onClick: handleCheckStatus,
                variant: "outline",
                className: "w-full",
                children: [/* @__PURE__ */ jsx(RefreshCw, {
                  className: "h-4 w-4 mr-2"
                }), "Check Status"]
              }), /* @__PURE__ */ jsxs(Button, {
                onClick: () => handleRequestVerification(),
                variant: "secondary",
                className: "w-full",
                children: [/* @__PURE__ */ jsx(Mail, {
                  className: "h-4 w-4 mr-2"
                }), "Resend Email"]
              })]
            })]
          })]
        }), /* @__PURE__ */ jsxs(CardFooter, {
          className: "flex flex-col gap-3",
          children: [/* @__PURE__ */ jsx(Separator, {
            className: "mb-4"
          }), /* @__PURE__ */ jsx("div", {
            className: "flex flex-col sm:flex-row gap-3 w-full",
            children: status === "success" ? /* @__PURE__ */ jsxs(Button, {
              onClick: () => navigate("/login"),
              className: "flex-1",
              size: "lg",
              children: [/* @__PURE__ */ jsx(ArrowRight, {
                className: "h-4 w-4 mr-2"
              }), "Go to Login Now"]
            }) : /* @__PURE__ */ jsxs(Fragment, {
              children: [/* @__PURE__ */ jsxs(Button, {
                onClick: () => navigate("/login"),
                variant: "outline",
                className: "flex-1",
                children: [/* @__PURE__ */ jsx(ArrowRight, {
                  className: "h-4 w-4 mr-2"
                }), "Back to Login"]
              }), /* @__PURE__ */ jsxs(Button, {
                onClick: () => navigate("/register"),
                variant: "ghost",
                className: "flex-1",
                children: [/* @__PURE__ */ jsx(User, {
                  className: "h-4 w-4 mr-2"
                }), "Register"]
              }), /* @__PURE__ */ jsxs(Button, {
                onClick: handleCheckStatus,
                variant: "secondary",
                className: "flex-1",
                children: [/* @__PURE__ */ jsx(RefreshCw, {
                  className: "h-4 w-4 mr-2"
                }), "Check Status"]
              })]
            })
          }), /* @__PURE__ */ jsxs("div", {
            className: "text-xs text-muted-foreground text-center mt-6 space-y-2",
            children: [/* @__PURE__ */ jsxs("p", {
              className: "flex items-center justify-center gap-2",
              children: [/* @__PURE__ */ jsx(Lock, {
                className: "h-3 w-3"
              }), /* @__PURE__ */ jsx("span", {
                children: "Your verification is secure and encrypted"
              })]
            }), /* @__PURE__ */ jsx("p", {
              children: "Need help? Contact support for assistance."
            })]
          })]
        })]
      })
    })
  });
});
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: VerificationPage
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/Deskstaff/assets/entry.client-MpHpOa-2.js", "imports": ["/Deskstaff/assets/chunk-EPOLDU6W-lxn-7cHT.js", "/Deskstaff/assets/index-BCeFHP6F.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/Deskstaff/assets/root-b3L5ZHLk.js", "imports": ["/Deskstaff/assets/chunk-EPOLDU6W-lxn-7cHT.js", "/Deskstaff/assets/index-BCeFHP6F.js", "/Deskstaff/assets/ThemeProvider-DgD1dgiN.js"], "css": ["/Deskstaff/assets/root-BxDwNKag.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/login": { "id": "routes/login", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/Deskstaff/assets/login-DjC-hWIf.js", "imports": ["/Deskstaff/assets/chunk-EPOLDU6W-lxn-7cHT.js", "/Deskstaff/assets/card-D0Zu7Dju.js", "/Deskstaff/assets/label-DXbj28az.js", "/Deskstaff/assets/AuthLayout-DmsmlbW8.js", "/Deskstaff/assets/index-BCeFHP6F.js", "/Deskstaff/assets/ThemeProvider-DgD1dgiN.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/register": { "id": "routes/register", "parentId": "root", "path": "register", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/Deskstaff/assets/register-CnkQG7M1.js", "imports": ["/Deskstaff/assets/chunk-EPOLDU6W-lxn-7cHT.js", "/Deskstaff/assets/card-D0Zu7Dju.js", "/Deskstaff/assets/label-DXbj28az.js", "/Deskstaff/assets/AuthLayout-DmsmlbW8.js", "/Deskstaff/assets/alert-DX30LBWn.js", "/Deskstaff/assets/index-BCeFHP6F.js", "/Deskstaff/assets/supabase-D95lysMu.js", "/Deskstaff/assets/ThemeProvider-DgD1dgiN.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth/callback": { "id": "routes/auth/callback", "parentId": "root", "path": "auth/callback", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/Deskstaff/assets/callback-D90obk_R.js", "imports": ["/Deskstaff/assets/chunk-EPOLDU6W-lxn-7cHT.js", "/Deskstaff/assets/supabase-D95lysMu.js", "/Deskstaff/assets/card-D0Zu7Dju.js", "/Deskstaff/assets/triangle-alert-DaEtPd0U.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/pages/VerificationPage": { "id": "routes/pages/VerificationPage", "parentId": "root", "path": "verification", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/Deskstaff/assets/VerificationPage-5HACNLyn.js", "imports": ["/Deskstaff/assets/chunk-EPOLDU6W-lxn-7cHT.js", "/Deskstaff/assets/supabase-D95lysMu.js", "/Deskstaff/assets/card-D0Zu7Dju.js", "/Deskstaff/assets/label-DXbj28az.js", "/Deskstaff/assets/alert-DX30LBWn.js", "/Deskstaff/assets/triangle-alert-DaEtPd0U.js", "/Deskstaff/assets/index-BCeFHP6F.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/Deskstaff/assets/manifest-77a30174.js", "version": "77a30174", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_optimizeDeps": false, "unstable_subResourceIntegrity": false, "unstable_trailingSlashAwareDataRequests": false, "v8_middleware": false, "v8_splitRouteModules": false, "v8_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/Deskstaff/";
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
  "routes/pages/VerificationPage": {
    id: "routes/pages/VerificationPage",
    parentId: "root",
    path: "verification",
    index: void 0,
    caseSensitive: void 0,
    module: route4
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
