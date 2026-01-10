// src/pages/HomePage.tsx
import { Header } from "@/components/Header";
import { PostList } from "@/components/PostList";
import { CreatePost } from "@/components/CreatePost";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { LogoutDialog } from "@/components/LogoutDialog";
import { PrivacySettingsDialog } from "@/components/PrivacySettingsDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { Loader2, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const {
    user,
    supabaseUser,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();
  const [notificationsCount] = useState(5);
  const [messagesCount] = useState(3);

  // Dialog states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Use the usePosts hook without userId to get ALL posts
  const {
    posts,
    loading: postsLoading,
    createPost,
    toggleLike, // Changed from likePost to toggleLike
    toggleBookmark, // Changed from bookmarkPost to toggleBookmark
    deletePost,
    addComment,
  } = usePosts(); // No userId means get all posts

  /**
   * Handle navigation to different routes
   */
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  /**
   * Handle edit profile action
   */
  const handleEditProfile = () => {
    if (supabaseUser?.id) {
      setShowEditProfile(true);
    } else {
      toast.error("Please log in to edit your profile");
    }
  };

  /**
   * Handle privacy settings action
   */
  const handlePrivacySettings = () => {
    if (supabaseUser?.id) {
      setShowPrivacySettings(true);
    } else {
      toast.error("Please log in to change privacy settings");
    }
  };

  /**
   * Handle change password action
   */
  const handleChangePassword = () => {
    if (supabaseUser?.id) {
      setShowChangePassword(true);
    } else {
      toast.error("Please log in to change password");
    }
  };

  /**
   * Handle logout action
   */
  const handleLogoutAction = async () => {
    try {
      if (supabaseUser?.id) {
        // Update user status if users table exists
        try {
          await supabase
            .from("users")
            .update({
              logged_in: false,
              last_seen: new Date().toISOString(),
            })
            .eq("id", supabaseUser.id);
        } catch (dbError) {
          console.warn("Could not update user status:", dbError);
        }
      }

      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      setShowLogoutDialog(false);
      navigate("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
      setShowLogoutDialog(false);
    }
  };

  /**
   * Handle logout button click
   */
  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  /**
   * Handle avatar update
   */
  const handleAvatarUpdate = (avatarUrl: string) => {
    console.log("Avatar updated to:", avatarUrl);
    // You can trigger a refetch here if needed
  };

  /**
   * Handle user data update
   */
  const handleUserUpdate = (updatedUser: any) => {
    console.log("User data updated:", updatedUser);
    // You can update local state or trigger a refetch here
  };

  /**
   * Handle profile update success
   */
  const handleProfileUpdateSuccess = () => {
    toast.success("Profile updated successfully!");
    // You can trigger a refetch here if needed
  };

  /**
   * Handle privacy settings save
   */
  const handlePrivacySettingsSave = () => {
    toast.success("Privacy settings updated!");
  };

  /**
   * Handle post creation
   */
  const handleCreatePost = async (content: string, image?: File) => {
    try {
      await createPost(content, image);
      toast.success("Post created successfully!");
    } catch (error: any) {
      toast.error("Failed to create post");
      throw error;
    }
  };

  /**
   * Handle post deletion
   */
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      toast.success("Post deleted successfully!");
    } catch (error: any) {
      toast.error("Failed to delete post");
    }
  };

  /**
   * Handle like toggle
   */
  const handleLikePost = async (postId: string) => {
    try {
      await toggleLike(postId); // Changed from likePost to toggleLike
    } catch (error: any) {
      toast.error("Failed to like post");
    }
  };

  /**
   * Handle bookmark toggle
   */
  const handleBookmarkPost = async (postId: string) => {
    try {
      await toggleBookmark(postId); // Changed from bookmarkPost to toggleBookmark
    } catch (error: any) {
      toast.error("Failed to bookmark post");
    }
  };

  /**
   * Handle adding comment
   */
  const handleAddComment = async (postId: string, content: string) => {
    try {
      await addComment(postId, content);
      toast.success("Comment added!");
    } catch (error: any) {
      toast.error("Failed to add comment");
      throw error;
    }
  };

  /**
   * Show loading spinner while authentication is being checked
   */
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Determine which user data to use for display
  const displayUser =
    user ||
    (supabaseUser
      ? {
          id: supabaseUser.id,
          full_name:
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            `${supabaseUser.user_metadata?.first_name || ""} ${supabaseUser.user_metadata?.last_name || ""}`.trim() ||
            supabaseUser.email?.split("@")[0] ||
            "User",
          avatar_url: supabaseUser.user_metadata?.avatar_url || null,
          position: supabaseUser.user_metadata?.position || "Employee",
          email: supabaseUser.email || "",
          first_name: supabaseUser.user_metadata?.first_name,
          last_name: supabaseUser.user_metadata?.last_name,
          bio: supabaseUser.user_metadata?.bio || null,
          location: supabaseUser.user_metadata?.location || null,
          workplace: supabaseUser.user_metadata?.workplace || null,
          education: supabaseUser.user_metadata?.education || null,
          birthday: supabaseUser.user_metadata?.birthday || null,
          website: supabaseUser.user_metadata?.website || null,
          phone: supabaseUser.user_metadata?.phone || null,
          department: supabaseUser.user_metadata?.department || null,
        }
      : null);

  // Prepare user data for EditProfileDialog
  const editProfileUser = displayUser
    ? {
        id: displayUser.id,
        first_name: displayUser.first_name || "",
        last_name: displayUser.last_name || "",
        bio: displayUser.bio || null,
        location: displayUser.location || null,
        workplace: displayUser.workplace || null,
        education: displayUser.education || null,
        birthday: displayUser.birthday || null,
        website: displayUser.website || null,
        phone: displayUser.phone || null,
        department: displayUser.department || null,
        position: displayUser.position || null,
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header with proper user data */}
      <Header
        user={displayUser}
        currentUserId={supabaseUser?.id || null}
        onNavigate={handleNavigate}
        onEditProfile={handleEditProfile}
        onPrivacySettings={handlePrivacySettings}
        onChangePassword={handleChangePassword}
        onLogout={handleLogout}
        onAvatarUpdate={handleAvatarUpdate}
        onUserUpdate={handleUserUpdate}
        notificationsCount={notificationsCount}
        messagesCount={messagesCount}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Show message if user is not authenticated */}
          {!isAuthenticated ? (
            <div className="mt-20 text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to DeskStaff
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect with your colleagues and stay updated
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate("/auth/login")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/auth/register")}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Page header for authenticated users */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Community Feed
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Stay updated with posts from all your colleagues
                </p>
              </div>

              {/* Create Post Component */}
              {displayUser && (
                <div className="mb-8">
                  <CreatePost
                    user={{
                      id: displayUser.id,
                      full_name: displayUser.full_name,
                      avatar_url: displayUser.avatar_url,
                      first_name: displayUser.first_name,
                      last_name: displayUser.last_name,
                    }}
                    onSubmit={handleCreatePost}
                    placeholder="What's on your mind?"
                  />
                </div>
              )}

              {/* Show loading state for posts */}
              {postsLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Directly render posts using PostList component */
                <div className="mt-6">
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No posts yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Be the first to share something with the community!
                      </p>
                    </div>
                  ) : (
                    <PostList
                      posts={posts.map((post) => ({
                        id: post.id,
                        content: post.content,
                        created_at: post.created_at,
                        user_id: post.user_id,
                        image_url: post.image_url,
                        likes_count: post.likes_count,
                        comments_count: post.comments_count,
                        is_liked: post.liked,
                        is_bookmarked: post.bookmarked,
                        user: {
                          id: post.user.id,
                          full_name: post.user.full_name,
                          avatar_url: post.user.avatar_url,
                          position: post.user.position || "Employee", // Added position
                        },
                      }))}
                      loading={postsLoading}
                      currentUserId={supabaseUser?.id}
                      onLike={handleLikePost}
                      onBookmark={handleBookmarkPost}
                      onDelete={handleDeletePost}
                      onAddComment={handleAddComment}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {editProfileUser && (
        <EditProfileDialog
          open={showEditProfile}
          onOpenChange={setShowEditProfile}
          user={editProfileUser}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}

      {/* Logout Dialog */}
      <LogoutDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onLogout={handleLogoutAction}
      />

      {/* Privacy Settings Dialog */}
      <PrivacySettingsDialog
        open={showPrivacySettings}
        onOpenChange={setShowPrivacySettings}
        currentPrivacy="friends" // You might want to fetch this from user data
        onSave={handlePrivacySettingsSave}
      />

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </div>
  );
}
