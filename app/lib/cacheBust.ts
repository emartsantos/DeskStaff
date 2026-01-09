// src/lib/cacheBust.ts
class CacheBustManager {
  private static instance: CacheBustManager;
  private version: number = Date.now();
  private subscribers: Array<() => void> = [];

  private constructor() {}

  static getInstance(): CacheBustManager {
    if (!CacheBustManager.instance) {
      CacheBustManager.instance = new CacheBustManager();
    }
    return CacheBustManager.instance;
  }

  getVersion(): number {
    return this.version;
  }

  bust(): void {
    this.version = Date.now();
    this.notifySubscribers();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach((callback) => callback());
  }

  // Helper to add cache busting to any URL
  bustUrl(url: string): string {
    if (!url) return url;
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set("_cb", this.version.toString());
      return urlObj.toString();
    } catch {
      // If URL parsing fails, just return original
      return url;
    }
  }

  // Helper to bust all Supabase storage URLs
  bustSupabaseUrl(url: string): string {
    if (!url || !url.includes("supabase.co")) return url;
    return this.bustUrl(url);
  }
}

export const cacheBust = CacheBustManager.getInstance();
