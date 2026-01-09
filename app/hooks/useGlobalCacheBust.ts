// src/hooks/useGlobalCacheBust.ts
import { useEffect, useState } from "react";
import { cacheBust } from "@/lib/cacheBust";

export function useGlobalCacheBust() {
  const [version, setVersion] = useState(cacheBust.getVersion());

  useEffect(() => {
    // Subscribe to cache bust events
    const unsubscribe = cacheBust.subscribe(() => {
      setVersion(cacheBust.getVersion());
    });

    return unsubscribe;
  }, []);

  const bust = () => cacheBust.bust();

  const getBustedUrl = (url: string) => {
    if (!url) return url;
    return cacheBust.bustSupabaseUrl(url);
  };

  return { version, bust, getBustedUrl };
}
