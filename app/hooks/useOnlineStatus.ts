import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);

        // Check current online status
        const { data: userData } = await supabase
          .from("users")
          .select("logged_in")
          .eq("id", session.user.id)
          .single();

        setIsOnline(userData?.logged_in || false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUserId(session.user.id);
        setIsOnline(true);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setIsOnline(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setOnlineStatus = async (status: boolean) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          logged_in: status,
          updated_at: new Date().toISOString(),
          ...(status ? {} : { last_seen: new Date().toISOString() }),
        })
        .eq("id", userId);

      if (!error) {
        setIsOnline(status);
      }
    } catch (error) {
      console.error("Error setting online status:", error);
    }
  };

  return {
    isOnline,
    setOnline: () => setOnlineStatus(true),
    setOffline: () => setOnlineStatus(false),
    userId,
  };
}
