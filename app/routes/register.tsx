import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router";
import registerIllustration from "../assets/images/login-illustration.jpg";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <AuthLayout
      illustration={registerIllustration}
      illustrationAlt="Registration illustration"
      gradientFrom="from-blue-50"
      gradientTo="to-indigo-100"
    >
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight dark:text-white">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Join us today! Please enter your details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="dark:text-gray-300">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="dark:text-gray-300">
                Last Name
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                required
              />
            </div>
          </div>

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
            <p className="text-xs text-muted-foreground dark:text-gray-400">
              Must be at least 8 characters with uppercase, lowercase, and
              numbers.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="dark:text-gray-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                className="mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary"
              />
              <div>
                <Label
                  htmlFor="terms"
                  className="font-normal dark:text-gray-400"
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="text-primary hover:underline dark:text-primary-400"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-primary hover:underline dark:text-primary-400"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="newsletter"
                className="mt-1 dark:border-gray-600 dark:data-[state=checked]:bg-primary"
              />
              <Label
                htmlFor="newsletter"
                className="font-normal dark:text-gray-400"
              >
                Subscribe to newsletter
              </Label>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg">
            Create Account
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card dark:bg-gray-800 px-2 text-muted-foreground dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-3">
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
              Sign up with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full flex items-center gap-2 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <img
                src="https://www.svgrepo.com/show/475661/github-filled.svg"
                alt="GitHub"
                className="h-5 w-5"
              />
              Sign up with GitHub
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline dark:text-primary-400"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
