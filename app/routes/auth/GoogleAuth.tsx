// src/routes/google-callback.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from Supabase auth
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }

        if (!session?.user) {
          throw new Error("No user session found");
        }

        const user = session.user;
        const userEmail = user.email?.toLowerCase();
        const googleSignupFlow = localStorage.getItem("google_signup_flow");

        // Clear the flag
        localStorage.removeItem("google_signup_flow");

        if (!userEmail) {
          throw new Error("No email found from Google");
        }

        // Check if user already exists in our custom users table
        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id, email, email_verified")
          .eq("email", userEmail)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking user:", checkError);
          // Continue anyway
        }

        if (existingUser) {
          // User exists - log them in
          if (!existingUser.email_verified) {
            // Update email_verified to true since they authenticated with Google
            await supabase
              .from("users")
              .update({
                email_verified: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingUser.id);
          }

          // Navigate to dashboard
          navigate("/dashboard", {
            replace: true,
            state: { message: "Successfully logged in!" },
          });
          return;
        }

        // User doesn't exist - check if this came from the registration page
        if (googleSignupFlow === "true") {
          // This is a new registration via Google
          // Create user in our custom table
          const { error: insertError } = await supabase.from("users").insert({
            id: user.id,
            email: userEmail,
            first_name: user.user_metadata?.given_name || "",
            last_name: user.user_metadata?.family_name || "",
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
            email_verified: true, // Google emails are verified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Error inserting Google user:", insertError);
            // Continue anyway - user is authenticated via Supabase
          }

          // Navigate to dashboard
          navigate("/dashboard", {
            replace: true,
            state: { message: "Registration successful!" },
          });
        } else {
          // This was a login attempt but user doesn't exist
          // Sign them out and show error
          await supabase.auth.signOut();
          setError(
            "No account found with this Google email. Please register first."
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Callback error:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">
            Processing Google sign in...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/register")}
              className="text-primary hover:underline"
            >
              Go back to registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
