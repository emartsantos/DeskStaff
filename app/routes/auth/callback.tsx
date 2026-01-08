import * as React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  MailCheck,
  Mail,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CallBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "error" | "unverified"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [checkCount, setCheckCount] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(0);

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

              // Redirect to login after 3 seconds
              setTimeout(() => {
                navigate("/login", {
                  state: {
                    message: "Email verified successfully! You can now log in.",
                  },
                });
              }, 3000);
            } else {
              setStatus("unverified");
              setMessage(
                "Email not verified yet. Please click the verification link in your email."
              );
            }
          } else {
            setStatus("pending");
            setMessage(
              `Registration completed! Please check your email at ${pendingEmail} and click the verification link to activate your account.`
            );
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

            // Redirect to login after 3 seconds
            setTimeout(() => {
              navigate("/login", {
                state: {
                  message: "Email already verified! You can now log in.",
                },
              });
            }, 3000);
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

            // Start periodic verification checks (every 10 seconds for 5 minutes)
            const interval = setInterval(async () => {
              const { verified } = await checkVerificationStatus();
              if (verified) {
                clearInterval(interval);
                setStatus("success");
                setMessage("Email verified! Your account is now active.");

                // Clear pending email
                clearPendingEmail();

                // Redirect to login after 3 seconds
                setTimeout(() => {
                  navigate("/login", {
                    state: {
                      message:
                        "Email verified successfully! You can now log in.",
                    },
                  });
                }, 3000);
              }
            }, 10000); // Check every 10 seconds

            // Stop checking after 5 minutes
            setTimeout(() => clearInterval(interval), 5 * 60 * 1000);
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

    return () => clearTimeout(timer);
  }, [navigate, location]);

  // Function to resend verification email
  const handleResendVerification = async () => {
    try {
      if (!email) return;

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

      setStatus("pending");
      setMessage(
        `Verification email resent to ${email}. Please check your inbox and click the link to verify your email.`
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("Failed to resend verification email. Please try again.");
    }
  };

  // Function to manually check verification status
  const handleCheckVerification = async () => {
    setStatus("loading");
    setMessage("Checking verification status...");

    const { verified, error } = await checkVerificationStatus();

    if (verified) {
      setStatus("success");
      setMessage("Email verified! Your account is now active.");

      // Clear pending email
      clearPendingEmail();

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Email verified successfully! You can now log in.",
          },
        });
      }, 3000);
    } else if (error) {
      setStatus("error");
      setMessage("Failed to check verification status. Please try again.");
    } else {
      setStatus("pending");
      setMessage(
        `Still waiting for verification. Please check your email at ${email} and click the verification link.`
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {status === "loading" && (
            <>
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20"></div>
                <Loader2 className="h-20 w-20 absolute inset-0 m-auto animate-spin text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  Processing...
                </h2>
                <p className="text-muted-foreground mt-2">
                  Completing your registration. Please wait.
                </p>
              </div>
            </>
          )}

          {status === "pending" && (
            <>
              <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  Check Your Email! 📧
                </h2>
                <p className="text-muted-foreground mt-4">{message}</p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      Account created successfully
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Verification email sent to {email}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Email verification required
                    </span>
                  </div>
                </div>

                <Alert className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    Please check your email and click the verification link
                    before proceeding.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-4 w-full">
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
                  variant="secondary"
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>

                <Button
                  onClick={() => navigate("/")}
                  className="w-full"
                  variant="ghost"
                >
                  Return to Home
                </Button>
              </div>
            </>
          )}

          {status === "unverified" && (
            <>
              <div className="h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  Verification Required
                </h2>
                <p className="text-muted-foreground mt-4">{message}</p>

                <Alert className="mt-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-300">
                    Your email is not verified yet. Please complete email
                    verification to access your account.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="space-y-4 w-full">
                <Button
                  onClick={handleCheckVerification}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Verification Status
                </Button>

                <Button onClick={handleResendVerification} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>

                <Button
                  onClick={() => navigate("/login")}
                  variant="secondary"
                  className="w-full"
                >
                  Go to Login Page
                </Button>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MailCheck className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  Email Verified! ✅
                </h2>
                <p className="text-muted-foreground mt-2">{message}</p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      Account activated successfully
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">
                      You can now log in
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Redirecting to login...
                    </span>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate("/login")} className="mt-6">
                Go to Login Now
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  Oops! Something went wrong
                </h2>
                <p className="text-muted-foreground mt-2">{message}</p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <Button onClick={handleCheckVerification} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status Again
                </Button>
                <Button variant="secondary" onClick={handleResendVerification}>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>
                <Button variant="outline" onClick={() => navigate("/register")}>
                  Try Registration Again
                </Button>
                <Button onClick={() => navigate("/")}>Go Home</Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
