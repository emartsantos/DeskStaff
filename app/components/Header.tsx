// src/components/Header.tsx
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  Users as UsersIcon,
  User,
  Edit,
  Shield,
  Key,
  LogOut,
  Building,
  Loader2,
  Camera,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  position?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface HeaderProps {
  user: UserProfile | null;
  currentUserId: string | null;
  onNavigate: (path: string) => void;
  onEditProfile: () => void;
  onPrivacySettings: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onAvatarUpdate?: (avatarUrl: string) => void;
  onUserUpdate?: (updatedUser: Partial<UserProfile>) => void;
  notificationsCount?: number;
  messagesCount?: number;
}

export function Header({
  user,
  currentUserId,
  onNavigate,
  onEditProfile,
  onPrivacySettings,
  onChangePassword,
  onLogout,
  onAvatarUpdate,
  onUserUpdate,
  notificationsCount = 5,
  messagesCount = 3,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Get user data from localStorage as fallback
  const getStoredUser = (): UserProfile | null => {
    try {
      const stored = localStorage.getItem("current_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
    return null;
  };

  // Use provided user or fallback to stored user
  const displayUser = user || getStoredUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!currentUserId) {
      toast.error("Please log in to upload profile picture");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Try to update user profile with new avatar URL
      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({ avatar_url: publicUrl })
          .eq("id", currentUserId);

        if (updateError) {
          console.warn("Note: Could not update avatar_url in database");
          // Store locally as fallback
          if (displayUser) {
            const updatedUser = { ...displayUser, avatar_url: publicUrl };
            localStorage.setItem("current_user", JSON.stringify(updatedUser));
          }
        }
      } catch (columnError) {
        console.warn("Database update failed:", columnError);
        // Store locally
        if (displayUser) {
          const updatedUser = { ...displayUser, avatar_url: publicUrl };
          localStorage.setItem("current_user", JSON.stringify(updatedUser));
        }
      }

      // Update local state
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }

      if (onUserUpdate && displayUser) {
        onUserUpdate({
          ...displayUser,
          avatar_url: publicUrl,
        });
      }

      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input
    e.target.value = "";
  };

  const getUserInitials = () => {
    if (!displayUser) {
      return "U";
    }

    const firstName = displayUser.first_name || "";
    const lastName = displayUser.last_name || "";

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (displayUser.full_name) {
      const names = displayUser.full_name.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0]?.toUpperCase() || "U";
    }

    console.log(
      "userasdadsasdsasdasdasasdasdasdadsasddasasd" + displayUser.full_name
    );
  };

  const getUserDisplayName = () => {
    if (!displayUser) {
      return "User";
    }
    return displayUser.full_name || displayUser.email?.split("@")[0] || "User";
  };

  const getUserPosition = () => {
    if (!displayUser) {
      return "Employee";
    }
    return displayUser.position || "Employee";
  };

  const getUserEmail = () => {
    if (!displayUser) {
      return "";
    }
    return displayUser.email || "";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                DeskStaff
              </span>
            </Link>
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search colleagues, projects, or documents..."
                className="pl-10 w-64 bg-gray-100/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Home"
              onClick={() => onNavigate("/")}
            >
              <Home className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative text-gray-700 dark:text-gray-300"
              title="Notifications"
              onClick={() => onNavigate("/notifications")}
            >
              <Bell className="h-5 w-5" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative text-gray-700 dark:text-gray-300"
              title="Messages"
              onClick={() => onNavigate("/messages")}
            >
              <MessageCircle className="h-5 w-5" />
              {messagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {messagesCount > 9 ? "9+" : messagesCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              title="Teams"
              onClick={() => onNavigate("/teams")}
            >
              <UsersIcon className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={isUploadingAvatar}
                >
                  {isUploadingAvatar ? (
                    <div className="h-9 w-9 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-gray-700">
                        <AvatarImage
                          src={displayUser?.avatar_url || undefined}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute -bottom-1 -right-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={isUploadingAvatar}
                        />
                      </label>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                align="end"
              >
                <DropdownMenuLabel className="flex items-center gap-3 text-gray-900 dark:text-white p-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={displayUser?.avatar_url || undefined}
                        alt={getUserDisplayName()}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploadingAvatar}
                      />
                      <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors border-2 border-white dark:border-gray-800">
                        {isUploadingAvatar ? (
                          <Loader2 className="h-3 w-3 text-white animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {getUserPosition()}
                    </p>
                    {getUserEmail() && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {getUserEmail()}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>

                <div className="px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Click camera icon to update profile picture
                  </p>
                </div>

                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

                <DropdownMenuItem
                  onClick={() =>
                    currentUserId && onNavigate(`/profile/${currentUserId}`)
                  }
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onEditProfile}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onPrivacySettings}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Privacy Settings
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={onChangePassword}
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                  onClick={onLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
