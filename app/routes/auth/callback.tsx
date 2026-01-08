import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";

interface UserVerificationStatus {
  id: string;
  email_verified: boolean;
  verified_at: string | null;
}

// Mock API function - replace with your actual API call
async function checkEmailVerification(
  token?: string
): Promise<UserVerificationStatus> {
  // This is where you'd make an actual API call to your backend
  // Example with actual API call:
  /*
  const response = await fetch(`/api/auth/verify-email?token=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Verification failed');
  }
  
  return response.json();
  */

  // Mock implementation
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (token && token.length > 10) {
        resolve({
          id: "mock-id",
          email_verified: true,
          verified_at: new Date().toISOString(),
        });
      } else {
        reject(new Error("Invalid token"));
      }
    }, 1000);
  });
}

export default function EmailVerificationCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "already_verified"
  >("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Verification token is missing");
          return;
        }

        // Call your API to verify the email
        const result = await checkEmailVerification(token);

        if (result.email_verified) {
          setStatus("success");
          setMessage("Email verified successfully!");

          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 3000);
        }
      } catch (error) {
        console.error("Verification error:", error);

        // Check if this is a "already verified" error from your backend
        // Adjust this based on your actual API error response
        const errorMessage =
          error instanceof Error ? error.message : "Verification failed";

        if (
          errorMessage.includes("already verified") ||
          errorMessage.includes("already_verified")
        ) {
          setStatus("already_verified");
          setMessage("Email is already verified");
        } else {
          setStatus("error");
          setMessage(errorMessage);
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    try {
      // Call API to resend verification email
      // Example:
      // await fetch('/api/auth/resend-verification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: userEmail }),
      // });

      setMessage(
        "Verification email has been resent. Please check your inbox."
      );
    } catch (error) {
      setMessage("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Email Verification
          </h1>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          {status === "loading" && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">
                Verifying your email address...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Success!
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-2 text-sm text-gray-500">
                You will be redirected shortly...
              </p>
              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {status === "already_verified" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Already Verified
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => navigate("/dashboard", { replace: true })}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Verification Failed
              </h3>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleResendVerification}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Resend Verification Email
                </button>
                <button
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
