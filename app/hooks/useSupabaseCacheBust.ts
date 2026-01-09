// src/hooks/useSupabaseCacheBust.ts
import { useState, useCallback } from "react";

export function useSupabaseCacheBust() {
  const [version, setVersion] = useState(Date.now());

  const refresh = useCallback(() => {
    setVersion(Date.now());
  }, []);

  const getBustedUrl = useCallback(
    (url: string) => {
      if (!url) return url;

      const urlObj = new URL(url);
      urlObj.searchParams.delete("v");
      urlObj.searchParams.append("v", version.toString());
      return urlObj.toString();
    },
    [version]
  );

  return { getBustedUrl, refresh, version };
}
