// pages/VerifyEmailRequiredV2.tsx (Alternative with countdown)
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Shield,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailRequiredV2() {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from || "/dashboard";
  const userEmail = location.state?.email || "your@email.com";

  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendVerification = async () => {
    if (cooldown > 0 || resendCount >= 5) return;

    setIsResending(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setResendCount((prev) => prev + 1);
      setCooldown(RESEND_COOLDOWN);

      toast.success("📧 Verification email sent!", {
        description: `Email sent to ${userEmail}`,
        action: {
          label: "Open Mail",
          onClick: () => window.open("https://mail.google.com", "_blank"),
        },
      });
    } catch (error) {
      toast.error("Failed to send email", {
        description: "Please check your internet connection",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header with progress */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-6 border">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Secure Your Account
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
            Verify your email address{" "}
            <span className="font-semibold text-primary">{userEmail}</span> to
            continue
          </p>

          <Progress value={33} className="w-64 mx-auto h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step 1 of 3: Email Verification
          </p>
        </div>

        <Tabs defaultValue="verify" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Verify Email
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Need Help?
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verify">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Action Card */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Verify Your Email Address</CardTitle>
                      <CardDescription>
                        Click the link in the email we sent to complete
                        verification
                      </CardDescription>
                    </div>
                    <Badge
                      variant={resendCount === 0 ? "default" : "secondary"}
                    >
                      {resendCount === 0 ? "Ready" : `Sent ${resendCount}x`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Email Confirmation */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Email sent to:</p>
                        <p className="text-sm text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEmailConfirmed(true)}
                    >
                      {emailConfirmed ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirmed
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                  </div>

                  {/* Action Steps */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Quick Actions:</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Button
                        onClick={handleResendVerification}
                        disabled={
                          isResending || cooldown > 0 || resendCount >= 5
                        }
                        className="h-auto py-4"
                      >
                        <div className="flex items-center justify-center gap-3">
                          {isResending ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Mail className="h-5 w-5" />
                          )}
                          <div className="text-left">
                            <div className="font-semibold">Resend Email</div>
                            <div className="text-xs opacity-75">
                              {cooldown > 0
                                ? `Available in ${formatTime(cooldown)}`
                                : resendCount < 5
                                  ? `${5 - resendCount} attempts remaining`
                                  : "Limit reached"}
                            </div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto py-4"
                        onClick={() =>
                          window.open("https://mail.google.com", "_blank")
                        }
                      >
                        <div className="flex items-center justify-center gap-3">
                          <ExternalLink className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">Open Email</div>
                            <div className="text-xs opacity-75">
                              Check your inbox now
                            </div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Status Alert */}
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Verification Status</AlertTitle>
                    <AlertDescription>
                      {resendCount === 0
                        ? "Waiting for you to check your email"
                        : resendCount === 1
                          ? "Email sent. Please check your inbox"
                          : `Email resent ${resendCount} times. Check spam folder if not received.`}
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => navigate(0)}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    I've Verified My Email
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Previous Page
                  </Button>
                </CardFooter>
              </Card>

              {/* Tips Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Tips & Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Common Issues:</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                        <span>Email in spam/junk folder</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                        <span>Incorrect email address</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5" />
                        <span>Email delivery delay (5-10 min)</span>
                      </li>
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">
                      What happens next?
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      After verification, you'll gain access to all features
                      including:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Full dashboard access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Account security features</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Need Help With Verification?</CardTitle>
                <CardDescription>
                  Common solutions and support options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Self-Help Solutions</h3>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Update Email Address
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Check Email Filters
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        Whitelist Our Domain
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Contact Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Our team is ready to help you with verification issues.
                    </p>
                    <div className="space-y-3">
                      <Button className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Email Support
                      </Button>
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Live Chat
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    For security reasons, we require email verification to
                    prevent unauthorized access. This process helps protect your
                    account and personal information.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Having trouble?{" "}
            <Button variant="link" className="p-0 h-auto">
              View detailed troubleshooting guide
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            Verification links expire in 24 hours for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
}

// Separator component if not available
const Separator = () => <div className="h-px bg-border my-2" />;
