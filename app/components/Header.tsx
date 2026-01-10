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
import { useState, useEffect } from "react";
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
  const [localUser, setLocalUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  /**
   * Get current authenticated user from Supabase Auth
   */
  useEffect(() => {
    const getAuthUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setAuthUser(session.user);

        // If no user prop provided, use auth user data
        if (!user) {
          setLocalUser({
            id: session.user.id,
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              `${session.user.user_metadata?.first_name || ""} ${session.user.user_metadata?.last_name || ""}`.trim() ||
              session.user.email?.split("@")[0] ||
              "User",
            avatar_url: session.user.user_metadata?.avatar_url || null,
            position: session.user.user_metadata?.position || "Employee",
            email: session.user.email || "",
            first_name: session.user.user_metadata?.first_name,
            last_name: session.user.user_metadata?.last_name,
          });
        }
      }
    };

    getAuthUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        if (!user) {
          setLocalUser({
            id: session.user.id,
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              `${session.user.user_metadata?.first_name || ""} ${session.user.user_metadata?.last_name || ""}`.trim() ||
              session.user.email?.split("@")[0] ||
              "User",
            avatar_url: session.user.user_metadata?.avatar_url || null,
            position: session.user.user_metadata?.position || "Employee",
            email: session.user.email || "",
            first_name: session.user.user_metadata?.first_name,
            last_name: session.user.user_metadata?.last_name,
          });
        }
      } else {
        setAuthUser(null);
        setLocalUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [user]);

  /**
   * Fetch user data from users table if needed
   */
  useEffect(() => {
    const fetchUserFromTable = async () => {
      // If we have auth user but no local user data, try to fetch from users table
      if (authUser && !localUser) {
        try {
          const { data, error } = await supabase
            .from("users")
            .select("id, full_name, avatar_url, email, first_name, last_name")
            .eq("id", authUser.id)
            .single();

          if (error) {
            console.error("Error fetching user from table:", error);
            // Fallback to auth user metadata
            setLocalUser({
              id: authUser.id,
              full_name:
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                `${authUser.user_metadata?.first_name || ""} ${authUser.user_metadata?.last_name || ""}`.trim() ||
                authUser.email?.split("@")[0] ||
                "User",
              avatar_url: authUser.user_metadata?.avatar_url || null,
              position: authUser.user_metadata?.position || "Employee",
              email: authUser.email || "",
              first_name: authUser.user_metadata?.first_name,
              last_name: authUser.user_metadata?.last_name,
            });
            return;
          }

          if (data) {
            setLocalUser(data as UserProfile);
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      }
    };

    fetchUserFromTable();
  }, [authUser, localUser]);

  /**
   * Get user data from localStorage as fallback
   */
  const getStoredUser = (): UserProfile | null => {
    try {
      const stored = localStorage.getItem("deskstaff_user");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
    return null;
  };

  // Use provided user, local state, or fallback to stored user
  const displayUser = user || localUser || getStoredUser();

  /**
   * Handle search form submission
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  /**
   * Upload avatar image to Supabase storage
   */
  const uploadAvatar = async (file: File) => {
    const userId = authUser?.id || currentUserId;

    if (!userId) {
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
      // Generate unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload file to Supabase storage
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

      // Update user metadata in Auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      if (authUpdateError) {
        console.warn("Could not update auth user metadata:", authUpdateError);
      }

      // Try to update users table if it exists
      try {
        const { error: updateError } = await supabase
          .from("users")
          .update({ avatar_url: publicUrl })
          .eq("id", userId);

        if (updateError && updateError.code !== "PGRST116") {
          console.warn("Could not update users table:", updateError);
        }
      } catch (dbError) {
        console.warn("Users table might not exist:", dbError);
      }

      // Update local state
      const updatedUser = displayUser
        ? { ...displayUser, avatar_url: publicUrl }
        : {
            id: userId,
            full_name: authUser?.user_metadata?.full_name || "User",
            avatar_url: publicUrl,
            position: "Employee",
            email: authUser?.email || "",
          };

      localStorage.setItem("deskstaff_user", JSON.stringify(updatedUser));
      setLocalUser(updatedUser);

      // Callback functions
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl);
      }

      if (onUserUpdate && displayUser) {
        onUserUpdate({
          ...displayUser,
          avatar_url: publicUrl,
        });
      }

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * Handle file selection for avatar upload
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    // Reset input
    e.target.value = "";
  };

  /**
   * Get user initials for avatar fallback
   */
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

    return "U";
  };

  /**
   * Get user display name
   */
  const getUserDisplayName = () => {
    if (!displayUser) {
      return "Guest";
    }
    return displayUser.full_name || displayUser.email?.split("@")[0] || "User";
  };

  /**
   * Get user position/title
   */
  const getUserPosition = () => {
    if (!displayUser) {
      return "Employee";
    }
    return displayUser.position || "Employee";
  };

  /**
   * Get user email
   */
  const getUserEmail = () => {
    if (!displayUser) {
      return "";
    }
    return displayUser.email || "";
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = !!(authUser || currentUserId);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section: Logo and Search */}
          <div className="flex items-center space-x-4">
            <Link to="/feed" className="flex items-center space-x-3">
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

          {/* Right Section: Navigation and User Menu */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Navigation Buttons - only show if authenticated */}
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  title="Home"
                  onClick={() =>
                    onNavigate("/profile/" + (authUser?.id || currentUserId))
                  }
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
              </>
            ) : (
              // Show login/register buttons if not authenticated
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("/auth/login")}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => onNavigate("/auth/register")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Register
                </Button>
              </div>
            )}

            {/* User Dropdown Menu - only show if authenticated */}
            {isAuthenticated && (
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
                  {/* User Profile Section */}
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

                  {/* Upload Hint */}
                  <div className="px-3 py-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Click camera icon to update profile picture
                    </p>
                  </div>

                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />

                  {/* Menu Items */}
                  <DropdownMenuItem
                    onClick={() =>
                      authUser?.id && onNavigate(`/profile/${authUser.id}`)
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

                  {/* Logout */}
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
