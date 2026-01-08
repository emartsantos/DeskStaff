// Safe localStorage utility that works in both browser and server environments

export const safeLocalStorage = {
  setItem: (key: string, value: string): void => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
    }
  },

  getItem: (key: string): string | null => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error("Error reading from localStorage:", error);
        return null;
      }
    }
    return null;
  },

  removeItem: (key: string): void => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error("Error removing from localStorage:", error);
      }
    }
  },

  clear: (): void => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
      } catch (error) {
        console.error("Error clearing localStorage:", error);
      }
    }
  },
};
