// components/AuthGuard.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Mock API function - replace with your actual API call
async function getCurrentUser(): Promise<{ email_verified: boolean } | null> {
  // This would be your actual API call to get current user
  // const response = await fetch('/api/auth/me');
  // return response.json();

  // Mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        email_verified: true, // Change this to test different scenarios
      });
    }, 500);
  });
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();

        if (user && user.email_verified) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  if (!isVerified) {
    // Redirect to verification required page
    return (
      <Navigate
        to="/verify-email-required"
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
