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
  Mail,
  RefreshCw,
  AlertTriangle,
  Shield,
  MailCheck,
  Key,
  UserCheck,
  Verified,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    "loading" | "verified" | "not_verified" | "error" | "processing"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [emailConfirmationData, setEmailConfirmationData] = useState<{
    confirmedInAuth: boolean;
    verifiedInDB: boolean;
  } | null>(null);
  const [progress, setProgress] = useState(0);

  // Get email from localStorage or location state
  const getEmail = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pending_email") || "";
    }
    return "";
  };

  // Clear pending data
  const clearPendingData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_email");
      localStorage.removeItem("pending_user_id");
    }
  };

  // Check email_verified status in database
  const checkEmailVerifiedStatus = async (
    userEmail: string
  ): Promise<boolean> => {
    try {
      if (!userEmail) return false;

      const { data, error } = await supabase
        .from("users")
        .select("email_verified")
        .eq("email", userEmail.toLowerCase())
        .maybeSingle();

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

  // Update email_verified to TRUE (only when user clicks email link)
  const updateEmailVerifiedToTrue = async (
    userEmail: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail.toLowerCase());

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

  // Check if user email is confirmed in Supabase Auth
  const checkEmailConfirmedInAuth = async (): Promise<boolean> => {
    try {
      const {
        data: { session },
        error,
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

  // Process email verification from email link
  const processEmailVerification = async (userEmail: string) => {
    try {
      setStatus("processing");
      setMessage("Processing email verification...");
      setProgress(30);

      // Check if email is confirmed in Supabase Auth
      const isConfirmedInAuth = await checkEmailConfirmedInAuth();
      setProgress(60);

      // Check current status in database
      const isVerifiedInDB = await checkEmailVerifiedStatus(userEmail);
      setProgress(80);

      setEmailConfirmationData({
        confirmedInAuth: isConfirmedInAuth,
        verifiedInDB: isVerifiedInDB,
      });

      // User clicked email link and auth confirms email
      if (isConfirmedInAuth) {
        // Update database to email_verified = TRUE
        const updated = await updateEmailVerifiedToTrue(userEmail);

        if (updated) {
          // Verify the update was successful
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
        // User clicked link but auth doesn't confirm yet
        setEmailVerified(false);
        setStatus("not_verified");
        setMessage(
          "Email verification link clicked, but confirmation is still pending."
        );
      }
    } catch (error) {
      console.error("Error processing email verification:", error);
      setStatus("error");
      setMessage("An error occurred while processing email verification.");
    }
  };

  // Main callback handler
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get email from location state or localStorage
        const userEmail = location.state?.email || getEmail();

        if (!userEmail) {
          setStatus("error");
          setMessage("No email found. Please try registering again.");
          return;
        }

        setEmail(userEmail);

        // Check if user came from email verification link
        const hash = window.location.hash;
        const isFromEmailLink =
          hash.includes("type=signup") || hash.includes("token=");

        if (isFromEmailLink) {
          // User clicked email verification link
          await processEmailVerification(userEmail);
        } else {
          // User came directly - just check current status
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

    // Small delay to ensure Supabase has processed everything
    const timer = setTimeout(() => {
      handleCallback();
    }, 1000);

    return () => clearTimeout(timer);
  }, [location]);

  // Function to manually check status
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

  // Function to resend verification email
  const handleResendVerification = async () => {
    if (!email) return;

    setStatus("loading");
    setMessage("Sending verification email...");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setStatus("not_verified");
      setMessage(
        `Verification email sent to ${email}. Please check your inbox.`
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("Failed to resend verification email");
    }
  };

  // Navigate to login
  const handleGoToLogin = () => {
    clearPendingData();
    navigate("/login", {
      state: {
        email,
        verified: status === "verified",
        message:
          status === "verified"
            ? "Email verified successfully! You can now log in."
            : undefined,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <Card className="w-full max-w-lg p-8 shadow-2xl border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              Email Verification
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {email && `Verifying: ${email}`}
            </p>
          </div>

          <Separator className="w-full" />

          {/* Main Content */}
          <div className="w-full space-y-6">
            {/* Status Section */}
            <div className="space-y-4">
              {/* Progress Bar */}
              {(status === "loading" || status === "processing") && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Processing...
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Status Indicator */}
              <div className="flex items-center justify-center">
                <div
                  className={`relative ${status === "processing" || status === "loading" ? "animate-pulse" : ""}`}
                >
                  {/* Status Icon */}
                  <div
                    className={`h-24 w-24 rounded-full flex items-center justify-center shadow-lg ${
                      status === "verified"
                        ? "bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-800"
                        : status === "not_verified"
                          ? "bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/30 dark:border-amber-800"
                          : status === "error"
                            ? "bg-gradient-to-br from-red-100 to-rose-100 border-4 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:border-red-800"
                            : "bg-gradient-to-br from-blue-100 to-indigo-100 border-4 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:border-blue-800"
                    }`}
                  >
                    {status === "loading" || status === "processing" ? (
                      <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : status === "verified" ? (
                      <Verified className="h-12 w-12 text-green-600 dark:text-green-400" />
                    ) : status === "not_verified" ? (
                      <AlertTriangle className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <Badge
                      variant={
                        status === "verified"
                          ? "default"
                          : status === "not_verified"
                            ? "secondary"
                            : status === "error"
                              ? "destructive"
                              : "outline"
                      }
                      className="px-3 py-1 font-medium"
                    >
                      {status === "loading" && "Checking"}
                      {status === "processing" && "Processing"}
                      {status === "verified" && "Verified"}
                      {status === "not_verified" && "Not Verified"}
                      {status === "error" && "Error"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {status === "loading" && "Checking Verification Status"}
                  {status === "processing" && "Processing Verification"}
                  {status === "verified" && "Email Verified Successfully!"}
                  {status === "not_verified" && "Email Verification Required"}
                  {status === "error" && "Verification Failed"}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Verification Details */}
            {(emailConfirmationData || emailVerified !== null) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Verification Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Database Status */}
                  <Card className="p-4 border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Database Status
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${emailVerified ? "bg-green-500" : "bg-red-500"}`}
                          />
                          <p
                            className={`text-sm font-medium ${emailVerified ? "text-green-600" : "text-red-600"}`}
                          >
                            email_verified = {emailVerified ? "TRUE" : "FALSE"}
                          </p>
                        </div>
                      </div>
                      <Shield
                        className={`h-5 w-5 ${emailVerified ? "text-green-500" : "text-red-500"}`}
                      />
                    </div>
                  </Card>

                  {/* Auth Status */}
                  {emailConfirmationData && (
                    <Card className="p-4 border shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Authentication
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${emailConfirmationData.confirmedInAuth ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <p
                              className={`text-sm font-medium ${emailConfirmationData.confirmedInAuth ? "text-green-600" : "text-red-600"}`}
                            >
                              {emailConfirmationData.confirmedInAuth
                                ? "Confirmed"
                                : "Not Confirmed"}
                            </p>
                          </div>
                        </div>
                        <UserCheck
                          className={`h-5 w-5 ${emailConfirmationData.confirmedInAuth ? "text-green-500" : "text-red-500"}`}
                        />
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {status === "verified" && (
                <>
                  <Button
                    onClick={handleGoToLogin}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Continue to Login
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCheckStatus}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Again
                    </Button>
                    <Button
                      onClick={() => navigate("/")}
                      variant="ghost"
                      className="flex-1"
                    >
                      Go Home
                    </Button>
                  </div>
                </>
              )}

              {status === "not_verified" && (
                <>
                  <Button
                    onClick={handleResendVerification}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Resend Verification Email
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleCheckStatus}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Check Status
                    </Button>
                    <Button
                      onClick={() => navigate("/login")}
                      variant="ghost"
                      className="flex-1"
                    >
                      Go to Login
                    </Button>
                  </div>
                </>
              )}

              {status === "error" && (
                <>
                  <Button
                    onClick={handleCheckStatus}
                    className="w-full h-12 text-base font-medium"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Try Again
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigate("/register")}
                      variant="outline"
                      className="flex-1"
                    >
                      Register Again
                    </Button>
                    <Button
                      onClick={() => navigate("/")}
                      variant="ghost"
                      className="flex-1"
                    >
                      Go Home
                    </Button>
                  </div>
                </>
              )}

              {status === "processing" && (
                <Button disabled className="w-full h-12">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing Verification...
                </Button>
              )}
            </div>

            {/* Help Text */}
            <div className="pt-6 border-t">
              <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <MailCheck className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">
                  Need help?
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                  <ul className="space-y-1 mt-1">
                    <li>• Check your spam folder for the verification email</li>
                    <li>
                      • Make sure you clicked the link in the verification email
                    </li>
                    <li>• Verification links expire after 24 hours</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
