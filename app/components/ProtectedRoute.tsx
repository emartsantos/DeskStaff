// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { AuthChecker } from "./AuthChecker";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
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

      if (!session) {
        navigate("/", { replace: true });
        return;
      }

      // Verify user exists in database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", session.user.id)
        .single();

      if (userError || !userData) {
        console.error("User not found in database:", userError);
        // If user doesn't exist in database, log them out
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error("Authentication error:", error);
      navigate("/", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the effect
  }

  return (
    <AuthChecker requireAuth={true} redirectTo="/">
      {children}
    </AuthChecker>
  );
}
