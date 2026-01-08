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
  Shield,
  Lock,
} from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<
    | "loading"
    | "success"
    | "pending"
    | "error"
    | "unverified"
    | "checking_verification"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [verificationDetails, setVerificationDetails] = useState<{
    dbVerified: boolean;
    authVerified: boolean;
  } | null>(null);
  const MAX_RETRIES = 3;

  // Function to handle safe localStorage access
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

  // Clear pending data safely
  const clearPendingData = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pending_email");
      localStorage.removeItem("pending_user_id");
    }
  };

  // Function to check email_verified status in database ONLY
  const checkEmailVerifiedInDB = async (
    userEmail: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email_verified")
        .eq("email", userEmail.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error("Error checking email_verified in DB:", error);
        return false;
      }

      return data?.email_verified === true;
    } catch (error) {
      console.error("Exception checking email_verified in DB:", error);
      return false;
    }
  };

  // Function to check if user is verified in the database
  const checkUserVerificationStatus = async (
    userEmail: string,
    userId?: string | null
  ) => {
    try {
      // Try to get user from users table
      let query = supabase
        .from("users")
        .select("email_verified, id, email")
        .eq("email", userEmail.toLowerCase());

      const { data: userData, error: userError } = await query.maybeSingle();

      if (userError) {
        console.error("Error checking user verification:", userError);
        return { verified: false, error: userError.message };
      }

      if (!userData) {
        // User not found in users table
        return { verified: false, error: "User not found in database" };
      }

      // Check if email_verified is true
      const isVerifiedInDB = userData.email_verified === true;

      // Also check Supabase auth status for consistency
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session check error:", sessionError);
        return { verified: isVerifiedInDB, userId: userData.id };
      }

      const isVerifiedInAuth =
        session?.user?.email_confirmed_at !== null ||
        session?.user?.confirmed_at !== null;

      // User is considered verified only if BOTH systems agree
      const isFullyVerified = isVerifiedInDB && isVerifiedInAuth;

      // Store verification details for UI
      setVerificationDetails({
        dbVerified: isVerifiedInDB,
        authVerified: isVerifiedInAuth,
      });

      return {
        verified: isFullyVerified,
        userId: userData.id,
        dbVerified: isVerifiedInDB,
        authVerified: isVerifiedInAuth,
      };
    } catch (error) {
      console.error("Exception checking verification status:", error);
      return { verified: false, error: "Failed to check verification status" };
    }
  };

  // Function to update user verification status in database
  const updateUserVerificationInDB = async (
    userEmail: string,
    isVerified: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          email_verified: isVerified,
          updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail.toLowerCase());

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

  // CRITICAL: Function to verify user can proceed to login
  const verifyUserCanLogin = async (userEmail: string): Promise<boolean> => {
    // Double-check email_verified status in database
    const isEmailVerifiedInDB = await checkEmailVerifiedInDB(userEmail);

    if (!isEmailVerifiedInDB) {
      console.log("🚫 User cannot login: email_verified = false in database");
      return false;
    }

    // Also check auth status
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const isAuthVerified = session?.user?.email_confirmed_at !== null;

    if (!isAuthVerified) {
      console.log("🚫 User cannot login: email not confirmed in auth");
      return false;
    }

    console.log("✅ User can login: Both DB and Auth verified");
    return true;
  };

  // Function to wait and retry verification check
  const waitAndRetryVerification = async (
    userEmail: string,
    userId: string | null,
    currentRetry: number
  ) => {
    if (currentRetry >= MAX_RETRIES) {
      setStatus("unverified");
      setMessage(
        `Email verification is taking longer than expected. Please check your email at ${userEmail} and click the verification link. You may need to manually refresh this page after verifying.`
      );
      return;
    }

    // Wait 3 seconds before retrying
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const { verified, dbVerified, authVerified } =
      await checkUserVerificationStatus(userEmail, userId);

    // CRITICAL: Check if user can actually login
    const canLogin = await verifyUserCanLogin(userEmail);

    if (verified && canLogin) {
      // Update database if needed
      if (!dbVerified) {
        await updateUserVerificationInDB(userEmail, true);
      }

      setStatus("success");
      setMessage("Email verified successfully! Your account is now active.");
      clearPendingData();

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Email verified successfully! You can now log in.",
          },
        });
      }, 3000);
    } else {
      setRetryCount(currentRetry + 1);
      setStatus("checking_verification");
      setMessage(
        `Still checking verification status... (Attempt ${currentRetry + 1}/${MAX_RETRIES})`
      );

      // Retry again
      setTimeout(() => {
        waitAndRetryVerification(userEmail, userId, currentRetry + 1);
      }, 3000);
    }
  };

  // Function to handle successful verification and redirect
  const handleSuccessfulVerification = async (userEmail: string) => {
    // CRITICAL: Final verification check before allowing login
    const canLogin = await verifyUserCanLogin(userEmail);

    if (!canLogin) {
      setStatus("unverified");
      setMessage(
        `Your email verification is not complete. Please check ${userEmail} and click the verification link. Database shows email_verified = false.`
      );
      return;
    }

    setStatus("success");
    setMessage("Email verified successfully! Your account is now active.");
    clearPendingData();

    // Redirect to login after 3 seconds
    setTimeout(() => {
      navigate("/login", {
        state: {
          message: "Email verified successfully! You can now log in.",
        },
      });
    }, 3000);
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get email from location state or localStorage
        const pendingEmail = location.state?.email || getPendingEmail();
        const pendingUserId = location.state?.userId || getPendingUserId();

        setEmail(pendingEmail);
        setUserId(pendingUserId);

        // Get the hash from URL (if user clicked email link)
        const hash = window.location.hash;

        if (hash.includes("type=signup") || hash.includes("token=")) {
          // User clicked email verification link
          setStatus("checking_verification");
          setMessage("Verifying your email... Please wait.");

          // First, get the session to process the verification
          const { error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error(
              "Session error after email verification:",
              sessionError
            );
            setStatus("error");
            setMessage("Email verification failed. Please try again.");
            return;
          }

          // Check verification status in database
          const { verified, dbVerified, authVerified, error } =
            await checkUserVerificationStatus(pendingEmail, pendingUserId);

          if (error && error !== "User not found in database") {
            console.error("Verification check error:", error);
          }

          // CRITICAL: Check if user can actually login
          const canLogin = await verifyUserCanLogin(pendingEmail);

          if (verified && canLogin) {
            // Update database if needed
            if (!dbVerified) {
              await updateUserVerificationInDB(pendingEmail, true);
            }

            setStatus("success");
            setMessage(
              "Email verified successfully! Your account is now active."
            );
            clearPendingData();

            // Redirect to login after 3 seconds
            setTimeout(() => {
              navigate("/login", {
                state: {
                  message: "Email verified successfully! You can now log in.",
                },
              });
            }, 3000);
          } else if (authVerified && !dbVerified) {
            // Auth says verified but DB doesn't - update DB first
            await updateUserVerificationInDB(pendingEmail, true);

            // CRITICAL: Check again after updating DB
            const canLoginAfterUpdate = await verifyUserCanLogin(pendingEmail);

            if (canLoginAfterUpdate) {
              setStatus("success");
              setMessage("Email verified successfully! Database updated.");
              clearPendingData();

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
                `Database updated but email verification not complete. Please check ${pendingEmail}.`
              );
            }
          } else {
            // Not verified yet, start retry mechanism
            setStatus("checking_verification");
            setMessage("Email verification in progress... Checking status.");
            setRetryCount(0);

            // Start retry mechanism
            setTimeout(() => {
              waitAndRetryVerification(pendingEmail, pendingUserId, 0);
            }, 3000);
          }
        } else {
          // User came from registration page (not from email link)
          // Check current verification status
          const { verified, dbVerified, authVerified } =
            await checkUserVerificationStatus(pendingEmail, pendingUserId);

          // CRITICAL: Check if user can actually login
          const canLogin = await verifyUserCanLogin(pendingEmail);

          if (verified && canLogin) {
            setStatus("success");
            setMessage("Your email is already verified! You can now log in.");
            clearPendingData();

            setTimeout(() => {
              navigate("/login", {
                state: {
                  message: "Email already verified! You can now log in.",
                },
              });
            }, 3000);
          } else if (authVerified && !dbVerified) {
            // Auth says verified but DB doesn't - update DB first
            await updateUserVerificationInDB(pendingEmail, true);

            // CRITICAL: Check again after updating DB
            const canLoginAfterUpdate = await verifyUserCanLogin(pendingEmail);

            if (canLoginAfterUpdate) {
              setStatus("success");
              setMessage("Email verification completed! Database updated.");
              clearPendingData();

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
                `Database updated but email verification not complete. Please check ${pendingEmail}.`
              );
            }
          } else {
            // User is not verified - DO NOT REDIRECT TO LOGIN
            setStatus("pending");
            setMessage(
              `Registration completed! We've sent a verification email to ${pendingEmail}. Please check your inbox and click the link to activate your account.`
            );

            // Start periodic verification checks
            const checkInterval = setInterval(async () => {
              const { verified, dbVerified, authVerified } =
                await checkUserVerificationStatus(pendingEmail, pendingUserId);

              // CRITICAL: Check if user can actually login
              const canLogin = await verifyUserCanLogin(pendingEmail);

              if ((verified || (authVerified && !dbVerified)) && canLogin) {
                clearInterval(checkInterval);

                if (authVerified && !dbVerified) {
                  await updateUserVerificationInDB(pendingEmail, true);
                }

                setStatus("success");
                setMessage("Email verified! Your account is now active.");
                clearPendingData();

                setTimeout(() => {
                  navigate("/login", {
                    state: {
                      message:
                        "Email verified successfully! You can now log in.",
                    },
                  });
                }, 3000);
              }
            }, 5000); // Check every 5 seconds

            // Stop checking after 5 minutes
            setTimeout(
              () => {
                clearInterval(checkInterval);
                if (status === "pending") {
                  setStatus("unverified");
                  setMessage(
                    `Verification is taking longer than expected. Please check your email at ${pendingEmail} and click the verification link.`
                  );
                }
              },
              5 * 60 * 1000
            );
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
  }, [navigate, location, status]);

  // Function to resend verification email
  const handleResendVerification = async () => {
    try {
      if (!email) return;

      setStatus("loading");
      setMessage("Sending verification email...");

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/verification`,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("pending");
      setMessage(
        `✅ Verification email resent to ${email}. Please check your inbox.`
      );
    } catch (error) {
      console.error("Error resending verification:", error);
      setStatus("error");
      setMessage("❌ Failed to resend verification email. Please try again.");
    }
  };

  // Function to manually check verification status
  const handleCheckVerification = async () => {
    try {
      setStatus("checking_verification");
      setMessage("Checking verification status...");

      const { verified, dbVerified, authVerified } =
        await checkUserVerificationStatus(email, userId);

      // CRITICAL: Check if user can actually login
      const canLogin = await verifyUserCanLogin(email);

      if (verified && canLogin) {
        setStatus("success");
        setMessage("✅ Email verified! Your account is now active.");
        clearPendingData();

        setTimeout(() => {
          navigate("/login", {
            state: {
              message: "Email verified successfully! You can now log in.",
            },
          });
        }, 3000);
      } else if (authVerified && !dbVerified) {
        // Update DB first
        await updateUserVerificationInDB(email, true);

        // CRITICAL: Check again after updating DB
        const canLoginAfterUpdate = await verifyUserCanLogin(email);

        if (canLoginAfterUpdate) {
          setStatus("success");
          setMessage("✅ Email verification completed! Database updated.");
          clearPendingData();

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
            `❌ Database updated but email verification not complete. Please check ${email}.`
          );
        }
      } else {
        setStatus("unverified");
        setMessage(
          `❌ Email not verified yet. Please check your email at ${email} and click the verification link.`
        );
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      setStatus("error");
      setMessage("Failed to check verification status.");
    }
  };

  // Function to go to verification page
  const handleGoToVerification = () => {
    navigate("/verification", {
      state: { email, userId },
    });
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

          {status === "checking_verification" && (
            <>
              <div className="relative">
                <div className="h-20 w-20 rounded-full border-4 border-primary/20"></div>
                <Loader2 className="h-20 w-20 absolute inset-0 m-auto animate-spin text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold dark:text-white">
                  Checking Verification
                </h2>
                <p className="text-muted-foreground mt-4">{message}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400">
                      Verifying email confirmation...
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Checking database status...
                    </span>
                  </div>
                  {verificationDetails && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Status Check:
                      </p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">Database:</span>
                        <span
                          className={`text-xs font-medium ${verificationDetails.dbVerified ? "text-green-600" : "text-red-600"}`}
                        >
                          {verificationDetails.dbVerified
                            ? "✓ Verified"
                            : "✗ Not Verified"}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs">Auth System:</span>
                        <span
                          className={`text-xs font-medium ${verificationDetails.authVerified ? "text-green-600" : "text-red-600"}`}
                        >
                          {verificationDetails.authVerified
                            ? "✓ Verified"
                            : "✗ Not Verified"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
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
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">
                      Login disabled until email is verified
                    </span>
                  </div>
                </div>
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

                <Button onClick={handleGoToVerification} className="w-full">
                  Go to Verification Page
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

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-600 dark:text-amber-400">
                      Email not verified yet
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">
                      Cannot log in until email is verified
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Lock className="h-4 w-4 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">
                      Database check: email_verified = false
                    </span>
                  </div>
                </div>
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
                  onClick={handleGoToVerification}
                  variant="secondary"
                  className="w-full"
                >
                  Go to Verification Page
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
                      Database: email_verified = true
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
