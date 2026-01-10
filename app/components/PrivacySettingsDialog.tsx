// src/components/PrivacySettingsDialog.tsx
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Loader2, Globe, Users, Lock } from "lucide-react";

interface PrivacySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrivacy: "public" | "friends" | "private";
  onSave: () => void;
}

export function PrivacySettingsDialog({
  open,
  onOpenChange,
  currentPrivacy,
  onSave,
}: PrivacySettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState<"public" | "friends" | "private">(
    currentPrivacy
  );
  const [settings, setSettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    allowFriendRequests: true,
    allowMessages: true,
    showEmail: false,
    showPhone: false,
    showBirthday: false,
  });

  const privacyOptions = [
    {
      value: "public",
      label: "Public",
      description: "Anyone can see your profile and posts",
      icon: Globe,
      color: "text-green-600",
    },
    {
      value: "friends",
      label: "Connections Only",
      description: "Only your connections can see your profile",
      icon: Users,
      color: "text-blue-600",
    },
    {
      value: "private",
      label: "Private",
      description: "Only you can see your profile",
      icon: Lock,
      color: "text-red-600",
    },
  ];

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to update privacy settings");
        return;
      }

      // Update privacy settings
      const { error } = await supabase
        .from("users")
        .update({
          privacy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Privacy settings updated successfully");
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating privacy settings:", error);
      toast.error(error.message || "Failed to update privacy settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Privacy Settings
          </DialogTitle>
          <DialogDescription>
            Control who can see your profile and activity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Privacy */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Profile Privacy</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose who can see your profile information
              </p>
            </div>

            <RadioGroup
              value={privacy}
              onValueChange={(value: "public" | "friends" | "private") =>
                setPrivacy(value)
              }
              className="space-y-3"
            >
              {privacyOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-4 rounded-lg border p-4 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      privacy === option.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`privacy-${option.value}`}
                      className={option.color}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`privacy-${option.value}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Icon className={`h-5 w-5 ${option.color}`} />
                        <span className="font-semibold">{option.label}</span>
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Additional Privacy Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Additional Settings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Fine-tune your privacy preferences
              </p>
            </div>

            <div className="space-y-4">
              {/* Online Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showOnlineStatus" className="font-medium">
                    Show Online Status
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Let others see when you're online
                  </p>
                </div>
                <Switch
                  id="showOnlineStatus"
                  checked={settings.showOnlineStatus}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showOnlineStatus", checked)
                  }
                  disabled={loading}
                />
              </div>

              {/* Last Seen */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showLastSeen" className="font-medium">
                    Show Last Seen
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Show when you were last active
                  </p>
                </div>
                <Switch
                  id="showLastSeen"
                  checked={settings.showLastSeen}
                  onCheckedChange={(checked) =>
                    handleSettingChange("showLastSeen", checked)
                  }
                  disabled={loading}
                />
              </div>

              {/* Friend Requests */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowFriendRequests" className="font-medium">
                    Allow Friend Requests
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow others to send you connection requests
                  </p>
                </div>
                <Switch
                  id="allowFriendRequests"
                  checked={settings.allowFriendRequests}
                  onCheckedChange={(checked) =>
                    handleSettingChange("allowFriendRequests", checked)
                  }
                  disabled={loading}
                />
              </div>

              {/* Messages */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowMessages" className="font-medium">
                    Allow Messages
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Allow others to send you direct messages
                  </p>
                </div>
                <Switch
                  id="allowMessages"
                  checked={settings.allowMessages}
                  onCheckedChange={(checked) =>
                    handleSettingChange("allowMessages", checked)
                  }
                  disabled={loading}
                />
              </div>
            </div>

            {/* Visibility of Personal Info */}
            <div className="space-y-4 border-t pt-6">
              <h4 className="font-semibold">Personal Information Visibility</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showEmail" className="font-medium">
                      Show Email Address
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Make your email visible on your profile
                    </p>
                  </div>
                  <Switch
                    id="showEmail"
                    checked={settings.showEmail}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showEmail", checked)
                    }
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showPhone" className="font-medium">
                      Show Phone Number
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Make your phone number visible on your profile
                    </p>
                  </div>
                  <Switch
                    id="showPhone"
                    checked={settings.showPhone}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showPhone", checked)
                    }
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showBirthday" className="font-medium">
                      Show Birthday
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Show your birthday on your profile
                    </p>
                  </div>
                  <Switch
                    id="showBirthday"
                    checked={settings.showBirthday}
                    onCheckedChange={(checked) =>
                      handleSettingChange("showBirthday", checked)
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Privacy Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
