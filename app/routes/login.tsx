import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate, useLocation } from "react-router";
import loginIllustration from "../assets/images/login-illustration.jpg";
import AuthLayout from "@/components/AuthLayout";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  LogIn,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AuthChecker } from "@/components/AuthChecker";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  // Form state
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  // UI state
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };
  React.useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        // Simple test query that doesn't require auth
        const { data, error } = await supabase
          .from("users")
          .select("count")
          .limit(1);

        if (error) {
          console.error("Supabase connection test failed:", error);
          setErrors((prev) => ({
            ...prev,
            connection: "Database connection issue detected",
          }));
        } else {
          console.log("Supabase connection OK");
        }
      } catch (err) {
        console.error("Connection test error:", err);
      }
    };

    testSupabaseConnection();
  }, []);

  React.useEffect(() => {
    document.title = "DeskStaff - Login";
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log("🔐 Login attempt:", {
        email: formData.email,
        timestamp: new Date().toISOString(),
      });

      // Clear any existing sessions first (clean slate)
      await supabase.auth.signOut();

      // Attempt login with detailed error capture
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      if (error) {
        console.error("❌ Auth error details:", {
          message: error.message,
          name: error.name,
          status: error.status,
          stack: error.stack,
        });

        // Try to get more specific error info
        if (error.message.includes("Database error granting user")) {
          // This is a Supabase internal error - likely auth schema issue

          // Test if we can create a new user (diagnostic)
          console.log("🧪 Testing user creation as diagnostic...");
          const testEmail = `test-${Date.now()}@diagnostic.com`;

          try {
            const { error: signUpError } = await supabase.auth.signUp({
              email: testEmail,
              password: "Test123!",
              options: {
                data: { diagnostic: true },
              },
            });

            if (signUpError) {
              console.error("🧪 Diagnostic signup failed:", signUpError);
              throw new Error(
                `Authentication service configuration issue. Please contact support with error code: AUTH_${Date.now()}`
              );
            } else {
              console.log("🧪 Diagnostic: New user creation works");
              throw new Error(
                "Your account may have an authentication issue. Please try resetting your password or contact support."
              );
            }
          } catch (diagnosticError) {
            console.error("Diagnostic failed:", diagnosticError);
            throw new Error(
              "Authentication system is experiencing technical difficulties. Our team has been notified. Please try again in 15 minutes."
            );
          }
        }

        // Handle other specific errors
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Invalid email or password. Please try again.");
        }

        throw new Error(`Authentication error: ${error.message}`);
      }

      if (!data?.user) {
        throw new Error("Login failed: No user data received.");
      }

      console.log("✅ Login successful:", {
        userId: data.user.id,
        email: data.user.email,
        session: !!data.session,
      });

      // Verify session is actually valid
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        throw new Error("Session not established. Please try again.");
      }

      // Store remember me preference
      if (formData.rememberMe && typeof window !== "undefined") {
        localStorage.setItem("rememberMe", "true");
      }

      toast.success("Login successful! Redirecting...");

      // Redirect to profile
      setTimeout(() => {
        navigate(`/profile/${data.user.id}`, { replace: true });
      }, 1000);
    } catch (error) {
      console.error("💥 Login process failed:", error);

      if (error instanceof Error) {
        const errMsg = error.message;

        if (
          errMsg.includes("configuration issue") ||
          errMsg.includes("technical difficulties") ||
          errMsg.includes("AUTH_")
        ) {
          // Show user-friendly message with support option
          setErrors({
            submit: (
              <span>
                {errMsg}
                <br />
                <button
                  type="button"
                  className="mt-1 text-sm text-primary underline"
                  onClick={() => {
                    navigator.clipboard.writeText(`AUTH_ERROR_${Date.now()}`);
                    toast.info("Error code copied to clipboard");
                  }}
                >
                  Copy error code for support
                </button>
              </span>
            ),
          });
        } else {
          setErrors({ submit: errMsg });
        }
      } else {
        setErrors({
          submit: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const siteUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/google`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google sign in error:", error);
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "Google sign in failed. Please try again." });
      }
      setIsGoogleLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email address to reset password" });
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) throw error;

      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form can be submitted
  const canSubmit =
    formData.email.includes("@") && formData.password.length > 0;

  return (
    <AuthChecker requireAuth={false} redirectTo="/profile/:userId">
      <AuthLayout
        illustration={loginIllustration}
        illustrationAlt="Login illustration"
        gradientFrom="from-blue-50"
        gradientTo="to-indigo-100"
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight dark:text-white">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Please enter your details to sign in.
            </p>
          </div>

          {errors.submit && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pl-10 ${
                    errors.email ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="dark:text-gray-300">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline dark:text-primary-400"
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pl-10 pr-10 ${
                    errors.password ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    rememberMe: checked as boolean,
                  }))
                }
                className="mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary"
                disabled={isSubmitting}
              />
              <Label
                htmlFor="rememberMe"
                className="font-normal dark:text-gray-400"
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="h-5 w-5"
                  />
                )}
                {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={isSubmitting}
                onClick={() => toast.info("GitHub sign in coming soon!")}
              >
                <img
                  src="https://www.svgrepo.com/show/475661/github-filled.svg"
                  alt="GitHub"
                  className="h-5 w-5"
                />
                Sign in with GitHub
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline dark:text-primary-400"
              onClick={(e) => isSubmitting && e.preventDefault()}
            >
              Sign up here
            </Link>
          </p>
        </div>
      </AuthLayout>
    </AuthChecker>
  );
}
