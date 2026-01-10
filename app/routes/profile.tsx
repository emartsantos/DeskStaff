// src/routes/profile.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePosts } from "@/hooks/usePosts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

// Import reusable components
import { Header } from "@/components/Header";
import { CreatePost } from "@/components/CreatePost";
import { UserInfoCard } from "@/components/UserInfoCard";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { PostList } from "@/components/PostList";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { LogoutDialog } from "@/components/LogoutDialog";
import { PrivacySettingsDialog } from "@/components/PrivacySettingsDialog";

import {
  Edit,
  MoreHorizontal,
  Bookmark,
  Users as UsersIcon,
  Award,
  Settings,
  Briefcase,
  CalendarDays,
  Clock,
  UserPlus,
  MessageSquare,
  Trash2,
  FileText,
  ImageIcon,
  Video,
} from "lucide-react";

// ========== TYPE DEFINITIONS ==========

/** User profile interface for type safety */
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  workplace: string | null;
  education: string | null;
  birthday: string | null;
  website: string | null;
  privacy: "public" | "friends" | "private";
  created_at: string;
  department?: string;
  position?: string;
  phone?: string;
  hire_date?: string;
  skills?: string[];
  logged_in?: boolean;
  last_seen?: string;
}

/** Friend connection interface */
interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
  mutual_friends: number;
  status: "pending" | "accepted" | "requested";
  department?: string;
  position?: string;
  logged_in?: boolean;
}

// ========== MAIN PROFILE COMPONENT ==========

