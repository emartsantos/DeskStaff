// pages/VerifyEmailRequired.tsx
import { useLocation, useNavigate } from "react-router";

export default function VerifyEmailRequired() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || "/dashboard";

  const handleResendVerification = async () => {
    try {
      // Call your API to resend verification
      // await fetch('/api/auth/resend-verification', { method: 'POST' });
      alert("Verification email resent! Please check your inbox.");
    } catch (error) {
      alert("Failed to resend verification email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Email Verification Required
          </h1>
          <p className="mt-2 text-gray-600">
            Please verify your email to access {from}
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                What to do next:
              </h3>
              <ol className="mt-2 list-decimal list-inside text-gray-600 space-y-2">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>Return here or to the dashboard after verification</li>
              </ol>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendVerification}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Resend Verification Email
              </button>

              <button
                onClick={() => navigate(-1)}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={handleResendVerification}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              click here to resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
