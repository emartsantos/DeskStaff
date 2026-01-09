// src/routes/profile.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Import reusable components
import { Header } from "@/components/Header";
import { CreatePost } from "@/components/CreatePost";
import { Post } from "@/components/Post";
import { UserInfoCard } from "@/components/UserInfoCard";

import {
  LogOut,
  Settings,
  Briefcase,
  Edit,
  MoreHorizontal,
  Heart,
  MessageSquare,
  Bookmark,
  Globe,
  Lock,
  Users,
  Image as ImageIcon,
  Video,
  UserPlus,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  CalendarDays,
  Clock,
  Award,
  FileText,
  Users as UsersIcon,
} from "lucide-react";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";

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

export default function Profile() {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const [loggedInUser, setLoggedInUser] = useState<UserProfile | null>(null);
  const [viewedUser, setViewedUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    location: "",
    workplace: "",
    education: "",
    birthday: "",
    website: "",
    privacy: "public" as "public" | "friends" | "private",
    department: "",
    position: "",
    phone: "",
    hire_date: "",
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
    fetchPosts();
    fetchFriends();
  }, []);

  // Debug useEffect
  useEffect(() => {
    if (viewedUser) {
      console.log("🔍 Viewed user data:", {
        full_name: viewedUser.full_name,
        logged_in: viewedUser.logged_in,
      });
    }
    if (loggedInUser) {
      console.log("🔍 Logged in user data:", {
        full_name: loggedInUser.full_name,
        logged_in: loggedInUser.logged_in,
      });
    }
  }, [viewedUser, loggedInUser]);

  // Auth State Listener
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      if (event === "SIGNED_IN" && session?.user) {
        try {
          await updateUserLoginStatus(true);
        } catch (error) {
          console.error("Error setting online status:", error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Keep user online while active
  useEffect(() => {
    if (!currentUserId || !isOwnProfile) return;

    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    let activityTimeout: NodeJS.Timeout;

    const updateActivity = async () => {
      await setUserOnline();
      clearTimeout(activityTimeout);

      // Set timeout to mark user as offline after 5 minutes of inactivity
      activityTimeout = setTimeout(
        async () => {
          if (isOwnProfile) {
            await setUserOffline();
            console.log("User marked as offline due to inactivity");
          }
        },
        5 * 60 * 1000
      ); // 5 minutes
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
        setUserOffline();
      }
    };
  }, [currentUserId, isOwnProfile]);

  useEffect(() => {
    document.title = "DeskStaff";
  }, []);

  // Real-time subscription for user updates
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
          console.log("User updated:", payload.new);
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

  const updateUserLoginStatus = async (isLoggedIn: boolean): Promise<void> => {
    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.log("No authenticated user found or auth error:", authError);
        return;
      }

      console.log(`Updating user ${authUser.id} logged_in to: ${isLoggedIn}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const { error } = await supabase
        .from("users")
        .update({
          logged_in: isLoggedIn,
          updated_at: new Date().toISOString(),
          ...(!isLoggedIn ? { last_seen: new Date().toISOString() } : {}),
        })
        .eq("id", authUser.id);

      clearTimeout(timeoutId);

      if (error) {
        if (
          error.message.includes("aborted") ||
          error.message.includes("AbortError")
        ) {
          console.log("Update aborted (expected during logout)");
        } else {
          console.error("Error updating login status:", error);
        }
      } else {
        console.log(
          `User ${isLoggedIn ? "logged in" : "logged out"} status updated successfully`
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        console.log("Request was aborted (expected during navigation)");
        return;
      }
      console.error("Error in updateUserLoginStatus:", error);
    }
  };

  const setUserOnline = () => updateUserLoginStatus(true);
  const setUserOffline = () => updateUserLoginStatus(false);

  const fetchUserData = async () => {
    try {
      console.log("🔄 Starting fetchUserData...");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("❌ Session error:", sessionError);
        toast.error("Please log in to continue");
        navigate("/", { replace: true });
        return;
      }

      setCurrentUserId(session.user.id);
      const userIdToFetch = urlUserId || session.user.id;
      const isOwnProfile = userIdToFetch === session.user.id;
      setIsOwnProfile(isOwnProfile);

      // 1. Fetch logged-in user's data
      const { data: loggedInUserData, error: loggedInUserError } =
        await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

      if (loggedInUserError) {
        console.error("❌ Error fetching logged-in user:", loggedInUserError);
      } else {
        setLoggedInUser(loggedInUserData);
      }

      // 2. Fetch viewed user's data
      const { data: viewedUserData, error: viewedUserError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userIdToFetch)
        .single();

      if (viewedUserError) {
        if (
          viewedUserError.code === "PGRST116" ||
          viewedUserError.message.includes("No rows found")
        ) {
          console.log("⚠️ Viewed user not found in database...");

          if (isOwnProfile) {
            await createUserRecord(session.user);
            await fetchUserData();
            return;
          } else {
            toast.error("User profile not found");
            navigate(`/profile/${session.user.id}`, { replace: true });
            return;
          }
        }
        toast.error("Failed to load profile data");
        return;
      }

      if (!viewedUserData) {
        if (isOwnProfile) {
          await createUserRecord(session.user);
          await fetchUserData();
          return;
        }
        toast.error("User profile not found");
        return;
      }

      setViewedUser(viewedUserData);

      if (isOwnProfile) {
        setEditForm({
          first_name: viewedUserData.first_name || "",
          last_name: viewedUserData.last_name || "",
          bio: viewedUserData.bio || "",
          location: viewedUserData.location || "",
          workplace: viewedUserData.workplace || "",
          education: viewedUserData.education || "",
          birthday: viewedUserData.birthday || "",
          website: viewedUserData.website || "",
          privacy: viewedUserData.privacy || "public",
          department: viewedUserData.department || "",
          position: viewedUserData.position || "",
          phone: viewedUserData.phone || "",
          hire_date: viewedUserData.hire_date || "",
        });

        try {
          await setUserOnline();
        } catch (onlineError) {
          console.error("⚠️ Failed to set user online:", onlineError);
        }
      }
    } catch (error) {
      console.error("💥 Error in fetchUserData:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createUserRecord = async (authUser: any) => {
    try {
      const { error } = await supabase.from("users").insert({
        id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || "",
        last_name: authUser.user_metadata?.last_name || "",
        full_name:
          `${authUser.user_metadata?.first_name || ""} ${
            authUser.user_metadata?.last_name || ""
          }`.trim() ||
          authUser.email?.split("@")[0] ||
          "User",
        avatar_url: null,
        bio: null,
        location: null,
        workplace: null,
        education: null,
        birthday: null,
        website: null,
        privacy: "public",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logged_in: true,
      });

      if (error) throw error;
      console.log("✅ New user record created");
    } catch (error) {
      console.error("Error creating user record:", error);
      throw error;
    }
  };

  const fetchPosts = async () => {
    try {
      const userIdToFetchPosts = urlUserId || currentUserId;
      // Mock posts data - replace with actual API call
      const mockPosts = [
        {
          id: "1",
          content: isOwnProfile
            ? "Just finished the Q3 project report ahead of schedule! Great teamwork from everyone involved. 🎯"
            : `${viewedUser?.full_name || "This user"} shared a professional update`,
          image_url: isOwnProfile
            ? "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop"
            : null,
          created_at: "2024-01-15T10:30:00Z",
          likes_count: 24,
          comments_count: 8,
          user: {
            id: userIdToFetchPosts || "1",
            full_name: viewedUser?.full_name || "User",
            avatar_url: viewedUser?.avatar_url || null,
          },
          liked: false,
          bookmarked: false,
        },
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchFriends = async () => {
    try {
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

  const testLoginStatusUpdate = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("No user found");
        return;
      }

      toast.loading("Testing login status update...");

      const { data, error } = await supabase
        .from("users")
        .update({
          logged_in: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id, logged_in, updated_at");

      if (error) {
        toast.error(`Update failed: ${error.message}`);
        console.error("Test error details:", error);
      } else {
        toast.success(`Update successful! Status: ${data?.[0]?.logged_in}`);
        console.log("Test result:", data);
      }
    } catch (error) {
      toast.error("Test failed");
      console.error("Test error:", error);
    }
  };

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);
    let dbUpdateComplete = false;

    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (!dbUpdateComplete) {
        e.preventDefault();
        e.returnValue = "Please wait, logging out...";
        return "Please wait, logging out...";
      }
    };

    window.addEventListener("beforeunload", beforeUnloadHandler);

    try {
      toast.loading("Logging out...");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await updateDatabaseWithRetry(user.id);
      }

      dbUpdateComplete = true;
      window.removeEventListener("beforeunload", beforeUnloadHandler);

      await supabase.auth.signOut();

      setLoggedInUser(null);
      setViewedUser(null);
      setPosts([]);
      setFriends([]);

      toast.dismiss();
      toast.success("Logged out!");

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast.dismiss();
      toast.error("Logout failed");
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      navigate("/", { replace: true });
    }
  };

  const updateDatabaseWithRetry = async (
    userId: string,
    retries = 3
  ): Promise<void> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to update database...`);

        const { error, status } = await supabase
          .from("users")
          .update({
            logged_in: false,
            last_seen: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (error) throw error;

        console.log(
          `✅ Database updated on attempt ${attempt}, status: ${status}`
        );

        const { data } = await supabase
          .from("users")
          .select("logged_in")
          .eq("id", userId)
          .maybeSingle();

        if (data && data.logged_in === false) {
          console.log("✅ Verification passed: logged_in is FALSE");
          return;
        } else {
          throw new Error("Verification failed");
        }
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        if (attempt === retries) {
          throw new Error(
            `Failed to update database after ${retries} attempts`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) return;

      const { error } = await supabase
        .from("users")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          full_name: `${editForm.first_name} ${editForm.last_name}`,
          bio: editForm.bio,
          location: editForm.location,
          workplace: editForm.workplace,
          education: editForm.education,
          birthday: editForm.birthday,
          website: editForm.website,
          privacy: editForm.privacy,
          department: editForm.department,
          position: editForm.position,
          phone: editForm.phone,
          hire_date: editForm.hire_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", authUser.id);

      if (error) throw error;

      toast.success("Your profile has been successfully updated");
      fetchUserData();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;

      toast.success("Your password has been successfully updated");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangePasswordOpen(false);
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCreatePost = async (content: string, image?: File) => {
    try {
      const newPostObj = {
        id: Date.now().toString(),
        content,
        image_url: image ? URL.createObjectURL(image) : null,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
        user: {
          id: viewedUser?.id || "",
          full_name: viewedUser?.full_name || "",
          avatar_url: viewedUser?.avatar_url || null,
        },
        liked: false,
        bookmarked: false,
      };

      setPosts([newPostObj, ...posts]);
      toast.success("Your post has been published");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
      throw error;
    }
  };

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const wasLiked = post.liked;
          return {
            ...post,
            liked: !wasLiked,
            likes_count: wasLiked ? post.likes_count - 1 : post.likes_count + 1,
          };
        }
        return post;
      })
    );

    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.liked) {
        toast.success("Post liked!");
      } else {
        toast.info("Post unliked");
      }
    }
  };

  const handleBookmarkPost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          const wasBookmarked = post.bookmarked;
          return {
            ...post,
            bookmarked: !wasBookmarked,
          };
        }
        return post;
      })
    );

    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.bookmarked) {
        toast.success("Post bookmarked!");
      } else {
        toast.info("Post removed from bookmarks");
      }
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
    toast.success("Post deleted successfully");
  };

  if (loading) {
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header
          user={loggedInUser}
          currentUserId={currentUserId}
          onNavigate={navigate}
          onEditProfile={() => setIsEditing(true)}
          onPrivacySettings={() => setIsPrivacyOpen(true)}
          onChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={() => setIsLogoutDialogOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="mb-6 overflow-hidden border-gray-200/50 dark:border-gray-700/50 shadow-lg bg-white dark:bg-gray-900">
            <div className="relative h-56 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-4 right-4 flex gap-2">
                {isOwnProfile ? (
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    onClick={() => setIsEditing(true)}
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
                <ProfilePictureUpload
                  userId={viewedUser?.id || ""}
                  currentAvatarUrl={viewedUser?.avatar_url || null}
                  onUploadComplete={(avatarUrl) => {
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
                  }}
                  size="lg"
                  editable={isOwnProfile}
                />

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {viewedUser?.full_name}
                        </h1>

                        {viewedUser?.logged_in ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></div>
                            Online
                          </Badge>
                        ) : viewedUser?.last_seen ? (
                          <Badge
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5"></div>
                            Offline
                          </Badge>
                        ) : null}

                        {viewedUser?.position && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {viewedUser.position}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{viewedUser?.department || "Department"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{friends.length} Connections</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            Joined{" "}
                            {viewedUser?.created_at
                              ? new Date(
                                  viewedUser.created_at
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Recently"}
                          </span>
                        </div>

                        {!viewedUser?.logged_in && viewedUser?.last_seen && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              Last seen{" "}
                              {new Date(
                                viewedUser.last_seen
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        onClick={() =>
                          toast.success("Connection request sent!")
                        }
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
                            onClick={() => setIsEditing(true)}
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
                              toast.error(
                                "Account deletion is not available yet"
                              )
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      onClick={() =>
                        toast.info("Connections page coming soon!")
                      }
                      className="text-gray-600 dark:text-gray-400"
                    >
                      See all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {friends.slice(0, 9).map((friend) => (
                      <div
                        key={friend.id}
                        className="group cursor-pointer space-y-2"
                      >
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
                        {viewedUser?.privacy === "public" &&
                          "Public - Anyone can see your profile"}
                        {viewedUser?.privacy === "friends" &&
                          "Connections only"}
                        {viewedUser?.privacy === "private" &&
                          "Private - Only you can see"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        viewedUser?.privacy === "public"
                          ? "default"
                          : viewedUser?.privacy === "friends"
                            ? "secondary"
                            : "destructive"
                      }
                      className="bg-gradient-to-r from-blue-500 to-indigo-600"
                    >
                      {viewedUser?.privacy?.charAt(0).toUpperCase() +
                        viewedUser?.privacy?.slice(1)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    onClick={() => setIsPrivacyOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {isOwnProfile && (
                <CreatePost
                  user={viewedUser}
                  onSubmit={handleCreatePost}
                  placeholder="What's on your mind"
                  disabled={!viewedUser}
                />
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab}>
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

                <TabsContent value="posts" className="space-y-6 mt-6">
                  {posts.map((post) => (
                    <Post
                      key={post.id}
                      {...post}
                      isOwnPost={post.user.id === viewedUser?.id}
                      onLike={handleLikePost}
                      onBookmark={handleBookmarkPost}
                      onComment={() =>
                        toast.info("Comment feature coming soon!")
                      }
                      onShare={() => toast.success("Post shared!")}
                      onDelete={handleDeletePost}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="photos">
                  <Card className="border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {posts
                          .filter((p) => p.image_url)
                          .map((post) => (
                            <div
                              key={post.id}
                              className="relative group rounded-xl overflow-hidden"
                            >
                              <img
                                src={post.image_url!}
                                alt="Post"
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                onClick={() =>
                                  toast.info("Viewing photo in full screen")
                                }
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                                <div className="text-white">
                                  <p className="text-sm font-medium truncate">
                                    {post.user.full_name}
                                  </p>
                                  <p className="text-xs opacity-90">
                                    {new Date(
                                      post.created_at
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                                    onClick={() => handleLikePost(post.id)}
                                  >
                                    <Heart
                                      className={`h-3 w-3 ${
                                        post.liked ? "fill-current" : ""
                                      }`}
                                    />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                                    onClick={() =>
                                      toast.info("Comment on photo")
                                    }
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="videos">
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
                          Share your first video to showcase your work or team
                          activities
                        </p>
                        <div className="pt-4">
                          <Button
                            variant="outline"
                            onClick={() =>
                              toast.info("Video upload feature coming soon!")
                            }
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Upload Your First Video
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-xl text-gray-900 dark:text-white">
                Edit Profile
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Update your professional profile information.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="first_name"
                    className="text-gray-900 dark:text-white"
                  >
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="last_name"
                    className="text-gray-900 dark:text-white"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-gray-900 dark:text-white">
                  Professional Summary
                </Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Tell people about your professional background and expertise..."
                  className="min-h-[100px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="department"
                    className="text-gray-900 dark:text-white"
                  >
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    placeholder="Engineering, Marketing, HR, etc."
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="position"
                    className="text-gray-900 dark:text-white"
                  >
                    Position
                  </Label>
                  <Input
                    id="position"
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({ ...editForm, position: e.target.value })
                    }
                    placeholder="Your job title"
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className="text-gray-900 dark:text-white"
                  >
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-gray-900 dark:text-white"
                  >
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="workplace"
                    className="text-gray-900 dark:text-white"
                  >
                    Company
                  </Label>
                  <Input
                    id="workplace"
                    value={editForm.workplace}
                    onChange={(e) =>
                      setEditForm({ ...editForm, workplace: e.target.value })
                    }
                    placeholder="Your company name"
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="hire_date"
                    className="text-gray-900 dark:text-white"
                  >
                    Hire Date
                  </Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={editForm.hire_date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hire_date: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="education"
                    className="text-gray-900 dark:text-white"
                  >
                    Education
                  </Label>
                  <Input
                    id="education"
                    value={editForm.education}
                    onChange={(e) =>
                      setEditForm({ ...editForm, education: e.target.value })
                    }
                    placeholder="Your educational background"
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="birthday"
                    className="text-gray-900 dark:text-white"
                  >
                    Birthday
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={editForm.birthday}
                    onChange={(e) =>
                      setEditForm({ ...editForm, birthday: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="website"
                  className="text-gray-900 dark:text-white"
                >
                  Website
                </Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                  placeholder="https://yourportfolio.com"
                  className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="privacy"
                  className="text-gray-900 dark:text-white"
                >
                  Profile Privacy
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={
                      editForm.privacy === "public" ? "default" : "outline"
                    }
                    onClick={() =>
                      setEditForm({ ...editForm, privacy: "public" })
                    }
                    className="justify-start gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <Globe className="h-4 w-4" />
                    Public
                  </Button>
                  <Button
                    type="button"
                    variant={
                      editForm.privacy === "friends" ? "default" : "outline"
                    }
                    onClick={() =>
                      setEditForm({ ...editForm, privacy: "friends" })
                    }
                    className="justify-start gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <Users className="h-4 w-4" />
                    Connections Only
                  </Button>
                  <Button
                    type="button"
                    variant={
                      editForm.privacy === "private" ? "default" : "outline"
                    }
                    onClick={() =>
                      setEditForm({ ...editForm, privacy: "private" })
                    }
                    className="justify-start gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    <Lock className="h-4 w-4" />
                    Private
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                Log Out
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to log out? You will need to sign in again
                to access your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsLogoutDialogOpen(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        >
          <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                Change Password
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Enter your current password and a new password to update your
                account security.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="currentPassword"
                  className="text-gray-900 dark:text-white"
                >
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-gray-900 dark:text-white"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-gray-900 dark:text-white"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsChangePasswordOpen(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                Privacy Settings
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Control who can see your profile and activity on DeskStaff.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Profile Visibility
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Who can see your profile?
                    </p>
                  </div>
                  <select
                    className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    value={editForm.privacy}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        privacy: e.target.value as
                          | "public"
                          | "friends"
                          | "private",
                      })
                    }
                  >
                    <option value="public">Public</option>
                    <option value="friends">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <Separator className="bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Email Visibility
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Who can see your email?
                      </p>
                    </div>
                    <select className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option>Only Me</option>
                      <option>Connections</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Connections List
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Who can see your connections?
                      </p>
                    </div>
                    <select className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option>Public</option>
                      <option>Connections Only</option>
                      <option>Only Me</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Post Visibility
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Default audience for new posts
                      </p>
                    </div>
                    <select className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option>Public</option>
                      <option>Connections Only</option>
                      <option>Only Me</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPrivacyOpen(false)}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleUpdateProfile();
                  setIsPrivacyOpen(false);
                  toast.success("Privacy settings updated");
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Save Privacy Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={testLoginStatusUpdate}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          >
            Test Login Status Update
          </Button>

          <Button
            onClick={() => {
              console.log("Current states:", {
                loggedInUser,
                viewedUser,
                currentUserId,
                loading,
              });
              fetchUserData();
            }}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            size="sm"
          >
            Debug Fetch
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
