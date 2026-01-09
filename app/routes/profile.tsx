// src/routes/profile.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
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
}

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
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

  // Add this after the first useEffect
  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);

      if (event === "SIGNED_OUT") {
        // Clear all state when signed out
        setUser(null);
        setPosts([]);
        setFriends([]);
        navigate("/", { replace: true });
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed");
      } else if (event === "USER_UPDATED") {
        console.log("User updated");
      }
    });

    // Clean up listener
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${user.id}`,
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
  }, [user?.id]);

  const fetchUserData = async () => {
    try {
      // First check session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Session error:", sessionError);
        toast.error("Please log in to continue");
        navigate("/", { replace: true });
        return;
      }

      // Fetch user data from database
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);

        // Check if it's a "no rows returned" error (user doesn't exist in database)
        if (error.code === "PGRST116") {
          toast.error("User profile not found. Please contact support.");
          await supabase.auth.signOut();
          navigate("/", { replace: true });
          return;
        }

        toast.error("Failed to load profile data");
        return;
      }

      if (!userData) {
        toast.error("User profile not found");
        await supabase.auth.signOut();
        navigate("/", { replace: true });
        return;
      }

      setUser(userData);
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
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred");

      // On unexpected errors, log out for security
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      // Mock posts data - replace with actual API call
      const mockPosts: Post[] = [
        {
          id: "1",
          content:
            "Just finished an amazing project! 🎉 Can't wait to share more details soon.",
          image_url:
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop",
          created_at: "2024-01-15T10:30:00Z",
          likes_count: 42,
          comments_count: 8,
          user: {
            id: "1",
            full_name: "John Doe",
            avatar_url: null,
          },
          liked: true,
          bookmarked: false,
        },
        {
          id: "2",
          content:
            "Beautiful sunset at the beach today. Sometimes you just need to pause and appreciate the little things.",
          image_url: null,
          created_at: "2024-01-14T18:45:00Z",
          likes_count: 89,
          comments_count: 12,
          user: {
            id: "1",
            full_name: "John Doe",
            avatar_url: null,
          },
          liked: false,
          bookmarked: true,
        },
        {
          id: "3",
          content:
            "Learning new things every day! 🚀 Just completed an advanced React course.",
          image_url:
            "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
          created_at: "2024-01-13T14:20:00Z",
          likes_count: 56,
          comments_count: 5,
          user: {
            id: "1",
            full_name: "John Doe",
            avatar_url: null,
          },
          liked: true,
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
      // Mock friends data - replace with actual API call
      const mockFriends: Friend[] = [
        {
          id: "2",
          full_name: "Jane Smith",
          avatar_url: null,
          mutual_friends: 12,
          status: "accepted",
        },
        {
          id: "3",
          full_name: "Bob Johnson",
          avatar_url: null,
          mutual_friends: 8,
          status: "accepted",
        },
        {
          id: "4",
          full_name: "Alice Williams",
          avatar_url: null,
          mutual_friends: 5,
          status: "pending",
        },
        {
          id: "5",
          full_name: "Charlie Brown",
          avatar_url: null,
          mutual_friends: 3,
          status: "requested",
        },
      ];
      setFriends(mockFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear local state first
      setUser(null);
      setPosts([]);
      setFriends([]);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase sign out error:", error);
        toast.error("Failed to log out properly");
        return;
      }

      toast.success("You have been successfully logged out");

      // Use a small delay to ensure toast is visible
      setTimeout(() => {
        // Force navigation to login page with replace to prevent back navigation
        navigate("/", { replace: true });

        // Force a reload to ensure all auth state is cleared
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    } finally {
      setIsLogoutDialogOpen(false);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full rounded-lg" />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
              ))}
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">F</span>
                  </div>
                  <span className="text-xl font-semibold dark:text-white hidden sm:inline">
                    SocialHub
                  </span>
                </Link>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search SocialHub"
                    className="pl-10 w-64 bg-gray-100 dark:bg-gray-700 border-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Home className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Users className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    5
                  </span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
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
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Profile
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Profile Header */}
          <Card className="mb-8 overflow-hidden">
            <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="absolute inset-0 bg-black/20" />
              <Button
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-none"
                size="sm"
                onClick={() =>
                  toast.info("Cover photo editing feature coming soon!")
                }
              >
                <Camera className="h-4 w-4 mr-2" />
                Edit Cover
              </Button>
            </div>

            <div className="relative px-8 pb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-lg">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold dark:text-white">
                        {user?.full_name}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300">
                        {friends.length} friends
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => toast.success("Friend request sent!")}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
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

                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Briefcase className="h-4 w-4" />
                      <span>{user?.workplace || "Add workplace"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <School className="h-4 w-4" />
                      <span>{user?.education || "Add education"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4" />
                      <span>{user?.location || "Add location"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Info & Friends */}
            <div className="space-y-6">
              {/* Bio Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Intro</span>
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
                    <p className="text-gray-600 dark:text-gray-300">
                      {user.bio}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">No bio added yet</p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Works at</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.workplace || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <School className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Studied at</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.education || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Lives in</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.location || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Born on</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {user?.birthday
                            ? new Date(user.birthday).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Website</p>
                        {user?.website ? (
                          <a
                            href={user.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              toast.info(`Opening website: ${user.website}`);
                              window.open(user.website!, "_blank");
                            }}
                          >
                            {user.website}
                          </a>
                        ) : (
                          <p className="text-gray-600 dark:text-gray-300">
                            Not specified
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Friends Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Friends</CardTitle>
                    <CardDescription>{friends.length} friends</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info("Friends page coming soon!")}
                  >
                    See all
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {friends.slice(0, 9).map((friend) => (
                      <div key={friend.id} className="space-y-1">
                        <Avatar
                          className="h-20 w-full rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            toast.info(`Viewing ${friend.full_name}'s profile`)
                          }
                        >
                          <AvatarFallback>
                            {friend.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs font-medium truncate">
                          {friend.full_name}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {friend.status === "pending" && (
                            <>
                              <Button
                                size="icon"
                                className="h-6 w-6 bg-green-500 hover:bg-green-600"
                                onClick={() =>
                                  handleFriendRequest(friend.id, "accept")
                                }
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                className="h-6 w-6 bg-red-500 hover:bg-red-600"
                                onClick={() =>
                                  handleFriendRequest(friend.id, "reject")
                                }
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {friend.status === "requested" && (
                            <Button
                              size="sm"
                              className="h-6 text-xs bg-gray-500 hover:bg-gray-600"
                              onClick={() =>
                                handleFriendRequest(friend.id, "cancel")
                              }
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Profile Privacy</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.privacy === "public" &&
                          "Public - Anyone can see your profile"}
                        {user?.privacy === "friends" && "Friends only"}
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
                    >
                      {user?.privacy?.charAt(0).toUpperCase() +
                        user?.privacy?.slice(1)}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsPrivacyOpen(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Posts */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={user?.avatar_url || undefined} />
                      <AvatarFallback>
                        {user?.first_name?.[0]}
                        {user?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <Textarea
                        placeholder={`What's on your mind, ${user?.first_name}?`}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />

                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-96 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageSelect}
                            />
                            <ImageIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Photo</span>
                          </label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              toast.info("Video upload coming soon!")
                            }
                          >
                            <Video className="h-5 w-5" />
                            <span className="hidden sm:inline">Video</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              toast.info("Feeling selection coming soon!")
                            }
                          >
                            <Smile className="h-5 w-5" />
                            <span className="hidden sm:inline">Feeling</span>
                          </Button>
                        </div>

                        <Button
                          onClick={handleCreatePost}
                          disabled={
                            isPosting || (!newPost.trim() && !selectedImage)
                          }
                          className="bg-blue-600 hover:bg-blue-700"
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

              {/* Posts */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-6">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={post.user.avatar_url || undefined}
                              />
                              <AvatarFallback>
                                {post.user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">
                                {post.user.full_name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(post.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
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
                                  className={`mr-2 h-4 w-4 ${post.bookmarked ? "fill-current" : ""}`}
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

                        <p className="mb-4">{post.content}</p>

                        {post.image_url && (
                          <div className="mb-4">
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => toast.info("Viewing full image")}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-1">
                              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-xs text-white">👍</span>
                              </div>
                              <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-xs text-white">❤️</span>
                              </div>
                            </div>
                            <span>{post.likes_count} likes</span>
                          </div>
                          <div>
                            <span>{post.comments_count} comments</span>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`flex-1 gap-2 ${post.liked ? "text-blue-600" : ""}`}
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
                            className="flex-1 gap-2"
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
                            className="flex-1 gap-2"
                            onClick={() => toast.success("Post shared!")}
                          >
                            <Share2 className="h-4 w-4" />
                            Share
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`gap-2 ${post.bookmarked ? "text-yellow-600" : ""}`}
                            onClick={() => handleBookmarkPost(post.id)}
                          >
                            <Bookmark
                              className={`h-4 w-4 ${post.bookmarked ? "fill-current" : ""}`}
                            />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="photos">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {posts
                          .filter((p) => p.image_url)
                          .map((post) => (
                            <div key={post.id} className="relative group">
                              <img
                                src={post.image_url!}
                                alt="Post"
                                className="w-full h-48 object-cover rounded-lg cursor-pointer"
                                onClick={() =>
                                  toast.info("Viewing photo in full screen")
                                }
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleLikePost(post.id)}
                                  >
                                    <Heart
                                      className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`}
                                    />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      toast.info("Comment on photo")
                                    }
                                  >
                                    <MessageSquare className="h-4 w-4" />
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
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No videos yet
                      </p>
                      <div className="text-center">
                        <Button
                          variant="outline"
                          onClick={() =>
                            toast.info("Video upload feature coming soon!")
                          }
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Upload Your First Video
                        </Button>
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
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your profile information. Changes will be visible to
                other users.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  placeholder="Tell people about yourself"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  placeholder="City, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workplace">Workplace</Label>
                <Input
                  id="workplace"
                  value={editForm.workplace}
                  onChange={(e) =>
                    setEditForm({ ...editForm, workplace: e.target.value })
                  }
                  placeholder="Where do you work?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Input
                  id="education"
                  value={editForm.education}
                  onChange={(e) =>
                    setEditForm({ ...editForm, education: e.target.value })
                  }
                  placeholder="Your educational background"
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm({ ...editForm, website: e.target.value })
                  }
                  placeholder="https://example.com"
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
                    className="justify-start gap-2"
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
                    className="justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Friends
                  </Button>
                  <Button
                    type="button"
                    variant={
                      editForm.privacy === "private" ? "default" : "outline"
                    }
                    onClick={() =>
                      setEditForm({ ...editForm, privacy: "private" })
                    }
                    className="justify-start gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Private
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
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
                Control who can see your profile and activity.
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
                    className="border rounded-md px-3 py-2"
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
                    <option value="friends">Friends Only</option>
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
                    <select className="border rounded-md px-3 py-2">
                      <option>Only Me</option>
                      <option>Friends</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Friends List</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Who can see your friends?
                      </p>
                    </div>
                    <select className="border rounded-md px-3 py-2">
                      <option>Public</option>
                      <option>Friends Only</option>
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
                    <select className="border rounded-md px-3 py-2">
                      <option>Public</option>
                      <option>Friends Only</option>
                      <option>Only Me</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPrivacyOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleUpdateProfile();
                  setIsPrivacyOpen(false);
                  toast.success("Privacy settings updated");
                }}
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
