// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function to bust cache for images
export const bustGlobalCache = () => {
  localStorage.setItem("cache_bust", Date.now().toString());
};

// Helper to get cache-busted URL
export const getBustedUrl = (url: string): string => {
  if (!url) return url;
  const cacheKey = localStorage.getItem("cache_bust") || "0";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}_cb=${cacheKey}`;
};
