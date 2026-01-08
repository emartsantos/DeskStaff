// hooks/useEmailVerification.ts
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface User {
  id: string;
  email: string;
  email_verified: boolean;
  verified_at: string | null;
}

export function useEmailVerification() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Replace with your actual API call
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const checkVerification = (redirectTo = "/verify-email-required") => {
    if (!loading && user && !user.email_verified) {
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  const resendVerification = async () => {
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user?.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend verification");
      }

      return { success: true };
    } catch (error) {
      console.error("Resend verification error:", error);
      return { success: false, error };
    }
  };

  return {
    user,
    loading,
    isVerified: user?.email_verified || false,
    checkVerification,
    resendVerification,
  };
}
