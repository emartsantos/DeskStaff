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
} from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "success" | "pending" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  // Function to handle safe localStorage access
  const getPendingEmail = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pending_email") || "";
    }
    return "";
  };

  // Clear email safely
  const clearPendingEmail = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_email");
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get email from location state or localStorage
        const pendingEmail = location.state?.email || getPendingEmail();
        setEmail(pendingEmail);

        // Get the hash from URL (if user clicked email link)
        const hash = window.location.hash;

        if (hash.includes("type=signup")) {
          // User clicked email verification link
          const { error } = await supabase.auth.getSession();

          if (error) {
            console.error("Session error after email verification:", error);
            setStatus("error");
            setMessage("Email verification failed. Please try again.");
            return;
          }

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
          // User came from registration page (not from email link)
          setStatus("pending");
          setMessage(
            `Registration completed! We've sent a verification email to ${pendingEmail}. Please check your inbox and click the link to activate your account.`
          );

          // Redirect to login after 10 seconds
          setTimeout(() => {
            navigate("/login");
          }, 10000);
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
        `Verification email resent to ${email}. Please check your inbox.`
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("Failed to resend verification email. Please try again.");
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
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Waiting for email verification
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 w-full">
                <Button
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Verification Email
                </Button>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full"
                  variant="secondary"
                >
                  Go to Login
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
                <Button variant="outline" onClick={() => navigate("/register")}>
                  Try Registration Again
                </Button>
                <Button onClick={() => navigate("/")}>Go Home</Button>
                {email && (
                  <Button
                    variant="secondary"
                    onClick={handleResendVerification}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Verification Email
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
