// src/routes/register.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router";
import registerIllustration from "../assets/images/login-illustration.jpg";
import AuthLayout from "@/components/AuthLayout";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  XCircle,
  MailWarning,
  Info,
  Loader2,
  UserX,
  ShieldAlert,
  MailCheck,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { AuthChecker } from "@/components/AuthChecker";

type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  newsletter: boolean;
}

// Cache for checked emails with verification status
const emailCheckCache = new Map<
  string,
  {
    exists: boolean;
    timestamp: number;
    email_verified: boolean;
    user_id?: string;
  }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function Register() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = React.useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
    newsletter: false,
  });

  // UI state
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = React.useState(false);
  const [emailSuggestions, setEmailSuggestions] = React.useState<string[]>([]);
  const [emailStatus, setEmailStatus] = React.useState<{
    exists: boolean;
    email_verified: boolean | null;
    user_id?: string;
  }>({ exists: false, email_verified: null });
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true); // Add this line

  // List of disposable/temporary email domains
  const disposableEmailDomains = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "yopmail.com",
    "throwawaymail.com",
    "fakeinbox.com",
    "temp-mail.org",
    "trashmail.com",
    "dispostable.com",
    "getairmail.com",
    "maildrop.cc",
    "tempmailaddress.com",
    "fake-mail.com",
    "mytemp.email",
    "tempemail.net",
  ];

  // Password strength calculation
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[A-Z]/.test(password)) score += 1; // Uppercase
    if (/[a-z]/.test(password)) score += 1; // Lowercase
    if (/[0-9]/.test(password)) score += 1; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special characters

    // Determine strength
    if (score <= 2) return "weak";
    if (score <= 4) return "medium";
    if (score <= 5) return "strong";
    return "very-strong";
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Password requirements
  const passwordRequirements = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  // Password matches confirmation
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.password.length > 0;

  // Strength indicators
  const strengthIndicators = {
    weak: { color: "bg-red-500", text: "Weak" },
    medium: { color: "bg-yellow-500", text: "Medium" },
    strong: { color: "bg-green-500", text: "Strong" },
    "very-strong": { color: "bg-emerald-600", text: "Very Strong" },
  };

  // Check email with verification status
  const checkEmailWithVerification = React.useCallback(
    async (email: string) => {
      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(normalizedEmail)) {
        setEmailStatus({ exists: false, email_verified: null });
        return { exists: false, email_verified: null };
      }

      // Check cache first
      const cached = emailCheckCache.get(normalizedEmail);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setEmailStatus({
          exists: cached.exists,
          email_verified: cached.email_verified,
          user_id: cached.user_id,
        });
        return {
          exists: cached.exists,
          email_verified: cached.email_verified,
          user_id: cached.user_id,
        };
      }

      setIsCheckingEmail(true);
      try {
        // First check our custom users table
        const { data: userData, error: usersError } = await supabase
          .from("users")
          .select("id, email, email_verified")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (usersError) {
          console.error("Database query error:", usersError);
          const result = { exists: false, email_verified: null };
          emailCheckCache.set(normalizedEmail, {
            exists: false,
            email_verified: false,
            timestamp: Date.now(),
          });
          setEmailStatus(result);
          return result;
        }

        // Check if user exists in auth.users table (for Google users)
        const { data: authUsers, error: authError } =
          await supabase.auth.admin.listUsers();

        if (authError) {
          console.error("Auth users query error:", authError);
        }

        const existingAuthUser = authUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === normalizedEmail
        );

        const isGoogleUser = existingAuthUser?.identities?.some(
          (id: any) => id.provider === "google"
        );

        // Determine the final status
        let exists = !!userData || !!existingAuthUser;
        let email_verified = userData?.email_verified || false;
        const user_id = userData?.id || existingAuthUser?.id;

        // If it's a Google user in auth table but not in our users table
        if (isGoogleUser && !userData) {
          exists = true;
          email_verified = true; // Google emails are considered verified
        }

        const result = { exists, email_verified, user_id };

        // Update cache
        emailCheckCache.set(normalizedEmail, {
          exists,
          email_verified,
          user_id,
          timestamp: Date.now(),
        });

        setEmailStatus(result);

        // Clear any existing email errors
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });

        return result;
      } catch (error) {
        console.error("Error checking email:", error);
        const result = { exists: false, email_verified: null };
        emailCheckCache.set(normalizedEmail, {
          exists: false,
          email_verified: false,
          timestamp: Date.now(),
        });
        setEmailStatus(result);
        return result;
      } finally {
        setIsCheckingEmail(false);
      }
    },
    []
  );

  // Basic email validation
  const validateEmailFormat = (
    email: string
  ): { isValid: boolean; message?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      return { isValid: false, message: "Email is required" };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Please enter a valid email address" };
    }

    // Check for disposable emails
    const domain = email.split("@")[1];
    if (
      domain &&
      disposableEmailDomains.some((disposable) =>
        domain.toLowerCase().includes(disposable.toLowerCase())
      )
    ) {
      return {
        isValid: false,
        message: "Please use a permanent email address",
      };
    }

    return { isValid: true };
  };

  // Levenshtein distance for typo detection
  const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  };

  // Debounced email check
  const debouncedEmailCheck = React.useRef<NodeJS.Timeout>();

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;

    if (id === "email") {
      setEmailStatus({ exists: false, email_verified: null });
      emailCheckCache.delete(value.toLowerCase());
    }

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));

    if (id === "email") {
      const { isValid, message } = validateEmailFormat(value);

      if (!isValid && message) {
        setErrors((prev) => ({ ...prev, email: message }));
        setEmailSuggestions([]);
      } else if (errors.email) {
        setErrors((prev) => {
          const newErrors = { ...prev };
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
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    }
  };

  React.useEffect(() => {
    document.title = "DeskStaff - Register";
  }, []); // The empty dependency array ensures this runs once when mounted

  React.useEffect(() => {
    return () => {
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }
    };
  }, []);

  // Handle Google Sign Up - UPDATED
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      // First, check if there are existing users with this email in our custom table
      const normalizedEmail = formData.email.toLowerCase();

      // Only check if there's an email in the form
      if (formData.email) {
        const { exists, email_verified } =
          await checkEmailWithVerification(normalizedEmail);

        // If user exists in our system, show appropriate message
        if (exists) {
          if (email_verified === true) {
            toast.error(
              "This email is already registered. Please log in instead."
            );
            setIsGoogleLoading(false);
            return;
          } else {
            // User exists but not verified - offer to resend verification
            toast.error(
              "This email is registered but not verified. Please check your email or use the resend verification option above."
            );
            setIsGoogleLoading(false);
            return;
          }
        }
      }

      // If no email in form or user doesn't exist, proceed with Google OAuth
      // Store a flag in localStorage to indicate this is a Google sign-up
      localStorage.setItem("google_signup_flow", "true");

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

      if (error) {
        console.error("Google OAuth error:", error);
        throw new Error(`Google sign up failed: ${error.message}`);
      }
      // The user will be redirected to Google for authentication
      // and then redirected back to the callback URL
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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    // Email validation
    const emailValidation = validateEmailFormat(formData.email);
    if (!emailValidation.isValid && emailValidation.message) {
      newErrors.email = emailValidation.message;
    }

    // Check email existence and verification status
    if (!newErrors.email && emailStatus.exists) {
      if (emailStatus.email_verified === true) {
        newErrors.email =
          "This email is already registered and verified. Please use a different email or try logging in.";
      } else if (emailStatus.email_verified === false) {
        newErrors.email =
          "This email is registered but not verified. Please check your email for the verification link or click below to resend.";
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength === "weak") {
      newErrors.password = "Please use a stronger password";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (!passwordsMatch) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms agreement
    if (!formData.terms) {
      newErrors.terms = "You must agree to the terms and privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // First validate form client-side
    if (!validateForm()) {
      return;
    }

    // Final check for email existence with verification status
    const normalizedEmail = formData.email.toLowerCase();
    try {
      const { exists, email_verified, user_id } =
        await checkEmailWithVerification(normalizedEmail);

      if (exists) {
        if (email_verified === true) {
          toast.error(
            "This email is already registered and verified. Please use a different email or try logging in."
          );
          return;
        } else if (email_verified === false) {
          // Email exists but not verified - redirect to verification page
          if (typeof window !== "undefined" && user_id) {
            localStorage.setItem("pending_email", formData.email);
            localStorage.setItem("pending_user_id", user_id);
          }

          navigate("/auth/callback", {
            state: {
              email: formData.email,
              userId: user_id,
              message:
                "Your email is registered but not verified. Please verify your email to continue.",
            },
          });
          return;
        }
      }
    } catch (error) {
      console.error("Final email check error:", error);
      // Continue with registration if check fails
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Get the current origin
      const siteUrl = window.location.origin;

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            newsletter_subscribed: formData.newsletter,
          },
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (authError) {
        console.error("Supabase auth error:", authError);

        // Handle specific Supabase errors
        if (authError.message.includes("User already registered")) {
          emailCheckCache.set(normalizedEmail, {
            exists: true,
            email_verified: null,
            timestamp: Date.now(),
          });
          setEmailStatus({ exists: true, email_verified: null });
          throw new Error(
            "This email is already registered. Please use a different email or try logging in."
          );
        } else if (authError.message.includes("Password should be at least")) {
          throw new Error(
            "Password is too weak. Please use a stronger password."
          );
        } else if (authError.message.includes("Invalid email")) {
          throw new Error("Please enter a valid email address.");
        } else if (authError.message.includes("rate limit")) {
          throw new Error(
            "Too many attempts. Please try again in a few minutes."
          );
        } else {
          throw new Error(`Registration failed: ${authError.message}`);
        }
      }

      if (!authData.user) {
        throw new Error("Registration failed. Please try again.");
      }

      // Insert user into users table with email_verified = false
      try {
        const { error: insertError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: normalizedEmail,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          newsletter_subscribed: formData.newsletter,
          email_verified: false, // Explicitly set to false for new registrations
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error inserting user into users table:", insertError);

          // If it's a duplicate, try updating instead
          if (insertError.code === "23505") {
            // Unique violation - update existing record
            const { error: updateError } = await supabase
              .from("users")
              .update({
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                newsletter_subscribed: formData.newsletter,
                email_verified: false, // Ensure it's false for unverified users
                updated_at: new Date().toISOString(),
              })
              .eq("email", normalizedEmail);

            if (updateError) {
              console.error("Error updating user in users table:", updateError);
            }
          }
        } else {
          console.log(
            "✅ User successfully added to users table with email_verified = false"
          );
        }
      } catch (dbError) {
        console.error("Database insert/update error:", dbError);
        // Don't throw here - we still want to proceed with registration
      }

      // Verify user was added with email_verified = false
      try {
        const { data: userCheck } = await supabase
          .from("users")
          .select("email_verified")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (!userCheck) {
          console.warn("User was not added to users table");
        } else {
          console.log("User verification status:", userCheck.email_verified);
        }
      } catch (verificationError) {
        console.error("Error verifying user status:", verificationError);
      }

      // Store email in localStorage for post-registration flow
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", formData.email);
        localStorage.setItem("pending_user_id", authData.user.id);
      }

      // Update cache
      emailCheckCache.set(normalizedEmail, {
        exists: true,
        email_verified: false,
        user_id: authData.user.id,
        timestamp: Date.now(),
      });

      // Redirect to auth/callback
      toast.success(
        "Registration successful! Please check your email to verify your account."
      );
      navigate("/auth/callback", {
        state: {
          email: formData.email,
          userId: authData.user.id,
          message:
            "Registration successful! Please check your email to verify your account.",
        },
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

  // Handle resend verification for unverified email
  const handleResendVerification = async () => {
    if (!formData.email) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Store email in localStorage for callback
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", formData.email);
      }

      // Navigate to callback page
      toast.success("Verification email resent! Please check your inbox.");
      navigate("/auth/callback", {
        state: {
          email: formData.email,
          message: "Verification email resent! Please check your inbox.",
        },
      });
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Failed to resend verification email. Please try again.");
    }
  };

  // Check if form can be submitted
  const canSubmit =
    formData.terms &&
    passwordsMatch &&
    formData.password.length >= 8 &&
    !errors.email &&
    !emailStatus.exists &&
    formData.email.includes("@");

  return (
    <AuthChecker requireAuth={false} redirectTo="/profile/:userId">
      <AuthLayout
        illustration={registerIllustration}
        illustrationAlt="Registration illustration"
        gradientFrom="from-blue-50"
        gradientTo="to-indigo-100"
      >
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight dark:text-white">
              Create an Account
            </h1>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Join us today! Please enter your details.
            </p>
          </div>

          {errors.submit && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Show special alert for unverified email */}
          {emailStatus.exists && emailStatus.email_verified === false && (
            <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-300">
                <div className="flex flex-col gap-2">
                  <p>This email is registered but not verified.</p>
                  <Button
                    onClick={handleResendVerification}
                    size="sm"
                    variant="outline"
                    className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  >
                    <MailCheck className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="dark:text-gray-300">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    errors.firstName ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="dark:text-gray-300">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    errors.lastName ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="email" className="dark:text-gray-300">
                  Email Address
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="ml-2">
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Use a permanent email you have access to
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center gap-2">
                  {isCheckingEmail && (
                    <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                  )}
                  {emailStatus.exists &&
                    !isCheckingEmail &&
                    formData.email.includes("@") && (
                      <div className="flex items-center gap-1 text-xs">
                        {emailStatus.email_verified === true ? (
                          <>
                            <UserX className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">
                              ✗ Email Already Exist
                            </span>
                          </>
                        ) : emailStatus.email_verified === false ? (
                          <>
                            <ShieldAlert className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-500">
                              ⚠️ Not Verified
                            </span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-3 w-3 text-red-500" />
                            <span className="text-red-500">
                              Already Registered
                            </span>
                          </>
                        )}
                      </div>
                    )}
                </div>
              </div>

              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${
                    errors.email || emailStatus.exists
                      ? "border-red-500 dark:border-red-500"
                      : ""
                  }`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.email || emailStatus.exists ? (
                    <MailWarning className="h-4 w-4 text-red-500" />
                  ) : formData.email.includes("@") &&
                    !errors.email &&
                    !emailStatus.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>

              {/* Email Error */}
              {errors.email && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
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
                {formData.password && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-12 rounded-full ${strengthIndicators[passwordStrength].color}`}
                    />
                    <span className="text-xs font-medium dark:text-gray-300">
                      {strengthIndicators[passwordStrength].text}
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${
                    errors.password ? "border-red-500 dark:border-red-500" : ""
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
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
                  <XCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}

              {/* Password Requirements - Always visible */}
              <div className="space-y-1 mt-2">
                <p className="text-xs font-medium dark:text-gray-400">
                  Password must contain:
                </p>
                <div className="space-y-1">
                  {Object.entries(passwordRequirements).map(([key, met]) => {
                    const labels: Record<string, string> = {
                      length: "At least 8 characters",
                      uppercase: "One uppercase letter (A-Z)",
                      lowercase: "One lowercase letter (a-z)",
                      number: "One number (0-9)",
                      special: "One special character (!@#$%^&*)",
                    };

                    return (
                      <div key={key} className="flex items-center gap-2">
                        {met ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={`text-xs ${met ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}`}
                        >
                          {labels[key]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="confirmPassword" className="dark:text-gray-300">
                  Confirm Password
                </Label>
                {formData.confirmPassword && (
                  <span
                    className={`text-xs font-medium ${passwordsMatch ? "text-green-600 dark:text-green-500" : "text-red-500"}`}
                  >
                    {passwordsMatch
                      ? "✓ Passwords match"
                      : "✗ Passwords don't match"}
                  </span>
                )}
              </div>

              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${
                    errors.confirmPassword
                      ? "border-red-500 dark:border-red-500"
                      : ""
                  }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div
                className={`space-y-2 rounded-lg ${errors.terms ? "bg-red-50 dark:bg-red-900/20" : ""}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex-0 items-center">
                    <Checkbox
                      id="terms"
                      checked={formData.terms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          terms: checked as boolean,
                        }))
                      }
                      className={`mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary ${
                        errors.terms ? "border-red-500 dark:border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="terms"
                      className="font-normal dark:text-gray-400"
                    >
                      I agree to the{" "}
                      <Link
                        to="/terms"
                        className="text-primary hover:underline dark:text-primary-400"
                        onClick={(e) => isSubmitting && e.preventDefault()}
                      >
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        to="/privacy"
                        className="text-primary hover:underline dark:text-primary-400"
                        onClick={(e) => isSubmitting && e.preventDefault()}
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                    {errors.terms && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <XCircle className="h-3 w-3" />
                        {errors.terms}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Newsletter Subscription */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      newsletter: checked as boolean,
                    }))
                  }
                  className="mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary"
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="newsletter"
                  className="font-normal dark:text-gray-400"
                >
                  Subscribe to newsletter for updates and offers
                </Label>
              </div>
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
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
                onClick={handleGoogleSignUp}
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
                {isGoogleLoading ? "Signing in..." : "Sign up with Google"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                disabled={isSubmitting}
                onClick={() => toast.info("GitHub sign up coming soon!")}
              >
                <img
                  src="https://www.svgrepo.com/show/475661/github-filled.svg"
                  alt="GitHub"
                  className="h-5 w-5"
                />
                Sign up with GitHub
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-primary font-medium hover:underline dark:text-primary-400"
              onClick={(e) => isSubmitting && e.preventDefault()}
            >
              Sign in here
            </Link>
          </p>
        </div>
      </AuthLayout>
    </AuthChecker>
  );
}
