// src/routes/profile.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuLabel,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  LogOut,
  User,
  Settings,
  Bell,
  Calendar,
  MapPin,
  Briefcase,
  School,
  Edit,
  Camera,
  MoreHorizontal,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Globe,
  Lock,
  Users,
  Image as ImageIcon,
  Video,
  Smile,
  Send,
  Home,
  Search,
  MessageCircle,
  UserPlus,
  Check,
  X,
  Loader2,
  Shield,
  Key,
  Trash2,
  Eye,
  EyeOff,
  Building,
  Mail,
  Phone,
  Globe as GlobeIcon,
  FileText,
  Award,
  CalendarDays,
  Clock,
  TrendingUp,
  Users as UsersIcon,
  BriefcaseBusiness,
} from "lucide-react";

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
  logged_in?: boolean; // Add this
  last_seen?: string; // Optional: track last activity
}

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  liked: boolean;
  bookmarked: boolean;
}

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
  mutual_friends: number;
  status: "pending" | "accepted" | "requested";
  department?: string;
  position?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
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

  // New post state
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    fetchUserData();
    fetchPosts();
    fetchFriends();
  }, []);

  // Add this debug useEffect
  useEffect(() => {
    if (user) {
      console.log("🔍 Current user data:", {
        full_name: user.full_name,
        first_name: user.first_name,
        last_name: user.last_name,
        logged_in: user.logged_in,
        last_seen: user.last_seen,
        email: user.email,
      });
    } else {
      console.log("🔍 User is null");
    }
  }, [user]);

  // Add this after the first useEffect
  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      if (event === "SIGNED_IN" && session?.user) {
        // User just logged in
        try {
          await updateUserLoginStatus(true);
        } catch (error) {
          console.error("Error setting online status:", error);
        }
      }
      // REMOVE the SIGNED_OUT handler here since handleLogout handles it
      // This prevents duplicate logout attempts
    });

    // Clean up listener
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Keep user online while active on the page
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

    // Add event listeners for user activity
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    // Initial activity update
    updateActivity();

    // Clean up
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearTimeout(activityTimeout);

      // Mark as offline when component unmounts (if it's user's own profile)
      if (isOwnProfile) {
        setUserOffline();
      }
    };
  }, [currentUserId, isOwnProfile]);

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
          setUser(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [urlUserId, currentUserId]); // Update dependency array

  // Function to update user's logged_in status in database
  // Function to update user's logged_in status in database
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

      // Use a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

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
        // Don't show error if it's an abort error during logout
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
      // Catch and handle abort errors gracefully
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        console.log("Request was aborted (expected during navigation)");
        return;
      }
      console.error("Error in updateUserLoginStatus:", error);
    }
  };

  // Function to set user as online
  const setUserOnline = () => updateUserLoginStatus(true);

  // Function to set user as offline
  const setUserOffline = () => updateUserLoginStatus(false);

  const fetchUserData = async () => {
    try {
      console.log("🔄 Starting fetchUserData...");

      // First check session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("📋 Session:", session ? "✅ Exists" : "❌ None");

      if (sessionError || !session) {
        console.error("❌ Session error:", sessionError);
        toast.error("Please log in to continue");
        navigate("/", { replace: true });
        return;
      }

      // Set current user ID from session
      setCurrentUserId(session.user.id);
      console.log("👤 Current User ID:", session.user.id);

      // Determine which user ID to fetch
      const userIdToFetch = urlUserId || session.user.id;
      console.log("🎯 Fetching data for User ID:", userIdToFetch);

      // Check if this is the user's own profile
      const isOwnProfile = userIdToFetch === session.user.id;
      setIsOwnProfile(isOwnProfile);
      console.log("👥 Is own profile?", isOwnProfile);

      // ⚠️ REMOVED: Don't call setUserOnline here - it might be failing
      // await setUserOnline(); // Remove this line

      // Fetch user data from database
      console.log("📥 Querying database for user...");
      const {
        data: userData,
        error,
        status,
      } = await supabase
        .from("users")
        .select("*")
        .eq("id", userIdToFetch)
        .single();

      console.log("📊 Database response:", {
        data: userData,
        error: error,
        status: status,
        hasData: !!userData,
      });

      if (error) {
        console.error("❌ Database error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
        });

        // Handle "no rows returned" error (user doesn't exist in database)
        if (
          error.code === "PGRST116" ||
          error.message.includes("No rows found")
        ) {
          console.log("⚠️ User not found in database, creating record...");

          // Only create record if it's the user's own profile
          if (isOwnProfile) {
            await createUserRecord(session.user);
            // Retry fetching after creation
            await fetchUserData(); // This will recursively call itself
            return;
          } else {
            // If viewing someone else's profile that doesn't exist
            toast.error("User profile not found");
            // Redirect to own profile
            navigate(`/profile/${session.user.id}`, { replace: true });
            return;
          }
        }

        toast.error("Failed to load profile data");
        return;
      }

      if (!userData) {
        console.error("❌ userData is null or undefined");

        // Create user record if it doesn't exist (for own profile)
        if (isOwnProfile) {
          await createUserRecord(session.user);
          await fetchUserData(); // Retry
          return;
        }

        toast.error("User profile not found");
        return;
      }

      console.log("✅ User data loaded successfully:", {
        id: userData.id,
        full_name: userData.full_name,
        email: userData.email,
      });

      // Set user state
      setUser(userData);

      // Only set edit form if it's the user's own profile
      if (isOwnProfile) {
        setEditForm({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          bio: userData.bio || "",
          location: userData.location || "",
          workplace: userData.workplace || "",
          education: userData.education || "",
          birthday: userData.birthday || "",
          website: userData.website || "",
          privacy: userData.privacy || "public",
          department: userData.department || "",
          position: userData.position || "",
          phone: userData.phone || "",
          hire_date: userData.hire_date || "",
        });

        // Now set user as online (after user is loaded)
        try {
          await setUserOnline();
          console.log("✅ User marked as online");
        } catch (onlineError) {
          console.error("⚠️ Failed to set user online:", onlineError);
          // Don't throw, continue anyway
        }
      }
    } catch (error) {
      console.error("💥 Error in fetchUserData:", error);
      toast.error("An unexpected error occurred");
    } finally {
      console.log("🏁 Setting loading to false");
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      // Determine which posts to fetch based on profile
      const userIdToFetchPosts = urlUserId || currentUserId;

      // Mock posts data - replace with actual API call
      const mockPosts: Post[] = [
        {
          id: "1",
          content: isOwnProfile
            ? "Just finished the Q3 project report ahead of schedule! Great teamwork from everyone involved. 🎯"
            : `${user?.full_name || "This user"} shared a professional update`,
          image_url: isOwnProfile
            ? "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop"
            : null,
          created_at: "2024-01-15T10:30:00Z",
          likes_count: 24,
          comments_count: 8,
          user: {
            id: userIdToFetchPosts || "1",
            full_name: user?.full_name || "User",
            avatar_url: user?.avatar_url || null,
          },
          liked: false,
          bookmarked: false,
        },
        // ... other posts
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchFriends = async () => {
    try {
      // Mock friends data - now with logged_in status
      const mockFriends: Friend[] = [
        {
          id: "2",
          full_name: "Jane Smith",
          avatar_url: null,
          mutual_friends: 8,
          status: "accepted",
          department: "Engineering",
          position: "Senior Developer",
          logged_in: true, // Online
        },
        {
          id: "3",
          full_name: "Bob Johnson",
          avatar_url: null,
          mutual_friends: 12,
          status: "accepted",
          department: "Marketing",
          position: "Marketing Manager",
          logged_in: false, // Offline
        },
        // ... other friends
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  // Add this debug function to test
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

      // Test update
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

  // Add a test button to your UI temporarily
  <Button
    variant="outline"
    size="sm"
    onClick={testLoginStatusUpdate}
    className="mb-2"
  >
    Test Login Status Update
  </Button>;

  const handleLogout = async () => {
    setIsLogoutDialogOpen(false);

    // Set a flag to prevent navigation until DB update is done
    let dbUpdateComplete = false;

    // Override beforeunload to wait for DB update
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

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Update database with retry logic
        await updateDatabaseWithRetry(user.id);
      }

      // Mark DB update as complete
      dbUpdateComplete = true;

      // Remove the beforeunload listener
      window.removeEventListener("beforeunload", beforeUnloadHandler);

      // Sign out
      await supabase.auth.signOut();

      // Clear state
      setUser(null);
      setPosts([]);
      setFriends([]);

      toast.dismiss();
      toast.success("Logged out!");

      // Navigate
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

        // Verify the update
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

        // Wait before retry
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

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) return;

    setIsPosting(true);
    try {
      // Mock post creation - replace with actual API call
      const newPostObj: Post = {
        id: Date.now().toString(),
        content: newPost,
        image_url: imagePreview,
        created_at: new Date().toISOString(),
        likes_count: 0,
        comments_count: 0,
        user: {
          id: user?.id || "",
          full_name: user?.full_name || "",
          avatar_url: user?.avatar_url || null,
        },
        liked: false,
        bookmarked: false,
      };

      setPosts([newPostObj, ...posts]);
      setNewPost("");
      setSelectedImage(null);
      setImagePreview(null);

      toast.success("Your post has been published");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsPosting(false);
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

    // Show toast for like/unlike action
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

    // Show toast for bookmark action
    const post = posts.find((p) => p.id === postId);
    if (post) {
      if (!post.bookmarked) {
        toast.success("Post bookmarked!");
      } else {
        toast.info("Post removed from bookmarks");
      }
    }
  };

  const handleFriendRequest = (
    friendId: string,
    action: "accept" | "reject" | "cancel"
  ) => {
    setFriends(
      friends
        .map((friend) => {
          if (friend.id === friendId) {
            if (action === "accept") {
              toast.success(`Friend request accepted from ${friend.full_name}`);
              return { ...friend, status: "accepted" };
            } else if (action === "reject") {
              toast.info(`Friend request from ${friend.full_name} rejected`);
              return { ...friend, status: "rejected" };
            } else if (action === "cancel") {
              toast.info(`Friend request to ${friend.full_name} cancelled`);
              return { ...friend, status: "cancelled" };
            }
          }
          return friend;
        })
        .filter(
          (friend) =>
            friend.status !== "rejected" && friend.status !== "cancelled"
        )
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.info("Image selected. Click 'Post' to publish.");
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    toast.info("Image removed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-xl" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Header */}
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
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search colleagues, projects, or documents..."
                    className="pl-10 w-64 bg-gray-100/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Home"
                >
                  <Home className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    5
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                  title="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Teams"
                >
                  <UsersIcon className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-gray-700">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="font-semibold">{user?.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.position || "Employee"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(`/profile/${currentUserId}`)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsPrivacyOpen(true)}>
                      <Shield className="mr-2 h-4 w-4" />
                      Privacy Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsChangePasswordOpen(true)}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setIsLogoutDialogOpen(true)}
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden border-gray-200/50 dark:border-gray-700/50 shadow-lg">
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
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                          {user?.full_name}
                        </h1>

                        {/* Status Badge */}
                        {user?.logged_in ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></div>
                            Online
                          </Badge>
                        ) : user?.last_seen ? (
                          <Badge
                            variant="outline"
                            className="border-gray-300 dark:border-gray-600"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-1.5"></div>
                            Offline
                          </Badge>
                        ) : null}

                        {/* Position Badge */}
                        {user?.position && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {user.position}
                          </Badge>
                        )}
                      </div>

                      {/* User info row */}
                      <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>{user?.department || "Department"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{friends.length} Connections</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            Joined{" "}
                            {user?.created_at
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

                        {/* Last seen time for offline users */}
                        {!user?.logged_in && user?.last_seen && (
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
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Saved items feature coming soon!")
                            }
                          >
                            <Bookmark className="mr-2 h-4 w-4" />
                            Saved Items
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
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
            {/* Left Column - Info & Connections */}
            <div className="space-y-6">
              {/* Bio Card */}
              <Card className="border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Professional Summary
                    </span>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.bio ? (
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {user.bio}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No summary added yet</p>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <BriefcaseBusiness className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Position
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.position || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Department
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.department || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Location
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.location || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          Email
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 truncate">
                          {user?.email || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {user?.phone && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Phone
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {user?.hire_date && (
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            Hire Date
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            {new Date(user.hire_date).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Connections Card */}
              <Card className="border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-blue-600" />
                        Connections
                      </CardTitle>
                      <CardDescription>
                        {friends.length} professional connections
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toast.info("Connections page coming soon!")
                      }
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
                              {/* Online status indicator */}
                              {friend.logged_in && (
                                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
                              )}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold truncate">
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

              {/* Skills & Privacy Card */}
              <Card className="border-gray-200/50 dark:border-gray-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
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
                        {user?.privacy === "public" &&
                          "Public - Anyone can see your profile"}
                        {user?.privacy === "friends" && "Connections only"}
                        {user?.privacy === "private" &&
                          "Private - Only you can see"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        user?.privacy === "public"
                          ? "default"
                          : user?.privacy === "friends"
                            ? "secondary"
                            : "destructive"
                      }
                      className="bg-gradient-to-r from-blue-500 to-indigo-600"
                    >
                      {user?.privacy?.charAt(0).toUpperCase() +
                        user?.privacy?.slice(1)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 dark:border-gray-600"
                    onClick={() => setIsPrivacyOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Posts & Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <Card className="border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {user?.first_name?.[0]}
                        {user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <Textarea
                        placeholder={`What's on your mind, ${user?.first_name}? Share an update, article, or thought...`}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="min-h-[120px] resize-none border-gray-300 dark:border-gray-600 focus:border-blue-500"
                      />

                      {imagePreview && (
                        <div className="relative rounded-xl overflow-hidden">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-96 object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-3 right-3 backdrop-blur-sm"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageSelect}
                            />
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                            <span className="hidden sm:inline">Photo</span>
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            onClick={() =>
                              toast.info("Video upload coming soon!")
                            }
                          >
                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                              <Video className="h-5 w-5" />
                            </div>
                            <span className="hidden sm:inline">Video</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                            onClick={() =>
                              toast.info("Feeling selection coming soon!")
                            }
                          >
                            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                              <Smile className="h-5 w-5" />
                            </div>
                            <span className="hidden sm:inline">Feeling</span>
                          </Button>
                        </div>

                        <Button
                          onClick={handleCreatePost}
                          disabled={
                            isPosting || (!newPost.trim() && !selectedImage)
                          }
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                        >
                          {isPosting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Post
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl">
                  <TabsTrigger
                    value="posts"
                    className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Posts
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photos
                  </TabsTrigger>
                  <TabsTrigger
                    value="videos"
                    className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Videos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-6 mt-6">
                  {posts.map((post) => (
                    <Card
                      key={post.id}
                      className="border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={post.user.avatar_url || undefined}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                {post.user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {post.user.full_name}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(post.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                                <GlobeIcon className="h-3 w-3" />
                                <span>Public</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.info("Edit post feature coming soon!")
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Post
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBookmarkPost(post.id)}
                              >
                                <Bookmark
                                  className={`mr-2 h-4 w-4 ${post.bookmarked ? "fill-current text-yellow-500" : ""}`}
                                />
                                {post.bookmarked
                                  ? "Remove from Bookmarks"
                                  : "Save Post"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setPosts(
                                    posts.filter((p) => p.id !== post.id)
                                  );
                                  toast.success("Post deleted successfully");
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                          {post.content}
                        </p>

                        {post.image_url && (
                          <div className="mb-4 rounded-xl overflow-hidden">
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => toast.info("Viewing full image")}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center -space-x-1">
                              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                                <span className="text-xs text-white">👍</span>
                              </div>
                              <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                                <span className="text-xs text-white">❤️</span>
                              </div>
                            </div>
                            <span>{post.likes_count} reactions</span>
                          </div>
                          <div>
                            <span>{post.comments_count} comments</span>
                          </div>
                        </div>

                        <Separator className="mb-4" />

                        <div className="grid grid-cols-4 gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 ${post.liked ? "text-blue-600" : "text-gray-600 dark:text-gray-400"}`}
                            onClick={() => handleLikePost(post.id)}
                          >
                            <Heart
                              className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`}
                            />
                            {post.liked ? "Liked" : "Like"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-gray-600 dark:text-gray-400"
                            onClick={() =>
                              toast.info("Comment feature coming soon!")
                            }
                          >
                            <MessageSquare className="h-4 w-4" />
                            Comment
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-gray-600 dark:text-gray-400"
                            onClick={() => toast.success("Post shared!")}
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 ${post.bookmarked ? "text-yellow-600" : "text-gray-600 dark:text-gray-400"}`}
                            onClick={() => handleBookmarkPost(post.id)}
                          >
                            <Bookmark
                              className={`h-4 w-4 ${post.bookmarked ? "fill-current" : ""}`}
                            />
                            Save
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="photos">
                  <Card className="border-gray-200/50 dark:border-gray-700/50">
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
                                      className={`h-3 w-3 ${post.liked ? "fill-current" : ""}`}
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
                  <Card className="border-gray-200/50 dark:border-gray-700/50">
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
                            className="border-gray-300 dark:border-gray-600"
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

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Profile</DialogTitle>
              <DialogDescription>
                Update your professional profile information.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Professional Summary</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Tell people about your professional background and expertise..."
                  className="min-h-[100px] border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={editForm.department}
                    onChange={(e) =>
                      setEditForm({ ...editForm, department: e.target.value })
                    }
                    placeholder="Engineering, Marketing, HR, etc."
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({ ...editForm, position: e.target.value })
                    }
                    placeholder="Your job title"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    placeholder="City, Country"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="+1 (555) 123-4567"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workplace">Company</Label>
                  <Input
                    id="workplace"
                    value={editForm.workplace}
                    onChange={(e) =>
                      setEditForm({ ...editForm, workplace: e.target.value })
                    }
                    placeholder="Your company name"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={editForm.hire_date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hire_date: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={editForm.education}
                    onChange={(e) =>
                      setEditForm({ ...editForm, education: e.target.value })
                    }
                    placeholder="Your educational background"
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={editForm.birthday}
                    onChange={(e) =>
                      setEditForm({ ...editForm, birthday: e.target.value })
                    }
                    className="border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                  placeholder="https://yourportfolio.com"
                  className="border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy">Profile Privacy</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={
                      editForm.privacy === "public" ? "default" : "outline"
                    }
                    onClick={() =>
                      setEditForm({ ...editForm, privacy: "public" })
                    }
                    className="justify-start gap-2 border-gray-300 dark:border-gray-600"
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
                    className="justify-start gap-2 border-gray-300 dark:border-gray-600"
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
                    className="justify-start gap-2 border-gray-300 dark:border-gray-600"
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
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout Dialog */}
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Out</DialogTitle>
              <DialogDescription>
                Are you sure you want to log out? You will need to sign in again
                to access your account.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsLogoutDialogOpen(false)}
                className="border-gray-300 dark:border-gray-600"
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

        {/* Change Password Dialog */}
        <Dialog
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and a new password to update your
                account security.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
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
                    className="border-gray-300 dark:border-gray-600"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
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
                <Label htmlFor="newPassword">New Password</Label>
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
                    className="border-gray-300 dark:border-gray-600"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
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
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                    className="border-gray-300 dark:border-gray-600"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
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
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isChangingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Privacy Settings Dialog */}
        <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Privacy Settings</DialogTitle>
              <DialogDescription>
                Control who can see your profile and activity on DeskStaff.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Who can see your profile?
                    </p>
                  </div>
                  <select
                    className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-transparent"
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

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Visibility</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Who can see your email?
                      </p>
                    </div>
                    <select className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-transparent">
                      <option>Only Me</option>
                      <option>Connections</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Connections List</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Who can see your connections?
                      </p>
                    </div>
                    <select className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-transparent">
                      <option>Public</option>
                      <option>Connections Only</option>
                      <option>Only Me</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Post Visibility</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Default audience for new posts
                      </p>
                    </div>
                    <select className="border rounded-lg px-3 py-2 border-gray-300 dark:border-gray-600 bg-transparent">
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
                className="border-gray-300 dark:border-gray-600"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleUpdateProfile();
                  setIsPrivacyOpen(false);
                  toast.success("Privacy settings updated");
                }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Save Privacy Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
