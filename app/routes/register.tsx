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
  const [emailSuggestions, setEmailSuggestions] = React.useState<string[]>([]);
  const [successMessage, setSuccessMessage] = React.useState("");

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

  // Email validation and suggestions
  const validateEmail = (email: string) => {
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

    // Check for common typos in domain
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

      // Check for free email providers with strict limitations
      const freeProviders = [
        "gmail.com",
        "yahoo.com",
        "outlook.com",
        "hotmail.com",
      ];
      if (freeProviders.includes(domain.toLowerCase())) {
        suggestions.push(
          "Consider using a work or institutional email for better delivery"
        );
      }
    }

    return { errors: newErrors, suggestions };
  };

  // Levenshtein distance for typo detection
  const levenshteinDistance = (a: string, b: string): number => {
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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));

    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage("");
    }

    // Validate email in real-time
    if (id === "email") {
      const { errors: emailErrors, suggestions } = validateEmail(value);
      setEmailSuggestions(suggestions);

      // Update errors
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (emailErrors.email) {
          newErrors.email = emailErrors.email;
        } else if (newErrors.email) {
          delete newErrors.email;
        }
        return newErrors;
      });
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

  // Check if email already exists in Supabase
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        console.error("Error checking email:", error);
        return false;
      }

      return !!data; // Returns true if email exists
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  // Save user data to Supabase
  const saveUserToSupabase = async (userData: RegisterFormData) => {
    const user = {
      email: userData.email.toLowerCase(),
      first_name: userData.firstName.trim(),
      last_name: userData.lastName.trim(),
      full_name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
      newsletter_subscribed: userData.newsletter,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // For security, we don't store password in user table
    // Instead, we'll use Supabase Auth for authentication
    // But we can still store profile information

    const { data, error } = await supabase
      .from("users")
      .insert([user])
      .select();

    if (error) {
      throw new Error(`Failed to save user: ${error.message}`);
    }

    return data;
  };

  // Sign up user with Supabase Auth
  const signUpWithSupabase = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
          newsletter_subscribed: formData.newsletter,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    return data;
  };

  // Handle form submission with Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        throw new Error(
          "Email already registered. Please use a different email or try logging in."
        );
      }

      // Sign up with Supabase Auth
      const { user } = await signUpWithSupabase(
        formData.email,
        formData.password
      );

      if (!user) {
        throw new Error("Registration failed. Please try again.");
      }

      // Save additional user data to Supabase
      await saveUserToSupabase(formData);

      // Success - show success message
      setSuccessMessage(
        "Account created successfully! Please check your email to verify your account."
      );

      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
        newsletter: false,
      });

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);

      if (error instanceof Error) {
        // Handle specific Supabase errors
        if (error.message.includes("User already registered")) {
          setErrors({
            submit:
              "Email already registered. Please use a different email or try logging in.",
          });
        } else if (error.message.includes("Password should be at least")) {
          setErrors({
            submit: "Password is too weak. Please use a stronger password.",
          });
        } else if (error.message.includes("Invalid email")) {
          setErrors({ submit: "Please enter a valid email address." });
        } else {
          setErrors({ submit: error.message });
        }
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
    formData.email.includes("@");

  // Email domain info
  const getEmailDomainInfo = () => {
    const domain = formData.email.split("@")[1];
    if (!domain) return null;

    const domainInfo: Record<
      string,
      { icon: React.ReactNode; message: string; color: string }
    > = {
      "gmail.com": {
        icon: <span className="text-xs">📧</span>,
        message: "Gmail",
        color: "text-red-500",
      },
      "yahoo.com": {
        icon: <span className="text-xs">🌈</span>,
        message: "Yahoo Mail",
        color: "text-purple-500",
      },
      "outlook.com": {
        icon: <span className="text-xs">📨</span>,
        message: "Outlook",
        color: "text-blue-500",
      },
      "hotmail.com": {
        icon: <span className="text-xs">🔥</span>,
        message: "Hotmail",
        color: "text-orange-500",
      },
      "icloud.com": {
        icon: <span className="text-xs">☁️</span>,
        message: "iCloud",
        color: "text-gray-500",
      },
    };

    return (
      domainInfo[domain.toLowerCase()] || {
        icon: <span className="text-xs">📧</span>,
        message: `@${domain}`,
        color: "text-gray-500",
      }
    );
  };

  const emailDomainInfo = getEmailDomainInfo();

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

        {successMessage && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

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
              {emailDomainInfo &&
                formData.email.includes("@") &&
                !errors.email && (
                  <div
                    className={`text-xs font-medium flex items-center gap-1 ${emailDomainInfo.color}`}
                  >
                    {emailDomainInfo.icon}
                    <span>{emailDomainInfo.message}</span>
                  </div>
                )}
            </div>

            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10 ${
                  errors.email ? "border-red-500 dark:border-red-500" : ""
                }`}
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {errors.email ? (
                  <MailWarning className="h-4 w-4 text-red-500" />
                ) : formData.email.includes("@") && !errors.email ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : null}
              </div>
            </div>

            {/* Email Errors */}
            {errors.email && (
              <div className="space-y-1">
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {errors.email}
                </p>
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
                  {
                    key: "common",
                    met:
                      formData.email.includes("@") &&
                      (commonEmailDomains.some((domain) =>
                        formData.email.toLowerCase().endsWith(`@${domain}`)
                      ) ||
                        true), // Always show as valid if not disposable
                    label: "Common email provider or custom domain",
                  },
                ].map(({ key, met, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    {met || !formData.email ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs ${met ? "text-green-600 dark:text-green-500" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
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
