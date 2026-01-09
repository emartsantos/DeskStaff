// src/components/AuthChecker.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface AuthCheckerProps {
  children: React.ReactNode;
  requireAuth?: boolean; // true = requires auth, false = redirects if auth, undefined = public page
  redirectTo?: string; // where to redirect if auth check fails/passes
}

export function AuthChecker({
  children,
  requireAuth = true,
  redirectTo = "/login",
}: AuthCheckerProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }

      const hasSession = !!session;

      if (requireAuth) {
        // Page requires authentication
        if (!hasSession) {
          navigate(redirectTo, { replace: true });
          return;
        }

        // Verify user exists in database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("id", session!.user.id)
          .single();

        if (userError || !userData) {
          console.error("User not found in database:", userError);
          await supabase.auth.signOut();
          navigate(redirectTo, { replace: true });
          return;
        }

        setIsAuthenticated(true);
      } else {
        // Page should NOT be accessible if authenticated (like login/register)
        if (hasSession) {
          navigate(redirectTo || "/profile", { replace: true });
          return;
        }
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      if (requireAuth) {
        navigate(redirectTo, { replace: true });
      }
    } finally {
      // Always show loading for at least 2 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the effect
  }

  return <>{children}</>;
}
