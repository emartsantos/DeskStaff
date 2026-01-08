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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";

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

// Cache for checked emails to reduce redundant API calls
const emailCheckCache = new Map<
  string,
  { exists: boolean; timestamp: number; isVerified?: boolean }
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
  const [emailExists, setEmailExists] = React.useState<boolean>(false);
  const [emailVerificationStatus, setEmailVerificationStatus] = React.useState<
    "verified" | "unverified" | "none"
  >("none");

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

  // Common email typos and suggestions
  const commonEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
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
    weak: { color: "bg-red-500", text: "Weak", description: "Easy to crack" },
    medium: {
      color: "bg-yellow-500",
      text: "Medium",
      description: "Could be stronger",
    },
    strong: {
      color: "bg-green-500",
      text: "Strong",
      description: "Good password",
    },
    "very-strong": {
      color: "bg-emerald-600",
      text: "Very Strong",
      description: "Excellent password",
    },
  };

  // Helper function to check unverified users
  const checkUnverifiedUser = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email, email_verified")
        .eq("email", email.toLowerCase())
        .eq("email_verified", false)
        .maybeSingle();

      if (error) {
        console.error("Error checking unverified user:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Exception checking unverified user:", error);
      return null;
    }
  };

  // Check if email exists in database
  const checkEmailExists = React.useCallback(async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();

    // Only check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setEmailExists(false);
      setEmailVerificationStatus("none");
      return false;
    }

    // Check cache first
    const cached = emailCheckCache.get(normalizedEmail);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setEmailExists(cached.exists);
      setEmailVerificationStatus(cached.isVerified ? "verified" : "unverified");
      return cached.exists;
    }

    setIsCheckingEmail(true);
    try {
      // Check both verified and unverified users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email, email_verified")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (userError) {
        console.error("Database query error:", userError);
        emailCheckCache.set(normalizedEmail, {
          exists: false,
          timestamp: Date.now(),
        });
        setEmailExists(false);
        setEmailVerificationStatus("none");
        return false;
      }

      // If userData exists, email is already registered
      const exists = !!userData;
      const isVerified = userData?.email_verified || false;

      emailCheckCache.set(normalizedEmail, {
        exists,
        timestamp: Date.now(),
        isVerified,
      });

      setEmailExists(exists);
      setEmailVerificationStatus(
        exists ? (isVerified ? "verified" : "unverified") : "none"
      );

      // Clear any existing email errors when checking
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });

      return exists;
    } catch (error) {
      console.error("Error checking email:", error);
      emailCheckCache.set(normalizedEmail, {
        exists: false,
        timestamp: Date.now(),
      });
      setEmailExists(false);
      setEmailVerificationStatus("none");
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Optimized email validation
  const validateEmail = React.useCallback((email: string) => {
    const newErrors: Record<string, string> = {};
    const suggestions: string[] = [];

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      return { errors: newErrors, suggestions };
    }

    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
      return { errors: newErrors, suggestions };
    }

    const [localPart, domain] = email.split("@");
    if (domain) {
      // Check for disposable/temporary emails
      const isDisposable = disposableEmailDomains.some((disposable) =>
        domain.toLowerCase().includes(disposable.toLowerCase())
      );

      if (isDisposable) {
        newErrors.email = "Please use a permanent email address";
        suggestions.push("Disposable/temporary emails are not allowed");
      }

      // Check for domain typos and suggest corrections
      const typedDomain = domain.toLowerCase();
      for (const commonDomain of commonEmailDomains) {
        if (
          typedDomain.includes(commonDomain.replace(".", "")) ||
          (typedDomain.length >= 3 && commonDomain.includes(typedDomain)) ||
          levenshteinDistance(typedDomain, commonDomain) <= 2
        ) {
          const suggestedEmail = `${localPart}@${commonDomain}`;
          if (suggestedEmail !== email.toLowerCase()) {
            suggestions.push(`Did you mean ${suggestedEmail}?`);
          }
        }
      }

      // Check for invalid TLDs
      const validTLDs = [
        "com",
        "org",
        "net",
        "edu",
        "gov",
        "io",
        "co",
        "ai",
        "dev",
        "me",
        "info",
        "biz",
        "us",
        "uk",
        "ca",
        "au",
        "in",
      ];
      const tld = domain.split(".").pop()?.toLowerCase();
      if (tld && !validTLDs.includes(tld) && tld.length <= 3) {
        suggestions.push("This email domain might be incorrect");
      }

      // Check for suspicious patterns
      if (localPart.length > 50) {
        suggestions.push("Email username seems unusually long");
      }

      if (domain.split(".").length > 3) {
        suggestions.push("Email domain has too many subdomains");
      }
    }

    return { errors: newErrors, suggestions };
  }, []);

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

    // Clear email states when email changes
    if (id === "email") {
      if (emailExists) {
        setEmailExists(false);
        setEmailVerificationStatus("none");
      }
      // Clear cache for this email
      emailCheckCache.delete(value.toLowerCase());
    }

    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));

    // Validate email in real-time
    if (id === "email") {
      const { errors: emailErrors, suggestions } = validateEmail(value);
      setEmailSuggestions(suggestions);

      // Update errors
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (emailErrors.email) {
          newErrors.email = emailErrors.email;
          delete newErrors.submit;
        } else if (newErrors.email) {
          delete newErrors.email;
        }
        return newErrors;
      });

      // Clear previous debounce timer
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }

      // Only check if email format is valid and not disposable
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(value) && !emailErrors.email) {
        // Check if email is not disposable
        const domain = value.split("@")[1];
        const isDisposable =
          domain &&
          disposableEmailDomains.some((disposable) =>
            domain.toLowerCase().includes(disposable.toLowerCase())
          );

        if (!isDisposable) {
          debouncedEmailCheck.current = setTimeout(() => {
            checkEmailExists(value);
          }, 800);
        }
      }
    } else {
      // Clear error for other fields
      if (errors[id]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[id];
          return newErrors;
        });
      }
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debouncedEmailCheck.current) {
        clearTimeout(debouncedEmailCheck.current);
      }
    };
  }, []);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    // Email validation
    const { errors: emailErrors } = validateEmail(formData.email);
    Object.assign(newErrors, emailErrors);

    // Check email existence and verification status
    if (!emailErrors.email && emailExists) {
      if (emailVerificationStatus === "verified") {
        newErrors.email =
          "This email is already registered and verified. Please use a different email or try logging in.";
      } else if (emailVerificationStatus === "unverified") {
        newErrors.email =
          "This email is registered but not verified. Please check your email for the verification link or request a new one.";
      } else {
        newErrors.email =
          "This email is already registered. Please use a different email or try logging in.";
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

    // Double-check email existence before proceeding
    const normalizedEmail = formData.email.toLowerCase();
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("email, email_verified")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (userData) {
        // Update cache
        emailCheckCache.set(normalizedEmail, {
          exists: true,
          timestamp: Date.now(),
          isVerified: userData.email_verified,
        });
        setEmailExists(true);
        setEmailVerificationStatus(
          userData.email_verified ? "verified" : "unverified"
        );

        if (userData.email_verified) {
          setErrors({
            submit:
              "This email is already registered and verified. Please use a different email or try logging in.",
          });
        } else {
          setErrors({
            submit:
              "This email is registered but not verified. Please check your email for verification or visit the verification page.",
          });
        }
        return;
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
          // Update cache
          emailCheckCache.set(normalizedEmail, {
            exists: true,
            timestamp: Date.now(),
          });
          setEmailExists(true);
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

      // ========== CRITICAL: INSERT USER INTO USERS TABLE WITH email_verified = false ==========
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
            // Unique violation
            const { error: updateError } = await supabase
              .from("users")
              .update({
                first_name: formData.firstName.trim(),
                last_name: formData.lastName.trim(),
                full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
                newsletter_subscribed: formData.newsletter,
                email_verified: false, // Ensure it's false
                updated_at: new Date().toISOString(),
              })
              .eq("email", normalizedEmail);

            if (updateError) {
              console.error("Error updating user in users table:", updateError);
            }
          }
        }
      } catch (dbError) {
        console.error("Database insert/update error:", dbError);
        // Don't throw here - we still want to proceed with registration
      }
      // ========== END CRITICAL SECTION ==========

      // Verify the user was added to unverified_users
      try {
        const { data: unverifiedUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", normalizedEmail)
          .eq("email_verified", false)
          .maybeSingle();

        if (!unverifiedUser) {
          console.warn("User was not added to unverified_users");
          // Attempt to manually fix by updating email_verified to false
          await supabase
            .from("users")
            .update({ email_verified: false })
            .eq("email", normalizedEmail);
        } else {
          console.log("User successfully added to unverified_users");
        }
      } catch (verificationError) {
        console.error(
          "Error verifying unverified user status:",
          verificationError
        );
      }

      // Store email in localStorage for post-registration flow
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", formData.email);
        // Also store user ID for reference
        localStorage.setItem("pending_user_id", authData.user.id);
      }

      // Redirect to auth/callback with state
      navigate("/auth/callback", {
        state: {
          email: formData.email,
          userId: authData.user.id,
          message:
            "Registration successful! Please check your email to verify your account. Your account has been added to unverified users until you verify your email.",
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "Registration failed. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form can be submitted
  const canSubmit =
    formData.terms &&
    passwordsMatch &&
    formData.password.length >= 8 &&
    !errors.email &&
    !emailExists &&
    formData.email.includes("@");

  return (
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
                {emailExists &&
                  !isCheckingEmail &&
                  formData.email.includes("@") && (
                    <div className="flex items-center gap-1 text-xs">
                      {emailVerificationStatus === "verified" ? (
                        <>
                          <UserX className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">
                            Already registered & verified
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3 w-3 text-amber-500" />
                          <span className="text-amber-500">
                            Registered but not verified
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
                  errors.email || emailExists
                    ? "border-red-500 dark:border-red-500"
                    : ""
                }`}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {errors.email || emailExists ? (
                  <MailWarning className="h-4 w-4 text-red-500" />
                ) : formData.email.includes("@") &&
                  !errors.email &&
                  !emailExists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
            </div>

            {/* Email Errors */}
            {(errors.email || emailExists) && (
              <div className="space-y-1">
                {emailSuggestions.length > 0 && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    {emailSuggestions.map((suggestion, index) => (
                      <p key={index} className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Email Requirements */}
            <div className="space-y-1 mt-2">
              <p className="text-xs font-medium dark:text-gray-400">
                Email requirements:
              </p>
              <div className="space-y-1">
                {[
                  {
                    key: "format",
                    met: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email),
                    label: "Valid email format (user@domain.com)",
                  },
                  {
                    key: "disposable",
                    met: !disposableEmailDomains.some((domain) =>
                      formData.email
                        .toLowerCase()
                        .includes(domain.toLowerCase())
                    ),
                    label: "Not a disposable/temporary email",
                  },
                ].map(({ key, met, label, loading, showOnlyIfRegistered }) => {
                  if (showOnlyIfRegistered && !emailExists) return null;

                  return (
                    <div key={key} className="flex items-center gap-2">
                      {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                      ) : met || !formData.email ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={`text-xs ${met ? "text-green-600 dark:text-green-500" : loading ? "text-gray-500" : "text-red-500 dark:text-red-400"}`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
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

            {/* Password Requirements */}
            {formData.password && (
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
            )}
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
              disabled={isSubmitting}
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="h-5 w-5"
              />
              Sign up with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              disabled={isSubmitting}
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
  );
}
