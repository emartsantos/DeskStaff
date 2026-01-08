import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router";
import loginIllustration from "../assets/images/login-illustration.jpg";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      illustration={loginIllustration}
      illustrationAlt="Login illustration"
      gradientFrom="from-red-50"
      gradientTo="to-neutral-100"
    >
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border dark:border-gray-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

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
    </AuthLayout>
  );
}
