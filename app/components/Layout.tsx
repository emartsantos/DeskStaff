import * as React from "react";
import { Outlet, Link } from "react-router";
import { ThemeToggle } from "./ThemeToggle";

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-bold text-xl">
              MyApp
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/dashboard" className="text-sm hover:text-primary">
                Dashboard
              </Link>
              <Link to="/profile" className="text-sm hover:text-primary">
                Profile
              </Link>
              <Link to="/settings" className="text-sm hover:text-primary">
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
