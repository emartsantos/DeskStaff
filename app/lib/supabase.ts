// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { cacheBust } from "./cacheBust";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Create the base client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // Global fetch options for cache control
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      // Clone the init object to avoid mutations
      const fetchInit = init ? { ...init } : {};

      // Add cache busting headers for all requests
      if (!fetchInit.headers) {
        fetchInit.headers = {};
      }

      // Convert headers to Headers object if needed
      let headers: Headers;
      if (fetchInit.headers instanceof Headers) {
        headers = fetchInit.headers;
      } else if (typeof fetchInit.headers === "object") {
        headers = new Headers(fetchInit.headers);
      } else {
        headers = new Headers();
      }

      // Add cache busting headers
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      headers.set("X-Cache-Bust", cacheBust.getVersion().toString());

      fetchInit.headers = headers;

      // Add cache busting to URL for GET requests
      if (typeof input === "string" && input.includes("storage/v1/object")) {
        const bustedUrl = cacheBust.bustSupabaseUrl(input);
        return fetch(bustedUrl, fetchInit);
      }

      return fetch(input, fetchInit);
    },
  },
});

// Export a helper function to bust cache globally
export const bustGlobalCache = () => {
  cacheBust.bust();
};

// Export a hook-friendly version
export const useSupabaseCacheBust = () => {
  const bust = () => cacheBust.bust();
  const getBustedUrl = (url: string) => cacheBust.bustSupabaseUrl(url);
  const version = cacheBust.getVersion();

  return { bust, getBustedUrl, version };
};
