import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link, useNavigate } from "react-router";
import loginIllustration from "../assets/images/login-illustration.jpg";
import { useTheme } from "@/context/ThemeProvider";

export default function Login() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle login logic here
    navigate("/dashboard");
  };

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
            <div className="w-full max-w-md">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight dark:text-white">
                  Welcome Back
                </h1>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Welcome back! Please enter your details.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="dark:text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      className="dark:border-gray-600 dark:data-[state=checked]:bg-primary"
                    />
                    <Label
                      htmlFor="remember"
                      className="font-normal dark:text-gray-400"
                    >
                      Remember me
                    </Label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline dark:text-primary-400"
                  >
                    Forgot password
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Sign in
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="h-5 w-5"
                  />
                  Sign in with Google
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary font-medium hover:underline dark:text-primary-400"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT – ILLUSTRATION */}
          <div
            className={`hidden md:flex items-center justify-center h-full transition-all duration-500 ${
              theme === "dark"
                ? "bg-gradient-to-br from-gray-800 to-gray-900"
                : "bg-gradient-to-br from-red-50 to-neutral-100"
            }`}
          >
            <img
              src={loginIllustration}
              alt="Login illustration"
              className="h-[520px] w-full object-cover transition-opacity duration-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
