import * as React from "react";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/context/ThemeProvider";

interface AuthLayoutProps {
  children: React.ReactNode;
  illustration?: string;
  illustrationAlt?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function AuthLayout({
  children,
  illustration,
  illustrationAlt = "Auth illustration",
  gradientFrom = "from-red-50",
  gradientTo = "to-neutral-100",
}: AuthLayoutProps) {
  const { theme } = useTheme();

  // Use default illustration if not provided
  const illustrationSrc =
    illustration ||
    "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted dark:bg-gray-900 px-4 transition-colors duration-300">
      <Card className="w-full max-w-5xl overflow-hidden rounded-2xl shadow-xl py-0 dark:bg-gray-800 dark:border-gray-700 transition-colors duration-300">
        {/* Theme Toggle Button */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* LEFT – FORM */}
          <div className="flex items-center justify-center px-8 md:px-12 py-8">
            {children}
          </div>

          {/* RIGHT – ILLUSTRATION */}
          <div
            className={`hidden md:flex items-center justify-center h-full transition-all duration-500 ${
              theme === "dark"
                ? "bg-gradient-to-br from-gray-800 to-gray-900"
                : `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
            }`}
          >
            <img
              src={illustrationSrc}
              alt={illustrationAlt}
              className="h-full w-full object-cover transition-opacity duration-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