export default function Profile() {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();

  // State declarations
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);
  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [postsUserId, setPostsUserId] = useState<string | undefined>(undefined);

  // Initialize posts hook with undefined to prevent fetching until we have the user ID
  const {
    posts,
    loading: postsLoading,
    createPost,
    deletePost,
    toggleLike,
    toggleBookmark,
    addComment,
    fetchPosts,
  } = usePosts(postsUserId); // Use state variable for user ID

  // ========== DATA FETCHING FUNCTIONS ==========

  /**
   * Fetch the currently logged-in user's data
   */
  const fetchLoggedInUser = async (
    userId: string
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching logged in user:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in fetchLoggedInUser:", error);
      return null;
    }
  };

  /**
   * Fetch the viewed user's profile data
   */
  const fetchViewedUser = async (
    userId: string
  ): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          toast.error("User profile not found");
          return null;
        }
        console.error("Error fetching viewed user:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in fetchViewedUser:", error);
      return null;
    }
  };

  /**
   * Fetch user data and friends when URL user ID changes
   */
  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setPostsUserId(undefined); // Reset posts user ID

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Please log in to continue");
        navigate("/", { replace: true });
        return;
      }

      const currentUserId = session.user.id;
      setCurrentUserId(currentUserId);

      const userIdToFetch = urlUserId || currentUserId;
      const isOwnProfile = userIdToFetch === currentUserId;
      setIsOwnProfile(isOwnProfile);

      // Fetch logged-in user data
      const loggedInUserData = await fetchLoggedInUser(currentUserId);
      if (loggedInUserData) {
        setLoggedInUser(loggedInUserData);
      }

      // Fetch viewed user data
      if (userIdToFetch !== currentUserId) {
        const viewedUserData = await fetchViewedUser(userIdToFetch);
        if (viewedUserData) {
          setViewedUser(viewedUserData);
          setPostsUserId(userIdToFetch); // Set posts user ID AFTER we have the user data
        } else {
          // If user not found, redirect to own profile
          navigate(`/profile/${currentUserId}`, { replace: true });
        }
      } else {
        // If viewing own profile, use logged-in user data
        if (loggedInUserData) {
          setViewedUser(loggedInUserData);
          setPostsUserId(currentUserId); // Set posts user ID AFTER we have the user data
        }
      }

      // Update user online status if it's own profile
      if (isOwnProfile && loggedInUserData) {
        await updateUserLoginStatus(currentUserId, true);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [urlUserId, navigate]);

  /**
   * Update user login status in database
   */
  const updateUserLoginStatus = async (
    userId: string,
    isLoggedIn: boolean
  ): Promise<void> => {
    try {
      await supabase
        .from("users")
        .update({
          logged_in: isLoggedIn,
          updated_at: new Date().toISOString(),
          ...(!isLoggedIn ? { last_seen: new Date().toISOString() } : {}),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating login status:", error);
    }
  };

  /**
   * Fetch user's friends/connections
   */
  const fetchFriends = async () => {
    try {
      // TODO: Replace with actual API call to friends table
      const mockFriends: Friend[] = [
        {
          id: "2",
          full_name: "Jane Smith",
          avatar_url: null,
          mutual_friends: 8,
          status: "accepted",
          department: "Engineering",
          position: "Senior Developer",
          logged_in: true,
        },
        {
          id: "3",
          full_name: "Bob Johnson",
          avatar_url: null,
          mutual_friends: 12,
          status: "accepted",
          department: "Marketing",
          position: "Marketing Manager",
          logged_in: false,
        },
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  // ========== EFFECT HOOKS ==========

  /**
   * Initial data fetching on component mount and URL changes
   */
  useEffect(() => {
    fetchUserData();
    fetchFriends();
  }, [fetchUserData]);

  /**
   * Track user activity and update online status
   */
  useEffect(() => {
    if (!currentUserId || !isOwnProfile) return;

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    let activityTimeout: NodeJS.Timeout;

    const updateActivity = async () => {
      await updateUserLoginStatus(currentUserId, true);
      clearTimeout(activityTimeout);

      // Mark as offline after 5 minutes of inactivity
      activityTimeout = setTimeout(
        async () => {
          await updateUserLoginStatus(currentUserId, false);
        },
        5 * 60 * 1000 // 5 minutes
      );
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    updateActivity();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearTimeout(activityTimeout);

      if (isOwnProfile) {
        updateUserLoginStatus(currentUserId, false);
      }
    };
  }, [currentUserId, isOwnProfile]);

  /**
   * Real-time subscription for user profile updates
   */
  useEffect(() => {
    const userIdToSubscribe = urlUserId || currentUserId;
    if (!userIdToSubscribe) return;

    const channel = supabase
      .channel(`user-${userIdToSubscribe}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userIdToSubscribe}`,
        },
        (payload) => {
          const updatedUser = payload.new as UserProfile;

          if (urlUserId && urlUserId !== currentUserId) {
            setViewedUser(updatedUser);
          } else {
            setViewedUser(updatedUser);
            setLoggedInUser(updatedUser);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [urlUserId, currentUserId]);

  // ========== POST MANAGEMENT FUNCTIONS ==========

  /**
   * Create a new post with optimistic update
   */
  const handleCreatePost = async (content: string, image?: File) => {
    try {
      await createPost(content, image);
      toast.success("Post published successfully");
      fetchPosts(); // Refresh the posts list
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  };

  /**
   * Handle like/unlike a post
   */
  const handleLikePost = async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch (error: any) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  /**
   * Handle bookmark/unbookmark a post
   */
  const handleBookmarkPost = async (postId: string) => {
    try {
      await toggleBookmark(postId);
    } catch (error: any) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  /**
   * Delete a post
   */
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success("Post deleted successfully");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  /**
   * Add a comment to a post
   */
  const handleAddComment = async (postId: string, content: string) => {
    try {
      await addComment(postId, content);
      toast.success("Comment added");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  // ========== PROFILE UPDATE FUNCTIONS ==========

  /**
   * Handle successful profile update
   */
  const handleProfileUpdate = () => {
    setIsEditing(false);
    fetchUserData(); // Refresh user data
    toast.success("Profile updated successfully");
  };

  /**
   * Handle avatar upload completion
   */
  const handleAvatarUpdate = (avatarUrl: string) => {
    if (viewedUser) {
      setViewedUser({
        ...viewedUser,
        avatar_url: avatarUrl || null,
      });
    }
    if (loggedInUser && isOwnProfile) {
      setLoggedInUser({
        ...loggedInUser,
        avatar_url: avatarUrl || null,
      });
    }
    toast.success("Profile picture updated");
  };

  // ========== NAVIGATION HANDLERS ==========

  /**
   * Handle navigation to different routes
   */
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      if (currentUserId) {
        await updateUserLoginStatus(currentUserId, false);
      }
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  // ========== RENDER LOGIC ==========

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!viewedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            User not found
          </h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header Component */}
      <Header
        user={loggedInUser}
        currentUserId={currentUserId}
        onNavigate={handleNavigate}
        onEditProfile={() => setIsEditing(true)}
        onPrivacySettings={() => setIsPrivacyOpen(true)}
        onChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={() => setIsLogoutDialogOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Header Card */}
        {viewedUser && (
          <ProfileHeaderCard
            user={viewedUser}
            isOwnProfile={isOwnProfile}
            connectionsCount={friends.length}
            onEditProfile={() => setIsEditing(true)}
            onAvatarUpdate={handleAvatarUpdate}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <UserInfoCard
              user={{
                full_name: viewedUser?.full_name || "",
                avatar_url: viewedUser?.avatar_url || null,
                bio: viewedUser?.bio || null,
                position: viewedUser?.position || "",
                department: viewedUser?.department || "",
                location: viewedUser?.location || null,
                email: viewedUser?.email || "",
                phone: viewedUser?.phone || "",
                hire_date: viewedUser?.hire_date || "",
                logged_in: viewedUser?.logged_in,
                last_seen: viewedUser?.last_seen,
                created_at: viewedUser?.created_at,
              }}
              connectionsCount={friends.length}
              isOwnProfile={isOwnProfile}
              onConnect={() => toast.success("Connection request sent!")}
              onMessage={() => toast.info("Messaging feature coming soon!")}
              onEdit={() => setIsEditing(true)}
              showActions={!isOwnProfile}
            />

            {/* Connections Card */}
            <ConnectionsCard friends={friends} />

            {/* Skills & Privacy Card */}
            <SkillsPrivacyCard
              privacy={viewedUser?.privacy || "public"} // Add fallback value
              onPrivacySettings={() => setIsPrivacyOpen(true)}
            />
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post (only for own profile) */}
            {isOwnProfile && (
              <CreatePost
                user={viewedUser}
                onSubmit={handleCreatePost}
                placeholder="What's on your mind?"
                disabled={!viewedUser}
              />
            )}

            {/* Content Tabs */}
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              posts={posts}
              postsLoading={postsLoading}
              isOwnProfile={isOwnProfile}
              currentUserId={currentUserId}
              onLikePost={handleLikePost}
              onBookmarkPost={handleBookmarkPost}
              onDeletePost={handleDeletePost}
              onAddComment={handleAddComment}
              postsUserId={postsUserId} // Pass the postsUserId to ProfileTabs
            />
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <EditProfileDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        user={viewedUser}
        onSuccess={handleProfileUpdate}
      />

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />

      <LogoutDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        onLogout={handleLogout}
      />

      {viewedUser && (
        <PrivacySettingsDialog
          open={isPrivacyOpen}
          onOpenChange={setIsPrivacyOpen}
          currentPrivacy={viewedUser.privacy || "public"}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

/**
 * Loading skeleton for profile page
 */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-64 w-full rounded-xl bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Profile header card component
 */
function ProfileHeaderCard({
  user,
  isOwnProfile,
  connectionsCount,
  onEditProfile,
  onAvatarUpdate,
}: {
  user: UserProfile;
  isOwnProfile: boolean;
  connectionsCount: number;
  onEditProfile: () => void;
  onAvatarUpdate: (avatarUrl: string) => void;
}) {
  return (
    <Card className="mb-6 overflow-hidden border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white dark:bg-gray-900">
      <div className="relative h-56 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute bottom-4 right-4 flex gap-2">
          {isOwnProfile ? (
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              onClick={onEditProfile}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              onClick={() => toast.success("Connection request sent!")}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
          {/* Profile Picture Upload Component */}
          <ProfilePictureUpload
            userId={user.id}
            currentAvatarUrl={user.avatar_url}
            onUploadComplete={onAvatarUpdate}
            size="lg"
            editable={isOwnProfile}
          />

          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.full_name}
                  </h1>

                  {/* Online Status Badge */}
                  {user.logged_in ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></div>
                      Online
                    </Badge>
                  ) : user.last_seen ? (
                    <Badge
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5"></div>
                      Offline
                    </Badge>
                  ) : null}

                  {/* Position Badge */}
                  {user.position && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    >
                      {user.position}
                    </Badge>
                  )}
                </div>

                {/* User Info Stats */}
                <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{user.department || "Department"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    <span>{connectionsCount} Connections</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      Joined{" "}
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Recently"}
                    </span>
                  </div>

                  {!user.logged_in && user.last_seen && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Last seen{" "}
                        {new Date(user.last_seen).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isOwnProfile && (
                  <>
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      onClick={() => toast.success("Connection request sent!")}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast.info("Messaging feature coming soon!")
                      }
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuItem
                      onClick={onEditProfile}
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        toast.info("Saved items feature coming soon!")
                      }
                      className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      Saved Items
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                    <DropdownMenuItem
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() =>
                        toast.error("Account deletion is not available yet")
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Connections card component
 */
function ConnectionsCard({ friends }: { friends: Friend[] }) {
  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Connections
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {friends.length} professional connections
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Connections page coming soon!")}
            className="text-gray-600 dark:text-gray-400"
          >
            See all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {friends.slice(0, 9).map((friend) => (
            <div key={friend.id} className="group cursor-pointer space-y-2">
              <div className="relative">
                <Avatar className="h-20 w-full rounded-xl border-2 border-transparent group-hover:border-blue-500 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative">
                    {friend.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                    {friend.logged_in && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                    )}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold truncate text-gray-900 dark:text-white">
                  {friend.full_name}
                  {friend.logged_in && (
                    <span className="ml-1 text-green-500">●</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skills and privacy card component
 */
function SkillsPrivacyCard({
  privacy,
  onPrivacySettings,
}: {
  privacy?: string; // Make it optional
  onPrivacySettings: () => void;
}) {
  // Add a default value
  const privacyValue = privacy || "public";

  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Skills & Privacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Profile Privacy
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {privacyValue === "public" &&
                "Public - Anyone can see your profile"}
              {privacyValue === "friends" && "Connections only"}
              {privacyValue === "private" && "Private - Only you can see"}
            </p>
          </div>
          <Badge
            variant={
              privacyValue === "public"
                ? "default"
                : privacyValue === "friends"
                  ? "secondary"
                  : "destructive"
            }
            className="bg-gradient-to-r from-blue-500 to-indigo-600"
          >
            {privacyValue.charAt(0).toUpperCase() + privacyValue.slice(1)}
          </Badge>
        </div>
        <Button
          variant="outline"
          className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          onClick={onPrivacySettings}
        >
          <Settings className="h-4 w-4 mr-2" />
          Privacy Settings
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Profile tabs component
 */
function ProfileTabs({
  activeTab,
  onTabChange,
  posts,
  postsLoading,
  isOwnProfile,
  currentUserId,
  postsUserId, // Add this prop
  onLikePost,
  onBookmarkPost,
  onDeletePost,
  onAddComment,
}: {
  activeTab: string;
  onTabChange: (value: string) => void;
  posts: any[];
  postsLoading: boolean;
  isOwnProfile: boolean;
  currentUserId: string | null;
  postsUserId: string | undefined; // Add this type
  onLikePost: (postId: string) => void;
  onBookmarkPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
}) {
  // Filter posts to only show posts from the specific user when viewing their profile
  const filteredPosts = posts.filter((post) => post.user_id === postsUserId);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
        <TabsTrigger
          value="posts"
          className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm text-gray-700 dark:text-gray-300"
        >
          <FileText className="h-4 w-4 mr-2" />
          Posts
        </TabsTrigger>
        <TabsTrigger
          value="photos"
          className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm text-gray-700 dark:text-gray-300"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Photos
        </TabsTrigger>
        <TabsTrigger
          value="videos"
          className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm text-gray-700 dark:text-gray-300"
        >
          <Video className="h-4 w-4 mr-2" />
          Videos
        </TabsTrigger>
      </TabsList>

      {/* Posts Tab */}
      <TabsContent value="posts" className="space-y-6 mt-6">
        {/* Show message if no posts found for this user */}
        {!postsLoading && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isOwnProfile
                ? "Share your first post to get started!"
                : "This user hasn't posted anything yet"}
            </p>
          </div>
        )}

        <PostList
          posts={filteredPosts} // Use filtered posts instead of all posts
          loading={postsLoading}
          currentUserId={currentUserId}
          onLike={onLikePost}
          onBookmark={onBookmarkPost}
          onDelete={isOwnProfile ? onDeletePost : undefined}
          onAddComment={onAddComment}
        />
      </TabsContent>

      {/* Photos Tab */}
      <TabsContent value="photos">
        <PhotosTab
          posts={posts.filter((p) => p.image_url && p.user_id === postsUserId)}
        />
      </TabsContent>

      {/* Videos Tab */}
      <TabsContent value="videos">
        <VideosTab />
      </TabsContent>
    </Tabs>
  );
}

/**
 * Photos tab component
 */
function PhotosTab({ posts }: { posts: any[] }) {
  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
      <CardContent className="pt-6">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No photos yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Share photos to showcase your work or team activities
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="relative group rounded-xl overflow-hidden"
              >
                <img
                  src={post.image_url!}
                  alt="Post"
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  onClick={() => toast.info("Viewing photo in full screen")}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                  <div className="text-white">
                    <p className="text-sm font-medium truncate">
                      {post.user.full_name}
                    </p>
                    <p className="text-xs opacity-90">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Videos tab component
 */
function VideosTab() {
  return (
    <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
      <CardContent className="pt-6 text-center">
        <div className="py-12 space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Video className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No videos yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Share your first video to showcase your work or team activities
          </p>
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={() => toast.info("Video upload feature coming soon!")}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              <Video className="h-4 w-4 mr-2" />
              Upload Your First Video
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
