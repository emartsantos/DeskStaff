// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  first_name?: string;
  last_name?: string;
  position?: string;
  department?: string;
  location?: string | null;
  bio?: string | null;
}

interface UseAuthReturn {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log("🔍 Fetching user profile for:", authUser.id);

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);

        // If user doesn't exist in database, create a basic profile
        if (
          profileError.code === "PGRST116" ||
          profileError.message?.includes("No rows found")
        ) {
          console.log("Creating new user profile...");

          const userData = {
            id: authUser.id,
            email: authUser.email,
            first_name: authUser.user_metadata?.first_name || "",
            last_name: authUser.user_metadata?.last_name || "",
            full_name:
              authUser.user_metadata?.full_name ||
              `${authUser.user_metadata?.first_name || ""} ${authUser.user_metadata?.last_name || ""}`.trim() ||
              authUser.email?.split("@")[0] ||
              "User",
            avatar_url: authUser.user_metadata?.avatar_url || null,
            bio: null,
            location: null,
            workplace: null,
            education: null,
            birthday: null,
            website: null,
            privacy: "public" as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            logged_in: true,
            last_seen: null,
          };

          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert([userData])
            .select()
            .single();

          if (insertError) {
            console.error("Error creating user profile:", insertError);
            throw insertError;
          }

          console.log("✅ New user profile created:", newProfile);
          setUser(newProfile);
          return;
        }
        throw profileError;
      }

      console.log("✅ User profile loaded:", profile);
      setUser(profile);
    } catch (err: any) {
      console.error("❌ Error fetching user profile:", err);
      setError(err.message || "Failed to load user profile");
    }
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔄 Initializing auth...");

      // Check current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw sessionError;
      }

      console.log("Session:", session ? "Found" : "Not found");

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error("❌ Auth initialization error:", err);
      setError(err.message || "Failed to initialize authentication");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth state changed:",
        event,
        session ? "User found" : "No user"
      );

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      console.log("✅ Signed out successfully");
    } catch (err: any) {
      console.error("❌ Sign out error:", err);
      setError(err.message || "Failed to sign out");
      throw err;
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      console.log("Refreshing user data...");
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        await fetchUserProfile(authUser);
      }
    } catch (err: any) {
      console.error("❌ Refresh user error:", err);
      setError(err.message || "Failed to refresh user data");
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    refreshUser,
  };
}
