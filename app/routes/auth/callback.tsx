import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Home,
  LogIn,
  UserPlus,
  ExternalLink,
  CheckSquare,
  Lock,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CallBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "error" | "unverified"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [checkCount, setCheckCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState<number | null>(
    null
  );
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  // Function to check email verification status
  const checkVerificationStatus = async () => {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session check error:", sessionError);
        return { verified: false, error: sessionError.message };
      }

      if (sessionData.session?.user) {
        // Check if user email is confirmed
        const user = sessionData.session.user;
        const isEmailConfirmed =
          user.email_confirmed_at !== null || user.confirmed_at !== null;

        return {
          verified: isEmailConfirmed,
          user: user,
          email: user.email,
        };
      }

      return { verified: false };
    } catch (error) {
      console.error("Verification check error:", error);
      return { verified: false, error: "Failed to check verification status" };
    }
  };

  // Function to handle safe localStorage access
  const getPendingEmail = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pending_email") || "";
    }
    return "";
  };

  const clearPendingEmail = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_email");
    }
  };

  // Function to start auto-check interval
  const startAutoCheck = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }

    const interval = setInterval(async () => {
      const { verified } = await checkVerificationStatus();
      if (verified) {
        clearInterval(interval);
        setCheckInterval(null);
        setStatus("success");
        setMessage("✅ Email verified! Your account is now active.");

        // Clear pending email
        clearPendingEmail();

        // Start auto-redirect countdown only when verified
        setAutoRedirectTimer(5);
      } else {
        setCheckCount((prev) => prev + 1);
      }
    }, 10000); // Check every 10 seconds

    setCheckInterval(interval);

    // Stop checking after 5 minutes
    setTimeout(
      () => {
        if (checkInterval) {
          clearInterval(checkInterval);
          setCheckInterval(null);
        }
      },
      5 * 60 * 1000
    );
  };

  // Function to navigate to login only if verified
  const navigateToLoginIfVerified = async () => {
    const { verified } = await checkVerificationStatus();
    if (verified) {
      navigate("/login", {
        state: {
          message: "Email verified successfully! You can now log in.",
        },
      });
    } else {
      setStatus("unverified");
      setMessage(
        "❌ Your email is not verified yet. Please verify your email first."
      );
    }
  };

  useEffect(() => {
    // Get email from location state or localStorage
    const pendingEmail = location.state?.email || getPendingEmail();
    setEmail(pendingEmail);

    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL (if user clicked email link)
        const hash = window.location.hash;
        const hasEmailVerification =
          hash.includes("type=signup") || hash.includes("token");

        if (hasEmailVerification) {
          // User clicked email verification link - process it
          console.log("Processing email verification link...");

          // Extract and set the session from URL
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error("Session error after email verification:", error);
            setStatus("error");
            setMessage("Email verification failed. Please try again.");
            return;
          }

          if (data.session?.user) {
            // Check if email is actually confirmed
            const user = data.session.user;
            const isEmailConfirmed =
              user.email_confirmed_at !== null || user.confirmed_at !== null;

            if (isEmailConfirmed) {
              setStatus("success");
              setMessage(
                "Email verified successfully! Your account is now active."
              );

              // Clear pending email
              clearPendingEmail();

              // Start auto-redirect countdown
              setAutoRedirectTimer(5);
            } else {
              setStatus("unverified");
              setMessage(
                "Email not verified yet. Please click the verification link in your email."
              );
              startAutoCheck();
            }
          } else {
            setStatus("pending");
            setMessage(
              `Registration completed! Please check your email at ${pendingEmail} and click the verification link to activate your account.`
            );
            startAutoCheck();
          }
        } else {
          // User came from registration page (not from email link)
          // Check if email is already verified
          const { verified, error } = await checkVerificationStatus();

          if (verified) {
            setStatus("success");
            setMessage(
              "Your email is already verified! Your account is ready."
            );

            // Clear pending email
            clearPendingEmail();

            // Start auto-redirect countdown
            setAutoRedirectTimer(5);
          } else if (error) {
            setStatus("error");
            setMessage(
              "Failed to check verification status. Please try again."
            );
          } else {
            setStatus("pending");
            setMessage(
              `Registration completed! We've sent a verification email to ${pendingEmail}. Please check your inbox and click the link to activate your account.`
            );
            startAutoCheck();
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try registering again.");
      }
    };

    // Small delay to ensure Supabase has processed everything
    const timer = setTimeout(() => {
      handleAuthCallback();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [navigate, location]);

  // Auto-redirect effect
  useEffect(() => {
    if (autoRedirectTimer !== null && autoRedirectTimer > 0) {
      const timer = setInterval(() => {
        setAutoRedirectTimer((prev) => {
          if (prev !== null && prev <= 1) {
            clearInterval(timer);
            navigate("/login", {
              state: {
                message: "Email verified successfully! You can now log in.",
              },
            });
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoRedirectTimer, navigate]);

  // Function to resend verification email
  const handleResendVerification = async () => {
    try {
      if (!email) return;

      setProgress(30);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setProgress(100);
      setStatus("pending");
      setMessage(
        `✅ Verification email resent to ${email}. Please check your inbox and click the link to verify your email.`
      );

      // Reset progress after success
      setTimeout(() => setProgress(0), 1000);
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("❌ Failed to resend verification email. Please try again.");
      setProgress(0);
    }
  };

  // Function to manually check verification status
  const handleCheckVerification = async () => {
    setStatus("loading");
    setMessage("Checking verification status...");
    setProgress(50);

    const { verified, error } = await checkVerificationStatus();

    if (verified) {
      setProgress(100);
      setStatus("success");
      setMessage("✅ Email verified! Your account is now active.");

      // Clear pending email
      clearPendingEmail();

      // Start auto-redirect countdown
      setAutoRedirectTimer(5);
      setTimeout(() => setProgress(0), 1000);
    } else if (error) {
      setProgress(0);
      setStatus("error");
      setMessage("❌ Failed to check verification status. Please try again.");
    } else {
      setProgress(0);
      setStatus("pending");
      setMessage(
        `⏳ Still waiting for verification. Please check your email at ${email} and click the verification link.`
      );
    }
  };

  const StatusIcon = () => {
    switch (status) {
      case "loading":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-20 w-20 rounded-full border-4 border-primary/20 flex items-center justify-center"
          >
            <Loader2 className="h-10 w-10 text-primary" />
          </motion.div>
        );
      case "pending":
        return (
          <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center ring-4 ring-amber-200 dark:ring-amber-900/30">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case "unverified":
        return (
          <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center ring-4 ring-red-200 dark:ring-red-900/30">
            <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        );
      case "success":
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center ring-4 ring-emerald-200 dark:ring-emerald-900/30"
          >
            <ShieldCheck className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        );
      case "error":
        return (
          <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center ring-4 ring-red-200 dark:ring-red-900/30">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        );
    }
  };

  const StatusBadge = () => {
    const badgeConfig = {
      loading: { label: "Processing", variant: "secondary" as const },
      pending: { label: "Pending Verification", variant: "warning" as const },
      unverified: { label: "Not Verified", variant: "destructive" as const },
      success: { label: "Verified", variant: "default" as const },
      error: { label: "Error", variant: "destructive" as const },
    };

    const config = badgeConfig[status];
    return (
      <Badge variant={config.variant} className="text-sm font-medium px-3 py-1">
        {config.label}
      </Badge>
    );
  };

  const StatusSteps = () => {
    const steps = [
      {
        key: "registration",
        label: "Registration",
        completed: ["success", "pending", "unverified", "error"].includes(
          status
        ),
        icon: UserPlus,
      },
      {
        key: "email_sent",
        label: "Email Sent",
        completed: ["success", "pending", "unverified"].includes(status),
        icon: Mail,
      },
      {
        key: "verified",
        label: "Verified",
        completed: status === "success",
        icon: CheckSquare,
      },
    ];

    return (
      <div className="flex items-center justify-between w-full mb-8 relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-muted -z-10">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{
              width: `${(steps.filter((s) => s.completed).length / steps.length) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, index) => (
          <div key={step.key} className="flex flex-col items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center mb-2",
                step.completed
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                step.completed ? "text-primary" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const WarningMessage = () => {
    if (status === "pending" || status === "unverified") {
      return (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            <strong>Account locked:</strong> You must verify your email before
            you can log in.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-xl border-0 dark:border dark:border-gray-700">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <StatusIcon />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">
                {status === "loading" && "Processing Your Registration"}
                {status === "pending" && "Check Your Email"}
                {status === "unverified" && "Email Verification Required"}
                {status === "success" && "Email Verified Successfully!"}
                {status === "error" && "Something Went Wrong"}
              </CardTitle>
              <CardDescription className="text-base">
                <StatusBadge />
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <StatusSteps />

            <AnimatePresence mode="wait">
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {status === "loading" && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-muted-foreground">
                        Completing your registration. Please wait...
                      </p>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {status === "pending" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Account created successfully
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-700 dark:text-blue-400">
                          Verification email sent to <strong>{email}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-700 dark:text-amber-400">
                          Email verification required
                        </span>
                      </div>
                    </div>

                    <WarningMessage />

                    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-300">
                        Please check your email and click the verification link
                        to activate your account.
                        <br />
                        <span className="text-xs mt-1 block opacity-75">
                          Check spam folder if you don't see it in your inbox.
                        </span>
                      </AlertDescription>
                    </Alert>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Didn't receive the email?
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCheckVerification}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Check Status
                        </Button>
                        <Button
                          onClick={handleResendVerification}
                          className="flex-1"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Email
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {status === "unverified" && (
                  <div className="space-y-6">
                    <WarningMessage />

                    <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertDescription className="text-red-800 dark:text-red-300">
                        Your email is not verified yet. Please complete email
                        verification to access your account.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <Button
                        onClick={handleCheckVerification}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Verification Status
                      </Button>
                      <Button
                        onClick={handleResendVerification}
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </Button>
                    </div>
                  </div>
                )}

                {status === "success" && (
                  <div className="space-y-6">
                    <div className="space-y-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          Account activated successfully
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">
                          You can now log in
                        </span>
                      </div>
                    </div>

                    <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                      <MailCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <AlertDescription className="text-emerald-800 dark:text-emerald-300">
                        {autoRedirectTimer !== null && autoRedirectTimer > 0 ? (
                          <>
                            Redirecting to login in {autoRedirectTimer}{" "}
                            seconds...
                          </>
                        ) : (
                          <>Your account is ready! You can now log in.</>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {status === "error" && (
                  <div className="space-y-6">
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <Button
                        onClick={handleCheckVerification}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Status Again
                      </Button>
                      <Button
                        onClick={handleResendVerification}
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Verification Email
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Separator className="mb-4" />
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {status === "success" ? (
                <>
                  <Button
                    onClick={() => navigate("/login")}
                    className="flex-1"
                    size="lg"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Go to Login
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Return Home
                  </Button>
                </>
              ) : (
                <>
                  {status === "pending" || status === "unverified" ? (
                    <Button
                      onClick={navigateToLoginIfVerified}
                      variant="outline"
                      className="flex-1"
                      disabled={status === "pending" || status === "unverified"}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      {status === "pending" || status === "unverified"
                        ? "Verify Email First"
                        : "Login"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate("/login")}
                      variant="outline"
                      className="flex-1"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate("/")}
                    variant="ghost"
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                  <Button
                    onClick={() => navigate("/register")}
                    variant="secondary"
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </>
              )}
            </div>

            {email && (
              <div className="text-xs text-muted-foreground text-center mt-4">
                <p>
                  Email: <span className="font-medium">{email}</span>
                </p>
                {(status === "pending" || status === "unverified") && (
                  <p className="mt-1 text-amber-600 dark:text-amber-400">
                    <Lock className="h-3 w-3 inline mr-1" />
                    Account locked until email verification is complete
                  </p>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
