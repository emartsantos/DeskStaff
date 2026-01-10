// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

/**
 * User profile interface matching database structure
 */
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

/**
 * Return type for the useAuth hook
 */
interface UseAuthReturn {
  user: UserProfile | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Custom hook for managing authentication state
 * Handles user login, profile creation, and session management
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch or create user profile from Supabase database
   * @param authUser - Authenticated Supabase user object
   */
  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Try to fetch existing user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) {
        // If user doesn't exist in database, create a new profile
        if (
          profileError.code === "PGRST116" ||
          profileError.message?.includes("No rows found")
        ) {
          const userData = {
            id: authUser.id,
            email: authUser.email!,
            first_name: authUser.user_metadata?.first_name || "",
            last_name: authUser.user_metadata?.last_name || "",
            full_name:
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              `${authUser.user_metadata?.first_name || ""} ${
                authUser.user_metadata?.last_name || ""
              }`.trim() ||
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
            // Even if creation fails, return basic info from auth user
            setUser({
              id: authUser.id,
              email: authUser.email!,
              full_name:
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                `${authUser.user_metadata?.first_name || ""} ${
                  authUser.user_metadata?.last_name || ""
                }`.trim() ||
                authUser.email?.split("@")[0] ||
                "User",
              avatar_url: authUser.user_metadata?.avatar_url || null,
              first_name: authUser.user_metadata?.first_name,
              last_name: authUser.user_metadata?.last_name,
            });
            return;
          }

          setUser(newProfile);
          return;
        }
        throw profileError;
      }

      setUser(profile);
    } catch (err: any) {
      console.error("Error in fetchUserProfile:", err);
      // Fallback to auth user data
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            `${authUser.user_metadata?.first_name || ""} ${
              authUser.user_metadata?.last_name || ""
            }`.trim() ||
            authUser.email?.split("@")[0] ||
            "User",
          avatar_url: authUser.user_metadata?.avatar_url || null,
          first_name: authUser.user_metadata?.first_name,
          last_name: authUser.user_metadata?.last_name,
        });
      }
      setError(err.message || "Failed to load user profile");
    }
  };

  /**
   * Initialize authentication state and fetch current session
   */
  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setSupabaseUser(null);
      }
    } catch (err: any) {
      console.error("Auth initialization error:", err);
      setError(err.message || "Failed to initialize authentication");
      setUser(null);
      setSupabaseUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect to initialize auth and set up auth state change listener
   */
  useEffect(() => {
    initializeAuth();

    // Listen for auth state changes (login, logout, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setSupabaseUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSupabaseUser(null);
    } catch (err: any) {
      console.error("Sign out error:", err);
      setError(err.message || "Failed to sign out");
      throw err;
    }
  };

  /**
   * Refresh user data from server
   */
  const refreshUser = async () => {
    if (!supabaseUser) return;

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        setSupabaseUser(authUser);
        await fetchUserProfile(authUser);
      }
    } catch (err: any) {
      console.error("Error refreshing user data:", err);
      setError(err.message || "Failed to refresh user data");
    }
  };

  return {
    user, // UserProfile from database
    supabaseUser, // Supabase User from auth
    loading,
    error,
    signOut,
    refreshUser,
    isAuthenticated: !!supabaseUser,
  };
}
