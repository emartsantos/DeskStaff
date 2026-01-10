// src/components/ChangePasswordDialog.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const validateForm = () => {
    if (!currentPassword.trim()) {
      toast.error("Current password is required");
      return false;
    }

    if (!newPassword.trim()) {
      toast.error("New password is required");
      return false;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return false;
    }

    if (!/[a-z]/.test(newPassword)) {
      toast.error("Password must contain at least one lowercase letter");
      return false;
    }

    if (!/\d/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Update password with Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // If the error is about current password, we need to reauthenticate
        if (error.message.includes("requires reauthentication")) {
          toast.error("Please re-authenticate to change your password");
          // Here you could trigger a reauthentication flow
          return;
        }
        throw error;
      }

      toast.success("Password changed successfully");
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error changing password:", error);

      // Handle specific error cases
      if (error.message?.includes("Password should be at least")) {
        toast.error("Password must be at least 8 characters long");
      } else if (error.message?.includes("Invalid login credentials")) {
        toast.error("Current password is incorrect");
      } else {
        toast.error(error.message || "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Change Password
          </DialogTitle>
          <DialogDescription>
            Update your password. Make sure it's strong and secure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, and
                numbers
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 space-y-2">
              <h4 className="font-medium text-sm">Password Requirements:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li
                  className={`flex items-center ${newPassword.length >= 8 ? "text-green-600" : ""}`}
                >
                  <span className="mr-2">•</span>
                  At least 8 characters long
                </li>
                <li
                  className={`flex items-center ${/[A-Z]/.test(newPassword) ? "text-green-600" : ""}`}
                >
                  <span className="mr-2">•</span>
                  Contains at least one uppercase letter
                </li>
                <li
                  className={`flex items-center ${/[a-z]/.test(newPassword) ? "text-green-600" : ""}`}
                >
                  <span className="mr-2">•</span>
                  Contains at least one lowercase letter
                </li>
                <li
                  className={`flex items-center ${/\d/.test(newPassword) ? "text-green-600" : ""}`}
                >
                  <span className="mr-2">•</span>
                  Contains at least one number
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
