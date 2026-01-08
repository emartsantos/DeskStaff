import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  MailCheck,
  Mail,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Clock,
  User,
  Lock,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function VerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "pending" | "error" | "checking"
  >("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(5);
  const [showManualVerification, setShowManualVerification] = useState(false);

  // Check if there's a verification token in the URL
  useEffect(() => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl =
      urlParams.get("token") || hash.includes("token=")
        ? hash.split("token=")[1]?.split("&")[0]
        : null;

    if (tokenFromUrl) {
      setVerificationToken(tokenFromUrl);
      handleTokenVerification(tokenFromUrl);
    } else {
      // Check if user is already verified
      checkCurrentVerificationStatus();
    }
  }, [location]);

  // Function to check current verification status
  const checkCurrentVerificationStatus = async () => {
    setStatus("checking");

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        setEmail(session.user.email || "");
        const isVerified = session.user.email_confirmed_at !== null;

        if (isVerified) {
          setStatus("success");
          setMessage(
            "Your email is already verified! You can proceed to login."
          );
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

  // Function to handle token verification
  const handleTokenVerification = async (token: string) => {
    setStatus("loading");

    try {
      // First, try to verify the token directly
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "signup",
      });

      if (error) throw error;

      if (data.user) {
        setStatus("success");
        setMessage("Email verified successfully! Your account is now active.");

        // Clear any pending email from localStorage
        localStorage.removeItem("pending_email");

        // Start auto-redirect countdown
        const timer = setInterval(() => {
          setAutoRedirectTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              navigate("/login", {
                state: {
                  message: "Email verified successfully! You can now log in.",
                },
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    } catch (error) {
      console.error("Token verification error:", error);
      setStatus("error");
      setMessage(
        "Invalid or expired verification token. Please request a new one."
      );
    }
  };

  // Function to request verification email
  const handleRequestVerification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email address.");
      return;
    }

    setStatus("loading");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verification`,
        },
      });

      if (error) throw error;

      setStatus("pending");
      setMessage(
        `✅ Verification email sent to ${email}. Please check your inbox and click the link.`
      );

      // Save email to localStorage for reference
      if (typeof window !== "undefined") {
        localStorage.setItem("pending_email", email);
      }
    } catch (error: any) {
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

  // Function to manually verify with token
  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationToken.trim()) {
      setStatus("error");
      setMessage("Please enter a verification token.");
      return;
    }

    await handleTokenVerification(verificationToken.trim());
  };

  // Function to check verification status
  const handleCheckStatus = async () => {
    setStatus("loading");

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        const isVerified = session.user.email_confirmed_at !== null;

        if (isVerified) {
          setStatus("success");
          setMessage("✅ Your email has been verified! You can now log in.");
        } else {
          setStatus("pending");
          setMessage(
            "⏳ Still waiting for verification. Please check your email."
          );
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
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto"
          >
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
        );
      case "pending":
        return (
          <div className="h-24 w-24 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center ring-4 ring-amber-200 dark:ring-amber-900/30 mx-auto">
            <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case "success":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center ring-4 ring-emerald-200 dark:ring-emerald-900/30 mx-auto"
          >
            <ShieldCheck className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        );
      case "error":
        return (
          <div className="h-24 w-24 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center ring-4 ring-red-200 dark:ring-red-900/30 mx-auto">
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        );
      default:
        return (
          <div className="h-24 w-24 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center ring-4 ring-blue-200 dark:ring-blue-900/30 mx-auto">
            <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        );
    }
  };

  const StatusBadge = () => {
    const badgeConfig = {
      idle: { label: "Ready", variant: "secondary" as const },
      loading: { label: "Processing", variant: "secondary" as const },
      checking: { label: "Checking", variant: "secondary" as const },
      pending: { label: "Pending", variant: "warning" as const },
      success: { label: "Verified", variant: "default" as const },
      error: { label: "Error", variant: "destructive" as const },
    };

    const config = badgeConfig[status];
    return (
      <Badge
        variant={config.variant}
        className="text-sm font-medium px-3 py-1.5 mb-4"
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0 dark:border dark:border-gray-700">
          <CardHeader className="text-center space-y-4">
            <StatusIcon />
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
                {status === "idle" && "Verify Your Email"}
                {status === "loading" && "Verifying..."}
                {status === "checking" && "Checking Status..."}
                {status === "pending" && "Check Your Email"}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Issue"}
              </CardTitle>
              <CardDescription className="text-base">
                <StatusBadge />
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Status Message */}
            {message && (
              <Alert
                className={cn(
                  status === "success" &&
                    "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
                  status === "error" &&
                    "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                  status === "pending" &&
                    "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                  "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                )}
              >
                {status === "success" && (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                )}
                {status === "error" && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                {status === "pending" && (
                  <Clock className="h-4 w-4 text-amber-600" />
                )}
                {(status === "idle" ||
                  status === "checking" ||
                  status === "loading") && (
                  <Mail className="h-4 w-4 text-blue-600" />
                )}
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {/* Email Input Form */}
            {(status === "idle" || status === "error") && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <form
                  onSubmit={handleRequestVerification}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "loading"}
                      required
                      className="dark:bg-gray-700 dark:border-gray-600"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the email you used for registration
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Verification Email
                      </>
                    )}
                  </Button>
                </form>

                <div className="flex items-center my-6">
                  <Separator className="flex-1" />
                  <span className="px-4 text-sm text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setShowManualVerification(!showManualVerification)
                  }
                >
                  {showManualVerification ? (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2 rotate-90" />
                      Hide Manual Verification
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Enter Verification Token Manually
                    </>
                  )}
                </Button>

                {/* Manual Verification Input */}
                {showManualVerification && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 p-4 border rounded-lg bg-muted/30"
                  >
                    <form
                      onSubmit={handleManualVerification}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="token" className="text-sm font-medium">
                          Verification Token
                        </Label>
                        <Input
                          id="token"
                          type="text"
                          placeholder="Paste your verification token here"
                          value={verificationToken}
                          onChange={(e) => setVerificationToken(e.target.value)}
                          disabled={status === "loading"}
                          required
                          className="font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
                        />
                        <p className="text-xs text-muted-foreground">
                          Paste the token from your verification email or URL
                        </p>
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={status === "loading"}
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Verify Token
                          </>
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Success State */}
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Account successfully verified
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      Full account access granted
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    <span className="text-blue-700 dark:text-blue-400 font-medium">
                      Redirecting to login in {autoRedirectTimer} seconds...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pending State */}
            {status === "pending" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-800 dark:text-amber-300 font-medium">
                        Important:
                      </p>
                      <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 mt-1">
                        <li>
                          • Check your spam/junk folder if you don't see the
                          email
                        </li>
                        <li>• Click the verification link in the email</li>
                        <li>• The link expires after 24 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleCheckStatus}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                  <Button
                    onClick={() => handleRequestVerification()}
                    variant="secondary"
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Resend Email
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Separator className="mb-4" />

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {status === "success" ? (
                <Button
                  onClick={() => navigate("/login")}
                  className="flex-1"
                  size="lg"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Login Now
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => navigate("/login")}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    variant="ghost"
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                  <Button
                    onClick={handleCheckStatus}
                    variant="secondary"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check Status
                  </Button>
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center mt-6 space-y-2">
              <p className="flex items-center justify-center gap-2">
                <Lock className="h-3 w-3" />
                <span>Your verification is secure and encrypted</span>
              </p>
              <p>Need help? Contact support for assistance.</p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
